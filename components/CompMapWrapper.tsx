"use client";

import dynamic from "next/dynamic";
import type { CompLocation } from "@/components/CompMap";

const DynamicCompMap = dynamic(() => import("@/components/CompMap"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-slate-900/50 animate-pulse rounded-2xl flex items-center justify-center text-xs text-slate-500">
      Loading Competition Map...
    </div>
  ),
});

export default function CompMapWrapper({ competitions }: { competitions: CompLocation[] }) {
  return <DynamicCompMap competitions={competitions} />;
}