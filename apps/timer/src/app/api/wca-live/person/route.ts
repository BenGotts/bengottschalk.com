import { z } from "zod";

// Finds a person's WCA Live id at a competition. WCA Live has its own ids;
// `/link/competitions/{wcaId}` redirects to the competition's page there, but
// a browser can't read a cross-site redirect, so this lookup runs here. The
// browser then polls WCA Live's GraphQL API (open CORS) directly.

const WCA_LIVE_URL = process.env.NEXT_PUBLIC_WCA_LIVE_URL ?? "https://live.worldcubeassociation.org";
const TIMEOUT_MS = 15_000;

const Query = z.object({
  competitionId: z.string().regex(/^[A-Za-z0-9]{1,64}$/),
  wcaId: z.string().regex(/^\d{4}[A-Z]{4}\d{2}$/),
});

const CompetitorsSchema = z.object({
  data: z.object({
    competition: z.object({ competitors: z.array(z.object({ id: z.string(), wcaId: z.string().nullable() })) }).nullable(),
  }),
});

const json = (body: unknown, maxAge: number) =>
  Response.json(body, { headers: { "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge}` } });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = Query.safeParse({ competitionId: url.searchParams.get("competitionId"), wcaId: url.searchParams.get("wcaId") });
  if (!query.success) return Response.json({ error: "competitionId and wcaId are required" }, { status: 400 });
  const { competitionId, wcaId } = query.data;

  try {
    const link = await fetch(`${WCA_LIVE_URL}/link/competitions/${encodeURIComponent(competitionId)}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const liveCompetitionId = link.headers.get("location")?.match(/\/competitions\/(\d+)/)?.[1];
    // Not on WCA Live (yet): competitors are imported shortly before the competition, so check again soon.
    if (!liveCompetitionId) return json({ person: null }, 300);

    const response = await fetch(`${WCA_LIVE_URL}/api`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: "query Competitors($id: ID!) { competition(id: $id) { competitors { id wcaId } } }", variables: { id: liveCompetitionId } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const parsed = CompetitorsSchema.safeParse(await response.json());
    if (!parsed.success) return Response.json({ error: "Unexpected WCA Live response" }, { status: 502 });
    const person = parsed.data.data.competition?.competitors.find((c) => c.wcaId === wcaId);
    return json({ person: person ? { competitionId: liveCompetitionId, personId: person.id } : null }, person ? 3600 : 300);
  } catch {
    return Response.json({ error: "WCA Live request failed" }, { status: 502 });
  }
}
