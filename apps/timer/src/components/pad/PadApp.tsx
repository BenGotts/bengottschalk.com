"use client";

// A phone as a stackmat's two pads, for the timer open on a computer.
//
// The phone does the timing (see @bengottschalk/timer-core/pad) from its own
// touch timestamps and sends each finished solve to the computer, which saves
// it with the scramble it's showing. Results wait here until the computer says
// it has them, so a dropped connection or a locked screen doesn't lose one.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { FaCube, FaHand, FaRightFromBracket } from "react-icons/fa6";
import { initialPadState, inspectionPenalty, padReduce, type PadAction, type PadConfig, type PadSide, type PadState } from "@bengottschalk/timer-core/pad";
import { formatRunning, formatTime, type Precision } from "@bengottschalk/timer-core/time";
import { TIMER_NAME } from "@bengottschalk/content/site";
import { usePadInvite } from "@/lib/pad/account";
import { openLink, padTopic, padTransport, type LinkStatus, type PadLink } from "@/lib/pad/link";
import { CODE_LENGTH, deviceId, GONE_AFTER_MS, HEARTBEAT_MS, normalizeCode, RESEND_MS, type ComputerState, type Envelope, type PhoneMessage, type PhoneResult } from "@/lib/pad/protocol";
import Modal from "../Modal";
import ScrambleImage from "../ScrambleImage";

const DEFAULT_CONFIG: PadConfig = { inspection: false, holdMs: 550, memoSplit: false };

const never = () => () => {};
/** The code in the address (?code=…), or undefined while rendering on the server, where it isn't known. */
const useCodeInAddress = () =>
  useSyncExternalStore(never, () => normalizeCode(new URLSearchParams(window.location.search).get("code") ?? ""), () => undefined);

export default function PadApp() {
  const fromAddress = useCodeInAddress();
  // A code typed in, or null after leaving; until then, the one in the address.
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);
  const code = chosen === undefined ? fromAddress : chosen;

  const join = (next: string) => {
    window.history.replaceState(null, "", `/pad?code=${next}`);
    setChosen(next);
  };
  const leave = () => {
    // Don't connect straight back to the computer just left (it keeps asking until a phone connects).
    if (code) setLeft(code);
    window.history.replaceState(null, "", "/pad");
    setChosen(null);
  };
  const [left, setLeft] = useState<string | null>(null);

  if (code === undefined) return <div className="min-h-dvh bg-base-100" />;
  if (padTransport() === null) return <Unavailable />;
  if (code === null) return <JoinForm onJoin={join} left={left} />;
  return <Pads key={code} code={code} onLeave={leave} />;
}

function Unavailable() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">Phone as stackmat pads</h1>
      <p className="text-muted">Using a phone as the timer isn’t set up on this server yet.</p>
      <Link href="/" className="btn">Open the timer</Link>
    </main>
  );
}

function JoinForm({ onJoin, left }: { onJoin: (code: string) => void; left: string | null }) {
  const [text, setText] = useState("");
  const code = normalizeCode(text);
  // Signed in here and on the computer: its code arrives by itself.
  const { channel, invite } = usePadInvite(true);
  const autoJoin = invite && invite.code !== left ? invite.code : null;
  useEffect(() => {
    if (autoJoin) onJoin(autoJoin);
  }, [autoJoin, onJoin]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
      <div>
        <h1 className="text-xl font-semibold">Use this phone as stackmat pads</h1>
        <p className="mt-2 text-muted">
          On your computer, open {TIMER_NAME}, choose <span className="font-medium text-base-content">Use phone as timer</span>, then scan the code it shows, or type the code here.
        </p>
      </div>
      {invite && invite.code === left && (
        <button type="button" className="btn btn-primary btn-lg" onClick={() => onJoin(invite.code)}>Connect to {invite.computer}</button>
      )}
      {channel && !invite && (
        <p className="alert alert-info alert-soft text-sm">You’re signed in: choose Use phone as timer on your computer and this phone connects by itself.</p>
      )}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code) onJoin(code); }}>
        <input
          className="input input-lg timer-digits flex-1 uppercase tracking-[0.3em]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="ABC234"
          maxLength={CODE_LENGTH + 2}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Pairing code"
        />
        <button type="submit" className="btn btn-primary btn-lg" disabled={!code}>Join</button>
      </form>
    </main>
  );
}

/** Keeps the screen awake while the pads are open (where the browser allows it). */
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let gone = false;
    const acquire = async () => {
      if (gone || (lock && !lock.released) || document.visibilityState !== "visible") return;
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        // Not allowed yet (some browsers want a touch first); tried again on the next touch.
      }
    };
    void acquire();
    const onVisible = () => void acquire();
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("pointerdown", onVisible);
    return () => {
      gone = true;
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("pointerdown", onVisible);
      void lock?.release().catch(() => {});
    };
  }, []);
}

/** Re-renders every frame while `active`, returning performance.now(). */
function useFrameClock(active: boolean) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let frame = 0;
    const tick = () => {
      setNow(performance.now());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return now;
}

const wallClock = (perfTime: number) => Math.round(performance.timeOrigin + perfTime);

function loadPending(key: string): PhoneResult[] {
  try {
    // Only this page writes this key.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return JSON.parse(localStorage.getItem(key) ?? "[]") as PhoneResult[];
  } catch {
    return [];
  }
}

function savePending(key: string, pending: PhoneResult[]) {
  try {
    localStorage.setItem(key, JSON.stringify(pending));
  } catch {
    // Kept in memory only.
  }
}

function resultText(result: Pick<PhoneResult, "timeMs" | "penalty">, precision: Precision) {
  if (result.penalty === "dnf") return "DNF";
  if (result.penalty === "+2") return `${formatTime(result.timeMs + 2000, precision)}+`;
  return formatTime(result.timeMs, precision);
}

function Pads({ code, onLeave }: { code: string; onLeave: () => void }) {
  useWakeLock();
  const pendingKey = `pad.pending.${code}`;
  // Pads only renders in the browser (the code comes from the address), so localStorage is there.
  const [savedPending] = useState(() => loadPending(pendingKey));
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("connecting");
  const [computer, setComputer] = useState<Omit<ComputerState, "t" | "to"> | null>(null);
  const [connected, setConnected] = useState(false);
  const [inUse, setInUse] = useState(false);
  const [machine, setMachine] = useState<PadState>(initialPadState);
  const [last, setLast] = useState<PhoneResult | null>(null);
  const [pendingCount, setPendingCount] = useState(savedPending.length);
  const [scrambleOpen, setScrambleOpen] = useState(false);

  const selfRef = useRef("");
  const linkRef = useRef<PadLink<Envelope> | null>(null);
  const machineRef = useRef<PadState>(initialPadState);
  const configRef = useRef<PadConfig>(DEFAULT_CONFIG);
  const pendingRef = useRef<PhoneResult[]>(savedPending);
  const heardForMeRef = useRef(0);
  const heardForOtherRef = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointers = useRef<Record<PadSide, Set<number>>>({ left: new Set(), right: new Set() });

  const send = useCallback((msg: PhoneMessage) => {
    linkRef.current?.send({ from: selfRef.current, role: "phone", msg });
  }, []);

  const sendPhase = useCallback(() => {
    const state = machineRef.current;
    const now = performance.now();
    send({
      t: "phase",
      phase: state.phase,
      inspectingForMs: state.inspectionStartedAt === null ? null : Math.round(now - state.inspectionStartedAt),
      runningForMs: state.phase === "running" && state.startedAt !== null ? Math.round(now - state.startedAt) : null,
      memoMs: state.memoMs,
    });
  }, [send]);

  const setPending = useCallback((next: PhoneResult[]) => {
    pendingRef.current = next;
    setPendingCount(next.length);
    savePending(pendingKey, next);
  }, [pendingKey]);

  const dispatchRef = useRef<(action: PadAction) => void>(() => {});
  const dispatch = useCallback((action: PadAction) => {
    const before = machineRef.current;
    const { state, result } = padReduce(before, action, configRef.current);
    if (state === before) return;
    machineRef.current = state;
    setMachine(state);
    if (state.phase === "holding" && before.phase !== "holding") {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(() => dispatchRef.current({ type: "tick", time: performance.now() }), configRef.current.holdMs);
    }
    if (state.phase === "ready" && before.phase !== "ready") {
      try {
        navigator.vibrate?.(30);
      } catch {
        // No vibration here (iPhones): the light still turns green.
      }
    }
    if (result) {
      const message: PhoneResult = { t: "result", id: crypto.randomUUID(), ...result, startedAt: wallClock(result.startedAt), endedAt: wallClock(result.endedAt) };
      setLast(message);
      setPending([...pendingRef.current, message]);
      send(message);
    }
    if (state.phase !== before.phase || state.memoMs !== before.memoMs) sendPhase();
  }, [send, sendPhase, setPending]);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  const receive = useCallback((envelope: Envelope) => {
    if (envelope.role !== "computer") return;
    const msg = envelope.msg;
    const now = performance.now();
    if (msg.to !== selfRef.current) {
      if (msg.t === "state") {
        heardForOtherRef.current = now;
        if (now - heardForMeRef.current > GONE_AFTER_MS) setInUse(true);
      }
      return;
    }
    const firstContact = now - heardForMeRef.current > GONE_AFTER_MS;
    heardForMeRef.current = now;
    setConnected(true);
    setInUse(false);
    if (msg.t === "state") {
      const { t: _t, to: _to, ...state } = msg;
      configRef.current = { inspection: state.inspection, holdMs: state.holdMs, memoSplit: state.memoSplit };
      setComputer(state);
      // Just (re)connected: anything still unsent goes now.
      if (firstContact) for (const result of pendingRef.current) send(result);
    } else if (msg.t === "ack") {
      setPending(pendingRef.current.filter((r) => r.id !== msg.id));
    } else if (msg.t === "cancel") {
      dispatch({ type: "cancel" });
    }
  }, [dispatch, send, setPending]);

  const receiveRef = useRef(receive);
  useEffect(() => {
    receiveRef.current = receive;
  }, [receive]);

  useEffect(() => {
    selfRef.current = deviceId("phone");
    const link = openLink<Envelope>(padTopic(code), (envelope) => receiveRef.current(envelope), (status) => {
      setLinkStatus(status);
      // Say hello as soon as the channel is open, so the computer knows we're here.
      if (status === "open") sendPhase();
    });
    linkRef.current = link;
    return () => {
      link.close();
      linkRef.current = null;
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, [code, sendPhase]);

  // Heartbeat: the phase every few seconds, unacknowledged results more often, and whether the computer's still there.
  useEffect(() => {
    const beat = setInterval(() => {
      sendPhase();
      if (performance.now() - heardForMeRef.current > GONE_AFTER_MS) setConnected(false);
      if (performance.now() - heardForOtherRef.current > GONE_AFTER_MS) setInUse(false);
    }, HEARTBEAT_MS);
    const resend = setInterval(() => {
      for (const result of pendingRef.current) send(result);
    }, RESEND_MS);
    // Back from the lock screen or another app: say so straight away.
    const onVisible = () => {
      if (document.visibilityState === "visible") sendPhase();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(beat);
      clearInterval(resend);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [send, sendPhase]);

  const canStart = connected && computer?.canStart === true;

  const padDown = (side: PadSide, e: React.PointerEvent) => {
    e.preventDefault();
    const held = pointers.current[side];
    held.add(e.pointerId);
    try {
      // Keep getting this finger's release even if it slides off the pad.
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Not a pointer the browser can capture; its release still comes here while it stays on the pad.
    }
    if (held.size > 1) return;
    // Nothing starts while the computer isn't there or isn't ready (a solve under way can still be stopped).
    if (machineRef.current.phase === "idle" && !canStart) return;
    dispatch({ type: "down", side, time: e.timeStamp });
  };
  const padUp = (side: PadSide, e: React.PointerEvent) => {
    const held = pointers.current[side];
    if (!held.delete(e.pointerId) || held.size > 0) return;
    dispatch({ type: "up", side, time: e.timeStamp });
  };

  const phase = machine.phase;
  const precision = computer?.precision ?? "hundredths";
  const inspecting = machine.inspectionStartedAt !== null && (phase === "inspecting" || phase === "holding" || phase === "ready");
  const now = useFrameClock(phase === "running" || inspecting);
  const solving = phase !== "idle" && phase !== "stopped";

  let display: string;
  if (phase === "running" && machine.startedAt !== null) display = formatRunning(Math.max(0, now - machine.startedAt), precision);
  else if (inspecting && machine.inspectionStartedAt !== null) {
    const elapsed = Math.max(0, now - machine.inspectionStartedAt);
    const penalty = inspectionPenalty(elapsed);
    display = penalty === "dnf" ? "DNF" : penalty === "+2" ? "+2" : String(Math.max(1, 15 - Math.floor(elapsed / 1000)));
  } else if (phase === "holding" || phase === "ready") display = formatRunning(0, precision);
  else display = last ? resultText(last, precision) : formatRunning(0, precision);

  const hint = inUse && !connected ? "Another phone is using this code. Ask the computer for a new one."
    : !connected ? (linkStatus === "error" ? "Can’t reach the computer. Trying again…" : pendingCount > 0 ? "Waiting for the computer to save your last solve…" : "Waiting for the computer…")
    : (phase === "idle" || phase === "stopped") && pendingCount > 0 ? "Sending to the computer…"
    : phase === "idle" && !computer?.canStart ? "The computer isn’t ready for a solve yet"
    : phase === "idle" ? (computer?.inspection ? "Touch a pad to start inspection" : "Both hands on the pads")
    : phase === "inspecting" ? "Both hands on the pads when you’re ready"
    : phase === "holding" ? "Hold…"
    : phase === "ready" ? "Lift to start"
    : phase === "running" ? (computer?.memoSplit && machine.memoMs === null ? "Both hands down to end memo" : "Both hands on the pads to stop")
    : "Saved";

  const light = phase === "ready" ? "green" : phase === "holding" ? "red" : null;
  const color = phase === "ready" ? "text-success" : phase === "holding" ? "text-error" : inspecting ? "text-warning" : "";

  return (
    <div data-solving={solving} className="pad-surface fixed inset-0 flex flex-col bg-base-300 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]" onContextMenu={(e) => e.preventDefault()}>
      <header className="focus-fade flex shrink-0 items-center gap-2 px-3 py-2">
        <span className={`size-2.5 shrink-0 rounded-full ${connected ? "bg-success" : "bg-warning"}`} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm">
          {connected ? <>Connected{computer ? <> · {computer.eventName}</> : null}</> : <span className="text-muted">Not connected · <span className="timer-digits">{code}</span></span>}
        </span>
        <button type="button" className="btn btn-sm" onClick={() => setScrambleOpen(true)} disabled={!computer?.scramble}>
          <FaCube aria-hidden /> Scramble
        </button>
        <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={onLeave} aria-label="Stop using this phone as the timer" title="Leave">
          <FaRightFromBracket aria-hidden />
        </button>
      </header>

      {/* The pads either side, and the display between them, like a stackmat. */}
      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2 landscape:gap-3">
        <Pad side="left" down={machine.down.left} onDown={padDown} onUp={padUp} />
        <div className="flex w-[34%] shrink-0 flex-col items-center justify-center gap-3 text-center landscape:w-[30%]">
          <div className="flex gap-3" aria-hidden>
            <span className={`size-4 rounded-full border border-base-content/20 ${light === "red" ? "bg-error shadow-[0_0_12px] shadow-error" : "bg-base-200"}`} />
            <span className={`size-4 rounded-full border border-base-content/20 ${light === "green" ? "bg-success shadow-[0_0_12px] shadow-success" : "bg-base-200"}`} />
          </div>
          <div className="w-full rounded-box border border-base-content/10 bg-base-100 px-2 py-3" aria-live={solving ? "off" : "polite"}>
            <div className={`timer-digits whitespace-nowrap text-[clamp(1.5rem,8vw,3.5rem)] font-medium leading-none landscape:text-[clamp(1.75rem,7vh,4rem)] ${color}`} data-testid="pad-time">{display}</div>
            <div className="timer-digits mt-1 h-4 text-xs text-muted">{phase === "running" && machine.memoMs !== null ? `memo ${formatTime(machine.memoMs, precision)}` : ""}</div>
          </div>
          <p className="min-h-10 text-xs text-muted" data-testid="pad-hint">{hint}</p>
        </div>
        <Pad side="right" down={machine.down.right} onDown={padDown} onUp={padUp} />
      </div>

      <Modal open={scrambleOpen} onClose={() => setScrambleOpen(false)} title={computer ? `Scramble · ${computer.eventName}` : "Scramble"}>
        {computer?.scramble && (
          <div className="space-y-3">
            {computer.puzzleId && (
              <div className="mx-auto h-48 w-full max-w-72">
                <ScrambleImage puzzleId={computer.puzzleId} scramble={computer.scramble} scheme={computer.scheme} />
              </div>
            )}
            <p className="scramble-text whitespace-pre-line text-center text-lg">{computer.scramble}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Pad({ side, down, onDown, onUp }: { side: PadSide; down: boolean; onDown: (side: PadSide, e: React.PointerEvent) => void; onUp: (side: PadSide, e: React.PointerEvent) => void }) {
  return (
    <div
      role="presentation"
      data-pad={side}
      className={`flex flex-1 items-center justify-center rounded-[2rem] border-2 transition-colors duration-75 ${down ? "border-primary bg-primary/25" : "border-base-content/15 bg-base-200"}`}
      onPointerDown={(e) => onDown(side, e)}
      onPointerUp={(e) => onUp(side, e)}
      onPointerCancel={(e) => onUp(side, e)}
    >
      <FaHand className={`size-12 opacity-40 ${side === "left" ? "-scale-x-100" : ""}`} aria-hidden />
    </div>
  );
}
