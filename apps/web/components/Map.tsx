// apps/web/components/Map.tsx
"use client";

import React, { useEffect, useRef, useMemo } from "react";
import "leaflet/dist/leaflet.css";

let L: any = null;
if (typeof window !== "undefined") {
  L = require("leaflet");
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
  collectors?: Array<{ 
    latitude: number; 
    longitude: number; 
    nama: string; 
    id?: string; 
    pricePerLiter?: number; // ✨ tambahan
  }>;
  showDepositors?: boolean;
  showCollectors?: boolean;
  showRecommendations?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  showRadius?: boolean;
  radius?: number;
}

// Helper format rupiah
function formatRp(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function Map({
  points = [],
  clusters = null,
  collectors = [],
  showDepositors = true,
  showCollectors = true,
  showRecommendations = true,
  userLocation = null,
  showRadius = false,
  radius = 1,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Icons (sama seperti sebelumnya)
  const depositorIcon = useMemo(() => {
    if (!L) return null;
    return L.divIcon({
      className: "depositor-marker",
      html: `<div style="background-color:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 1px #3b82f6;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  }, []);

  const collectorIcon = useMemo(() => {
    if (!L) return null;
    return L.divIcon({
      className: "collector-marker",
      html: `<div style="background-color:#10b981;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 1px #10b981;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  }, []);

  const recommendationIcon = useMemo(() => {
    if (!L) return null;
    return L.divIcon({
      className: "centroid-marker",
      html: `<div style="background-color:#dc2626;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 1px #dc2626;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  }, []);

  const userIcon = useMemo(() => {
    if (!L) return null;
    return L.divIcon({
      className: "user-marker",
      html: `<div style="background-color:#1d4ed8;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #1d4ed8;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }, []);

  useEffect(() => {
    if (!L || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([-6.2088, 106.8456], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers & circles
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    // 1. Penyetor
    if (showDepositors && points.length > 0 && depositorIcon) {
      points.forEach((point) => {
        if (point && typeof point.latitude === "number" && typeof point.longitude === "number") {
          L.marker([point.latitude, point.longitude], { icon: depositorIcon }).addTo(map);
        }
      });
    }

    // 2. Pengepul (dengan popup yang menampilkan harga)
    if (showCollectors && collectors.length > 0 && collectorIcon) {
      collectors.forEach((collector) => {
        if (collector && typeof collector.latitude === "number" && typeof collector.longitude === "number") {
          const marker = L.marker([collector.latitude, collector.longitude], {
            icon: collectorIcon,
          });

          let popupContent = `<b>${collector.nama || "Pengepul"}</b><br>ID: ${collector.id || "-"}`;
          if (collector.pricePerLiter) {
            popupContent += `<br>Harga: ${formatRp(collector.pricePerLiter)}/L`;
          }
          marker.bindPopup(popupContent);
          marker.addTo(map);
        }
      });
    }

    // 3. Rekomendasi
    if (showRecommendations && clusters && clusters.centroids && recommendationIcon) {
      clusters.centroids.forEach((centroid: number[], idx: number) => {
        if (Array.isArray(centroid) && centroid.length === 2) {
          const popupContent = `
            <b>Rekomendasi Lokasi ${idx + 1}</b><br>
            Cluster ${idx + 1} - ${clusters.cluster_counts?.[idx] || 0} penyetor
          `;
          L.marker([centroid[0], centroid[1]], {
            icon: recommendationIcon,
          })
            .bindPopup(popupContent)
            .addTo(map);
        }
      });
    }

    // 4. Lokasi pengguna & radius
    if (userLocation && userIcon) {
      const { lat, lng } = userLocation;
      L.marker([lat, lng], { icon: userIcon })
        .bindPopup("<b>📍 Lokasi Anda</b>")
        .addTo(map);
      if (showRadius) {
        L.circle([lat, lng], {
          radius: radius * 1000,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(map);
      }
    }

    // Fit bounds
    const allPoints: Array<[number, number]> = [];
    if (showDepositors) {
      points.forEach((p) => allPoints.push([p.latitude, p.longitude]));
    }
    if (showCollectors) {
      collectors.forEach((c) => {
        if (c && typeof c.latitude === "number" && typeof c.longitude === "number") {
          allPoints.push([c.latitude, c.longitude]);
        }
      });
    }
    if (showRecommendations && clusters?.centroids) {
      clusters.centroids.forEach((c: number[]) => {
        if (Array.isArray(c) && c.length === 2) {
          allPoints.push([c[0], c[1]]);
        }
      });
    }
    if (userLocation) {
      allPoints.push([userLocation.lat, userLocation.lng]);
    }
    if (allPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (e) {
        // ignore
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, clusters, collectors, showDepositors, showCollectors, showRecommendations, userLocation, showRadius, radius]);

  return <div ref={mapRef} style={{ width: "100%", height: "600px", borderRadius: "8px", position: "relative", zIndex: 0 }} />;
}