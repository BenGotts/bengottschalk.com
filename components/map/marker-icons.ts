import L from "leaflet";
import { STATUS_MARKER_COLORS, type CompetitionMapStatus } from "@/lib/map-competitions";

/** Fixed pixel size — does not scale with viewport or map zoom. */
export const MARKER_WIDTH = 24;
export const MARKER_HEIGHT = 35;

function markerSvg(color: string) {
  return `<div class="competition-marker-pin" style="--pin-color:${color}">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 40" aria-hidden="true">
      <path
        d="M14 0C6.82 0 1 5.82 1 13c0 9.75 13 27 13 27s13-17.25 13-27C27 5.82 21.18 0 14 0z"
        fill="var(--pin-color)"
        stroke="#f8fafc"
        stroke-width="1.5"
      />
      <circle cx="14" cy="13" r="4.5" fill="#f8fafc" fill-opacity="0.9" />
    </svg>
  </div>`;
}

export function createCompetitionMarkerIcon(status: CompetitionMapStatus) {
  return L.divIcon({
    className: "competition-marker-icon",
    html: markerSvg(STATUS_MARKER_COLORS[status]),
    iconSize: [MARKER_WIDTH, MARKER_HEIGHT],
    iconAnchor: [MARKER_WIDTH / 2, MARKER_HEIGHT],
    popupAnchor: [0, -MARKER_HEIGHT + 2],
  });
}
