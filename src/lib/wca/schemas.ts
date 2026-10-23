import { z } from "zod";

// Schemas for the WCA REST API (https://www.worldcubeassociation.org/api).
// Zod strips keys that aren't declared, so only the fields listed here survive
// parsing. That keeps private or third-party data (emails, other people's
// details in WCIF) out of the cache and out of rendered pages.

const isoDate = z.iso.date();

const StaffSchema = z.object({
  id: z.number(),
  wca_id: z.string().nullable(),
  name: z.string(),
});

const CompetitionBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  short_name: z.string(),
  start_date: isoDate,
  end_date: isoDate,
  url: z.string(),
  website: z.string().nullable(),
  city: z.string(),
  venue: z.string(),
  country_iso2: z.string(),
  latitude_degrees: z.number(),
  longitude_degrees: z.number(),
  results_posted_at: z.string().nullable(),
  cancelled_at: z.string().nullable(),
});

/** Competition from `users/{id}?upcoming_competitions` or `competitions?…`. */
export const CompetitionSchema = CompetitionBaseSchema.extend({
  event_ids: z.array(z.string()),
  date_range: z.string(),
  delegates: z.array(StaffSchema),
  organizers: z.array(StaffSchema),
});
export type Competition = z.infer<typeof CompetitionSchema>;

/** Competition from `persons/{id}/competitions` (no events or staff). */
export const PastCompetitionSchema = CompetitionBaseSchema;
export type PastCompetition = z.infer<typeof PastCompetitionSchema>;

export const UserCompetitionsSchema = z.object({
  upcoming_competitions: z.array(CompetitionSchema),
  ongoing_competitions: z.array(CompetitionSchema),
});
export type UserCompetitions = z.infer<typeof UserCompetitionsSchema>;

const RankSchema = z.object({
  best: z.number().int(),
  world_rank: z.number().int(),
  continent_rank: z.number().int(),
  country_rank: z.number().int(),
});
export type Rank = z.infer<typeof RankSchema>;

export const PersonSchema = z.object({
  person: z.object({
    wca_id: z.string(),
    name: z.string(),
    url: z.string(),
    country_iso2: z.string(),
    country: z.object({ id: z.string(), name: z.string(), continent_id: z.string() }),
    delegate_status: z.string().nullable(),
    avatar: z.object({ url: z.string(), thumb_url: z.string() }).nullable(),
  }),
  competition_count: z.number().int(),
  personal_records: z.record(
    z.string(),
    z.object({ single: RankSchema, average: RankSchema.optional() }),
  ),
  medals: z.object({
    gold: z.number().int(),
    silver: z.number().int(),
    bronze: z.number().int(),
    total: z.number().int(),
  }),
  records: z.object({
    national: z.number().int(),
    continental: z.number().int(),
    world: z.number().int(),
    total: z.number().int(),
  }),
  total_solves: z.number().int(),
});
export type Person = z.infer<typeof PersonSchema>;

/** Result row from `v1/persons/{id}/results` and `v1/persons/{id}/records`. */
export const PersonResultSchema = z.object({
  id: z.number(),
  pos: z.number(),
  best: z.number(),
  average: z.number(),
  attempts: z.array(z.number()),
  regional_single_record: z.string().nullable(),
  regional_average_record: z.string().nullable(),
  competition_id: z.string(),
  competition_short_name: z.string(),
  competition_start_date: isoDate,
  event_id: z.string(),
  round_type_id: z.string(),
  format_id: z.string(),
});
export type PersonResult = z.infer<typeof PersonResultSchema>;

export const UserRoleSchema = z.object({
  id: z.number(),
  start_date: isoDate,
  end_date: isoDate.nullable(),
  group: z.object({ name: z.string(), group_type: z.string() }),
  metadata: z.object({ status: z.string().nullish() }).nullish(),
});
export type UserRole = z.infer<typeof UserRoleSchema>;

const EventRecordsSchema = z.record(
  z.string(),
  z.object({ single: z.number().optional(), average: z.number().optional() }),
);
export type EventRecords = z.infer<typeof EventRecordsSchema>;

export const RecordsSchema = z.object({
  world_records: EventRecordsSchema,
  continental_records: z.record(z.string(), EventRecordsSchema),
  national_records: z.record(z.string(), EventRecordsSchema),
});
export type Records = z.infer<typeof RecordsSchema>;

// WCIF (public competition file). Only the schedule and the fields needed to
// find one person's assignments are kept.
export interface WcifActivity {
  id: number;
  name: string;
  activityCode: string;
  startTime: string;
  endTime: string;
  childActivities: WcifActivity[];
}

const WcifActivitySchema: z.ZodType<WcifActivity> = z.object({
  id: z.number(),
  name: z.string(),
  activityCode: z.string(),
  startTime: z.iso.datetime({ offset: true }),
  endTime: z.iso.datetime({ offset: true }),
  get childActivities() {
    return z.array(WcifActivitySchema);
  },
});

export const WcifSchema = z.object({
  id: z.string(),
  name: z.string(),
  persons: z.array(
    z.object({
      wcaId: z.string().nullish(),
      roles: z.array(z.string()).optional(),
      registration: z
        .object({ eventIds: z.array(z.string()), status: z.string() })
        .nullish(),
      assignments: z
        .array(
          z.object({
            activityId: z.number(),
            assignmentCode: z.string(),
            stationNumber: z.number().nullable(),
          }),
        )
        .optional(),
    }),
  ),
  schedule: z.object({
    startDate: isoDate,
    numberOfDays: z.number(),
    venues: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        timezone: z.string(),
        rooms: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            color: z.string(),
            activities: z.array(WcifActivitySchema),
          }),
        ),
      }),
    ),
  }),
});
export type Wcif = z.infer<typeof WcifSchema>;
