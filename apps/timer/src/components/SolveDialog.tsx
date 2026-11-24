"use client";

import { useEffect, useState } from "react";
import { FaRegCopy, FaRegStar, FaStar, FaTrash, FaTrophy } from "react-icons/fa6";
import { formatRoundAverage, ordinal, roundName } from "@bengottschalk/timer-core/competition";
import { timerEvent } from "@bengottschalk/timer-core/events";
import { rawTimeKnown, timingOf, TIMING_LABELS, type CompetitionAttempt, type Penalty, type Solve } from "@bengottschalk/timer-core/solve";
import { loadCompetitionScrambles } from "@/lib/wca/results";
import { localDate, sotdClipboardText, sotdKey, sotdReplaceQuestion, type SotdDetails } from "@bengottschalk/timer-core/sotd";
import { formatTime, type Precision } from "@bengottschalk/timer-core/time";
import { confirmSolveDeletion } from "@/lib/confirm";
import { deleteSolve, setSotd, updateSolve } from "@/lib/db";
import { formatDateTime, formatDay, formatSolveWithPoints, multiPointsText } from "@/lib/format";
import Modal from "./Modal";
import type { ColorScheme } from "@/lib/colorSchemes";
import ScrambleImage from "./ScrambleImage";

interface Props {
  solve: Solve | null;
  onClose: () => void;
  precision: Precision;
  /** Which solve is Solve of the Day for each event and day (keyed by `sotdKey`). */
  sotdByEventDay: Map<string, string>;
  /** Solve of the Day is only for the site owner's account. */
  sotdEnabled: boolean;
  /** The details "Copy for Claude" needs, worked out from the session. */
  sotdDetails: (solve: Solve) => SotdDetails;
  /** Read-only when the solve's branch was merged or discarded, or it came from a competition. */
  readOnly: boolean;
  /** Scramble picture colors for an event (the solve's own event's colors). */
  colorsFor: (eventId: string) => ColorScheme;
}

const PENALTIES: { value: Penalty; label: string }[] = [
  { value: "none", label: "OK" },
  { value: "+2", label: "+2" },
  { value: "dnf", label: "DNF" },
];

export default function SolveDialog({ solve, onClose, precision, sotdByEventDay, sotdEnabled, sotdDetails, readOnly, colorsFor }: Props) {
  return (
    <Modal open={solve !== null} onClose={onClose} title={solve ? formatSolveWithPoints(solve, precision) : "Solve"}>
      {solve && <SolveDetails key={solve.id} solve={solve} onClose={onClose} precision={precision} sotdByEventDay={sotdByEventDay} sotdEnabled={sotdEnabled} sotdDetails={sotdDetails} readOnly={readOnly} colorsFor={colorsFor} />}
    </Modal>
  );
}

const TIME_ESTIMATE: Record<CompetitionAttempt["timeEstimate"], string> = {
  entered: "about when, from your group and when your result was entered",
  group: "about when, from your group's slot",
  round: "about when, from the round's slot",
  day: "time not known",
};

/** Where a competition attempt came from. Its scramble is fetched the first time it's opened, where the WCA says which it was. */
function CompetitionDetails({ solve, competition, precision }: { solve: Solve; competition: CompetitionAttempt; precision: Precision }) {
  useEffect(() => {
    if (!solve.scramble && competition.status === "official") {
      loadCompetitionScrambles(competition.competitionId).catch(() => {
        // Scrambles are a nicety; the attempt shows without one.
      });
    }
  }, [solve.scramble, competition.competitionId, competition.status]);

  const average = formatRoundAverage(solve.eventId, competition.roundAverage, precision);
  const records = [competition.singleRecord && `${competition.singleRecord} single`, competition.averageRecord && `${competition.averageRecord} average`].filter(Boolean);
  return (
    <div className="rounded-box border border-ink-gold/40 bg-ink-gold/8 p-3 text-sm">
      <p className="flex items-center gap-2 font-medium text-ink-gold">
        <FaTrophy aria-hidden />
        <a className="link-hover" href={`https://www.worldcubeassociation.org/competitions/${competition.competitionId}/results/all`} target="_blank" rel="noreferrer">
          {competition.competitionName}
        </a>
        {competition.status === "live" && <span className="badge badge-error badge-xs">live</span>}
      </p>
      <p className="mt-1">
        {roundName(competition.roundTypeId)}, attempt {competition.attempt}
        {competition.position !== null && ` · placed ${ordinal(competition.position)}`}
        {average && ` · ${timerEvent(solve.eventId).format === "mo3" ? "mean" : "average"} ${average}`}
        {records.length > 0 && ` · ${records.join(", ")}`}
      </p>
      <p className="mt-1 text-xs text-muted">From the WCA{competition.status === "live" ? " Live" : ""}, so it can't be edited. It counts in your stats and averages.</p>
    </div>
  );
}

function SolveDetails({ solve, onClose, precision, sotdByEventDay, sotdEnabled, sotdDetails, readOnly, colorsFor }: Props & { solve: Solve }) {
  const [comment, setComment] = useState(solve.comment);
  const [copied, setCopied] = useState<string | null>(null);
  const event = timerEvent(solve.eventId);
  const day = localDate(solve.startedAt);
  const sotdId = sotdByEventDay.get(sotdKey(solve.eventId, day));
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
    if (isSotd) return setSotd(solve.eventId, day, null);
    if (sotdId && !confirm(sotdReplaceQuestion(solve.eventId, "this day"))) return;
    await setSotd(solve.eventId, day, solve.id);
  };

  const saveComment = () => {
    if (comment !== solve.comment) void updateSolve(solve.id, { comment });
  };

  return (
    <div className="space-y-4">
      {solve.competition && <CompetitionDetails solve={solve} competition={solve.competition} precision={precision} />}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">Event</dt><dd>{event.name}</dd>
        <dt className="text-muted">When</dt>
        <dd>
          {solve.competition && (solve.competition.timeEstimate === "round" || solve.competition.timeEstimate === "day") ? formatDay(localDate(solve.startedAt)) : formatDateTime(solve.startedAt)}
          {solve.competition && <span className="text-muted"> ({TIME_ESTIMATE[solve.competition.timeEstimate]})</span>}
        </dd>
        {solve.penalty !== "none" && event.kind === "time" && (
          <>
            <dt className="text-muted">Raw time</dt>
            <dd className={rawTimeKnown(solve) ? "timer-digits" : "text-muted"}>
              {/* The WCA records no time for a DNF. */}
              {rawTimeKnown(solve) ? formatTime(solve.timeMs, precision) : "Not recorded"}
            </dd>
          </>
        )}
        {solve.memoMs !== null && <><dt className="text-muted">Memo</dt><dd className="timer-digits">{formatTime(solve.memoMs, precision)}</dd></>}
        {solve.multi && (
          <>
            <dt className="text-muted">Cubes</dt><dd className="timer-digits">{solve.multi.solved}/{solve.multi.attempted}</dd>
            {/* Solved minus missed; fewer than 2 solved or below 0 points is a DNF. */}
            <dt className="text-muted">Points</dt><dd>{multiPointsText(solve) ?? <span className="text-muted">none: {solve.penalty === "dnf" ? "a DNF" : solve.multi.solved < 2 ? "a DNF (fewer than 2 solved)" : "a DNF (more missed than solved)"}</span>}</dd>
          </>
        )}
        <dt className="text-muted">Timed with</dt><dd>{TIMING_LABELS[timingOf(solve)]}</dd>
      </dl>

      <div>
        <div className="mb-1 text-xs text-muted">Scramble</div>
        <p className="timer-digits whitespace-pre-wrap rounded-field bg-base-200 p-2 text-sm">
          {solve.scramble || (solve.competition ? <span className="font-sans text-muted">Not known: the WCA posts each round's scramble sets, but not which set a competitor had.</span> : "—")}
        </p>
        {/* Multi-Blind has several scrambles, so no single picture. */}
        {solve.scramble && event.puzzleId && event.kind !== "multi-blind" && (
          <div className="mt-2 h-40 w-full">
            <ScrambleImage puzzleId={event.puzzleId} scramble={solve.scramble} scheme={colorsFor(solve.eventId)} />
          </div>
        )}
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

      {!solve.competition && (
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
      )}

      <div className="flex flex-wrap gap-2">
        {sotdEnabled && (
          <button type="button" className={`btn btn-sm ${isSotd ? "btn-accent" : ""}`} aria-pressed={isSotd} onClick={() => void toggleSotd()}>
            {isSotd ? <FaStar aria-hidden /> : <FaRegStar aria-hidden />} Solve of the Day
          </button>
        )}
        <button type="button" className="btn btn-sm" onClick={() => void copy("Copied", `${formatSolveWithPoints(solve, precision)}   ${solve.scramble}`)}>
          <FaRegCopy aria-hidden /> Copy
        </button>
        {sotdEnabled && isSotd && (
          <button type="button" className="btn btn-sm" onClick={() => void copy("Copied for Claude", sotdClipboardText(sotdDetails(solve), precision))}>
            <FaRegCopy aria-hidden /> Copy for Claude
          </button>
        )}
        {editable && (
          <button
            type="button"
            className="btn btn-sm btn-ghost text-error"
            onClick={() => {
              void (async () => {
                if (!(await confirmSolveDeletion(solve, precision))) return;
                await deleteSolve(solve.id);
                onClose();
              })();
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
