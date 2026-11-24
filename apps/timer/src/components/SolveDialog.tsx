"use client";

import { useState } from "react";
import { FaRegCopy, FaRegStar, FaStar, FaTrash } from "react-icons/fa6";
import { timerEvent } from "@bengottschalk/timer-core/events";
import type { Penalty, Solve } from "@bengottschalk/timer-core/solve";
import { localDate, sotdClipboardText, type SotdDetails } from "@bengottschalk/timer-core/sotd";
import { formatTime, type Precision } from "@bengottschalk/timer-core/time";
import { deleteSolve, setSotd, updateSolve } from "@/lib/db";
import { formatDateTime, formatSolve } from "@/lib/format";
import Modal from "./Modal";

interface Props {
  solve: Solve | null;
  onClose: () => void;
  precision: Precision;
  /** Which solve is Solve of the Day on each day. */
  sotdByDate: Map<string, string>;
  /** The details "Copy for Claude" needs, worked out from the session. */
  sotdDetails: (solve: Solve) => SotdDetails;
  /** Read-only when the solve's branch was merged or discarded, or it came from a competition. */
  readOnly: boolean;
}

const PENALTIES: { value: Penalty; label: string }[] = [
  { value: "none", label: "OK" },
  { value: "+2", label: "+2" },
  { value: "dnf", label: "DNF" },
];

export default function SolveDialog({ solve, onClose, precision, sotdByDate, sotdDetails, readOnly }: Props) {
  return (
    <Modal open={solve !== null} onClose={onClose} title={solve ? formatSolve(solve, precision) : "Solve"}>
      {solve && <SolveDetails key={solve.id} solve={solve} onClose={onClose} precision={precision} sotdByDate={sotdByDate} sotdDetails={sotdDetails} readOnly={readOnly} />}
    </Modal>
  );
}

function SolveDetails({ solve, onClose, precision, sotdByDate, sotdDetails, readOnly }: Props & { solve: Solve }) {
  const [comment, setComment] = useState(solve.comment);
  const [copied, setCopied] = useState<string | null>(null);
  const event = timerEvent(solve.eventId);
  const day = localDate(solve.startedAt);
  const sotdId = sotdByDate.get(day);
  const isSotd = sotdId === solve.id;
  const editable = !readOnly && solve.source === "home";

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied("Couldn't copy");
    }
  };

  const toggleSotd = async () => {
    if (isSotd) return setSotd(day, null);
    if (sotdId && !confirm("Another solve is already Solve of the Day for this day. Replace it with this one?")) return;
    await setSotd(day, solve.id);
  };

  const saveComment = () => {
    if (comment !== solve.comment) void updateSolve(solve.id, { comment });
  };

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">Event</dt><dd>{event.name}</dd>
        <dt className="text-muted">When</dt><dd>{formatDateTime(solve.startedAt)}</dd>
        {solve.penalty !== "none" && event.kind === "time" && (
          <><dt className="text-muted">Raw time</dt><dd className="timer-digits">{formatTime(solve.timeMs, "thousandths")}</dd></>
        )}
        {solve.memoMs !== null && <><dt className="text-muted">Memo</dt><dd className="timer-digits">{formatTime(solve.memoMs, precision)}</dd></>}
        {solve.multi && <><dt className="text-muted">Cubes</dt><dd>{solve.multi.solved}/{solve.multi.attempted}</dd></>}
        {solve.entry !== "timer" && <><dt className="text-muted">Entered</dt><dd>{{ typed: "Typed", stackmat: "Stackmat", import: "Imported", timer: "Timer" }[solve.entry]}</dd></>}
      </dl>

      <div>
        <div className="mb-1 text-xs text-muted">Scramble</div>
        <p className="timer-digits whitespace-pre-wrap rounded-field bg-base-200 p-2 text-sm">{solve.scramble || "—"}</p>
      </div>
      {solve.fmc && (
        <div>
          <div className="mb-1 text-xs text-muted">Solution ({solve.fmc.moves} moves)</div>
          <p className="timer-digits whitespace-pre-wrap rounded-field bg-base-200 p-2 text-sm">{solve.fmc.solution}</p>
        </div>
      )}

      {editable && event.kind === "time" && (
        <fieldset className="join">
          <legend className="sr-only">Penalty</legend>
          {PENALTIES.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`btn join-item btn-sm ${solve.penalty === p.value ? "btn-primary" : ""}`}
              aria-pressed={solve.penalty === p.value}
              onClick={() => void updateSolve(solve.id, { penalty: p.value })}
            >
              {p.label}
            </button>
          ))}
        </fieldset>
      )}

      <label className="block">
        <span className="mb-1 block text-xs text-muted">Comment</span>
        <textarea
          className="textarea w-full"
          rows={2}
          value={comment}
          disabled={!editable}
          onChange={(e) => setComment(e.target.value)}
          onBlur={saveComment}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={`btn btn-sm ${isSotd ? "btn-accent" : ""}`} aria-pressed={isSotd} onClick={() => void toggleSotd()}>
          {isSotd ? <FaStar aria-hidden /> : <FaRegStar aria-hidden />} Solve of the Day
        </button>
        <button type="button" className="btn btn-sm" onClick={() => void copy("Copied", `${formatSolve(solve, precision)}   ${solve.scramble}`)}>
          <FaRegCopy aria-hidden /> Copy
        </button>
        {isSotd && (
          <button type="button" className="btn btn-sm" onClick={() => void copy("Copied for Claude", sotdClipboardText(sotdDetails(solve)))}>
            <FaRegCopy aria-hidden /> Copy for Claude
          </button>
        )}
        {editable && (
          <button
            type="button"
            className="btn btn-sm btn-ghost text-error"
            onClick={() => {
              if (!confirm("Delete this solve?")) return;
              void deleteSolve(solve.id);
              onClose();
            }}
          >
            <FaTrash aria-hidden /> Delete
          </button>
        )}
        <output className="self-center text-sm text-success">{copied}</output>
      </div>
    </div>
  );
}
