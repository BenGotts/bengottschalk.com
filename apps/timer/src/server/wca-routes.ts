// Request handlers for the WCA routes under /api/wca and the daily cron job.
// Kept apart from the route files so tests can call them with a test database.

import { eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import type { TimerDb } from "./db";
import { user } from "./schema";
import { competitionSchedule, competitionScrambles, importCompetitionResults, personCompetitions, wcifForPerson } from "./wca";

export interface WcaDeps {
  db: TimerDb;
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
}

const CompetitionId = z.string().regex(/^[A-Za-z0-9]{1,64}$/);

/** The signed-in user and their WCA ID, or a response saying why not. */
async function signedIn(request: Request, { db, getSession }: WcaDeps): Promise<{ userId: string; wcaId: string } | Response> {
  const session = await getSession(request.headers);
  if (!session) return Response.json({ error: "Sign in with WCA first." }, { status: 401 });
  const [row] = await db.select({ wcaId: user.wcaId }).from(user).where(eq(user.id, session.user.id));
  if (!row?.wcaId) return Response.json({ error: "This account has no WCA ID yet." }, { status: 403 });
  return { userId: session.user.id, wcaId: row.wcaId };
}

const failed = (error: unknown) =>
  Response.json({ error: error instanceof Error ? error.message : "The WCA request failed." }, { status: 502 });

/** POST /api/wca/results `{ force?: boolean }`: imports official results (when due) into the account. */
export async function handleImportResults(request: Request, deps: WcaDeps): Promise<Response> {
  const who = await signedIn(request, deps);
  if (who instanceof Response) return who;
  const body = z.object({ force: z.boolean().optional() }).catch({}).parse(await request.json().catch(() => ({})));
  try {
    return Response.json(await importCompetitionResults(deps.db, who.userId, who.wcaId, { force: body.force }));
  } catch (error) {
    return failed(error);
  }
}

/** GET /api/wca/competitions: the person's ongoing, upcoming and recently finished competitions. */
export async function handleCompetitions(request: Request, deps: WcaDeps): Promise<Response> {
  const who = await signedIn(request, deps);
  if (who instanceof Response) return who;
  try {
    return Response.json({ competitions: await personCompetitions(deps.db, who.wcaId) });
  } catch (error) {
    return failed(error);
  }
}

/** GET /api/wca/schedule?competitionId=: a competition's schedule with only the caller's assignments. */
export async function handleSchedule(request: Request, deps: WcaDeps): Promise<Response> {
  const who = await signedIn(request, deps);
  if (who instanceof Response) return who;
  const id = CompetitionId.safeParse(new URL(request.url).searchParams.get("competitionId"));
  if (!id.success) return Response.json({ error: "competitionId is required" }, { status: 400 });
  try {
    const wcif = await competitionSchedule(deps.db, id.data);
    return Response.json({ wcif: wcif && wcifForPerson(wcif, who.wcaId) });
  } catch (error) {
    return failed(error);
  }
}

/** GET /api/wca/scrambles?competitionId=: a competition's published scrambles. */
export async function handleScrambles(request: Request, deps: WcaDeps): Promise<Response> {
  const who = await signedIn(request, deps);
  if (who instanceof Response) return who;
  const id = CompetitionId.safeParse(new URL(request.url).searchParams.get("competitionId"));
  if (!id.success) return Response.json({ error: "competitionId is required" }, { status: 400 });
  try {
    return Response.json({ scrambles: await competitionScrambles(deps.db, id.data) });
  } catch (error) {
    return failed(error);
  }
}

/**
 * GET /api/cron/wca, run daily by Vercel Cron (with `Authorization: Bearer
 * $CRON_SECRET`): imports results for everyone who's due, so they're in
 * place even if the person doesn't open the timer.
 */
export async function handleCron(request: Request, { db, cronSecret, budgetMs = 50_000 }: { db: TimerDb; cronSecret: string | undefined; budgetMs?: number }): Promise<Response> {
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Not allowed." }, { status: 401 });
  }
  const started = Date.now();
  const people = await db.select({ id: user.id, wcaId: user.wcaId }).from(user).where(isNotNull(user.wcaId));
  const report: { wcaId: string; saved?: number; remaining?: number; error?: string }[] = [];
  for (const person of people) {
    const left = budgetMs - (Date.now() - started);
    if (left <= 5_000) break;
    try {
      const result = await importCompetitionResults(db, person.id, person.wcaId!, { budgetMs: left - 5_000 });
      report.push({ wcaId: person.wcaId!, saved: result.saved, remaining: result.remaining });
    } catch (error) {
      report.push({ wcaId: person.wcaId!, error: error instanceof Error ? error.message : "failed" });
    }
  }
  return Response.json({ people: people.length, report });
}
