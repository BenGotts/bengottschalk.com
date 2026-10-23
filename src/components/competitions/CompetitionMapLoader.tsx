"use client";

import dynamic from "next/dynamic";
import type { MapLocation } from "@/lib/wca/competitions";

// Leaflet needs `window`, so the map only renders in the browser.
const CompetitionMap = dynamic(() => import("./CompetitionMap"), {
  ssr: false,
  loading: () => <div className="skeleton h-[31rem] w-full rounded-box" aria-label="Loading map" />,
});

export default function CompetitionMapLoader({ locations }: { locations: MapLocation[] }) {
  return <CompetitionMap locations={locations} />;
}
