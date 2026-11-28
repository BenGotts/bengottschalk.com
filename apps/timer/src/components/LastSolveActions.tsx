"use client";

import { useEffect, useRef, useState } from "react";
import { FaRegComment, FaRegStar, FaStar, FaTrash } from "react-icons/fa6";
import { timerEvent } from "@bengottschalk/timer-core/events";
import type { Penalty, Solve } from "@bengottschalk/timer-core/solve";
import { localDate, sotdKey, sotdReplaceQuestion } from "@bengottschalk/timer-core/sotd";
import type { Precision } from "@bengottschalk/timer-core/time";
import { confirmSolveDeletion } from "@/lib/confirm";
import { deleteSolve, restoreSolve, setSotd, updateSolve } from "@/lib/db";
import { useShortcuts, withShortcut, type ShortcutId } from "@/lib/shortcuts";
import Modal from "./Modal";

interface Props {
  /** The latest solve done here (competition attempts are never edited); null hides the buttons. */
  solve: Solve | null;
  /** Which solve is Solve of the Day for each event and day (keyed by `sotdKey`). */
  sotdByEventDay: Map<string, string>;
  /** Solve of the Day is only for the site owner's account. */
  sotdEnabled: boolean;
  precision: Precision;
  /** Whether the keyboard shortcuts for these buttons work (only while the timer is idle). */
  shortcuts: boolean;
}

const PENALTIES: { value: Penalty; label: string; shortcut: ShortcutId }[] = [
  { value: "none", label: "OK", shortcut: "ok" },
  { value: "+2", label: "+2", shortcut: "plus2" },
  { value: "dnf", label: "DNF", shortcut: "dnf" },
];

const UNDO_MS = 6000;

/** A button keeps focus after a click; let go of it so the space bar goes to the timer, not the button. */
const blur = (e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.blur();

/**
 * Buttons under the time for the solve just done, like csTimer's: OK, +2 or
 * DNF, delete (asks first, then offers undo), a comment, and Solve of the Day.
 * Their keyboard shortcuts (see lib/shortcuts.ts) are handled here too, so a
 * shortcut does exactly what its button does, undo included.
 */
export default function LastSolveActions({ solve, sotdByEventDay, sotdEnabled, precision, shortcuts }: Props) {
  const [deleted, setDeleted] = useState<{ solve: Solve; wasSotd: boolean } | null>(null);
  const [commenting, setCommenting] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  // Worked out before the early returns below, so the shortcut hook always runs.
  const day = solve ? localDate(solve.startedAt) : null;
  const sotdId = solve && day ? sotdByEventDay.get(sotdKey(solve.eventId, day)) : undefined;
  const isSotd = solve !== null && sotdId === solve.id;
  const timed = solve !== null && timerEvent(solve.eventId).kind === "time";

  const setPenalty = (penalty: Penalty) => {
    if (solve && solve.penalty !== penalty) void updateSolve(solve.id, { penalty });
  };

  const toggleSotd = async () => {
    if (!solve || !day) return;
    if (isSotd) return setSotd(solve.eventId, day, null);
    if (sotdId && !confirm(sotdReplaceQuestion(solve.eventId, "today"))) return;
    await setSotd(solve.eventId, day, solve.id);
  };

  const remove = async () => {
    if (!solve || !(await confirmSolveDeletion(solve, precision))) return;
    await deleteSolve(solve.id);
    setDeleted({ solve, wasSotd: isSotd });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setDeleted(null), UNDO_MS);
  };

  // Only while the buttons are there to press: not while "Solve deleted. Undo" shows, or with no solve.
  useShortcuts(shortcuts && solve !== null && !deleted, {
    ...(timed ? { ok: () => setPenalty("none"), plus2: () => setPenalty("+2"), dnf: () => setPenalty("dnf") } : {}),
    delete: () => void remove(),
    comment: () => setCommenting(true),
    ...(sotdEnabled ? { sotd: () => void toggleSotd() } : {}),
  });

  if (deleted) {
    return (
      <div className="flex h-10 items-center justify-center gap-3 text-sm">
        <output className="text-muted">Solve deleted.</output>
        <button
          type="button"
          className="btn btn-sm"
          onClick={(e) => {
            blur(e);
            if (undoTimer.current) clearTimeout(undoTimer.current);
            void restoreSolve(deleted.solve.id).then(() => (deleted.wasSotd ? setSotd(deleted.solve.eventId, localDate(deleted.solve.startedAt), deleted.solve.id) : undefined));
            setDeleted(null);
          }}
        >
          Undo
        </button>
      </div>
    );
  }
  if (!solve) return <div className="h-10" />;

  return (
    <div className="flex h-10 flex-wrap items-center justify-center gap-2">
      {timed && (
        <fieldset className="join">
          <legend className="sr-only">Penalty for the last solve</legend>
          {PENALTIES.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`btn join-item min-w-12 ${solve.penalty === p.value ? "btn-primary" : ""}`}
              aria-pressed={solve.penalty === p.value}
              title={withShortcut(p.label, p.shortcut)}
              onClick={(e) => {
                blur(e);
                setPenalty(p.value);
              }}
            >
              {p.label}
            </button>
          ))}
        </fieldset>
      )}
      <div className="join">
        <button type="button" className="btn join-item btn-square" aria-label="Delete the last solve" title={withShortcut("Delete", "delete")} onClick={(e) => { blur(e); void remove(); }}>
          <FaTrash aria-hidden />
        </button>
        <button
          type="button"
          className={`btn join-item btn-square ${solve.comment ? "text-primary" : ""}`}
          aria-label={solve.comment ? "Edit the comment" : "Add a comment"}
          title={solve.comment || withShortcut("Comment", "comment")}
          onClick={(e) => { blur(e); setCommenting(true); }}
        >
          <FaRegComment aria-hidden />
        </button>
        {sotdEnabled && (
          <button
            type="button"
            className={`btn join-item btn-square ${isSotd ? "btn-accent" : ""}`}
            aria-pressed={isSotd}
            aria-label="Solve of the Day"
            title={withShortcut("Solve of the Day", "sotd")}
            onClick={(e) => { blur(e); void toggleSotd(); }}
          >
            {isSotd ? <FaStar aria-hidden /> : <FaRegStar aria-hidden />}
          </button>
        )}
      </div>
      {/* The dialog sits inside the timer's touch area in React's tree: keep its taps from reaching the timer. */}
      <div className="contents" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
        <Modal open={commenting} onClose={() => setCommenting(false)} title="Comment">
          <CommentForm
            initial={solve.comment}
            onSave={(comment) => {
              if (comment !== solve.comment) void updateSolve(solve.id, { comment });
              setCommenting(false);
            }}
          />
        </Modal>
      </div>
    </div>
  );
}

function CommentForm({ initial, onSave }: { initial: string; onSave: (comment: string) => void }) {
  const [comment, setComment] = useState(initial);
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => field.current?.focus(), []);
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(comment.trim()); }}>
      <textarea
        ref={field}
        className="textarea w-full"
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSave(comment.trim());
          }
        }}
        aria-label="Comment"
        placeholder="Lucky skip, lockup on F2L…"
      />
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary btn-sm">Save</button>
      </div>
    </form>
  );
}
