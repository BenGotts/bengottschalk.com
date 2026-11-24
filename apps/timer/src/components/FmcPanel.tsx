"use client";

import { useEffect, useRef, useState } from "react";
import { FaRegCopy } from "react-icons/fa6";
import { describeFmcProblem, fmcProblem, FMC_TIME_LIMIT_MS, parseFmcSolution, startsLikeInverseScramble } from "@bengottschalk/timer-core/fmc";
import type { ColorScheme } from "@/lib/colorSchemes";
import { confirmAction } from "@/lib/confirm";
import { invertScramble, solvesScramble } from "@/lib/scrambles";
import ScrambleImage from "./ScrambleImage";

export interface FmcResult {
  /** The attempt's own scramble (after a reload, it isn't the one the timer is showing). */
  scramble: string;
  solution: string;
  moves: number;
  dnf: boolean;
  /** The scratch pad. */
  notes: string;
  startedAt: number;
  /** From starting to saving, even past the hour. */
  timeMs: number;
}

/** An attempt in progress, kept in this browser so a reload doesn't lose it. */
interface Attempt {
  scramble: string;
  startedAt: number;
  scratch: string;
  solution: string;
}

const STORAGE_KEY = "timer.fmc-attempt";

function loadAttempt(): Attempt | null {
  try {
    const raw = typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return isAttempt(value) ? { scramble: value.scramble, startedAt: value.startedAt, scratch: value.scratch, solution: value.solution } : null;
  } catch {
    return null;
  }
}

function isAttempt(value: unknown): value is Attempt {
  return typeof value === "object" && value !== null
    && "scramble" in value && typeof value.scramble === "string"
    && "startedAt" in value && typeof value.startedAt === "number"
    && "scratch" in value && typeof value.scratch === "string"
    && "solution" in value && typeof value.solution === "string";
}

function storeAttempt(attempt: Attempt | null): void {
  try {
    if (attempt) localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private windows and full storage: the attempt still works, it just won't survive a reload.
  }
}

/** Minutes and seconds (60:00, not 1:00:00), rounded up for a countdown. */
function clock(ms: number, roundUp = false): string {
  const seconds = roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

interface Props {
  /** The next scramble, hidden until the attempt starts. */
  scramble: string | null;
  /** Why the scramble couldn't be made, if it couldn't. */
  error: string | null;
  puzzleId: string | null;
  scheme: ColorScheme;
  showImage: boolean;
  onSave: (result: FmcResult) => void;
  disabled: boolean;
}

/**
 * Fewest Moves, as at a competition: the scramble stays hidden until the
 * attempt starts (E2a2), then an hour to find a solution, with a scratch pad.
 * The solution is checked as a judge would (E2c, E2d) before it's saved.
 */
export default function FmcPanel({ scramble, error, puzzleId, scheme, showImage, onSave, disabled }: Props) {
  const [attempt, setAttempt] = useState<Attempt | null>(loadAttempt);
  const [now, setNow] = useState(() => Date.now());
  const [inverse, setInverse] = useState<string | null>(null);
  const [showInverse, setShowInverse] = useState(false);
  /** Why the solution wouldn't count, shown before saving it as a DNF. */
  const [problem, setProblem] = useState<{ text: string; dnf: boolean } | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const problemRef = useRef<HTMLDivElement>(null);

  // On a phone the panel scrolls: bring the problem (and its buttons) into view.
  useEffect(() => {
    if (problem) problemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [problem]);

  useEffect(() => storeAttempt(attempt), [attempt]);

  const running = attempt !== null;
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  const read = parseFmcSolution(attempt?.solution ?? "");
  const elapsed = attempt ? Math.max(0, now - attempt.startedAt) : 0;
  const overTime = elapsed >= FMC_TIME_LIMIT_MS;

  const update = (change: Partial<Attempt>) => setAttempt((a) => (a ? { ...a, ...change } : a));

  const start = () => {
    if (!scramble) return;
    setAttempt({ scramble, startedAt: Date.now(), scratch: "", solution: "" });
    setNow(Date.now());
  };

  const finish = (dnf: boolean, endedAt: number) => {
    if (!attempt) return;
    onSave({
      scramble: attempt.scramble,
      solution: attempt.solution.trim(),
      moves: read.invalid.length > 0 ? 0 : read.count,
      dnf,
      notes: attempt.scratch,
      startedAt: attempt.startedAt,
      timeMs: Math.max(0, endedAt - attempt.startedAt),
    });
    setAttempt(null);
    setInverse(null);
    setShowInverse(false);
    setProblem(null);
  };

  /** `endedAt`: when Submit was pressed (the check takes a moment). */
  const submit = async (endedAt: number) => {
    if (!attempt) return;
    const found = fmcProblem(read);
    if (found?.kind === "empty") return setProblem({ text: describeFmcProblem(found), dnf: false });
    if (found) return setProblem({ text: `${describeFmcProblem(found)} Saved like this, it's a DNF.`, dnf: true });
    setChecking(true);
    try {
      if (!(await solvesScramble(attempt.scramble, read.moves.join(" ")))) return setProblem({ text: "This doesn't solve the cube. Check for a typo, or save it as a DNF.", dnf: true });
    } finally {
      setChecking(false);
    }
    finish(false, endedAt);
  };

  const discard = async () => {
    if (!(await confirmAction({ title: "Discard this attempt?", message: "The scramble, scratch pad and solution are thrown away. Nothing is saved.", confirmLabel: "Discard", danger: true }))) return;
    setAttempt(null);
    setInverse(null);
    setShowInverse(false);
    setProblem(null);
  };

  const toggleInverse = async () => {
    if (!attempt) return;
    if (!showInverse && inverse === null) setInverse(await invertScramble(attempt.scramble));
    setShowInverse((s) => !s);
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied("Couldn't copy");
    }
    setTimeout(() => setCopied(null), 1500);
  };

  if (!attempt) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 text-center">
        <span className="timer-digits text-5xl">{clock(FMC_TIME_LIMIT_MS)}</span>
        <p className="text-sm text-muted">
          The scramble shows when you start. You then have an hour to find a solution, using face turns, outer block turns (Rw) and rotations.
        </p>
        <button type="button" className="btn btn-primary" onClick={start} disabled={disabled || !scramble}>Start attempt</button>
        {!scramble && <p className={`text-sm ${error ? "text-error" : "text-muted"}`}>{error ?? "Making a scramble…"}</p>}
      </div>
    );
  }

  const fromInverse = read.moves.length > 0 && startsLikeInverseScramble(read.moves, attempt.scramble);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col gap-3 overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`timer-digits text-4xl sm:text-5xl ${overTime ? "text-error" : ""}`} aria-label="Time left">
          {overTime ? `+${clock(elapsed - FMC_TIME_LIMIT_MS)}` : clock(FMC_TIME_LIMIT_MS - elapsed, true)}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void discard()}>Discard attempt</button>
      </div>
      {overTime && (
        <output className="alert alert-warning alert-soft py-2 text-sm">
          The hour is up. At a competition the solution is handed in at 60:00 (Regulation E2b); you can still save it here, with the time taken.
        </output>
      )}

      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <section className="min-w-0 space-y-2" aria-label="Scramble">
          <p className="timer-digits rounded-field bg-base-200 p-2 text-lg text-balance">{attempt.scramble}</p>
          {showInverse && inverse && (
            <div>
              <div className="text-xs text-muted">Inverse</div>
              <p className="timer-digits rounded-field bg-base-200 p-2 text-lg text-balance" aria-label="Inverse scramble">{inverse}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1">
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => void copy(attempt.scramble, "Scramble copied")}><FaRegCopy aria-hidden /> Copy scramble</button>
            <button type="button" className={`btn btn-xs ${showInverse ? "btn-active" : "btn-ghost"}`} aria-pressed={showInverse} onClick={() => void toggleInverse()}>Show inverse</button>
            {showInverse && inverse && <button type="button" className="btn btn-ghost btn-xs" onClick={() => void copy(inverse, "Inverse copied")}><FaRegCopy aria-hidden /> Copy inverse</button>}
            {copied && <output className="text-xs text-muted">{copied}</output>}
          </div>
          {showImage && puzzleId && (
            <div className="flex gap-2">
              <div className="flex h-32 min-w-0 flex-1 flex-col sm:h-40">
                <div className="min-h-0 flex-1"><ScrambleImage puzzleId={puzzleId} scramble={attempt.scramble} scheme={scheme} /></div>
                {showInverse && inverse && <div className="text-center text-xs text-muted">Scramble</div>}
              </div>
              {showInverse && inverse && (
                <div className="flex h-32 min-w-0 flex-1 flex-col sm:h-40">
                  <div className="min-h-0 flex-1"><ScrambleImage puzzleId={puzzleId} scramble={inverse} scheme={scheme} /></div>
                  <div className="text-center text-xs text-muted">Inverse</div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="min-w-0 space-y-2">
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Scratch pad <span className="text-xs">(saved with the solve, not checked)</span></span>
            <textarea
              className="textarea timer-digits h-36 w-full lg:h-56"
              value={attempt.scratch}
              onChange={(e) => update({ scratch: e.target.value })}
              placeholder={"Notes and working: EO, blocks, insertions…"}
              disabled={disabled}
              spellCheck={false}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">
              Solution
              {read.invalid.length === 0 && read.count > 0 && <span className="text-base-content"> · {read.count} moves</span>}
              {read.invalid.length > 0 && <span className="text-error"> · not notation: {read.invalid.join(", ")}</span>}
            </span>
            <textarea
              className="textarea timer-digits w-full"
              rows={3}
              value={attempt.solution}
              onChange={(e) => { update({ solution: e.target.value }); setProblem(null); }}
              placeholder="R U' F2 Rw …  (// for a note)"
              disabled={disabled}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </label>
          {fromInverse && <p className="text-sm text-warning">This starts like the inverse scramble. At a competition that can be ruled as taken from the scramble, a DNF (Regulation E2e).</p>}
          <div ref={problemRef} className="space-y-2">
            {problem && !problem.dnf && <p className="text-sm text-error" role="alert">{problem.text}</p>}
            {problem?.dnf ? (
              <div className="alert alert-error alert-soft flex flex-col items-start gap-2 text-sm" role="alert">
                <span>{problem.text}</span>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-sm" onClick={() => setProblem(null)}>Keep editing</button>
                  <button type="button" className="btn btn-sm btn-error" onClick={() => finish(true, Date.now())} disabled={disabled}>Save as DNF</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void submit(Date.now())} disabled={disabled || checking}>{checking ? "Checking…" : "Submit"}</button>
                <button type="button" className="btn btn-sm" onClick={() => finish(true, Date.now())} disabled={disabled}>Give up (DNF)</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
