"use client";

import { useEffect, useState } from "react";

export function FooterClockBadge() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "America/Los_Angeles",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded border bg-slate-900 text-slate-300 border-slate-800 tabular-nums">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      <span className="text-slate-500">Oregon</span>
      <span className="font-mono text-emerald-400">{time || "—:—:—"}</span>
      <span className="text-slate-600">PT</span>
    </span>
  );
}
