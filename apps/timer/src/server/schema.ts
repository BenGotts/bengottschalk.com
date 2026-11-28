// The timer's Postgres schema (Supabase in production), for Drizzle.
//
// better-auth's tables (user, session, account, verification) hold sign-in
// state. The timer's own tables mirror the records each device keeps in
// IndexedDB (see @bengottschalk/timer-core), keyed by user and record id.
// Times are milliseconds since 1970 as bigints, exactly as devices write them.
//
// Every table has row-level security switched on with no policies, so
// nothing is reachable through Supabase's public APIs; only the server,
// connecting as the database owner, reads and writes them.

import { sql } from "drizzle-orm";
import { bigint, boolean, customType, index, integer, jsonb, pgSequence, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { CompetitionAttempt, FmcRecord, MultiBlindResult, Penalty, Solve, SolveSource, TimingMethod } from "@bengottschalk/timer-core/solve";

// ---------------------------------------------------------------------------
// better-auth

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** The person's WCA ID, like 2016GOTT01; null until they've competed. */
  wcaId: text("wca_id"),
  /** The person's IANA time zone, as their browser last reported it; used for calendar dates when no browser is asking (the daily job). */
  timeZone: text("time_zone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}).enableRLS();

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (t) => [index("session_user_id_idx").on(t.userId)]).enableRLS();

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("account_user_id_idx").on(t.userId)]).enableRLS();

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]).enableRLS();

// ---------------------------------------------------------------------------
// The timer

/**
 * Every write to a timer table takes the next number from this sequence, so
 * a device can ask for "everything changed since cursor N".
 */
export const syncSeq = pgSequence("sync_seq");

const ms = (name: string) => bigint(name, { mode: "number" });
const changeCursor = () => ms("seq").notNull().default(sql`nextval('sync_seq')`);
const owner = () => text("user_id").notNull().references(() => user.id, { onDelete: "cascade" });

export const timerSession = pgTable("timer_session", {
  userId: owner(),
  id: text("id").notNull(),
  eventId: text("event_id").notNull(),
  parentId: text("parent_id"),
  name: text("name").notNull(),
  goal: integer("goal"),
  status: text("status", { enum: ["active", "merged", "discarded"] }).notNull(),
  createdAt: ms("created_at").notNull(),
  updatedAt: ms("updated_at").notNull(),
  mergedAt: ms("merged_at"),
  deletedAt: ms("deleted_at"),
  seq: changeCursor(),
}, (t) => [primaryKey({ columns: [t.userId, t.id] }), index("timer_session_user_seq_idx").on(t.userId, t.seq)]).enableRLS();

/**
 * A short list of names kept as a smallint (2 bytes instead of 3 to 9 of
 * text: it adds up over hundreds of thousands of solves). The number is the
 * name's place in `names`, so only ever add names at the end.
 */
function coded<const T extends string>(names: readonly T[]) {
  return customType<{ data: T; driverData: number }>({
    dataType: () => "smallint",
    toDriver: (name) => {
      const code = names.indexOf(name);
      if (code < 0) throw new Error(`Unknown value: ${name}`);
      return code;
    },
    fromDriver: (code) => {
      const name = names[code];
      if (name === undefined) throw new Error(`Unknown code: ${code}`);
      return name;
    },
  });
}

const PENALTIES = ["none", "+2", "dnf"] as const satisfies readonly Penalty[];
const SOURCES = ["home", "competition"] as const satisfies readonly SolveSource[];
const ENTRIES = ["timer", "typed", "stackmat", "import"] as const satisfies readonly Solve["entry"][];

export const solve = pgTable("solve", {
  userId: owner(),
  /** The solve's id as a uuid; see solve-key.ts for ids that aren't UUIDs. */
  id: uuid("id").notNull(),
  /** The solve's id when it isn't a UUID (official results), else null. */
  key: text("key"),
  eventId: text("event_id").notNull(),
  sessionId: text("session_id").notNull(),
  timeMs: integer("time_ms").notNull(),
  penalty: coded(PENALTIES)("penalty").notNull(),
  scramble: text("scramble").notNull(),
  comment: text("comment").notNull(),
  startedAt: ms("started_at").notNull(),
  endedAt: ms("ended_at"),
  source: coded(SOURCES)("source").notNull(),
  competition: jsonb("competition").$type<CompetitionAttempt>(),
  memoMs: integer("memo_ms"),
  fmc: jsonb("fmc").$type<FmcRecord>(),
  multi: jsonb("multi").$type<MultiBlindResult>(),
  entry: coded(ENTRIES)("entry").notNull(),
  /** How the time was taken (keyboard, touch, typed, …); null for solves saved before it was recorded. Not an enum, so new hardware needs no migration. */
  timing: text("timing").$type<TimingMethod>(),
  createdAt: ms("created_at").notNull(),
  updatedAt: ms("updated_at").notNull(),
  deletedAt: ms("deleted_at"),
  seq: changeCursor(),
}, (t) => [primaryKey({ columns: [t.userId, t.id] }), index("solve_user_seq_idx").on(t.userId, t.seq)]).enableRLS();

export const sotdMark = pgTable("sotd_mark", {
  userId: owner(),
  /** Each event has its own Solve of the Day: the marked solve's event. */
  eventId: text("event_id").notNull(),
  /** The local calendar day, YYYY-MM-DD. */
  date: text("date").notNull(),
  solveId: text("solve_id").notNull(),
  updatedAt: ms("updated_at").notNull(),
  deletedAt: ms("deleted_at"),
  seq: changeCursor(),
}, (t) => [primaryKey({ columns: [t.userId, t.eventId, t.date] }), index("sotd_mark_user_seq_idx").on(t.userId, t.seq)]).enableRLS();

// ---------------------------------------------------------------------------
// WCA data, fetched by the server and kept here so the WCA API is asked as
// little as possible (see src/server/wca.ts). All of it is public WCA data.

/** A competition's WCIF, reduced to the schedule and competitors' assignments; null when the WCA has none. */
export const wcaCompetition = pgTable("wca_competition", {
  id: text("id").primaryKey(),
  wcif: jsonb("wcif").$type<unknown>(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
}).enableRLS();

/** A WCA ID's official results and competitions. */
export const wcaPerson = pgTable("wca_person", {
  wcaId: text("wca_id").primaryKey(),
  results: jsonb("results").$type<unknown>(),
  resultsFetchedAt: timestamp("results_fetched_at", { withTimezone: true }),
  /** Ongoing and upcoming competitions, plus ones that ended in the last 30 days. */
  competitions: jsonb("competitions").$type<unknown>(),
  competitionsFetchedAt: timestamp("competitions_fetched_at", { withTimezone: true }),
}).enableRLS();

/** A competition's published scrambles. */
export const wcaScrambles = pgTable("wca_scrambles", {
  competitionId: text("competition_id").primaryKey(),
  scrambles: jsonb("scrambles").$type<unknown>().notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
}).enableRLS();

/**
 * A competition as captured from WCA Live (the main source for schedules,
 * groups and when results were entered). WCA Live keeps competitions for only
 * about three months, so each is captured while it's on and once more after
 * it ends (`final`), then kept. `liveId` is null when WCA Live doesn't have it.
 */
export const wcaLiveCompetition = pgTable("wca_live_competition", {
  competitionId: text("competition_id").primaryKey(),
  liveId: text("live_id"),
  /** WcaLiveSchedule (timer-core): times in milliseconds since 1970. */
  schedule: jsonb("schedule").$type<unknown>(),
  /** Competitors' groups, by WCA ID. */
  assignments: jsonb("assignments").$type<unknown>(),
  /** When each competitor's results were entered, by WCA ID and round. */
  enteredAt: jsonb("entered_at").$type<unknown>(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  final: boolean("final").notNull().default(false),
}).enableRLS();

export const schema = { user, session, account, verification, timerSession, solve, sotdMark, syncSeq, wcaCompetition, wcaPerson, wcaScrambles, wcaLiveCompetition };
