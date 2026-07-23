import Link from "next/link";
import { DesktopNav } from "@/components/DesktopNav";
import { MobileNav } from "@/components/MobileNav";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-4">
        <Link
          href="/"
          className="group text-lg sm:text-xl font-black text-sky-400 tracking-tight flex items-center gap-2 min-w-0"
        >
          <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
            <span className="cubing-icon event-sq1 text-cyan-400 text-xl absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-75 group-hover:rotate-12 flex items-center justify-center" />
            <span className="cubing-icon event-333 text-emerald-400 text-xl absolute inset-0 opacity-0 scale-75 -rotate-12 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0 flex items-center justify-center" />
          </div>
          <span className="truncate">
            bengottschalk<span className="text-emerald-400">.com</span>
          </span>
        </Link>

        <DesktopNav />
        <MobileNav />
      </div>
    </header>
  );
}
