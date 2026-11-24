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
import { bigint, boolean, index, integer, jsonb, pgSequence, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { CompetitionAttempt, MultiBlindResult } from "@bengottschalk/timer-core/solve";

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

export const solve = pgTable("solve", {
  userId: owner(),
  id: text("id").notNull(),
  eventId: text("event_id").notNull(),
  sessionId: text("session_id").notNull(),
  timeMs: integer("time_ms").notNull(),
  penalty: text("penalty", { enum: ["none", "+2", "dnf"] }).notNull(),
  scramble: text("scramble").notNull(),
  comment: text("comment").notNull(),
  startedAt: ms("started_at").notNull(),
  endedAt: ms("ended_at"),
  source: text("source", { enum: ["home", "competition"] }).notNull(),
  competition: jsonb("competition").$type<CompetitionAttempt>(),
  memoMs: integer("memo_ms"),
  fmc: jsonb("fmc").$type<{ solution: string; moves: number }>(),
  multi: jsonb("multi").$type<MultiBlindResult>(),
  entry: text("entry", { enum: ["timer", "typed", "stackmat", "import"] }).notNull(),
  createdAt: ms("created_at").notNull(),
  updatedAt: ms("updated_at").notNull(),
  deletedAt: ms("deleted_at"),
  seq: changeCursor(),
}, (t) => [primaryKey({ columns: [t.userId, t.id] }), index("solve_user_seq_idx").on(t.userId, t.seq)]).enableRLS();

export const sotdMark = pgTable("sotd_mark", {
  userId: owner(),
  /** The local calendar day, YYYY-MM-DD. */
  date: text("date").notNull(),
  solveId: text("solve_id").notNull(),
  updatedAt: ms("updated_at").notNull(),
  deletedAt: ms("deleted_at"),
  seq: changeCursor(),
}, (t) => [primaryKey({ columns: [t.userId, t.date] }), index("sotd_mark_user_seq_idx").on(t.userId, t.seq)]).enableRLS();

export const schema = { user, session, account, verification, timerSession, solve, sotdMark, syncSeq };
