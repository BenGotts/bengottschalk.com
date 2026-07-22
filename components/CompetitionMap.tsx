"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

const iconFix = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

export default function CompetitionMap({ comps }: { comps: any[] }) {
  useEffect(() => {
    iconFix();
  }, []);

  // Center roughly on the Pacific Northwest (Portland area)
  const position: [number, number] = [45.5231, -122.6765];

  return (
    <MapContainer 
      center={position} 
      zoom={5} 
      scrollWheelZoom={false} 
      className="h-full w-full z-0"
      style={{ background: 'transparent' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* Map over the actual competition data passed from page.tsx */}
      {comps.map((comp) => (
        <Marker 
          key={comp.id} 
          position={[comp.latitude, comp.longitude]}
        >
          <Popup>
            <div className="text-center font-sans">
              <strong className="block text-sm">{comp.name}</strong>
              <span className="text-xs text-gray-500">
                {comp.isUpcoming ? 'Upcoming Competition' : 'Attended'}
              </span>
              <br />
              <span className="text-xs text-gray-400">{comp.cityName}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}