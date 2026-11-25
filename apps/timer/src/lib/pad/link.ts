"use client";

// The line between the computer and its phone: a Supabase Realtime broadcast
// channel named after the pairing code (and, for a signed-in person, a channel
// for their account where a computer announces its code; see server/pad.ts).
// Nothing is stored; messages only go to whoever is on the channel at the time.
//
// Without Supabase set up, a development build falls back to a channel
// between tabs of the same browser, so the pads can be tried (and tested)
// locally with one tab as the computer and another as the phone.



export type LinkStatus = "connecting" | "open" | "error";

export interface PadLink<T> {
  send(message: T): void;
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

/** The channel for a pairing code. */
export const padTopic = (code: string) => `timer-pad:${code}`;
const EVENT = "pad";

/** Joins a channel. Everything sent on it reaches the others on it (not the sender). */
export function openLink<T>(topic: string, onMessage: (message: T) => void, onStatus: (status: LinkStatus) => void): PadLink<T> {
  const transport = padTransport();
  if (transport === "local") return openLocal(topic, onMessage, onStatus);
  if (transport === "supabase") return openSupabase(topic, onMessage, onStatus);
  onStatus("error");
  return { send: () => {}, close: () => {} };
}

function openLocal<T>(topic: string, onMessage: (message: T) => void, onStatus: (status: LinkStatus) => void): PadLink<T> {
  const channel = new BroadcastChannel(topic);
  channel.addEventListener("message", (e: MessageEvent<T>) => onMessage(e.data));
  queueMicrotask(() => onStatus("open"));
  return {
    // A BroadcastChannel has no target origin (it only reaches this origin's tabs).
    // oxlint-disable-next-line unicorn/require-post-message-target-origin
    send: (message) => channel.postMessage(message),
    close: () => channel.close(),
  };
}

const noop = () => {};

function openSupabase<T>(topic: string, onMessage: (message: T) => void, onStatus: (status: LinkStatus) => void): PadLink<T> {
  let closed = false;
  let open = false;
  let send: (message: T) => void = noop;
  let close = noop;
  onStatus("connecting");
  // Loaded only once a phone is in use, so the timer itself doesn't carry it.
  void import("@supabase/supabase-js").then(({ createClient, REALTIME_SUBSCRIBE_STATES: STATES }) => {
    if (closed) return undefined;
    const client = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
    const channel = client.channel(topic, { config: { broadcast: { self: false } } });
    // Only this app's pages send on these channels.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    channel.on("broadcast", { event: EVENT }, ({ payload }) => onMessage(payload as T));
    channel.subscribe((status) => {
      if (closed) return;
      open = status === STATES.SUBSCRIBED;
      // The client rejoins by itself after an error or timeout (a phone waking up, say).
      onStatus(open ? "open" : status === STATES.CHANNEL_ERROR || status === STATES.TIMED_OUT || status === STATES.CLOSED ? "error" : "connecting");
    });
    send = (message) => {
      if (open) void channel.send({ type: "broadcast", event: EVENT, payload: message });
    };
    close = () => {
      void client.removeChannel(channel);
    };
    return undefined;
  }).catch(() => {
    if (!closed) onStatus("error");
  });
  return {
    send: (message) => send(message),
    close: () => {
      closed = true;
      close();
    },
  };
}
