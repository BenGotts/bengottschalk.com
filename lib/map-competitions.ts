export type CompetitionMapStatus = "ongoing" | "upcoming" | "previous";

export interface MapCompetition {
  id: string;
  name: string;
  cityName: string;
  latitude: number;
  longitude: number;
  date: string;
  status: CompetitionMapStatus;
  url: string;
}

export interface MapLocationGroup {
  key: string;
  latitude: number;
  longitude: number;
  cityName: string;
  status: CompetitionMapStatus;
  competitions: MapCompetition[];
}

const STATUS_PRIORITY: Record<CompetitionMapStatus, number> = {
  ongoing: 3,
  upcoming: 2,
  previous: 1,
};

/** WCA venues can differ by a few meters between years — cluster by coordinate proximity. */
const VENUE_CLUSTER_METERS = 250;

/** Pin colors: attended = blue, upcoming = green, ongoing = red */
export const STATUS_MARKER_COLORS: Record<CompetitionMapStatus, string> = {
  previous: "#2563eb",
  upcoming: "#16a34a",
  ongoing: "#dc2626",
};

export const STATUS_SECTION_ORDER: CompetitionMapStatus[] = ["ongoing", "upcoming", "previous"];

export function wcaCompetitionUrl(compId: string): string {
  return `https://www.worldcubeassociation.org/competitions/${compId}`;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export function compareCompetitionStatus(a: CompetitionMapStatus, b: CompetitionMapStatus): number {
  return STATUS_PRIORITY[b] - STATUS_PRIORITY[a];
}

export function sortMapCompetitions(competitions: MapCompetition[]): MapCompetition[] {
  return [...competitions].sort((a, b) => {
    const statusDiff = compareCompetitionStatus(a.status, b.status);
    if (statusDiff !== 0) return statusDiff;

    if (a.status === "previous") {
      return b.date.localeCompare(a.date);
    }

    return a.date.localeCompare(b.date);
  });
}

function resolveGroupStatus(competitions: MapCompetition[]): CompetitionMapStatus {
  return sortMapCompetitions(competitions)[0].status;
}

function resolveGroupCityName(competitions: MapCompetition[]): string {
  const sorted = sortMapCompetitions(competitions);
  return sorted[0]?.cityName ?? competitions[0].cityName;
}

/** Group competitions that share the same WCA coordinates (within a small radius). */
export function groupMapCompetitionsByLocation(competitions: MapCompetition[]): MapLocationGroup[] {
  const groups: MapLocationGroup[] = [];

  for (const competition of competitions) {
    const existingGroup = groups.find((group) =>
      haversineMeters(
        group.latitude,
        group.longitude,
        competition.latitude,
        competition.longitude,
      ) <= VENUE_CLUSTER_METERS,
    );

    if (!existingGroup) {
      groups.push({
        key: `${competition.latitude}|${competition.longitude}`,
        latitude: competition.latitude,
        longitude: competition.longitude,
        cityName: competition.cityName,
        status: competition.status,
        competitions: [competition],
      });
      continue;
    }

    existingGroup.competitions.push(competition);

    const count = existingGroup.competitions.length;
    existingGroup.latitude =
      existingGroup.competitions.reduce((sum, comp) => sum + comp.latitude, 0) / count;
    existingGroup.longitude =
      existingGroup.competitions.reduce((sum, comp) => sum + comp.longitude, 0) / count;
    existingGroup.competitions = sortMapCompetitions(existingGroup.competitions);
    existingGroup.status = resolveGroupStatus(existingGroup.competitions);
    existingGroup.cityName = resolveGroupCityName(existingGroup.competitions);
    existingGroup.key = `${existingGroup.latitude}|${existingGroup.longitude}`;
  }

  return groups.map((group) => ({
    ...group,
    competitions: sortMapCompetitions(group.competitions),
    status: resolveGroupStatus(group.competitions),
    cityName: resolveGroupCityName(group.competitions),
  }));
}

export const STATUS_LABELS: Record<CompetitionMapStatus, string> = {
  ongoing: "Ongoing",
  upcoming: "Upcoming",
  previous: "Attended",
};

export function formatLocationTooltip(location: MapLocationGroup): string {
  const count = location.competitions.length;
  const attended = location.competitions.filter((comp) => comp.status === "previous").length;
  const label = count === 1 ? "1 competition" : `${count} competitions`;
  const attendedLabel =
    attended > 0 ? ` · ${attended} attended` : "";

  return `${location.cityName} · ${label}${attendedLabel}`;
}

/** Longitude offsets (multiples of 360°) needed to cover the visible map span. */
export function getVisibleLongitudeOffsets(west: number, east: number): number[] {
  let spanWest = west;
  let spanEast = east;

  if (spanEast < spanWest) {
    spanEast += 360;
  }

  const minK = Math.floor(spanWest / 360) - 1;
  const maxK = Math.ceil(spanEast / 360) + 1;

  const offsets: number[] = [];
  for (let k = minK; k <= maxK; k++) {
    offsets.push(k * 360);
  }

  return offsets;
}

export function getWrappedMarkerPositions(
  latitude: number,
  longitude: number,
  longitudeOffsets: number[],
): Array<[number, number]> {
  return longitudeOffsets.map((offset) => [latitude, longitude + offset]);
}

export function competitionsByStatus(
  location: MapLocationGroup,
): Record<CompetitionMapStatus, MapCompetition[]> {
  return {
    ongoing: location.competitions.filter((comp) => comp.status === "ongoing"),
    upcoming: location.competitions.filter((comp) => comp.status === "upcoming"),
    previous: location.competitions.filter((comp) => comp.status === "previous"),
  };
}
