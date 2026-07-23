"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { useMap, useMapEvents } from "react-leaflet";
import {
  getVisibleLongitudeOffsets,
  type MapLocationGroup,
} from "@/lib/map-competitions";

interface WrappedLocationMarkersProps {
  locations: MapLocationGroup[];
  renderMarker: (props: {
    location: MapLocationGroup;
    position: [number, number];
    markerKey: string;
  }) => ReactNode;
}

function readOffsetsFromMap(map: LeafletMap) {
  const bounds = map.getBounds();
  return getVisibleLongitudeOffsets(bounds.getWest(), bounds.getEast());
}

export function WrappedLocationMarkers({ locations, renderMarker }: WrappedLocationMarkersProps) {
  const map = useMap();
  const [longitudeOffsets, setLongitudeOffsets] = useState<number[]>(() =>
    getVisibleLongitudeOffsets(-130, -110),
  );

  const syncOffsets = useCallback(() => {
    setLongitudeOffsets(readOffsetsFromMap(map));
  }, [map]);

  useMapEvents({
    moveend: syncOffsets,
    zoomend: syncOffsets,
    resize: syncOffsets,
  });

  useEffect(() => {
    syncOffsets();
  }, [syncOffsets, locations]);

  return (
    <>
      {locations.flatMap((location) =>
        longitudeOffsets.map((offset) => {
          const position: [number, number] = [location.latitude, location.longitude + offset];
          return renderMarker({
            location,
            position,
            markerKey: `${location.key}@${offset}`,
          });
        }),
      )}
    </>
  );
}
