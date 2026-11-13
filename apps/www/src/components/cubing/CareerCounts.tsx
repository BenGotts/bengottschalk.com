import { LuFlag } from "react-icons/lu";
import { isMilestoneCount, type CompetitionNumbers } from "@/lib/wca/careerMilestones";
import { ordinal } from "@/lib/wca/onThisDay";

/** One career count, flagged when it's a milestone (see `isMilestoneCount`), e.g. "100th competition". */
function Count({ number, noun }: { number: number; noun: string }) {
  if (!isMilestoneCount(number)) return <span>{ordinal(number)} {noun}</span>;
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-base-content">
      <LuFlag aria-hidden="true" className="size-3.5 text-primary" />
      {number === 1 ? "First" : ordinal(number)} {noun}
    </span>
  );
}

/** Which competition it is in my career, e.g. "42nd competition · 15th as Delegate"; nothing when neither is known. */
export default function CareerCounts({ numbers, className = "" }: { numbers: CompetitionNumbers | undefined; className?: string }) {
  const { competition, delegated } = numbers ?? {};
  if (competition === undefined && delegated === undefined) return null;
  return (
    <span className={`flex flex-wrap items-center gap-x-1.5 text-sm text-muted ${className}`}>
      {competition !== undefined && <Count number={competition} noun="competition" />}
      {competition !== undefined && delegated !== undefined && <span aria-hidden="true">·</span>}
      {delegated !== undefined && <Count number={delegated} noun="as Delegate" />}
    </span>
  );
}
