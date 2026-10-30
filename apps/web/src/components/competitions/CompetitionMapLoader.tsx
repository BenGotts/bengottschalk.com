"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { MapLocation } from "@/lib/wca/competitions";

// <output> has the implicit "status" role, so screen readers announce it.
const placeholder = (
  <output className="skeleton block h-[23rem] w-full sm:h-[31rem] rounded-box">
    <span className="sr-only">Loading map</span>
  </output>
);

// Leaflet needs `window`, so the map only renders in the browser.
const CompetitionMap = dynamic(() => import("./CompetitionMap"), { ssr: false, loading: () => placeholder });

/**
 * The map sits below the fold, so Leaflet (the heaviest script on the site) is
 * only loaded once the placeholder is about to scroll into view.
 */
export default function CompetitionMapLoader({ locations }: { locations: MapLocation[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return () => {};
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{nearViewport ? <CompetitionMap locations={locations} /> : placeholder}</div>;
}
