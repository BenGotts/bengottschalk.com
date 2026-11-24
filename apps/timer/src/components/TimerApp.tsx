"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { FaArrowLeft, FaArrowRight, FaChartSimple, FaCodeBranch, FaFlagCheckered, FaGear, FaListUl, FaPlus, FaRegCopy, FaStar, FaStopwatch, FaTrophy } from "react-icons/fa6";
import { timerEvent } from "@bengottschalk/timer-core/events";
import { acceptsSolves, isMainSession, mainSessionId, reachesGoal, sessionSolves, type TimerSession } from "@bengottschalk/timer-core/sessions";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import { isNewBest, rollingAverages, sessionStats, type AverageSpec } from "@bengottschalk/timer-core/stats";
import { localDate, sotdByDate as marksByDate, type SotdDetails, type SotdMark } from "@bengottschalk/timer-core/sotd";
import type { ParsedTime } from "@bengottschalk/timer-core/time";
import { TIMER_NAME, WCA_ID as OWNER_WCA_ID } from "@bengottschalk/content/site";
import { confirmSolveDeletion } from "@/lib/confirm";
import { addSolve, db, deleteSolve, ensureMainSession, getMeta, setMeta, setSotd, updateSolve } from "@/lib/db";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";
import { generateMultiBlindScrambles } from "@/lib/scrambles";
import { formatSolve } from "@/lib/format";
import { useScramble } from "@/lib/useScramble";
import { useTimer, type FinishedSolve } from "@/lib/useTimer";
import { useCompetitionResults } from "@/lib/wca/useCompetitionResults";
import { CompetitionResultsContext } from "@/lib/wca/competitionResultsContext";
import AverageDialog, { type AverageView } from "./AverageDialog";
import EventPicker from "./EventPicker";
import SourceFilter, { type SourceFilterValue } from "./SourceFilter";
import FmcPanel, { type FmcResult } from "./FmcPanel";
import ImportDialog from "./ImportDialog";
import ConfirmDialog from "./ConfirmDialog";
import LastSolveActions from "./LastSolveActions";
import Modal from "./Modal";
import MultiBlindSetup from "./MultiBlindSetup";
import ScrambleImage from "./ScrambleImage";
import ScreenStats from "./ScreenStats";
import SessionsDialog from "./SessionsDialog";
import { SessionSummaryDialog } from "./SessionSummary";
import { EndSessionDialog, StartSessionDialog } from "./TemporarySession";
import SettingsDialog from "./SettingsDialog";
import { AccountButton, useSignedInWcaId, AccountSession, UnsyncedSolvesDialog } from "./Account";
import SolveDialog from "./SolveDialog";
import SolveList from "./SolveList";
import SotdList from "./SotdList";
import StatsPanel from "./StatsPanel";
import TimeDisplay from "./TimeDisplay";
import TypingEntry from "./TypingEntry";

type Dialog = "sessions" | "settings" | "import" | "start-temporary" | "summary" | "scramble" | null;
/** Which screen a phone shows (wide screens show the timer and the side panel together). */
type MobileView = "timer" | "solves" | "stats" | "sotd";

const MOBILE_TABS: { view: MobileView; label: string; icon: React.ReactNode }[] = [
  { view: "timer", label: "Timer", icon: <FaStopwatch aria-hidden /> },
  { view: "solves", label: "Solves", icon: <FaListUl aria-hidden /> },
  { view: "stats", label: "Stats", icon: <FaChartSimple aria-hidden /> },
  { view: "sotd", label: "Solve of the Day", icon: <FaStar aria-hidden /> },
];

// Stable fallbacks while live queries load, so memos don't recompute every render.
const NO_SESSIONS: TimerSession[] = [];
const NO_SOLVES: Solve[] = [];
const NO_MARKS: SotdMark[] = [];
const NO_IDS = new Set<string>();
const MEAN_OF_3: AverageSpec = { kind: "mean", size: 3 };
const AVERAGE_OF_5: AverageSpec = { kind: "average", size: 5 };

/** `authEnabled`: whether signing in with WCA is set up on this server (otherwise the timer is local-only). */
export default function TimerApp({ authEnabled }: { authEnabled: boolean }) {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [eventId, setEventIdState] = useState<string | null>(null);
  const [sessionIds, setSessionIds] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<Dialog>(null);
  const [openSolveId, setOpenSolveId] = useState<string | null>(null);
  const [averageView, setAverageView] = useState<AverageView | null>(null);
  // The temporary session whose end-of-session choice is due: shown once the timer is idle.
  const [endFor, setEndFor] = useState<string | null>(null);
  const [tab, setTab] = useState<"solves" | "sotd">("solves");
  const [view, setView] = useState<MobileView>("timer");
  const [mbldCubes, setMbldCubes] = useState(2);
  const [mbldScrambles, setMbldScrambles] = useState<string[] | null>(null);
  const [mbldGenerating, setMbldGenerating] = useState(false);
  const [pendingMulti, setPendingMulti] = useState<FinishedSolve | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>("all");
  const competitionResults = useCompetitionResults();

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

  const sessionView = useMemo(() => (current ? sessionSolves(current, sessions, allSolves) : []), [current, sessions, allSolves]);
  // Competition attempts count in stats like any solve, unless the filter leaves them (or home solves) out.
  const viewSolves = useMemo(
    () => (sourceFilter === "all" ? sessionView : sessionView.filter((s) => s.source === sourceFilter)),
    [sessionView, sourceFilter],
  );
  // Shortcuts act on the latest solve done here (competition attempts are read-only).
  const lastHomeSolve = useMemo(() => sessionView.findLast((s) => s.source === "home" && s.sessionId === current?.id) ?? null, [sessionView, current]);
  const values = useMemo(() => viewSolves.map(solveValue), [viewSolves]);
  const stats = useMemo(() => sessionStats(values), [values]);
  // The solve list's running average: mo3 for mean-of-3 events, ao5 for the rest.
  const rollingSpec = event.format === "mo3" ? MEAN_OF_3 : AVERAGE_OF_5;
  const rolling = useMemo(() => rollingAverages(values, rollingSpec), [values, rollingSpec]);
  // Solve of the Day is only for the site owner's account (it feeds their Solve of the Day videos).
  const sotdEnabled = useSignedInWcaId() === OWNER_WCA_ID;
  const sotdMap = useMemo(() => marksByDate(marks), [marks]);
  const sotdSolveIds = useMemo(() => (sotdEnabled ? new Set(sotdMap.values()) : NO_IDS), [sotdEnabled, sotdMap]);
  const mobileTabs = sotdEnabled ? MOBILE_TABS : MOBILE_TABS.filter((item) => item.view !== "sotd");
  // Signing out (or into another account) while on the SOTD screen goes back to the solves.
  const shownView: MobileView = view === "sotd" && !sotdEnabled ? "solves" : view;
  const shownTab = tab === "sotd" && !sotdEnabled ? "solves" : tab;

  const recentSolves = useMemo(() => viewSolves.slice(-5), [viewSolves]);
  const ownCount = current ? allSolves.filter((s) => s.sessionId === current.id && s.deletedAt === null).length : 0;
  const writable = current !== null && acceptsSolves(current);
  const scramble = useScramble(activeEventId);
  const lastSolve = viewSolves.at(-1) ?? null;
  const usesTimer = event.kind !== "fewest-moves" && settings.entry === "timer";
  const scrambleText = event.kind === "multi-blind" ? (mbldScrambles ? mbldScrambles.join("\n") : null) : scramble.scramble;

  const save = useCallback(async (input: Parameters<typeof addSolve>[0]) => {
    await addSolve(input);
    if (event.kind === "multi-blind") setMbldScrambles(null);
    else scramble.next();
    // The solve that completes a temporary session brings up its end (once the timer is idle).
    if (current && reachesGoal(current, ownCount + 1)) setEndFor(current.id);
  }, [event.kind, scramble, current, ownCount]);

  const onFinish = useCallback((finished: FinishedSolve) => {
    if (!current || !scrambleText) return;
    if (event.kind === "multi-blind") {
      setPendingMulti(finished);
      return;
    }
    void save({ eventId: activeEventId, sessionId: current.id, ...finished, scramble: scrambleText, fmc: null, multi: null, entry: "timer" });
  }, [activeEventId, current, event.kind, save, scrambleText]);

  const timer = useTimer({
    enabled: usesTimer && writable && scrambleText !== null && dialog === null && openSolveId === null && averageView === null && pendingMulti === null,
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
    void save({ eventId: activeEventId, sessionId: current.id, timeMs: time.ms, penalty: time.penalty, scramble: scrambleText, startedAt: now, endedAt: null, memoMs: null, fmc: null, multi: null, entry: "typed", timing: "typed" });
  };

  const saveFmc = (result: FmcResult) => {
    if (!current || !scrambleText) return;
    void save({
      eventId: activeEventId, sessionId: current.id, timeMs: result.timeMs, penalty: result.dnf ? "dnf" : "none", scramble: scrambleText,
      startedAt: result.startedAt, endedAt: result.timeMs ? result.startedAt + result.timeMs : null, memoMs: null,
      fmc: { solution: result.solution, moves: result.moves }, multi: null, entry: "typed", timing: "typed",
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
      const last = lastHomeSolve;
      const actions: Record<string, () => void> = {
        Digit1: () => last && void updateSolve(last.id, { penalty: "none" }),
        Digit2: () => last && void updateSolve(last.id, { penalty: "+2" }),
        Digit3: () => last && void updateSolve(last.id, { penalty: "dnf" }),
        KeyS: () => {
          if (!last || !sotdEnabled) return;
          const day = localDate(last.startedAt);
          const marked = sotdMap.get(day);
          if (marked === last.id) void setSotd(day, null);
          else if (!marked || confirm("Another solve is already Solve of the Day for today. Replace it?")) void setSotd(day, last.id);
        },
        KeyZ: () => {
          if (!last) return;
          void (async () => {
            if (await confirmSolveDeletion(last, settings.precision)) await deleteSolve(last.id);
          })();
        },
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
  }, [timer.phase, lastHomeSolve, sotdMap, sotdEnabled, scramble, settings.precision]);

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
    setView("solves");
    setOpenSolveId(solve.id);
  };

  const openAverage = (spec: AverageSpec, end: number) => setAverageView({ spec, end });
  const openSolveAt = (index: number) => {
    const solve = viewSolves[index];
    if (solve) setOpenSolveId(solve.id);
  };
  // The buttons under the time act on the solve the time shows, when it was done here.
  const actionSolve = lastSolve && lastSolve.id === lastHomeSolve?.id && writable ? lastSolve : null;

  const lastResult = lastSolve ? formatSolve(lastSolve, settings.precision) : null;
  const newBest = timer.phase === "idle" && isNewBest(values);
  const goalReached = current && !isMainSession(current) && current.status === "active" && current.goal !== null && ownCount >= current.goal;
  const temporary = current && !isMainSession(current) ? current : null;
  // Never in the middle of a solve: it waits until the timer is idle again.
  const endOpen = temporary !== null && endFor === temporary.id && temporary.status === "active" && timer.phase === "idle";
  const backToMain = () => {
    setEndFor(null);
    if (main) selectSession(main.id);
  };

  if (eventId === null) return <div className="min-h-dvh" />;

  const scrambleImage = settings.showScrambleImage && event.puzzleId && scramble.scramble && event.kind !== "multi-blind" ? (
    <ScrambleImage puzzleId={event.puzzleId} scramble={scramble.scramble} />
  ) : null;
  /** The scramble picture as a button that opens it large. */
  const enlargeButton = (size: string) => (
    <button
      type="button"
      className={`${size} block cursor-zoom-in rounded-field`}
      onClick={(e) => { e.currentTarget.blur(); setDialog("scramble"); }}
      aria-label="Enlarge the scramble picture"
      title="Enlarge"
    >
      {/* The picture itself ignores taps, so the whole button takes them. */}
      <div className="pointer-events-none h-full w-full">{scrambleImage}</div>
    </button>
  );

  // The event picker and session controls: in the sidebar on wide screens, in the header on phones.
  const eventControls = (
    <>
      <EventPicker eventId={activeEventId} onChange={setEventId} />
      <button type="button" className="btn btn-sm min-w-0" onClick={() => setDialog("sessions")}>
        <FaCodeBranch aria-hidden /> <span className="truncate">{temporary ? temporary.name : "Main"}</span>
        {temporary && <span className="timer-digits text-muted">{temporary.goal === null ? ownCount : `${ownCount} / ${temporary.goal}`}</span>}
      </button>
      {!temporary && main && (
        <button type="button" className="btn btn-sm btn-ghost shrink-0" onClick={() => setDialog("start-temporary")} aria-label="New temporary session">
          <FaPlus aria-hidden /> <span className="hidden sm:inline">Temporary session</span>
        </button>
      )}
      {temporary?.status === "active" && (
        <button type="button" className="btn btn-sm btn-ghost shrink-0" onClick={() => setEndFor(temporary.id)}>
          <FaFlagCheckered aria-hidden /> End<span className="hidden sm:inline"> session</span>
        </button>
      )}
    </>
  );

  return (
    <CompetitionResultsContext.Provider value={competitionResults}>
    <div data-solving={solving} className="flex h-dvh flex-col">
      {/* Phones: the title, account and settings on one line, the event and session on the next. Wide screens: the event and session are at the top of the sidebar. */}
      <header className="focus-fade flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-base-300 bg-base-200 px-3 py-2 lg:h-14 lg:flex-nowrap lg:py-0">
        <h1 className="order-1 text-base font-semibold">
          <Link href="/" className="flex items-center gap-2">
            <FaStopwatch className="text-primary" aria-hidden /> {TIMER_NAME}
          </Link>
        </h1>
        {/* Phones have no sidebar, so the event and session stay in the header. */}
        <div className="order-3 flex w-full min-w-0 items-center gap-2 lg:hidden">{eventControls}</div>
        <div className="order-2 ml-auto flex items-center gap-1 lg:order-3">
          {authEnabled && <AccountButton />}
          <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => setDialog("settings")} aria-label="Settings"><FaGear className="size-4" aria-hidden /></button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main
          className={`relative min-h-0 flex-1 flex-col lg:order-2 lg:flex ${shownView === "timer" ? "flex" : "hidden"} ${usesTimer && writable ? "touch-surface" : ""}`}
          {...(usesTimer ? timer.surfaceHandlers : {})}
        >
          {!writable && current && (
            <div className="focus-fade mx-3 mt-3 alert alert-soft">
              <span>“{current.name}” was {current.status === "merged" ? "merged into Main" : current.status} and is read-only.</span>
              <div className="flex gap-2">
                <button type="button" className="btn btn-sm" onClick={() => setDialog("summary")}>Summary</button>
                {main && <button type="button" className="btn btn-sm" onClick={() => selectSession(main.id)}>Back to Main</button>}
              </div>
            </div>
          )}
          {goalReached && (
            <div className="focus-fade mx-3 mt-3 alert alert-success alert-soft">
              <span>Goal reached: {ownCount}/{current.goal} solves.</span>
              <button type="button" className="btn btn-sm" onClick={() => setEndFor(current.id)}>End session</button>
            </div>
          )}

          <section className="focus-fade max-h-[30dvh] shrink-0 overflow-y-auto px-4 pt-3 text-center lg:max-h-none" aria-label="Scramble">
            {event.kind === "multi-blind" ? (
              <MultiBlindSetup cubes={mbldCubes} onCubesChange={setMbldCubes} scrambles={mbldScrambles} generating={mbldGenerating} onGenerate={() => void makeMultiScrambles()} />
            ) : (
              <>
                <p className={`timer-digits mx-auto max-w-4xl text-balance ${event.id === "minx" || event.id.startsWith("6") || event.id.startsWith("7") ? "text-sm" : "text-lg sm:text-xl"}`}>
                  {scramble.error ?? (scramble.scramble ? <ScrambleText scramble={scramble.scramble} /> : <span className="text-muted">Making a scramble…</span>)}
                </p>
                <div className="mt-1 flex justify-center gap-1">
                  <button type="button" className="btn btn-ghost btn-xs" onClick={scramble.previous} disabled={!scramble.canGoBack} aria-label="Previous scramble"><FaArrowLeft aria-hidden /></button>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => scramble.scramble && void navigator.clipboard.writeText(scramble.scramble)} aria-label="Copy scramble"><FaRegCopy aria-hidden /></button>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={scramble.next} aria-label="Next scramble"><FaArrowRight aria-hidden /></button>
                </div>
              </>
            )}
          </section>

          {/* On phones with a scramble picture, the time sits under the scramble and the picture fills the space below; otherwise the time is centred. */}
          <div className={`flex min-h-0 flex-col items-center justify-center gap-1 px-4 py-4 lg:flex-1 [@media(max-height:700px)]:py-1 ${scrambleImage ? "flex-none" : "flex-1"}`}>
            {event.kind === "fewest-moves" ? (
              <FmcPanel scramble={scramble.scramble} onSave={saveFmc} disabled={!writable} />
            ) : settings.entry === "typing" ? (
              <>
                <TypingEntry precision={settings.precision} onSave={saveTyped} disabled={!writable || !scrambleText} />
                <div className="focus-fade mt-2"><LastSolveActions solve={actionSolve} sotdByDate={sotdMap} sotdEnabled={sotdEnabled} precision={settings.precision} /></div>
              </>
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
                  {timer.phase === "idle" && lastSolve?.competition ? <span className="text-ink-gold"><FaTrophy className="inline align-[-2px]" aria-hidden /> {lastSolve.competition.competitionName}</span>
                    : newBest ? <span className="font-medium text-accent">New best single</span>
                    : event.kind === "multi-blind" && !mbldScrambles ? <span className="text-muted">Make scrambles to start</span>
                    : timer.phase === "idle" && !actionSolve && <span className="text-muted">{settings.inspection && event.inspection ? "Press space (or touch the timer) to inspect" : "Hold space (or touch the timer), then let go"}</span>}
                </p>
                <div className={`focus-fade ${timer.phase === "idle" ? "" : "invisible"}`}>
                  <LastSolveActions solve={actionSolve} sotdByDate={sotdMap} sotdEnabled={sotdEnabled} precision={settings.precision} />
                </div>
              </>
            )}
          </div>

          {/* Phones: the scramble picture centred in the space between the time and the stats. */}
          {scrambleImage && (
            <div className="focus-fade flex min-h-16 flex-1 items-center justify-center px-3 pb-2 lg:hidden">
              {enlargeButton("h-full max-h-40 w-full max-w-56")}
            </div>
          )}
          {/* Wide screens: the scramble picture at the bottom right. Phones: the stats across the full width (wide screens have them in the sidebar). */}
          <div className="focus-fade flex shrink-0 flex-col gap-2 px-3 pb-3">
            {scrambleImage && <div className="hidden self-end lg:block">{enlargeButton("h-40 w-56")}</div>}
            <ScreenStats eventId={activeEventId} format={event.format} stats={stats} precision={settings.precision} onOpenAverage={openAverage} onOpenSolve={openSolveAt} recent={recentSolves} />
          </div>
        </main>

        <aside className={`focus-fade min-h-0 flex-1 flex-col gap-3 border-base-300 p-3 lg:order-1 lg:flex lg:w-80 lg:flex-none lg:border-r ${shownView === "timer" ? "hidden" : "flex"}`}>
          <div className="hidden min-w-0 flex-wrap items-center gap-2 lg:flex">{eventControls}</div>
          <div className={`lg:block ${shownView === "solves" || shownView === "stats" ? "" : "hidden"}`}>
            <SourceFilter value={sourceFilter} onChange={setSourceFilter} wcaId={competitionResults.wcaId} />
          </div>
          <div className={`lg:block ${shownView === "stats" ? "" : "hidden"}`}>
            <StatsPanel eventId={activeEventId} format={event.format} stats={stats} precision={settings.precision} onOpenAverage={openAverage} onOpenSolve={openSolveAt} />
          </div>
          {/* Only worth tabs when there's Solve of the Day to switch to. */}
          <div role="tablist" className={`tabs tabs-box tabs-sm hidden ${sotdEnabled ? "lg:flex" : ""}`}>
            <button type="button" role="tab" className={`tab grow ${shownTab === "solves" ? "tab-active" : ""}`} aria-selected={shownTab === "solves"} onClick={() => setTab("solves")}>Solves</button>
            {sotdEnabled && <button type="button" role="tab" className={`tab grow ${tab === "sotd" ? "tab-active" : ""}`} aria-selected={tab === "sotd"} onClick={() => setTab("sotd")}>Solve of the Day</button>}
          </div>
          {/* On phones the bottom tabs pick the list; on wide screens the tabs above do. */}
          <div className={`min-h-0 flex-1 overflow-hidden ${shownView === "solves" ? "block" : "hidden"} ${shownTab === "solves" ? "lg:block" : "lg:hidden"}`} role="tabpanel">
            <SolveList
              eventId={activeEventId}
              solves={viewSolves}
              rolling={rolling}
              rollingLabel={event.format === "mo3" ? "mo3" : "ao5"}
              sotdSolveIds={sotdSolveIds}
              precision={settings.precision}
              onOpen={(s) => setOpenSolveId(s.id)}
              onOpenAverage={(end) => openAverage(rollingSpec, end)}
            />
          </div>
          <div className={`min-h-0 flex-1 overflow-y-auto ${shownView === "sotd" ? "block" : "hidden"} ${shownTab === "sotd" ? "lg:block" : "lg:hidden"}`} role="tabpanel">
            <SotdList precision={settings.precision} onOpen={openFromSotd} />
          </div>
        </aside>
      </div>

      <nav className={`focus-fade grid shrink-0 ${mobileTabs.length === 4 ? "grid-cols-4" : "grid-cols-3"} border-t border-base-300 bg-base-200 pb-[env(safe-area-inset-bottom)] lg:hidden`} aria-label="Screens">
        {mobileTabs.map((item) => (
          <button
            key={item.view}
            type="button"
            className={`flex flex-col items-center gap-0.5 py-2 text-xs ${shownView === item.view ? "text-primary" : "text-muted"}`}
            aria-current={shownView === item.view ? "page" : undefined}
            onClick={() => setView(item.view)}
          >
            <span className="text-base">{item.icon}</span>
            {item.view === "sotd" ? "SOTD" : item.label}
          </button>
        ))}
      </nav>

      {main && current && (
        <SessionsDialog
          open={dialog === "sessions"}
          onClose={() => setDialog(null)}
          main={main}
          sessions={sessions}
          solves={allSolves}
          currentId={current.id}
          onSelect={selectSession}
          precision={settings.precision}
          onStartTemporary={() => setDialog("start-temporary")}
          onOpenSolve={(s) => setOpenSolveId(s.id)}
        />
      )}
      {main && (
        <StartSessionDialog
          open={dialog === "start-temporary"}
          onClose={() => setDialog(null)}
          main={main}
          onStarted={(session) => {
            setDialog(null);
            selectSession(session.id);
          }}
        />
      )}
      {main && (
        <EndSessionDialog
          session={endOpen ? temporary : null}
          onClose={() => setEndFor(null)}
          main={main}
          sessions={sessions}
          solves={allSolves}
          precision={settings.precision}
          onEnded={backToMain}
          onOpenSolve={(s) => setOpenSolveId(s.id)}
        />
      )}
      {current && dialog === "summary" && (
        <SessionSummaryDialog
          open
          onClose={() => setDialog(null)}
          name={current.name}
          eventId={activeEventId}
          solves={sessionView}
          precision={settings.precision}
          onOpenSolve={(s) => setOpenSolveId(s.id)}
        />
      )}
      <SettingsDialog open={dialog === "settings"} onClose={() => setDialog(null)} settings={settings} onChange={setSettings} onImportCsTimer={() => setDialog("import")} authEnabled={authEnabled} />
      <ImportDialog open={dialog === "import"} onClose={() => setDialog(null)} />
      {authEnabled && (
        <>
          <AccountSession />
          <UnsyncedSolvesDialog />
        </>
      )}
      <AverageDialog view={averageView} onClose={() => setAverageView(null)} eventId={activeEventId} solves={viewSolves} precision={settings.precision} onOpenSolve={(s) => setOpenSolveId(s.id)} />
      <Modal open={dialog === "scramble"} onClose={() => setDialog(null)} title="Scramble" wide>
        {event.puzzleId && scramble.scramble && (
          <div className="space-y-3">
            <div className="h-[min(60dvh,28rem)] w-full">
              <ScrambleImage puzzleId={event.puzzleId} scramble={scramble.scramble} />
            </div>
            <p className="timer-digits text-center text-sm">{scramble.scramble}</p>
          </div>
        )}
      </Modal>
      {/* Opens above whichever dialog asked (native dialogs stack in the order they open). */}
      <ConfirmDialog />
      <SolveDialog solve={openSolve} onClose={() => setOpenSolveId(null)} precision={settings.precision} sotdByDate={sotdMap} sotdEnabled={sotdEnabled} sotdDetails={sotdDetails} readOnly={openSolveReadOnly} />
      <Modal open={pendingMulti !== null} onClose={() => setPendingMulti(null)} title="How many did you solve?">
        <MultiResultForm attempted={mbldScrambles?.length ?? 0} onSave={saveMulti} />
      </Modal>
    </div>
    </CompetitionResultsContext.Provider>
  );
}

/** The scramble, never breaking a line inside a Square-1 move like "(1, -3) /". */
function ScrambleText({ scramble }: { scramble: string }) {
  if (!scramble.includes("(")) return scramble;
  return (scramble.match(/[^/]+\/?|\//g) ?? [scramble]).map((part, i) => (
    // Index keys are fine: the parts of one scramble never reorder.
    // oxlint-disable-next-line react/no-array-index-key
    <Fragment key={i}><span className="whitespace-nowrap">{part.trim()}</span>{" "}</Fragment>
  ));
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
