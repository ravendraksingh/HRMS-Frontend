"use client";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix for missing marker icons in Webpack/Next.js
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src ? markerIcon2x.src : markerIcon2x,
  iconUrl: markerIcon.src ? markerIcon.src : markerIcon,
  shadowUrl: markerShadow.src ? markerShadow.src : markerShadow,
});

export default function SimpleMapWithGeolocation() {
  const [position, setPosition] = useState(null); // [lat, lng]
  const defaultPosition = [28.6139, 77.209]; // Default (Delhi)

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
        },
        (err) => {
          // If permission denied/failed, fallback to default
          setPosition(defaultPosition);
        }
      );
    } else {
      setPosition(defaultPosition);
    }
  }, []);

  // Wait for position to load
  if (!position) return <div>Loading your location...</div>;

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            {position[0]}, {position[1]}
            <br />
            {position[0] === defaultPosition[0] &&
            position[1] === defaultPosition[1]
              ? "Default location (Delhi)"
              : "You are here"}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
