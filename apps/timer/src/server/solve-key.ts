// How a solve's id is stored. Devices make UUIDs (uuidv7), which Postgres
// keeps in a 16-byte `uuid` column instead of 37 bytes of text. A few ids
// aren't UUIDs (official results are `wca-<competition>-<event>-<round>-<attempt>`,
// so every device names the same attempt the same way): those are kept as
// text in `key`, and `id` holds md5(key) as a UUID, so the primary key stays
// (user_id, id). Migration 0005 does the same in SQL (md5(id)::uuid).

import { createHash } from "node:crypto";

/** Exactly the form Postgres prints a uuid in, so it comes back unchanged. */
const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The stored `id` (a uuid) for a solve id. */
export function solveUuid(id: string): string {
  if (CANONICAL_UUID.test(id)) return id;
  const hex = createHash("md5").update(id, "utf8").digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** The stored columns for a solve id. */
export function toStoredId(id: string): { id: string; key: string | null } {
  return CANONICAL_UUID.test(id) ? { id, key: null } : { id: solveUuid(id), key: id };
}

/** A stored row with the solve's own id back in place of `id` and `key`. */
export function fromStoredId<T extends { id: string; key: string | null }>({ key, ...row }: T): Omit<T, "key"> {
  return { ...row, id: key ?? row.id };
}
