import Link from "next/link";
import { SolveOfTheDayStrip } from "@/components/SolveOfTheDayStrip";

export default function ContentPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white">Solve of the Day</h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Daily 3x3, Square-1, and 3BLD solves with scrambles and reconstructions.
          Searchable archive coming soon.
        </p>
      </div>

      <SolveOfTheDayStrip />

      <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
        <p className="text-sm text-slate-400">Full archive search is on the roadmap.</p>
        <Link href="/" className="text-xs font-bold text-cyan-400 hover:underline">
          Back to home &rarr;
        </Link>
      </div>
    </div>
  );
}
