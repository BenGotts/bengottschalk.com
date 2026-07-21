"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface CompLocation {
  id: string;
  name: string;
  cityName: string;
  latitude: number;
  longitude: number;
  date: string;
  isUpcoming?: boolean;
}

// Generate SVG Map Marker Pin Icons dynamically
const createCustomPinIcon = (isUpcoming: boolean = false) => {
  const pinColor = isUpcoming ? "#10b981" : "#0284c7"; // Emerald for upcoming, Sky for past
  const strokeColor = isUpcoming ? "#064e3b" : "#0c4a6e";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
      <path fill="${pinColor}" stroke="${strokeColor}" stroke-width="1.5" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z"/>
      <circle cx="12" cy="12" r="4.5" fill="#ffffff" />
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "custom-leaflet-pin",
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -38],
  });
};

const pastIcon = createCustomPinIcon(false);
const upcomingIcon = createCustomPinIcon(true);

export default function CompMap({ competitions }: { competitions: CompLocation[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const defaultCenter: [number, number] = [45.5152, -122.6784]; // Pacific Northwest center

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-96 w-full bg-slate-900/50 animate-pulse rounded-2xl flex items-center justify-center text-xs text-slate-500">
        Initializing Map...
      </div>
    );
  }

  return (
    <div className="h-96 w-full rounded-2xl overflow-hidden border border-slate-800 relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom={false}
        className="h-full w-full bg-slate-950"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {competitions.map((comp) => {
          if (!comp.latitude || !comp.longitude) return null;

          const compUrl = `https://www.worldcubeassociation.org/competitions/${comp.id}`;

          return (
            <Marker
              key={comp.id}
              position={[comp.latitude, comp.longitude]}
              icon={comp.isUpcoming ? upcomingIcon : pastIcon}
            >
              <Popup>
                <div className="p-1 text-slate-900 min-w-[140px]">
                  <div className="flex items-center gap-1 mb-1">
                    {comp.isUpcoming && (
                      <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded uppercase">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs leading-snug">{comp.name}</h4>
                  <p className="text-[10px] text-slate-600 mt-0.5">{comp.cityName}</p>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{comp.date}</p>
                  
                  <a
                    href={compUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-[10px] font-bold text-sky-600 hover:text-sky-800 hover:underline"
                  >
                    View Competition Page &rarr;
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}