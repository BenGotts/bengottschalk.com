"use client";

import "leaflet/dist/leaflet.css";
import { latLngBounds, type Map as LeafletMap } from "leaflet";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LuFocus, LuHouse, LuMaximize, LuMinus, LuPlus, LuX } from "react-icons/lu";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { THEMES } from "@/lib/theme";
import { useTheme } from "@/lib/useTheme";
// Import the pure module directly: the wca index also exports server-only API code.
import { mostCurrentStatus, type MapLocation, type MapStatus } from "@/lib/wca/competitions";
import ExternalLink from "@/components/ExternalLink";

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

const DRAW_ORDER: Record<MapStatus, number> = { past: 0, upcoming: 1, ongoing: 2 };

// Phones and tablets: the inline map is a preview that opens fullscreen when
// tapped, so a finger drag over it always scrolls the page.
const TOUCH_QUERY = "(pointer: coarse)";

// Marks the history entry added while the map is expanded, so Back collapses it.
const HISTORY_KEY = "competitionMapExpanded";

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

function MapHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-field bg-base-200/90 px-3 py-1.5 text-xs text-muted">
      {children}
    </p>
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
  // Whether the history entry for the expanded map is still there to go back from.
  const historyEntryRef = useRef(false);
  // Only rendered in the browser (see CompetitionMapLoader), so matchMedia is safe here.
  const [touch, setTouch] = useState(() => window.matchMedia(TOUCH_QUERY).matches);
  // Set while expanded, by the effect that owns collapsing.
  const collapseRef = useRef(() => {});

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
      })
      // Later markers draw on top: past first, so upcoming and ongoing stay visible.
      .toSorted((a, b) => DRAW_ORDER[a.status] - DRAW_ORDER[b.status]),
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

  useEffect(() => {
    const query = window.matchMedia(TOUCH_QUERY);
    const onChange = () => setTouch(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Leaflet only measures its container on load; re-measure whenever it resizes
  // (expanding, collapsing, rotating a phone) so tiles fill the whole map.
  useEffect(() => {
    if (!map) return () => {};
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  // While expanded: Back (including Android's), Esc and leaving native
  // fullscreen all collapse it, and the page behind doesn't scroll.
  useEffect(() => {
    if (!expanded) return () => {};
    const collapse = () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      // Going back fires popstate, which finishes collapsing.
      if (historyEntryRef.current) {
        historyEntryRef.current = false;
        history.back();
      } else {
        setExpanded(false);
      }
    };
    const onPopState = () => {
      historyEntryRef.current = false;
      collapse();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") collapse();
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) collapse();
    };
    collapseRef.current = collapse;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("popstate", onPopState);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [expanded]);

  const preview = touch && !expanded;

  const fitAll = () => {
    if (!map || visible.length === 0) return;
    map.fitBounds(latLngBounds(visible.map((l) => [l.latitude, l.longitude] as [number, number])), { padding: [40, 40], maxZoom: 10 });
  };

  // Expanding covers the window with CSS, which works everywhere (including
  // iPhones, which don't support element fullscreen). Computers also get native
  // fullscreen where the browser allows it; phones don't, since it hides the
  // status bar and puts the camera cutout over the map's controls.
  const expand = () => {
    setExpanded(true);
    history.pushState({ [HISTORY_KEY]: true }, "");
    historyEntryRef.current = true;
    if (!touch && document.fullscreenEnabled) void widgetRef.current?.requestFullscreen().catch(() => {});
  };

  return (
    <div
      ref={widgetRef}
      className={
        expanded
          ? "fixed inset-0 z-[2000] flex flex-col gap-3 bg-base-100 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]"
          : "space-y-3"
      }
    >
      <div className="flex items-start gap-2">
        <fieldset className="flex flex-1 flex-wrap gap-2">
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
        {expanded && (
          <button type="button" onClick={() => collapseRef.current()} className="btn btn-sm btn-neutral shrink-0 gap-1.5">
            <LuX className="size-4" aria-hidden="true" />
            Close
          </button>
        )}
      </div>

      {/* The height lives here: MapContainer keeps the className it first rendered with.
          `isolate` keeps Leaflet's internal z-indexes (up to 1000) from stacking over the sticky header. */}
      <div className={`relative isolate ${expanded ? "min-h-0 flex-1" : "h-80 sm:h-[28rem]"}`}>
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
              // A creation option, not pathOptions: Leaflet only reads className when the
              // marker is built (the key above rebuilds it when the status changes).
              className={`map-marker map-marker-${location.status}`}
            >
              <Popup>
                <p className="m-0 font-semibold">{location.city}</p>
                <ul className="mt-2 space-y-1">
                  {location.competitions.slice(0, POPUP_LIMIT).map((competition) => (
                    <li key={competition.id}>
                      <ExternalLink href={competition.url}>{competition.name}</ExternalLink>
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

        <div className={`absolute right-3 top-3 z-[1000] flex-col gap-2 ${preview ? "hidden" : "flex"}`}>
          <div className="join join-vertical shadow-sm">
            <MapButton label="Zoom in" onClick={() => map?.zoomIn()}><LuPlus className="size-4" /></MapButton>
            <MapButton label="Zoom out" onClick={() => map?.zoomOut()}><LuMinus className="size-4" /></MapButton>
          </div>
          <div className="join join-vertical shadow-sm">
            <MapButton label="Back to the Pacific Northwest" onClick={() => map?.setView(HOME_CENTER, HOME_ZOOM)}><LuHouse className="size-4" /></MapButton>
            <MapButton label="Fit all venues" onClick={fitAll}><LuFocus className="size-4" /></MapButton>
            {!expanded && (
              <MapButton label="Fullscreen" onClick={expand}><LuMaximize className="size-4" /></MapButton>
            )}
          </div>
        </div>

        {preview && (
          // Covers the map so it never receives a touch; a scroll gesture passes
          // through to the page and a tap opens the map fullscreen.
          <button
            type="button"
            onClick={expand}
            className="absolute inset-0 z-[1000] flex items-start justify-center rounded-box p-3"
          >
            <span className="inline-flex items-center gap-1.5 rounded-field border border-base-300 bg-base-200/90 px-3 py-1.5 text-sm shadow-sm">
              <LuMaximize className="size-3.5" aria-hidden="true" />
              Tap to explore the map
            </span>
          </button>
        )}
        {!touch && !engaged && <MapHint>Click the map to zoom with scroll</MapHint>}
      </div>
    </div>
  );
}
