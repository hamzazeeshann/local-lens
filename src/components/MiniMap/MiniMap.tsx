"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map } from "leaflet";

export default function MiniMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(containerRef.current!, {
        center: [lat, lng], zoom: 15,
        zoomControl: false, dragging: false, scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© CARTO', subdomains: "abcd", maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:18px;height:18px;border-radius:50% 50% 50% 0;
          background:#f5a623;transform:rotate(-45deg);
          border:2px solid #0f1117;box-shadow:0 2px 8px rgba(245,166,35,0.5);
        "></div>`,
        iconSize: [18, 18], iconAnchor: [9, 18],
      });

      L.marker([lat, lng], { icon }).addTo(map)
        .bindPopup(`<strong style="color:#e8eaf0">${name}</strong>`)
        .openPopup();
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [lat, lng, name]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />;
}
