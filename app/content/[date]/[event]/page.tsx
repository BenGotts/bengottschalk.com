import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyTextButton } from "@/components/CopyTextButton";
import { EVENT_NAMES } from "@/lib/wca";
import {
  formatSolveDisplayTime,
  getSolveByDateAndEvent,
  hasReconstruction,
  isSolveEvent,
} from "@/lib/solves";

interface PageProps {
  params: Promise<{ date: string; event: string }>;
}

export default async function SolveDetailPage({ params }: PageProps) {
  const { date, event } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isSolveEvent(event)) {
    notFound();
  }

  const solve = getSolveByDateAndEvent(date, event);
  if (!solve) {
    notFound();
  }

  const time = formatSolveDisplayTime(solve);
  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <Link href="/content" className="text-xs font-bold text-cyan-400 hover:underline">
          &larr; Back to archive
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`cubing-icon event-${event} text-3xl text-cyan-400`} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {EVENT_NAMES[event] ?? event}
            </h1>
            <p className="text-xs text-slate-400">{formattedDate}</p>
          </div>
          {time && (
            <span className="ml-auto font-mono text-xl font-black text-white">{time}s</span>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Scramble</h2>
          <CopyTextButton text={solve.scramble} />
        </div>
        <p className="font-mono text-sm text-slate-200 leading-relaxed break-all select-all">
          {solve.scramble}
        </p>
      </div>

      {(solve.videos?.youtube || solve.videos?.tiktok) && (
        <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Watch</h2>
          <div className="flex flex-wrap gap-3">
            {solve.videos.youtube && (
              <a
                href={solve.videos.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-4 py-2 rounded-lg bg-red-950 text-red-400 border border-red-800/80 hover:border-red-600 transition-colors"
              >
                YouTube &rarr;
              </a>
            )}
            {solve.videos.tiktok && (
              <a
                href={solve.videos.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-4 py-2 rounded-lg bg-slate-950 text-slate-200 border border-slate-700 hover:border-cyan-600 transition-colors"
              >
                TikTok &rarr;
              </a>
            )}
          </div>
        </div>
      )}

      {hasReconstruction(solve) && solve.reconstruction && (
        <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Reconstruction
            </h2>
            {solve.reconstruction.summary && (
              <p className="text-xs text-slate-400 mt-1">{solve.reconstruction.summary}</p>
            )}
          </div>
          <div className="space-y-3">
            {solve.reconstruction.steps.map((step, i) => (
              <div
                key={`${step.label}-${i}`}
                className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-400">{step.label}</span>
                  {step.comment && (
                    <span className="text-[10px] text-slate-500">{step.comment}</span>
                  )}
                </div>
                <p className="font-mono text-sm text-slate-200 break-all">{step.moves}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {solve.notes && (
        <p className="text-xs text-slate-500">{solve.notes}</p>
      )}
    </div>
  );
}
