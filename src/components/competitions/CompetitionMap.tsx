"use client";

import "leaflet/dist/leaflet.css";
import { latLngBounds, type Map as LeafletMap } from "leaflet";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LuFocus, LuHouse, LuMaximize, LuMinimize, LuMinus, LuPlus } from "react-icons/lu";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { THEMES } from "@/lib/theme";
import { useTheme } from "@/lib/useTheme";
// Import the pure module directly: the wca index also exports server-only API code.
import { mostCurrentStatus, type MapLocation, type MapStatus } from "@/lib/wca/competitions";

const HOME_CENTER: [number, number] = [45.5, -122.7]; // Portland
const HOME_ZOOM = 5;
const POPUP_LIMIT = 8;

// Esri Canvas basemaps: keyless, with a separate labels layer on top.
// (CARTO's basemaps, used before, now require an API key.)
const esriTiles = (service: string) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${service}/MapServer/tile/{z}/{y}/{x}`;
const TILES = {
  [THEMES.dark]: { base: esriTiles("World_Dark_Gray_Base"), labels: esriTiles("World_Dark_Gray_Reference") },
  [THEMES.light]: { base: esriTiles("World_Light_Gray_Base"), labels: esriTiles("World_Light_Gray_Reference") },
};
const ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const MAX_ZOOM = 16; // Canvas basemaps stop at 16

const FILTERS: { status: MapStatus; label: string; dot: string; active: string }[] = [
  { status: "past", label: "Past", dot: "bg-primary", active: "border-primary bg-primary/10" },
  { status: "upcoming", label: "Upcoming", dot: "bg-secondary", active: "border-secondary bg-secondary/10" },
  { status: "ongoing", label: "Happening now", dot: "bg-error", active: "border-error bg-error/10" },
];

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="btn join-item btn-square btn-sm border-base-300 bg-base-200 hover:border-primary"
    >
      {children}
    </button>
  );
}

export default function CompetitionMap({ locations }: { locations: MapLocation[] }) {
  const theme = useTheme();
  // The whole widget (filters, controls, map, popups). Used for fullscreen and
  // to decide whether the visitor is interacting with the map.
  const widgetRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [shown, setShown] = useState<Record<MapStatus, boolean>>({ past: true, upcoming: true, ongoing: true });
  const [engaged, setEngaged] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mapInstance, setMapInstance] = useState(0);

  // Next.js keeps pages hidden with React <Activity> after navigating away,
  // running effect cleanups but keeping the DOM. react-leaflet destroys its map
  // in that cleanup and never recreates it, so each hide swaps in a new
  // MapContainer (via its key), which builds a fresh map when shown again.
  useLayoutEffect(
    () => () => {
      setMapInstance((n) => n + 1);
      setExpanded(false);
    },
    [],
  );

  const counts = useMemo(() => {
    const totals: Record<MapStatus, number> = { past: 0, upcoming: 0, ongoing: 0 };
    for (const location of locations) for (const c of location.competitions) totals[c.status]++;
    return totals;
  }, [locations]);

  const visible = useMemo(
    () =>
      locations.flatMap((location) => {
        const competitions = location.competitions.filter((c) => shown[c.status]);
        if (competitions.length === 0) return [];
        return [{ ...location, competitions, status: mostCurrentStatus(competitions.map((c) => c.status)) }];
      }),
    [locations, shown],
  );

  // Scroll-to-zoom turns on when the visitor clicks or tabs into any part of the
  // widget, and off only when they click or tab somewhere else on the page, so
  // page scrolling never gets trapped and using a control or popup keeps it on.
  useEffect(() => {
    const widget = widgetRef.current;
    if (!map || !widget) return () => {};
    const update = (target: EventTarget | null) => {
      const inside = target instanceof Node && widget.contains(target);
      if (inside) map.scrollWheelZoom.enable();
      else map.scrollWheelZoom.disable();
      setEngaged(inside);
    };
    const onPointerDown = (event: PointerEvent) => update(event.target);
    const onFocusIn = (event: FocusEvent) => update(event.target);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [map]);

  // Leaflet only measures its container on load; re-measure whenever it resizes
  // (expanding, collapsing, rotating a phone) so tiles fill the whole map.
  useEffect(() => {
    if (!map) return () => {};
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  // Leaving native fullscreen (e.g. the browser's own Esc) also collapses the map.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setExpanded(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // While expanded: Esc collapses, and the page behind doesn't scroll.
  useEffect(() => {
    if (!expanded) return () => {};
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  const fitAll = () => {
    if (!map || visible.length === 0) return;
    map.fitBounds(latLngBounds(visible.map((l) => [l.latitude, l.longitude] as [number, number])), { padding: [40, 40], maxZoom: 10 });
  };

  // Expanding covers the window with CSS, which works everywhere (including
  // iPhones, which don't support element fullscreen), and also asks for native
  // fullscreen where the browser allows it.
  const toggleExpanded = () => {
    if (expanded) {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (document.fullscreenEnabled) void widgetRef.current?.requestFullscreen().catch(() => {});
  };

  return (
    <div
      ref={widgetRef}
      className={expanded ? "fixed inset-0 z-[2000] flex flex-col gap-3 bg-base-100 p-4" : "space-y-3"}
    >
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Show on map</legend>
        {FILTERS.filter((f) => counts[f.status] > 0).map((f) => (
          <button
            key={f.status}
            type="button"
            aria-pressed={shown[f.status]}
            onClick={() => setShown((s) => ({ ...s, [f.status]: !s[f.status] }))}
            className={`btn btn-sm gap-2 ${shown[f.status] ? f.active : "border-base-300 bg-base-200 text-muted"}`}
          >
            <span className={`size-2.5 rounded-full ${shown[f.status] ? f.dot : "border border-current"}`} aria-hidden="true" />
            {f.label} <span className="text-muted">{counts[f.status]}</span>
          </button>
        ))}
      </fieldset>

      {/* The height lives here: MapContainer keeps the className it first rendered with. */}
      <div className={`relative ${expanded ? "min-h-0 flex-1" : "h-[28rem]"}`}>
        <MapContainer
          key={mapInstance}
          ref={setMap}
          center={HOME_CENTER}
          zoom={HOME_ZOOM}
          minZoom={2}
          maxZoom={MAX_ZOOM}
          zoomControl={false}
          scrollWheelZoom={false}
          worldCopyJump
          className="h-full w-full rounded-box border border-base-300"
        >
          <TileLayer key={`${theme}-base`} url={TILES[theme].base} attribution={ATTRIBUTION} maxZoom={MAX_ZOOM} />
          <TileLayer key={`${theme}-labels`} url={TILES[theme].labels} maxZoom={MAX_ZOOM} />
          {visible.map((location) => (
            <CircleMarker
              key={`${location.key}-${location.status}-${location.competitions.length}`}
              center={[location.latitude, location.longitude]}
              radius={6 + Math.min(10, Math.sqrt(location.competitions.length) * 2)}
              pathOptions={{ className: `map-marker map-marker-${location.status}` }}
            >
              <Popup>
                <p className="m-0 font-semibold">{location.city}</p>
                <ul className="mt-2 space-y-1">
                  {location.competitions.slice(0, POPUP_LIMIT).map((competition) => (
                    <li key={competition.id}>
                      <a href={competition.url} target="_blank" rel="noopener noreferrer">{competition.name}</a>
                      <span className="text-muted"> · {competition.dateLabel}</span>
                    </li>
                  ))}
                </ul>
                {location.competitions.length > POPUP_LIMIT && (
                  <p className="m-0 mt-1 text-muted">+{location.competitions.length - POPUP_LIMIT} more</p>
                )}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
          <div className="join join-vertical shadow-sm">
            <MapButton label="Zoom in" onClick={() => map?.zoomIn()}><LuPlus className="size-4" /></MapButton>
            <MapButton label="Zoom out" onClick={() => map?.zoomOut()}><LuMinus className="size-4" /></MapButton>
          </div>
          <div className="join join-vertical shadow-sm">
            <MapButton label="Back to the Pacific Northwest" onClick={() => map?.setView(HOME_CENTER, HOME_ZOOM)}><LuHouse className="size-4" /></MapButton>
            <MapButton label="Fit all venues" onClick={fitAll}><LuFocus className="size-4" /></MapButton>
            <MapButton label={expanded ? "Exit fullscreen" : "Fullscreen"} onClick={toggleExpanded}>
              {expanded ? <LuMinimize className="size-4" /> : <LuMaximize className="size-4" />}
            </MapButton>
          </div>
        </div>

        {!engaged && (
          <p className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-field bg-base-200/90 px-3 py-1.5 text-xs text-muted">
            Click the map to zoom with scroll
          </p>
        )}
      </div>
    </div>
  );
}
