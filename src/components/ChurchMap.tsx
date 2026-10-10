"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

type Pin = { slug: string; name: string; city: string; lat: number; lng: number };

export default function ChurchMap({ churches }: { churches: Pin[] }) {
  // Roughly centered on the metroplex; fits Denton–Mansfield–McKinney.
  const center: [number, number] = [32.88, -96.95];
  return (
    <MapContainer center={center} zoom={9} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {churches.map((c) => (
        <CircleMarker
          key={c.slug}
          center={[c.lat, c.lng]}
          radius={7}
          pathOptions={{ color: "#6e1e1e", weight: 1.5, fillColor: "#6e1e1e", fillOpacity: 0.75 }}
        >
          <Popup>
            <strong>{c.name}</strong>
            <br />
            {c.city}
            <br />
            <a href={`/churches/${c.slug}`}>Events &amp; details</a>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
