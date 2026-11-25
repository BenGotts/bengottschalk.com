// The account channel a signed-in person's devices use to find each other for
// phone-as-stackmat-pads: a computer waiting for a phone announces its pairing
// code there, and the person's phone offers to connect.
//
// Realtime broadcast channels are open to anyone who knows their name, so the
// name is a keyed hash of the user's ID: only this server can work it out, and
// it only tells signed-in people their own.

import { createHmac } from "node:crypto";

export const ACCOUNT_CHANNEL_PREFIX = "timer-account:";

export function accountChannel(userId: string, secret: string): string {
  const digest = createHmac("sha256", secret).update(`pad-invites:${userId}`).digest("base64url");
  return `${ACCOUNT_CHANNEL_PREFIX}${digest.slice(0, 32)}`;
}

type GetSession = (headers: Headers) => Promise<{ user: { id: string } } | null>;

/** GET /api/pad/channel: the signed-in person's account channel. */
export async function handleAccountChannel(request: Request, { getSession, secret }: { getSession: GetSession; secret: string }): Promise<Response> {
  const session = await getSession(request.headers);
  if (!session) return Response.json({ error: "Not signed in." }, { status: 401 });
  return Response.json({ channel: accountChannel(session.user.id, secret) }, { headers: { "Cache-Control": "private, no-store" } });
}
