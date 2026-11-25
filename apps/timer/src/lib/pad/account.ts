"use client";

// Connecting a phone without the code, when the person is signed in on both:
// a computer waiting for a phone announces its pairing code on the account's
// channel (see server/pad.ts), and the person's phone offers to connect.

import { useEffect, useState, useSyncExternalStore } from "react";
import { openLink, padTransport } from "./link";
import { deviceId, GONE_AFTER_MS, HEARTBEAT_MS, normalizeCode } from "./protocol";

/** A computer's announcement that it's waiting for a phone. */
export interface Invite {
  t: "invite";
  /** The computer's device ID (so a computer ignores its own). */
  from: string;
  code: string;
  /** Which computer, roughly: "Chrome on macOS". */
  computer: string;
}

let channelRequest: Promise<string | null> | null = null;

/** The signed-in person's account channel, or null when signed out (or sign-in isn't set up). */
export function fetchAccountChannel(): Promise<string | null> {
  channelRequest ??= fetch("/api/pad/channel", { cache: "no-store", credentials: "same-origin" })
    .then(async (response) => {
      if (!response.ok) return null;
      const body: unknown = await response.json();
      const channel = typeof body === "object" && body !== null && "channel" in body ? body.channel : null;
      return typeof channel === "string" && channel.startsWith("timer-account:") ? channel : null;
    })
    .catch(() => {
      // Offline, say: ask again next time.
      channelRequest = null;
      return null;
    });
  return channelRequest;
}

/** The account channel while `active` (null until known, or when signed out). */
export function useAccountChannel(active: boolean): string | null {
  const [channel, setChannel] = useState<string | null>(null);
  useEffect(() => {
    if (!active || padTransport() === null) return undefined;
    let current = true;
    void fetchAccountChannel().then((found) => {
      if (current) setChannel(found);
      return undefined;
    });
    return () => {
      current = false;
    };
  }, [active]);
  return active ? channel : null;
}

/** "Chrome on macOS", for telling the person which computer is asking. */
export function deviceLabel(): string {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "a browser";
  const os = /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : null;
  return os ? `${browser} on ${os}` : browser;
}

/**
 * The computer's side: while `code` is waiting for a phone, announce it on
 * the account channel every few seconds.
 */
export function useAnnounceCode(channel: string | null, code: string | null, from: () => string) {
  useEffect(() => {
    if (!channel || !code) return undefined;
    const invite = (): Invite => ({ t: "invite", from: from(), code, computer: deviceLabel() });
    const link = openLink<Invite>(channel, () => {}, (status) => {
      if (status === "open") link.send(invite());
    });
    const beat = setInterval(() => link.send(invite()), HEARTBEAT_MS);
    return () => {
      clearInterval(beat);
      link.close();
    };
  }, [channel, code, from]);
}

/**
 * The phone's side: the latest computer waiting for a phone on this account,
 * while `active`. It's gone once the computer stops announcing (a phone
 * connected, or the tab closed). `channel` says whether the person is signed in.
 */
export function usePadInvite(active: boolean): { channel: string | null; invite: Invite | null } {
  const channel = useAccountChannel(active);
  const [heard, setHeard] = useState<{ invite: Invite; at: number } | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!channel) return undefined;
    // A touchscreen computer hears its own announcements: those aren't for it.
    const self = deviceId("computer");
    const link = openLink<Invite>(channel, (message) => {
      if (message.t !== "invite" || message.from === self || normalizeCode(message.code) !== message.code) return;
      setHeard({ invite: message, at: performance.now() });
    }, () => {});
    const tick = setInterval(() => setNow(performance.now()), HEARTBEAT_MS);
    return () => {
      clearInterval(tick);
      link.close();
    };
  }, [channel]);
  const fresh = heard !== null && (now === 0 || now - heard.at < GONE_AFTER_MS);
  return { channel, invite: fresh ? heard.invite : null };
}

const never = () => () => {};
/** Whether this device's main pointer is a finger (a phone or tablet, not a computer). */
export const useTouchDevice = () => useSyncExternalStore(never, () => window.matchMedia("(pointer: coarse)").matches, () => false);
