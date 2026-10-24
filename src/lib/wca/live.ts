import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import { sortEventIds } from "./events";
import { formatResult } from "./format";

// WCA Live (live.worldcubeassociation.org) has a public GraphQL API with open
// CORS, so the browser can poll it directly. Overridable to point demos at a mock.
export const WCA_LIVE_URL = process.env.NEXT_PUBLIC_WCA_LIVE_URL ?? "https://live.worldcubeassociation.org";

const REQUEST_TIMEOUT_MS = 15_000;

export interface LivePerson {
  competitionId: string;
  personId: string;
}

const LiveResultSchema = z.object({
  id: z.string(),
  ranking: z.number().nullable(),
  best: z.number().nullable(),
  average: z.number().nullable(),
  advancing: z.boolean(),
  advancingQuestionable: z.boolean(),
  singleRecordTag: z.string().nullable(),
  averageRecordTag: z.string().nullable(),
  attempts: z.array(z.object({ result: z.number() })),
  round: z.object({
    id: z.string(),
    name: z.string(),
    number: z.number(),
    finished: z.boolean(),
    competitionEvent: z.object({ event: z.object({ id: z.string(), name: z.string() }) }),
    format: z.object({ numberOfAttempts: z.number() }),
  }),
});

export type LiveResult = z.infer<typeof LiveResultSchema>;

const PERSON_RESULTS_QUERY = `query PersonResults($id: ID!) {
  person(id: $id) {
    results {
      id ranking best average advancing advancingQuestionable singleRecordTag averageRecordTag
      attempts { result }
      round { id name number finished competitionEvent { event { id name } } format { numberOfAttempts } }
    }
  }
}`;

const COMPETITORS_QUERY = `query Competitors($id: ID!) {
  competition(id: $id) { competitors { id wcaId } }
}`;

async function queryLive<S extends z.ZodType>(
  query: string,
  variables: Record<string, string>,
  schema: S,
): Promise<Result<z.output<S>>> {
  try {
    const response = await fetch(`${WCA_LIVE_URL}/api`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return fail(`WCA Live returned ${response.status}`);
    const body = z.object({ data: z.unknown() }).safeParse(await response.json());
    const parsed = schema.safeParse(body.success ? body.data.data : undefined);
    return parsed.success ? ok(parsed.data) : fail("Unexpected WCA Live response");
  } catch {
    return fail("WCA Live request failed");
  }
}

/**
 * Finds a person at a competition on WCA Live. WCA Live has its own ids, and
 * `/link/competitions/{wcaId}` redirects to the competition's page there.
 * `null` when the competition or person isn't on WCA Live (yet).
 */
export async function findLivePerson(wcaCompetitionId: string, wcaId: string): Promise<Result<LivePerson | null>> {
  let competitionId: string | undefined;
  try {
    const response = await fetch(`${WCA_LIVE_URL}/link/competitions/${encodeURIComponent(wcaCompetitionId)}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    competitionId = response.headers.get("location")?.match(/\/competitions\/(\d+)/)?.[1];
  } catch {
    return fail("WCA Live request failed");
  }
  if (!competitionId) return ok(null);

  const result = await queryLive(
    COMPETITORS_QUERY,
    { id: competitionId },
    z.object({ competition: z.object({ competitors: z.array(z.object({ id: z.string(), wcaId: z.string().nullable() })) }).nullable() }),
  );
  if (!result.ok) return result;
  const person = result.data.competition?.competitors.find((competitor) => competitor.wcaId === wcaId);
  return ok(person ? { competitionId, personId: person.id } : null);
}

/** A person's entered results at one competition, in event order then round order. */
export async function fetchLiveResults(personId: string): Promise<Result<LiveResult[]>> {
  const result = await queryLive(
    PERSON_RESULTS_QUERY,
    { id: personId },
    z.object({ person: z.object({ results: z.array(LiveResultSchema) }).nullable() }),
  );
  if (!result.ok) return result;
  return ok(sortLiveResults((result.data.person?.results ?? []).filter((r) => r.attempts.length > 0)));
}

export function sortLiveResults(results: LiveResult[]): LiveResult[] {
  const eventOrder = sortEventIds([...new Set(results.map((r) => r.round.competitionEvent.event.id))]);
  return results.toSorted(
    (a, b) =>
      eventOrder.indexOf(a.round.competitionEvent.event.id) - eventOrder.indexOf(b.round.competitionEvent.event.id)
      || a.round.number - b.round.number,
  );
}

/** Short result for a schedule badge: `"#9 · 11.11 avg"`, or `"2 of 5 done"` mid-round. */
export function liveResultSummary(result: LiveResult): string {
  const { numberOfAttempts } = result.round.format;
  if (result.attempts.length < numberOfAttempts) return `${result.attempts.length} of ${numberOfAttempts} done`;
  const eventId = result.round.competitionEvent.event.id;
  const value = result.average
    ? `${formatResult(eventId, result.average, "average")} avg`
    : result.best ? `${formatResult(eventId, result.best)} single` : "DNF";
  return result.ranking === null ? value : `#${result.ranking} · ${value}`;
}

/** Link to a person's results page on WCA Live. */
export function livePersonUrl({ competitionId, personId }: LivePerson): string {
  return `${WCA_LIVE_URL}/competitions/${competitionId}/competitors/${personId}`;
}
