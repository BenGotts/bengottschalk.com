// Runs a migration against data saved before it: the committed migrations up
// to the one before, some rows, then the rest (PGlite, in-process).

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, describe, expect, it } from "vitest";
import { solveUuid } from "./solve-key";

const folder = fileURLToPath(new URL("../../drizzle", import.meta.url));
const scratch: string[] = [];
afterAll(() => scratch.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

/** A copy of the migrations folder with only the migrations before `tag`. */
function migrationsBefore(tag: string): string {
  const dir = mkdtempSync(join(tmpdir(), "timer-migrations-"));
  scratch.push(dir);
  cpSync(folder, dir, { recursive: true });
  const journalPath = join(dir, "meta", "_journal.json");
  // The journal drizzle-kit writes.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as { entries: { tag: string }[] };
  const index = journal.entries.findIndex((entry) => entry.tag === tag);
  expect(index).toBeGreaterThan(0);
  writeFileSync(journalPath, JSON.stringify({ ...journal, entries: journal.entries.slice(0, index) }));
  return dir;
}

describe("0004: a Solve of the Day for each event", () => {
  it("gives each mark its solve's event, drops marks without a solve, and keys marks by event and day", async () => {
    const client = new PGlite();
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: migrationsBefore("0004_sotd_per_event") });

    await client.exec(`
      insert into "user" (id, name, email, email_verified, created_at, updated_at) values
        ('u1', 'One', 'one@example.com', false, now(), now()),
        ('u2', 'Two', 'two@example.com', false, now(), now());
      insert into solve (user_id, id, event_id, session_id, time_ms, penalty, scramble, comment, started_at, source, entry, created_at, updated_at) values
        ('u1', 'a', '333', 'main-333', 9000, 'none', '', '', 1, 'home', 'timer', 1, 1),
        ('u1', 'b', 'sq1', 'main-sq1', 9000, 'none', '', '', 1, 'home', 'timer', 1, 1),
        ('u2', 'c', 'pyram', 'main-pyram', 9000, 'none', '', '', 1, 'home', 'timer', 1, 1);
      insert into sotd_mark (user_id, date, solve_id, updated_at, deleted_at) values
        ('u1', '2026-11-23', 'a', 5, null),
        ('u1', '2026-11-22', 'b', 5, 6),
        ('u1', '2026-11-21', 'c', 5, null),
        ('u2', '2026-11-23', 'c', 5, null);
    `);
    const before = await client.query<{ seq: number }>(`select max(seq) as seq from sotd_mark`);

    await migrate(db, { migrationsFolder: folder });

    const marks = await client.query<{ user_id: string; event_id: string; date: string; solve_id: string; deleted_at: number | null; seq: number }>(
      `select user_id, event_id, date, solve_id, deleted_at, seq from sotd_mark order by user_id, date`,
    );
    expect(marks.rows.map(({ seq: _seq, ...row }) => row)).toEqual([
      { user_id: "u1", event_id: "sq1", date: "2026-11-22", solve_id: "b", deleted_at: 6 },
      { user_id: "u1", event_id: "333", date: "2026-11-23", solve_id: "a", deleted_at: null },
      // u1's mark on u2's solve had no solve of its own: gone.
      { user_id: "u2", event_id: "pyram", date: "2026-11-23", solve_id: "c", deleted_at: null },
    ]);
    // Every mark changed, so devices download them again with their event.
    expect(marks.rows.every((row) => row.seq > before.rows[0].seq)).toBe(true);

    // Two events can share a day now; the same event can't twice.
    await client.exec(`insert into sotd_mark (user_id, event_id, date, solve_id, updated_at) values ('u1', 'sq1', '2026-11-23', 'b', 7)`);
    await expect(client.exec(`insert into sotd_mark (user_id, event_id, date, solve_id, updated_at) values ('u1', '333', '2026-11-23', 'b', 8)`)).rejects.toThrow();
    await expect(client.exec(`insert into sotd_mark (user_id, date, solve_id, updated_at) values ('u1', '2026-11-20', 'b', 8)`)).rejects.toThrow();
  }, 60_000);
});

describe("0005: smaller solve rows", () => {
  it("stores ids as uuids (keeping ids that aren't) and penalty, source and entry as codes, without moving any cursor", async () => {
    const client = new PGlite();
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: migrationsBefore("0005_solve_storage") });

    await client.exec(`
      insert into "user" (id, name, email, email_verified, created_at, updated_at) values ('u1', 'One', 'one@example.com', false, now(), now());
      insert into solve (user_id, id, event_id, session_id, time_ms, penalty, scramble, comment, started_at, source, entry, created_at, updated_at) values
        ('u1', '0197c3b4-d378-7e1d-ba6c-8a43fc62d744', '333', 'main-333', 9000, 'none', 'R U', '', 1, 'home', 'timer', 1, 1),
        ('u1', '0197C3B4-D378-7E1D-BA6C-8A43FC62D744', '333', 'main-333', 9000, '+2', '', '', 1, 'home', 'typed', 1, 1),
        ('u1', 'wca-NAC2022-pyram-1-5', 'pyram', 'main-pyram', 9000, 'dnf', '', '', 1, 'competition', 'import', 1, 1),
        ('u1', 'x', '333', 'main-333', 9000, 'none', '', '', 1, 'home', 'stackmat', 1, 1);
    `);
    const before = await client.query<{ id: string; seq: number }>(`select id, seq from solve`);

    await migrate(db, { migrationsFolder: folder });

    const rows = await client.query<{ id: string; key: string | null; penalty: number; source: number; entry: number; seq: number }>(
      `select id::text, key, penalty, source, entry, seq from solve order by entry`,
    );
    expect(rows.rows.map(({ seq: _seq, ...row }) => row)).toEqual([
      { id: "0197c3b4-d378-7e1d-ba6c-8a43fc62d744", key: null, penalty: 0, source: 0, entry: 0 },
      { id: solveUuid("0197C3B4-D378-7E1D-BA6C-8A43FC62D744"), key: "0197C3B4-D378-7E1D-BA6C-8A43FC62D744", penalty: 1, source: 0, entry: 1 },
      { id: solveUuid("x"), key: "x", penalty: 0, source: 0, entry: 2 },
      { id: solveUuid("wca-NAC2022-pyram-1-5"), key: "wca-NAC2022-pyram-1-5", penalty: 2, source: 1, entry: 3 },
    ]);
    expect(rows.rows.map((row) => row.seq).toSorted((a, b) => a - b)).toEqual(before.rows.map((row) => row.seq).toSorted((a, b) => a - b));
  }, 60_000);
});
