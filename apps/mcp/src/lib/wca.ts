import { eventName, sortEventIds } from "@bengottschalk/wca/events";
import { formatDelegateStatus, formatResult } from "@bengottschalk/wca/format";
import { WCA_ID } from "@bengottschalk/content/site";
import { WCA_PROFILE_URL } from "@bengottschalk/content/links";
import { z } from "zod";

const RankSchema = z.object({
  best: z.number().int(),
  world_rank: z.number().int(),
  continent_rank: z.number().int(),
  country_rank: z.number().int(),
});

// Only the fields the profile tool reports; Zod drops the rest.
const PersonSchema = z.object({
  person: z.object({
    name: z.string(),
    country: z.object({ name: z.string() }),
    delegate_status: z.string().nullable(),
  }),
  competition_count: z.number().int(),
  personal_records: z.record(z.string(), z.object({ single: RankSchema, average: RankSchema.optional() })),
  medals: z.object({ gold: z.number().int(), silver: z.number().int(), bronze: z.number().int() }),
  records: z.object({ national: z.number().int(), continental: z.number().int(), world: z.number().int() }),
  total_solves: z.number().int(),
});

function rank(eventId: string, kind: "single" | "average", r: z.infer<typeof RankSchema>) {
  return {
    result: formatResult(eventId, r.best, kind),
    worldRank: r.world_rank,
    continentRank: r.continent_rank,
    countryRank: r.country_rank,
  };
}

/** Ben's WCA profile with formatted personal records, cached for an hour. */
export async function getWcaProfile() {
  const response = await fetch(`https://www.worldcubeassociation.org/api/v0/persons/${WCA_ID}`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`WCA API answered ${response.status}`);
  const data = PersonSchema.parse(await response.json());

  return {
    name: data.person.name,
    wcaId: WCA_ID,
    profileUrl: WCA_PROFILE_URL,
    country: data.person.country.name,
    delegateStatus: data.person.delegate_status ? formatDelegateStatus(data.person.delegate_status) : null,
    competitions: data.competition_count,
    totalSolves: data.total_solves,
    medals: data.medals,
    records: data.records,
    personalRecords: sortEventIds(Object.keys(data.personal_records)).map((eventId) => {
      const { single, average } = data.personal_records[eventId];
      return {
        event: eventName(eventId),
        eventId,
        single: rank(eventId, "single", single),
        average: average ? rank(eventId, "average", average) : null,
      };
    }),
  };
}
