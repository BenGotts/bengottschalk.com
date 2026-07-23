"use client";

import dynamic from 'next/dynamic';

const CompetitionMap = dynamic(() => import('./CompetitionMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-900 animate-pulse rounded-lg flex items-center justify-center text-slate-500 text-sm">
      Loading map…
    </div>
  ),
});

export default function MapWrapper({ comps }: { comps: any[] }) {
  return <CompetitionMap comps={comps} />;
}