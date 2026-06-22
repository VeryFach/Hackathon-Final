// apps/web/app/(dashboard)/stakeholder/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Dynamic import untuk menghindari 'window is not defined' di server
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

// Data dummy sebagai fallback jika API tidak tersedia
const FALLBACK_COORDINATES = [
  { latitude: -6.2, longitude: 106.8 },
  { latitude: -6.3, longitude: 106.9 },
  { latitude: -6.1, longitude: 106.7 },
  { latitude: -6.25, longitude: 106.85 },
  { latitude: -6.15, longitude: 106.75 },
];

export default function StakeholderPage() {
  // 🔥 Hanya satu state untuk coordinates
  const [coordinates, setCoordinates] = useState(FALLBACK_COORDINATES);
  const [clusters, setClusters] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDepositors, setLoadingDepositors] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi fetch clustering, menerima koordinat sebagai parameter
  const fetchClusters = async (coords: typeof coordinates) => {
    if (!coords || coords.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/cluster`, {
        coordinates: coords,
        n_clusters: 3,
      });
      setClusters(response.data);
    } catch (err: any) {
      console.error("❌ Cluster error:", err);
      setError(err.message || "Failed to fetch clusters");
    } finally {
      setLoading(false);
    }
  };

  // Ambil data penyetor dari AI service saat mount
  useEffect(() => {
    const fetchDepositors = async () => {
      try {
        const response = await axios.get(`${API_URL}/depositors`);
        if (response.data && response.data.length > 0) {
          setCoordinates(response.data);
          // Setelah dapat data, langsung fetch clustering
          await fetchClusters(response.data);
        } else {
          // Jika data kosong, pakai fallback
          await fetchClusters(FALLBACK_COORDINATES);
        }
      } catch (err) {
        console.error("❌ Failed to fetch depositors:", err);
        // Fallback ke dummy
        await fetchClusters(FALLBACK_COORDINATES);
      } finally {
        setLoadingDepositors(false);
      }
    };
    fetchDepositors();
  }, []);

  const handleRefresh = () => {
    fetchClusters(coordinates);
  };

  if (loadingDepositors) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Memuat data penyetor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Stakeholder Dashboard</h1>
        <Button onClick={handleRefresh} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh Clustering
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Peta Persebaran & Rekomendasi</CardTitle>
          </CardHeader>
          <CardContent>
            <Map points={coordinates} clusters={clusters} />
            {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
            <p className="text-xs text-muted-foreground mt-2">
              {coordinates.length} penyetor di peta
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cluster Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Memuat data cluster...</p>
              ) : clusters ? (
                <div className="space-y-2">
                  {Object.entries(clusters.cluster_counts).map(([clusterId, count]) => (
                    <div key={clusterId} className="flex justify-between items-center border-b pb-2">
                      <span>
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: ["#2563eb", "#7c3aed", "#d97706", "#059669", "#dc2626"][
                              parseInt(clusterId)
                            ],
                          }}
                        />
                        Cluster {parseInt(clusterId) + 1}
                      </span>
                      <span className="font-mono">{count} penyetor</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak ada data cluster.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rekomendasi Lokasi Pengepul</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Memuat rekomendasi...</p>
              ) : clusters?.recommended_centroids ? (
                <div className="space-y-2">
                  {clusters.recommended_centroids.map((centroid: number[], idx: number) => (
                    <div key={idx} className="p-2 bg-muted/20 rounded-sm border border-border">
                      <p className="font-mono text-sm">
                        Lokasi {idx + 1}: {centroid[0].toFixed(4)}, {centroid[1].toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cluster {idx + 1} - {clusters.cluster_counts[idx] || 0} penyetor
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak ada rekomendasi.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}