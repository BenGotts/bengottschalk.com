"use client";

// The computer's side of using a phone as stackmat pads: shows a pairing code,
// keeps the phone up to date with the event, settings and scramble, mirrors
// the phone's phase on screen, and saves the results it sends.
//
// The first phone to join with the code is paired; another phone with the
// same code is turned away while the paired one is around. The code and the
// paired phone are kept on this device, so a reload (or the phone's screen
// locking) picks up where it left off.

import { useCallback, useEffect, useRef, useState } from "react";
import type { PadPhase } from "@bengottschalk/timer-core/pad";
import type { FinishedSolve } from "@/lib/useTimer";
import { useAccountChannel, useAnnounceCode } from "./account";
import { openLink, padTopic, padTransport, type LinkStatus, type PadLink } from "./link";
import { deviceId, generateCode, GONE_AFTER_MS, HEARTBEAT_MS, type ComputerMessage, type ComputerState, type Envelope } from "./protocol";

const PAIRING_KEY = "pad.computer";
const SEEN_KEY = "pad.seenResults";
/** Enough to recognise a resent result after a reload; results are acknowledged within seconds. */
const SEEN_KEPT = 50;

interface Pairing {
  code: string;
  phoneId: string | null;
}

function load<T>(key: string, fallback: T): T {
  try {
    const text = localStorage.getItem(key);
    // Only this hook writes these keys.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return text ? (JSON.parse(text) as T) : fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing: the pairing just doesn't outlast the tab.
  }
}

/** The phone's phase in this computer's clock, for the time display. */
export interface PhoneView {
  phase: PadPhase;
  startedAt: number;
  inspectionStartedAt: number | null;
  memoMs: number | null;
}

const IDLE_VIEW: PhoneView = { phase: "idle", startedAt: 0, inspectionStartedAt: null, memoMs: null };

/** Within this, a repeated "started n ms ago" is the same start (the message just took longer). */
const SAME_START_MS = 200;

export function usePhonePad({ state, onFinish }: { state: Omit<ComputerState, "t" | "to">; onFinish: (solve: FinishedSolve) => void }) {
  const available = padTransport() !== null;
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("connecting");
  const [connected, setConnected] = useState(false);
  const [view, setView] = useState<PhoneView>(IDLE_VIEW);

  const linkRef = useRef<PadLink<Envelope> | null>(null);
  const pairingRef = useRef<Pairing | null>(null);
  const lastHeardRef = useRef(0);
  const viewRef = useRef<PhoneView>(IDLE_VIEW);
  const stateRef = useRef(state);
  const onFinishRef = useRef(onFinish);
  const selfRef = useRef("");
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // The pairing saved on this device, if any.
  useEffect(() => {
    selfRef.current = deviceId("computer");
    if (!available) return;
    const saved = load<Pairing | null>(PAIRING_KEY, null);
    if (saved?.code) {
      pairingRef.current = saved;
      setPairing(saved);
    }
  }, [available]);

  const updatePairing = useCallback((next: Pairing | null) => {
    pairingRef.current = next;
    setPairing(next);
    store(PAIRING_KEY, next);
  }, []);

  const setPhoneView = useCallback((next: PhoneView) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const send = useCallback((msg: ComputerMessage) => {
    linkRef.current?.send({ from: selfRef.current, role: "computer", msg });
  }, []);

  const sendState = useCallback(() => {
    const phoneId = pairingRef.current?.phoneId;
    if (phoneId) send({ t: "state", to: phoneId, ...stateRef.current });
  }, [send]);

  const receive = useCallback((envelope: Envelope) => {
    if (envelope.role !== "phone") return;
    const current = pairingRef.current;
    if (!current) return;
    const now = performance.now();
    if (current.phoneId !== envelope.from) {
      // Another phone with the code: only taken on once the paired one has been gone a while.
      if (current.phoneId !== null && now - lastHeardRef.current < GONE_AFTER_MS) {
        send({ t: "state", to: current.phoneId, ...stateRef.current });
        return;
      }
      updatePairing({ ...current, phoneId: envelope.from });
    }
    const firstContact = now - lastHeardRef.current > GONE_AFTER_MS;
    lastHeardRef.current = now;
    setConnected(true);
    if (firstContact) sendState();

    const msg = envelope.msg;
    if (msg.t === "phase") {
      const previous = viewRef.current;
      const near = (a: number | null, b: number | null) => a !== null && b !== null && Math.abs(a - b) < SAME_START_MS;
      const startedAt = msg.runningForMs === null ? 0 : now - msg.runningForMs;
      const inspectionStartedAt = msg.inspectingForMs === null ? null : now - msg.inspectingForMs;
      setPhoneView({
        phase: msg.phase,
        // Keep the first estimate of a start, so heartbeats don't make the running clock jump about.
        startedAt: near(previous.startedAt, startedAt) && previous.phase === "running" ? previous.startedAt : startedAt,
        inspectionStartedAt: near(previous.inspectionStartedAt, inspectionStartedAt) ? previous.inspectionStartedAt : inspectionStartedAt,
        memoMs: msg.memoMs,
      });
      return;
    }
    // A result: save it once, however often it's resent.
    const seen = load<string[]>(SEEN_KEY, []);
    if (!seen.includes(msg.id)) {
      store(SEEN_KEY, [...seen, msg.id].slice(-SEEN_KEPT));
      onFinishRef.current({
        timeMs: msg.timeMs,
        penalty: msg.penalty,
        memoMs: msg.memoMs,
        startedAt: msg.startedAt,
        endedAt: msg.endedAt,
        timing: "phone-pads",
      });
    }
    send({ t: "ack", to: envelope.from, id: msg.id });
  }, [send, sendState, setPhoneView, updatePairing]);

  const receiveRef = useRef(receive);
  useEffect(() => {
    receiveRef.current = receive;
  }, [receive]);

  // The channel, open while there's a pairing code.
  const code = pairing?.code ?? null;
  useEffect(() => {
    if (!code) return undefined;
    setLinkStatus("connecting");
    const link = openLink<Envelope>(padTopic(code), (envelope) => receiveRef.current(envelope), setLinkStatus);
    linkRef.current = link;
    return () => {
      link.close();
      linkRef.current = null;
    };
  }, [code]);

  // The phone hears about every change straight away, and the latest state as a heartbeat.
  const stateKey = JSON.stringify(state);
  useEffect(() => {
    stateRef.current = state;
    sendState();
    // stateKey stands for state's contents (a new object each render).
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey, sendState]);
  useEffect(() => {
    if (!code) return undefined;
    const beat = setInterval(() => {
      sendState();
      // Nothing from the phone for a while: it's gone (locked, closed, out of range).
      if (lastHeardRef.current && performance.now() - lastHeardRef.current > GONE_AFTER_MS) {
        setConnected(false);
        if (viewRef.current.phase !== "idle") setPhoneView(IDLE_VIEW);
      }
    }, HEARTBEAT_MS);
    return () => clearInterval(beat);
  }, [code, sendState, setPhoneView]);

  // Signed in: the code is also announced to the person's own phone until one connects.
  const accountChannel = useAccountChannel(available && code !== null);
  const self = useCallback(() => selfRef.current, []);
  useAnnounceCode(connected ? null : accountChannel, code, self);

  /** Shows a code for a phone to join (keeps the one in use, if any). */
  const enable = useCallback(() => {
    if (!pairingRef.current) updatePairing({ code: generateCode(), phoneId: null });
  }, [updatePairing]);

  /** A fresh code: the paired phone is forgotten and has to join again. */
  const newCode = useCallback(() => {
    lastHeardRef.current = 0;
    setConnected(false);
    setPhoneView(IDLE_VIEW);
    updatePairing({ code: generateCode(), phoneId: null });
  }, [setPhoneView, updatePairing]);

  /** Stops using a phone. */
  const disable = useCallback(() => {
    lastHeardRef.current = 0;
    setConnected(false);
    setPhoneView(IDLE_VIEW);
    updatePairing(null);
  }, [setPhoneView, updatePairing]);

  /** Stops the phone's inspection or solve without saving it. */
  const cancel = useCallback(() => {
    const phoneId = pairingRef.current?.phoneId;
    if (phoneId) send({ t: "cancel", to: phoneId });
    setPhoneView(IDLE_VIEW);
  }, [send, setPhoneView]);

  return {
    available,
    code,
    linkStatus,
    connected: connected && code !== null,
    /** Whether the person is signed in, so their phone can connect without the code. */
    signedIn: accountChannel !== null,
    view,
    /** Whether the phone is mid-solve (or inspecting, or holding the pads). */
    busy: view.phase !== "idle" && view.phase !== "stopped",
    enable,
    newCode,
    disable,
    cancel,
  };
}
