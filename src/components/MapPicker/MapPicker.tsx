"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map, Marker, LeafletMouseEvent } from "leaflet";

interface Props {
  onLocationSelect: (lat: number, lng: number) => void;
  selected: { lat: number; lng: number } | null;
}

export default function MapPicker({ onLocationSelect, selected }: Props) {
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: selected ? [selected.lat, selected.lng] : [30.0, 20.0],
        zoom: selected ? 13 : 2,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // Custom amber marker icon
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:24px;height:24px;border-radius:50% 50% 50% 0;
          background:#f5a623;transform:rotate(-45deg);
          border:3px solid #0f1117;box-shadow:0 2px 8px rgba(245,166,35,0.5);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      if (selected) {
        markerRef.current = L.marker([selected.lat, selected.lng], { icon }).addTo(map);
      }

      map.on("click", (e: LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
        }
        onLocationSelect(lat, lng);
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />
  );
}
