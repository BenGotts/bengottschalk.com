"use client";

import L from "leaflet";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMap, useMapEvents } from "react-leaflet";
import { STATUS_LABELS, type MapLocationGroup } from "@/lib/map-competitions";

const DEFAULT_CENTER: [number, number] = [45.5231, -122.6765];
const DEFAULT_ZOOM = 5;

interface MapControlsProps {
  locations: MapLocationGroup[];
}

const LEGEND_ITEMS: MapLocationGroup["status"][] = ["previous", "upcoming", "ongoing"];

function MapControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/95 text-slate-200 shadow-lg backdrop-blur-sm transition-colors hover:border-emerald-600 hover:text-emerald-400"
    >
      {children}
    </button>
  );
}

export function MapControls({ locations }: MapControlsProps) {
  const map = useMap();
  const [active, setActive] = useState(false);
  const [overlayRoot, setOverlayRoot] = useState<HTMLDivElement | null>(null);

  useMapEvents({
    click() {
      map.scrollWheelZoom.enable();
      setActive(true);
    },
  });

  useEffect(() => {
    const container = map.getContainer();
    container.setAttribute("tabindex", "0");
    container.classList.add("competition-map-container");

    map.scrollWheelZoom.disable();
    L.DomEvent.disableScrollPropagation(container);

    const handleWheel = (event: WheelEvent) => {
      if (!map.scrollWheelZoom.enabled()) {
        const target = event.target as HTMLElement | null;
        if (target?.closest(".leaflet-popup")) {
          return;
        }
        event.preventDefault();
      }
    };

    const deactivate = () => {
      map.scrollWheelZoom.disable();
      setActive(false);
    };

    const handleBlur = () => deactivate();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        deactivate();
        container.blur();
      }
    };

    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (!container.contains(event.target as Node)) {
        deactivate();
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("blur", handleBlur);
    container.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleDocumentPointerDown);

    const overlay = L.DomUtil.create("div", "competition-map-overlay");
    L.DomEvent.disableClickPropagation(overlay);
    L.DomEvent.disableScrollPropagation(overlay);
    container.appendChild(overlay);
    setOverlayRoot(overlay);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("blur", handleBlur);
      container.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      overlay.remove();
      container.classList.remove("competition-map-container", "competition-map-active");
    };
  }, [map]);

  useEffect(() => {
    const container = map.getContainer();
    container.classList.toggle("competition-map-active", active);
  }, [active, map]);

  const zoomIn = useCallback(() => map.zoomIn(), [map]);
  const zoomOut = useCallback(() => map.zoomOut(), [map]);

  const fitMarkers = useCallback(() => {
    if (locations.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(
      locations.map((location) => [location.latitude, location.longitude] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 10 });
  }, [locations, map]);

  const resetView = useCallback(() => {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }, [map]);

  if (!overlayRoot) return null;

  return createPortal(
    <>
      {!active && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[1000] flex justify-center px-3">
          <span className="rounded-full border border-slate-700/80 bg-slate-900/95 px-3 py-1.5 text-[11px] font-semibold text-slate-300 shadow-lg backdrop-blur-sm">
            Click map to interact · scroll to zoom
          </span>
        </div>
      )}

      <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
        <div className="rounded-lg border border-slate-700/80 bg-slate-900/95 px-3 py-2 shadow-lg backdrop-blur-sm">
          <ul className="flex flex-col gap-1.5">
            {LEGEND_ITEMS.map((status) => (
              <li key={status} className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
                <span className={`competition-legend-dot competition-legend-dot--${status}`} />
                {STATUS_LABELS[status]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
        <MapControlButton label="Zoom in" onClick={zoomIn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </MapControlButton>
        <MapControlButton label="Zoom out" onClick={zoomOut}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M5 12h14" strokeLinecap="round" />
          </svg>
        </MapControlButton>
        <MapControlButton label="Fit all competitions" onClick={fitMarkers}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 9V4h5M15 4h5v5M4 15v5h5M15 20h5v-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </MapControlButton>
        <MapControlButton label="Reset map view" onClick={resetView}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </MapControlButton>
      </div>
    </>,
    overlayRoot,
  );
}
