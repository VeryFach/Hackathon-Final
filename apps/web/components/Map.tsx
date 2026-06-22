"use client";

import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

let L: any = null;
if (typeof window !== "undefined") {
  L = require("leaflet");
  // Fix default marker icons
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface MapProps {
  points?: Array<{ latitude: number; longitude: number; cluster?: number }>;
  clusters?: any;
}

export default function Map({ points = [], clusters = null }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!L || !mapRef.current) return;

    // Initialize map once
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([-6.2088, 106.8456], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers (keep tile layer)
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // 🔥 Pastikan points adalah array sebelum forEach
    if (Array.isArray(points) && points.length > 0) {
      points.forEach((point) => {
        if (point && typeof point.latitude === 'number' && typeof point.longitude === 'number') {
          L.marker([point.latitude, point.longitude]).addTo(map);
        }
      });
    }

    // Add centroids if clusters exist
    if (clusters && clusters.recommended_centroids && Array.isArray(clusters.recommended_centroids)) {
      clusters.recommended_centroids.forEach((centroid: number[], idx: number) => {
        if (Array.isArray(centroid) && centroid.length === 2) {
          L.marker([centroid[0], centroid[1]], {
            icon: L.divIcon({
              className: "centroid-marker",
              html: `<div style="background-color:#dc2626;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #dc2626;"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            }),
          })
            .bindPopup(`Rekomendasi Lokasi ${idx + 1}`)
            .addTo(map);
        }
      });
    }

    // Fit bounds to show all markers
    const allPoints: Array<[number, number]> = [];
    points.forEach((p) => allPoints.push([p.latitude, p.longitude]));
    if (clusters?.recommended_centroids) {
      clusters.recommended_centroids.forEach((c: number[]) => {
        if (Array.isArray(c) && c.length === 2) {
          allPoints.push([c[0], c[1]]);
        }
      });
    }
    if (allPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (e) {
        // ignore bounds error
      }
    }

    // Cleanup function not needed because we reuse the map instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, clusters]);

  return <div ref={mapRef} style={{ width: "100%", height: "500px", borderRadius: "8px" }} />;
}