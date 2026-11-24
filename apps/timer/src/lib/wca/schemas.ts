import { z } from "zod";
import type { WcifActivity } from "@bengottschalk/timer-core/competition";

// Only the fields the timer uses are kept (Zod drops the rest), which also
// keeps other people's details from a competition's WCIF out of storage.

/** A row of `v1/persons/{id}/results`. */
export const PersonResultSchema = z.object({
  competition_id: z.string(),
  competition_short_name: z.string(),
  competition_start_date: z.string(),
  event_id: z.string(),
  round_type_id: z.string(),
  pos: z.number(),
  best: z.number(),
  average: z.number(),
  attempts: z.array(z.number()),
  regional_single_record: z.string().nullable(),
  regional_average_record: z.string().nullable(),
});

const WcifActivitySchema: z.ZodType<WcifActivity> = z.object({
  id: z.number(),
  activityCode: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  get childActivities() {
    return z.array(WcifActivitySchema);
  },
});

/** `v0/competitions/{id}/wcif/public`, reduced to the schedule and one person's assignments (see `forPerson`). */
export const WcifSchema = z.object({
  id: z.string(),
  name: z.string(),
  events: z.array(z.object({ id: z.string(), rounds: z.array(z.object({ id: z.string() })) })).optional(),
  persons: z.array(z.object({
    wcaId: z.string().nullish(),
    assignments: z.array(z.object({ activityId: z.number(), assignmentCode: z.string() })).optional(),
  })),
  schedule: z.object({
    startDate: z.string(),
    numberOfDays: z.number().optional(),
    venues: z.array(z.object({
      timezone: z.string(),
      rooms: z.array(z.object({ activities: z.array(WcifActivitySchema) })),
    })),
  }),
});
export type Wcif = z.infer<typeof WcifSchema>;

/** `v0/users/{id}?ongoing_competitions=true&upcoming_competitions=true`, reduced to dates. */
export const UserCompetitionsSchema = z.object({
  ongoing_competitions: z.array(z.object({ id: z.string(), start_date: z.string(), end_date: z.string() })),
  upcoming_competitions: z.array(z.object({ id: z.string(), start_date: z.string(), end_date: z.string() })),
});

/** `v0/competitions/{id}/scrambles`. */
export const ScramblesSchema = z.array(z.object({
  event_id: z.string(),
  round_type_id: z.string(),
  group_id: z.string(),
  is_extra: z.boolean(),
  scramble_num: z.number(),
  scramble: z.string(),
}));
