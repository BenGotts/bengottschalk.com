"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Footer() {
  const [time, setTime] = useState<string>("");

  // Update Pacific Time clock dynamically on client side
  useEffect(() => {
    const updateTime = () => {
      const pnwTime = new Date().toLocaleTimeString("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTime(pnwTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-16 border-t-2 border-slate-800 bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        
        {/* TOP ROW: BRAND & LIVE STATUS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-800">
          
          <div className="space-y-1">
            <Link href="/" className="text-xl font-black text-sky-400 tracking-tight flex items-center gap-2">
              <span className="cubing-icon event-333 text-emerald-400 text-xl"></span>
              bengottschalk<span className="text-emerald-400">.com</span>
            </Link>
            <p className="text-xs text-slate-400">
              Software Engineer • WCA Regional Delegate • Trumpeter
            </p>
          </div>

          {/* Live PNW Clock & Status Badge */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Oregon (PT):</span>
              <span className="font-mono text-emerald-400 font-bold">{time || "Pacific Time"}</span>
            </div>
            <span className="text-slate-700">|</span>
            <span className="text-xs text-sky-400 font-semibold">Available for Projects & Comps</span>
          </div>

        </div>

        {/* MIDDLE ROW: CATEGORIES & QUICK NAVIGATION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
          
          {/* Col 1: Speedcubing */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-emerald-400">
              WCA Speedcubing
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/cubing" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="cubing-icon event-333 text-slate-400"></span> PNW Competitions
                </Link>
              </li>
              <li>
                <Link href="/cubing#delegate" className="hover:text-emerald-400 transition-colors">
                  Delegate Information
                </Link>
              </li>
              <li>
                <a 
                  href="https://www.worldcubeassociation.org" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  WCA Official Site ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Content Series */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-cyan-400">
              Solve of the Day
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/content#3x3" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <span className="cubing-icon event-333 text-slate-400"></span> 3x3x3 Solves
                </Link>
              </li>
              <li>
                <Link href="/content#sq1" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <span className="cubing-icon event-sq1 text-slate-400"></span> Square-1 Solves
                </Link>
              </li>
              <li>
                <Link href="/content#3bld" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <span className="cubing-icon event-333bf text-slate-400"></span> 3BLD Solves
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Tech & Engineering */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-sky-400">
              Software & Tech
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/tech" className="hover:text-sky-300 transition-colors">
                  Project Portfolio
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-sky-300 transition-colors inline-flex items-center gap-1"
                >
                  GitHub Profile ↗
                </a>
              </li>
              <li>
                <Link href="/tech#stack" className="hover:text-sky-300 transition-colors">
                  Next.js & Tailwind Stack
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Music & Performance */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-blue-400">
              Brass Performance
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/music#symphony" className="hover:text-blue-300 transition-colors">
                  Hillsboro Symphony
                </Link>
              </li>
              <li>
                <Link href="/music#marching" className="hover:text-blue-300 transition-colors">
                  One More Time Band
                </Link>
              </li>
              <li>
                <Link href="/contact?topic=music" className="hover:text-blue-300 transition-colors">
                  Booking & Concerts
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM ROW: COPYRIGHT & BACK TO TOP BUTTON */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Ben Gottschalk. Built with Next.js, Tailwind v4 & DaisyUI 5.</p>

          <button 
            onClick={scrollToTop}
            className="group flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-sky-400 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
          >
            <span>Back to top</span>
            <span className="group-hover:-translate-y-0.5 transition-transform">↑</span>
          </button>
        </div>

      </div>
    </footer>
  );
}