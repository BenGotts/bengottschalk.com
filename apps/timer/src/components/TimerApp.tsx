"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { FaArrowLeft, FaArrowRight, FaCodeBranch, FaGear, FaRegCopy } from "react-icons/fa6";
import { timerEvent } from "@bengottschalk/timer-core/events";
import { acceptsSolves, isMainSession, mainSessionId, sessionSolves, type TimerSession } from "@bengottschalk/timer-core/sessions";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import { isNewBest, rollingAverages, sessionStats } from "@bengottschalk/timer-core/stats";
import { localDate, sotdByDate as marksByDate, type SotdDetails, type SotdMark } from "@bengottschalk/timer-core/sotd";
import type { ParsedTime } from "@bengottschalk/timer-core/time";
import { addSolve, db, deleteSolve, ensureMainSession, getMeta, setMeta, setSotd, updateSolve } from "@/lib/db";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";
import { generateMultiBlindScrambles } from "@/lib/scrambles";
import { formatSolve } from "@/lib/format";
import { useScramble } from "@/lib/useScramble";
import { useTimer, type FinishedSolve } from "@/lib/useTimer";
import EventPicker from "./EventPicker";
import FmcPanel, { type FmcResult } from "./FmcPanel";
import ImportDialog from "./ImportDialog";
import Modal from "./Modal";
import MultiBlindSetup from "./MultiBlindSetup";
import ScrambleImage from "./ScrambleImage";
import SessionsDialog from "./SessionsDialog";
import SettingsDialog from "./SettingsDialog";
import SolveDialog from "./SolveDialog";
import SolveList from "./SolveList";
import SotdList from "./SotdList";
import StatsPanel from "./StatsPanel";
import TimeDisplay from "./TimeDisplay";
import TypingEntry from "./TypingEntry";

type Dialog = "sessions" | "settings" | "import" | null;

// Stable fallbacks while live queries load, so memos don't recompute every render.
const NO_SESSIONS: TimerSession[] = [];
const NO_SOLVES: Solve[] = [];
const NO_MARKS: SotdMark[] = [];

export default function TimerApp() {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [eventId, setEventIdState] = useState<string | null>(null);
  const [sessionIds, setSessionIds] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<Dialog>(null);
  const [openSolveId, setOpenSolveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"solves" | "sotd">("solves");
  const [mbldCubes, setMbldCubes] = useState(2);
  const [mbldScrambles, setMbldScrambles] = useState<string[] | null>(null);
  const [mbldGenerating, setMbldGenerating] = useState(false);
  const [pendingMulti, setPendingMulti] = useState<FinishedSolve | null>(null);

  // Restore settings and the last event and sessions used on this device.
  useEffect(() => {
    void (async () => {
      const [saved, lastEvent, savedSessions] = await Promise.all([
        getMeta<Partial<Settings>>("settings", {}),
        getMeta<string>("event", "333"),
        getMeta<Record<string, string>>("sessions", {}),
      ]);
      setSettingsState({ ...DEFAULT_SETTINGS, ...saved });
      setSessionIds(savedSessions);
      setEventIdState(lastEvent);
    })();
  }, []);

  const activeEventId = eventId ?? "333";
  const event = timerEvent(activeEventId);

  useEffect(() => {
    if (eventId) void ensureMainSession(eventId);
  }, [eventId]);

  const setSettings = (next: Settings) => {
    setSettingsState(next);
    void setMeta("settings", next);
  };
  const setEventId = (next: string) => {
    setEventIdState(next);
    void setMeta("event", next);
  };
  const selectSession = useCallback((sessionId: string) => {
    setSessionIds((current) => {
      const next = { ...current, [activeEventId]: sessionId };
      void setMeta("sessions", next);
      return next;
    });
  }, [activeEventId]);

  const sessions = useLiveQuery(() => db.sessions.where("eventId").equals(activeEventId).toArray(), [activeEventId]) ?? NO_SESSIONS;
  const allSolves = useLiveQuery(() => db.solves.where("eventId").equals(activeEventId).toArray(), [activeEventId]) ?? NO_SOLVES;
  const marks = useLiveQuery(() => db.sotd.toArray(), []) ?? NO_MARKS;

  const main = sessions.find((s) => s.id === mainSessionId(activeEventId)) ?? null;
  const current: TimerSession | null = sessions.find((s) => s.id === sessionIds[activeEventId] && s.deletedAt === null) ?? main;

  const viewSolves = useMemo(() => (current ? sessionSolves(current, sessions, allSolves) : []), [current, sessions, allSolves]);
  const values = useMemo(() => viewSolves.map(solveValue), [viewSolves]);
  const stats = useMemo(() => sessionStats(values), [values]);
  const meanOf3 = event.format === "mo3";
  const rolling = useMemo(() => rollingAverages(values, meanOf3 ? { kind: "mean", size: 3 } : { kind: "average", size: 5 }), [values, meanOf3]);
  const sotdMap = useMemo(() => marksByDate(marks), [marks]);
  const sotdSolveIds = useMemo(() => new Set(sotdMap.values()), [sotdMap]);
  const branchNames = useMemo(() => {
    const names = new Map<string, string>();
    if (current && isMainSession(current)) for (const s of sessions) if (s.parentId === current.id) names.set(s.id, s.name);
    return names;
  }, [current, sessions]);

  const writable = current !== null && acceptsSolves(current);
  const scramble = useScramble(activeEventId);
  const lastSolve = viewSolves.at(-1) ?? null;
  const usesTimer = event.kind !== "fewest-moves" && settings.entry === "timer";
  const scrambleText = event.kind === "multi-blind" ? (mbldScrambles ? mbldScrambles.join("\n") : null) : scramble.scramble;

  const save = useCallback(async (input: Parameters<typeof addSolve>[0]) => {
    await addSolve(input);
    if (event.kind === "multi-blind") setMbldScrambles(null);
    else scramble.next();
  }, [event.kind, scramble]);

  const onFinish = useCallback((finished: FinishedSolve) => {
    if (!current || !scrambleText) return;
    if (event.kind === "multi-blind") {
      setPendingMulti(finished);
      return;
    }
    void save({ eventId: activeEventId, sessionId: current.id, ...finished, scramble: scrambleText, fmc: null, multi: null, entry: "timer" });
  }, [activeEventId, current, event.kind, save, scrambleText]);

  const timer = useTimer({
    enabled: usesTimer && writable && scrambleText !== null && dialog === null && openSolveId === null && pendingMulti === null,
    inspection: settings.inspection && event.inspection,
    holdMs: settings.holdMs,
    memoSplit: settings.bldMemoSplit && event.blindfolded,
    voice: settings.inspectionVoice,
    onFinish,
  });
  const solving = timer.phase === "running" || timer.phase === "inspecting" || timer.phase === "holding" || timer.phase === "ready";

  const saveTyped = (time: ParsedTime) => {
    if (!current || !scrambleText) return;
    const now = Date.now();
    void save({ eventId: activeEventId, sessionId: current.id, timeMs: time.ms, penalty: time.penalty, scramble: scrambleText, startedAt: now, endedAt: null, memoMs: null, fmc: null, multi: null, entry: "typed" });
  };

  const saveFmc = (result: FmcResult) => {
    if (!current || !scrambleText) return;
    void save({
      eventId: activeEventId, sessionId: current.id, timeMs: result.timeMs, penalty: result.dnf ? "dnf" : "none", scramble: scrambleText,
      startedAt: result.startedAt, endedAt: result.timeMs ? result.startedAt + result.timeMs : null, memoMs: null,
      fmc: { solution: result.solution, moves: result.moves }, multi: null, entry: "typed",
    });
  };

  const saveMulti = (solved: number) => {
    if (!pendingMulti || !current || !mbldScrambles) return;
    const overLimit = pendingMulti.timeMs > Math.min(mbldScrambles.length, 6) * 600_000;
    void save({ eventId: activeEventId, sessionId: current.id, ...pendingMulti, penalty: overLimit ? "dnf" : pendingMulti.penalty, scramble: mbldScrambles.join("\n"), fmc: null, multi: { solved, attempted: mbldScrambles.length }, entry: "timer" });
    setPendingMulti(null);
  };

  const makeMultiScrambles = async () => {
    setMbldGenerating(true);
    try {
      setMbldScrambles(await generateMultiBlindScrambles(mbldCubes));
    } finally {
      setMbldGenerating(false);
    }
  };

  // Keyboard shortcuts for the last solve, when the timer is idle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || timer.phase !== "idle" || document.querySelector("dialog[open]")) return;
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      const last = lastSolve && lastSolve.sessionId === current?.id ? lastSolve : null;
      const actions: Record<string, () => void> = {
        Digit1: () => last && void updateSolve(last.id, { penalty: "none" }),
        Digit2: () => last && void updateSolve(last.id, { penalty: "+2" }),
        Digit3: () => last && void updateSolve(last.id, { penalty: "dnf" }),
        KeyS: () => {
          if (!last) return;
          const day = localDate(last.startedAt);
          const marked = sotdMap.get(day);
          if (marked === last.id) void setSotd(day, null);
          else if (!marked || confirm("Another solve is already Solve of the Day for today. Replace it?")) void setSotd(day, last.id);
        },
        KeyZ: () => last && confirm("Delete the last solve?") && void deleteSolve(last.id),
        KeyN: () => scramble.next(),
      };
      const action = actions[e.code];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [timer.phase, lastSolve, current, sotdMap, scramble]);

  const openSolve = allSolves.find((s) => s.id === openSolveId) ?? null;
  const openSolveReadOnly = openSolve ? !sessions.some((s) => s.id === openSolve.sessionId && acceptsSolves(s)) : true;

  const sotdDetails = (solve: Solve): SotdDetails => {
    const session = sessions.find((s) => s.id === solve.sessionId);
    const viewOf = session && session.status === "merged" && main ? main : session;
    const list = viewOf ? sessionSolves(viewOf, sessions, allSolves) : [solve];
    const index = Math.max(0, list.findIndex((s) => s.id === solve.id));
    const upTo = list.slice(0, index + 1).map(solveValue);
    return {
      solve,
      ao5: rollingAverages(upTo, { kind: "average", size: 5 }).at(-1) ?? null,
      ao12: rollingAverages(upTo, { kind: "average", size: 12 }).at(-1) ?? null,
      wasPersonalBest: isNewBest(upTo),
      sessionName: `${event.name} · ${session && !isMainSession(session) ? session.name : "Main"}`,
    };
  };

  const openFromSotd = (solve: Solve) => {
    if (solve.eventId !== activeEventId) setEventId(solve.eventId);
    setOpenSolveId(solve.id);
  };

  const lastResult = lastSolve ? formatSolve(lastSolve, settings.precision) : null;
  const newBest = timer.phase === "idle" && isNewBest(values);
  const ownCount = current ? allSolves.filter((s) => s.sessionId === current.id && s.deletedAt === null).length : 0;
  const goalReached = current && !isMainSession(current) && current.status === "active" && current.goal !== null && ownCount >= current.goal;

  if (eventId === null) return <div className="min-h-dvh" />;

  return (
    <div data-solving={solving} className="flex min-h-dvh flex-col lg:h-dvh lg:flex-row">
      <main
        className={`relative flex min-h-[75dvh] flex-1 flex-col lg:order-2 lg:min-h-0 ${usesTimer && writable ? "touch-surface" : ""}`}
        {...(usesTimer ? timer.surfaceHandlers : {})}
      >
        <header className="focus-fade flex flex-wrap items-center gap-2 p-3">
          <EventPicker eventId={activeEventId} onChange={setEventId} />
          <button type="button" className="btn btn-sm" onClick={() => setDialog("sessions")}>
            <FaCodeBranch aria-hidden /> {current && !isMainSession(current) ? current.name : "Main"}
            {current && current.goal !== null && <span className="text-muted">{ownCount}/{current.goal}</span>}
          </button>
          <span className="grow" />
          <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => setDialog("settings")} aria-label="Settings"><FaGear className="size-4" aria-hidden /></button>
        </header>

        {!writable && current && (
          <div className="focus-fade mx-3 alert alert-soft">
            <span>“{current.name}” was {current.status} and is read-only.</span>
            {main && <button type="button" className="btn btn-sm" onClick={() => selectSession(main.id)}>Back to Main</button>}
          </div>
        )}
        {goalReached && (
          <div className="focus-fade mx-3 alert alert-success alert-soft">
            <span>Goal reached: {ownCount}/{current.goal} solves.</span>
            <button type="button" className="btn btn-sm" onClick={() => setDialog("sessions")}>Merge into Main</button>
          </div>
        )}

        <section className="focus-fade px-4 pt-2 text-center" aria-label="Scramble">
          {event.kind === "multi-blind" ? (
            <MultiBlindSetup cubes={mbldCubes} onCubesChange={setMbldCubes} scrambles={mbldScrambles} generating={mbldGenerating} onGenerate={() => void makeMultiScrambles()} />
          ) : (
            <>
              <p className={`timer-digits mx-auto max-w-4xl text-balance ${event.id === "minx" || event.id.startsWith("6") || event.id.startsWith("7") ? "text-sm" : "text-lg sm:text-xl"}`}>
                {scramble.error ?? scramble.scramble ?? <span className="text-muted">Making a scramble…</span>}
              </p>
              <div className="mt-1 flex justify-center gap-1">
                <button type="button" className="btn btn-ghost btn-xs" onClick={scramble.previous} disabled={!scramble.canGoBack} aria-label="Previous scramble"><FaArrowLeft aria-hidden /></button>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => scramble.scramble && void navigator.clipboard.writeText(scramble.scramble)} aria-label="Copy scramble"><FaRegCopy aria-hidden /></button>
                <button type="button" className="btn btn-ghost btn-xs" onClick={scramble.next} aria-label="Next scramble"><FaArrowRight aria-hidden /></button>
              </div>
            </>
          )}
        </section>

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
          {event.kind === "fewest-moves" ? (
            <FmcPanel scramble={scramble.scramble} onSave={saveFmc} disabled={!writable} />
          ) : settings.entry === "typing" ? (
            <TypingEntry precision={settings.precision} onSave={saveTyped} disabled={!writable || !scrambleText} />
          ) : (
            <>
              <TimeDisplay
                phase={timer.phase}
                startedAt={timer.startedAt}
                inspectionStartedAt={timer.inspectionStartedAt}
                memoMs={timer.memoMs}
                lastResult={lastResult}
                precision={settings.precision}
                hideRunningTime={settings.hideRunningTime}
              />
              <p className="focus-fade h-6 text-sm">
                {newBest ? <span className="font-medium text-accent">New best single</span>
                  : event.kind === "multi-blind" && !mbldScrambles ? <span className="text-muted">Make scrambles to start</span>
                  : timer.phase === "idle" && <span className="text-muted">{settings.inspection && event.inspection ? "Press space or tap to inspect" : "Hold space or the timer, then let go"}</span>}
              </p>
            </>
          )}
        </div>

        {settings.showScrambleImage && event.puzzleId && scramble.scramble && event.kind !== "multi-blind" && (
          <div className="focus-fade pointer-events-none absolute bottom-3 right-3 hidden h-40 w-56 sm:block">
            <ScrambleImage puzzleId={event.puzzleId} scramble={scramble.scramble} />
          </div>
        )}
      </main>

      <aside className="focus-fade flex flex-col gap-3 border-base-300 p-3 lg:order-1 lg:h-dvh lg:w-80 lg:border-r">
        <div className="flex items-baseline justify-between">
          <h1 className="font-semibold">Cube Timer</h1>
          <span className="text-xs text-muted">{event.shortName} · {current && !isMainSession(current) ? current.name : "Main"}</span>
        </div>
        <StatsPanel eventId={activeEventId} format={event.format} stats={stats} precision={settings.precision} />
        <div role="tablist" className="tabs tabs-box tabs-sm">
          <button type="button" role="tab" className={`tab grow ${tab === "solves" ? "tab-active" : ""}`} aria-selected={tab === "solves"} onClick={() => setTab("solves")}>Solves</button>
          <button type="button" role="tab" className={`tab grow ${tab === "sotd" ? "tab-active" : ""}`} aria-selected={tab === "sotd"} onClick={() => setTab("sotd")}>Solve of the Day</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto" role="tabpanel">
          {tab === "solves"
            ? <SolveList eventId={activeEventId} solves={viewSolves} rolling={rolling} rollingLabel={event.format === "mo3" ? "mo3" : "ao5"} sotdSolveIds={sotdSolveIds} branchNames={branchNames} precision={settings.precision} onOpen={(s) => setOpenSolveId(s.id)} />
            : <SotdList precision={settings.precision} onOpen={openFromSotd} />}
        </div>
      </aside>

      {main && current && (
        <SessionsDialog open={dialog === "sessions"} onClose={() => setDialog(null)} main={main} sessions={sessions} solves={allSolves} currentId={current.id} onSelect={selectSession} precision={settings.precision} />
      )}
      <SettingsDialog open={dialog === "settings"} onClose={() => setDialog(null)} settings={settings} onChange={setSettings} onImportCsTimer={() => setDialog("import")} />
      <ImportDialog open={dialog === "import"} onClose={() => setDialog(null)} />
      <SolveDialog solve={openSolve} onClose={() => setOpenSolveId(null)} precision={settings.precision} sotdByDate={sotdMap} sotdDetails={sotdDetails} readOnly={openSolveReadOnly} />
      <Modal open={pendingMulti !== null} onClose={() => setPendingMulti(null)} title="How many did you solve?">
        <MultiResultForm attempted={mbldScrambles?.length ?? 0} onSave={saveMulti} />
      </Modal>
    </div>
  );
}

function MultiResultForm({ attempted, onSave }: { attempted: number; onSave: (solved: number) => void }) {
  const [solved, setSolved] = useState(attempted);
  return (
    <form className="flex items-end gap-3" onSubmit={(e) => { e.preventDefault(); onSave(solved); }}>
      <label>
        <span className="mb-1 block text-sm text-muted">Solved out of {attempted}</span>
        <input type="number" min={0} max={attempted} className="input w-28" value={solved} onChange={(e) => setSolved(Math.max(0, Math.min(attempted, Number(e.target.value) || 0)))} />
      </label>
      <button type="submit" className="btn btn-primary">Save</button>
    </form>
  );
}
