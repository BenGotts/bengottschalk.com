import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { LINKS_TAG } from "@/lib/data";

function isAuthorized(header: string | null) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Called by the MCP server after it changes links, so the page shows them right away. */
export function POST(request: Request) {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  revalidateTag(LINKS_TAG, { expire: 0 });
  return Response.json({ revalidated: true });
}
