"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import type { Map } from "leaflet";

interface Place {
  id: string; name: string; category: string;
  latitude: number | string; longitude: number | string;
  likeCount: number; visitCount: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  cafe: "#f5a623", viewpoint: "#60a5fa", market: "#4ade80",
  restaurant: "#f87171", park: "#34d399", shop: "#a78bfa",
  museum: "#fb923c", beach: "#22d3ee", street: "#fbbf24", other: "#9ba3b8",
};

export default function CityMapView({ places, cityName }: { places: Place[]; cityName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const validPlaces = places.filter(
        (p) => p.latitude && p.longitude &&
          !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
      );

      const center: [number, number] = validPlaces.length > 0
        ? [Number(validPlaces[0].latitude), Number(validPlaces[0].longitude)]
        : [30, 20];

      const map = L.map(containerRef.current!, { center, zoom: 13, zoomControl: true });
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd", maxZoom: 19,
      }).addTo(map);

      // Fit bounds to all markers
      const markers: [number, number][] = [];

      validPlaces.forEach((place) => {
        const lat = Number(place.latitude);
        const lng = Number(place.longitude);
        const color = CATEGORY_COLORS[place.category] ?? CATEGORY_COLORS.other;

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:20px;height:20px;border-radius:50% 50% 50% 0;
            background:${color};transform:rotate(-45deg);
            border:2px solid #0f1117;box-shadow:0 2px 8px rgba(0,0,0,0.4);
          "></div>`,
          iconSize: [20, 20], iconAnchor: [10, 20],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:160px">
            <strong style="color:#e8eaf0;font-size:0.9rem">${place.name}</strong><br/>
            <span style="color:#9ba3b8;font-size:0.75rem;text-transform:capitalize">${place.category}</span><br/>
            <span style="color:${color};font-size:0.75rem">❤ ${place.likeCount} · 👁 ${place.visitCount}</span><br/>
            <a href="/place/${place.id}" style="color:#f5a623;font-size:0.75rem">View details →</a>
          </div>
        `, { maxWidth: 220 });
        markers.push([lat, lng]);
      });

      if (markers.length > 1) {
        map.fitBounds(L.latLngBounds(markers), { padding: [40, 40] });
      }
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />
  );
}
