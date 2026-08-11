"use client";

import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import type { LeafletEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapControls } from "@/components/map/MapControls";
import { WrappedLocationMarkers } from "@/components/map/WrappedLocationMarkers";
import { createCompetitionMarkerIcon } from "@/components/map/marker-icons";
import {
  competitionsByStatus,
  formatLocationTooltip,
  groupMapCompetitionsByLocation,
  STATUS_LABELS,
  STATUS_SECTION_ORDER,
  type MapCompetition,
  type MapLocationGroup,
} from "@/lib/map-competitions";

const iconFix = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

const DEFAULT_CENTER: [number, number] = [45.5231, -122.6765];
const DEFAULT_ZOOM = 5;

const STATUS_BADGE_CLASS: Record<MapLocationGroup["status"], string> = {
  ongoing: "competition-popup-badge competition-popup-badge--ongoing",
  upcoming: "competition-popup-badge competition-popup-badge--upcoming",
  previous: "competition-popup-badge competition-popup-badge--previous",
};

function disableScrollOnElement(element: HTMLElement | null | undefined) {
  if (element) {
    L.DomEvent.disableScrollPropagation(element);
  }
}

function enablePopupScroll(event: LeafletEvent) {
  const popup = (event.target as L.Popup).getElement();
  if (!popup) return;

  disableScrollOnElement(popup);
  disableScrollOnElement(popup.querySelector(".leaflet-popup-content") as HTMLElement | null);
  disableScrollOnElement(popup.querySelector(".leaflet-popup-content-wrapper") as HTMLElement | null);
}

function LocationPopup({ location }: { location: MapLocationGroup }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const count = location.competitions.length;
  const grouped = competitionsByStatus(location);

  useEffect(() => {
    disableScrollOnElement(scrollRef.current);
  }, [location.key]);

  return (
    <div className="competition-popup font-sans min-w-[240px] max-w-[300px]">
      <div className="competition-popup-header">
        <strong className="block text-sm text-slate-900">{location.cityName}</strong>
        <span className="text-[11px] text-slate-500">
          {count === 1 ? "1 competition" : `${count} competitions`} at this location
        </span>
      </div>

      <div ref={scrollRef} className="competition-popup-list">
        {STATUS_SECTION_ORDER.map((status) => {
          const items = grouped[status];
          if (items.length === 0) return null;

          return (
            <section key={status} className="competition-popup-section">
              <h3 className="competition-popup-section-title">
                {STATUS_LABELS[status]} ({items.length})
              </h3>
              <ul className="competition-popup-section-list">
                {items.map((competition) => (
                  <li key={competition.id} className="competition-popup-item">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <span className={STATUS_BADGE_CLASS[competition.status]}>
                          {STATUS_LABELS[competition.status]}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 leading-snug">
                          {competition.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">{competition.date}</p>
                      </div>
                      <a
                        href={competition.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[11px] font-bold text-emerald-700 hover:underline"
                      >
                        WCA →
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function LocationMarker({
  location,
  position,
}: {
  location: MapLocationGroup;
  position: [number, number];
}) {
  return (
    <Marker
      position={position}
      icon={createCompetitionMarkerIcon(location.status)}
    >
      <Tooltip
        direction="top"
        offset={[0, -36]}
        opacity={1}
        className="competition-marker-tooltip"
      >
        {formatLocationTooltip(location)}
      </Tooltip>
      <Popup
        className="competition-map-popup"
        minWidth={260}
        maxWidth={320}
        eventHandlers={{ add: enablePopupScroll }}
      >
        <LocationPopup location={location} />
      </Popup>
    </Marker>
  );
}

export default function CompetitionMap({ comps }: { comps: MapCompetition[] }) {
  const locations = useMemo(() => groupMapCompetitionsByLocation(comps), [comps]);

  useEffect(() => {
    iconFix();
  }, []);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={false}
      zoomControl={false}
      worldCopyJump={false}
      className="h-full w-full z-0 competition-map"
      style={{ background: "transparent" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        noWrap={false}
      />

      <MapControls locations={locations} />

      <WrappedLocationMarkers
        locations={locations}
        renderMarker={({ location, position, markerKey }) => (
          <LocationMarker key={markerKey} location={location} position={position} />
        )}
      />
    </MapContainer>
  );
}
