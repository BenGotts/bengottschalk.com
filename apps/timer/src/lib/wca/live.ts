// WCA Live, for a competition that's on today: results show up there as
// they're entered, long before the WCA posts official results.

import { z } from "zod";
import type { WcaLiveResult } from "@bengottschalk/timer-core/competition";

export const WCA_LIVE_URL = process.env.NEXT_PUBLIC_WCA_LIVE_URL ?? "https://live.worldcubeassociation.org";

const PersonResponseSchema = z.object({
  person: z.object({ competitionId: z.string(), personId: z.string() }).nullable(),
});

const LiveResultSchema: z.ZodType<WcaLiveResult> = z.object({
  /** UTC, like "2026-11-21T18:45:40Z". */
  enteredAt: z.string().nullable(),
  ranking: z.number().nullable(),
  average: z.number().nullable(),
  singleRecordTag: z.string().nullable(),
  averageRecordTag: z.string().nullable(),
  attempts: z.array(z.object({ result: z.number() })),
  round: z.object({
    number: z.number(),
    name: z.string(),
    competitionEvent: z.object({ event: z.object({ id: z.string() }) }),
    format: z.object({ numberOfAttempts: z.number() }),
  }),
});

const ResultsResponseSchema = z.object({
  data: z.object({ person: z.object({ results: z.array(LiveResultSchema) }).nullable() }),
});

const PERSON_RESULTS_QUERY = `query PersonResults($id: ID!) {
  person(id: $id) {
    results {
      enteredAt ranking average singleRecordTag averageRecordTag
      attempts { result }
      round { number name competitionEvent { event { id } } format { numberOfAttempts } }
    }
  }
}`;

/** The person's WCA Live id at a competition (looked up by the app's own route), or null if they aren't on WCA Live yet. */
export async function findLivePerson(competitionId: string, wcaId: string): Promise<string | null> {
  const params = new URLSearchParams({ competitionId, wcaId });
  const response = await fetch(`/api/wca-live/person?${params}`);
  if (!response.ok) throw new Error(`WCA Live lookup failed (${response.status})`);
  const parsed = PersonResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Unexpected WCA Live lookup response");
  return parsed.data.person?.personId ?? null;
}

/** A person's results entered so far on WCA Live. */
export async function fetchLiveResults(personId: string): Promise<WcaLiveResult[]> {
  const response = await fetch(`${WCA_LIVE_URL}/api`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: PERSON_RESULTS_QUERY, variables: { id: personId } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`WCA Live returned ${response.status}`);
  const parsed = ResultsResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Unexpected WCA Live response");
  return (parsed.data.data.person?.results ?? []).filter((r) => r.attempts.length > 0);
}
