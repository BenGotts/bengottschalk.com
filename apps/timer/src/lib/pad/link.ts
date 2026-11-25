"use client";

// The line between the computer and its phone: a Supabase Realtime broadcast
// channel named after the pairing code. Nothing is stored; messages only go
// to whoever is on the channel at the time.
//
// Without Supabase set up, a development build falls back to a channel
// between tabs of the same browser, so the pads can be tried (and tested)
// locally with one tab as the computer and another as the phone.

import type { Envelope } from "./protocol";

export type LinkStatus = "connecting" | "open" | "error";

export interface PadLink {
  send(envelope: Envelope): void;
  close(): void;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const configured = (value: string | undefined): value is string => Boolean(value && !value.startsWith("REPLACE_ME"));

/** How phones reach this computer, or null when using a phone as the pads isn't set up. */
export function padTransport(): "supabase" | "local" | null {
  if (configured(SUPABASE_URL) && configured(SUPABASE_KEY)) return "supabase";
  if (process.env.NODE_ENV !== "production" && typeof BroadcastChannel !== "undefined") return "local";
  return null;
}

const channelName = (code: string) => `timer-pad:${code}`;
const EVENT = "pad";

export function openLink(code: string, onEnvelope: (envelope: Envelope) => void, onStatus: (status: LinkStatus) => void): PadLink {
  const transport = padTransport();
  if (transport === "local") return openLocal(code, onEnvelope, onStatus);
  if (transport === "supabase") return openSupabase(code, onEnvelope, onStatus);
  onStatus("error");
  return { send: () => {}, close: () => {} };
}

function openLocal(code: string, onEnvelope: (envelope: Envelope) => void, onStatus: (status: LinkStatus) => void): PadLink {
  const channel = new BroadcastChannel(channelName(code));
  channel.addEventListener("message", (e: MessageEvent<Envelope>) => onEnvelope(e.data));
  queueMicrotask(() => onStatus("open"));
  return {
    // A BroadcastChannel has no target origin (it only reaches this origin's tabs).
    // oxlint-disable-next-line unicorn/require-post-message-target-origin
    send: (envelope) => channel.postMessage(envelope),
    close: () => channel.close(),
  };
}

const noop = () => {};

function openSupabase(code: string, onEnvelope: (envelope: Envelope) => void, onStatus: (status: LinkStatus) => void): PadLink {
  let closed = false;
  let open = false;
  let send: (envelope: Envelope) => void = noop;
  let close = noop;
  onStatus("connecting");
  // Loaded only once a phone is in use, so the timer itself doesn't carry it.
  void import("@supabase/supabase-js").then(({ createClient, REALTIME_SUBSCRIBE_STATES: STATES }) => {
    if (closed) return undefined;
    const client = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
    const channel = client.channel(channelName(code), { config: { broadcast: { self: false } } });
    // Only this app's pages send on these channels.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    channel.on("broadcast", { event: EVENT }, ({ payload }) => onEnvelope(payload as Envelope));
    channel.subscribe((status) => {
      if (closed) return;
      open = status === STATES.SUBSCRIBED;
      // The client rejoins by itself after an error or timeout (a phone waking up, say).
      onStatus(open ? "open" : status === STATES.CHANNEL_ERROR || status === STATES.TIMED_OUT || status === STATES.CLOSED ? "error" : "connecting");
    });
    send = (envelope) => {
      if (open) void channel.send({ type: "broadcast", event: EVENT, payload: envelope });
    };
    close = () => {
      void client.removeChannel(channel);
    };
    return undefined;
  }).catch(() => {
    if (!closed) onStatus("error");
  });
  return {
    send: (envelope) => send(envelope),
    close: () => {
      closed = true;
      close();
    },
  };
}
