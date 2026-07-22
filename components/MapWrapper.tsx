"use client";

import dynamic from 'next/dynamic';

const CompetitionMap = dynamic(() => import('./CompetitionMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-base-300 animate-pulse rounded-2xl flex items-center justify-center text-base-content/50">
      Loading Interactive Map...
    </div>
  ),
});

export default function MapWrapper({ comps }: { comps: any[] }) {
  return <CompetitionMap comps={comps} />;
}