"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

const FALLBACK_COORDINATES = [
  { latitude: -6.2, longitude: 106.8 },
  { latitude: -6.3, longitude: 106.9 },
  { latitude: -6.1, longitude: 106.7 },
  { latitude: -6.25, longitude: 106.85 },
  { latitude: -6.15, longitude: 106.75 },
];

export default function StakeholderPage() {
  const [coordinates, setCoordinates] = useState(FALLBACK_COORDINATES);
  const [clusters, setClusters] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDepositors, setLoadingDepositors] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk kontrol cluster
  const [clusterMode, setClusterMode] = useState<"auto" | "manual">("auto");
  const [manualClusters, setManualClusters] = useState<number>(3);

  const fetchClusters = async (coords: typeof coordinates) => {
    if (!coords || coords.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      // Tentukan payload
      const payload: any = {
        coordinates: coords,
      };
      if (clusterMode === "manual") {
        payload.n_clusters = manualClusters;
      } else {
        payload.n_clusters = null; // auto
      }
      
      const response = await axios.post(`${API_URL}/cluster`, payload);
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
          await fetchClusters(FALLBACK_COORDINATES);
        }
      } catch (err) {
        console.error("❌ Failed to fetch depositors:", err);
        await fetchClusters(FALLBACK_COORDINATES);
      } finally {
        setLoadingDepositors(false);
      }
    };
    fetchDepositors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efek untuk refetch saat mode atau jumlah cluster berubah
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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-foreground">Stakeholder Dashboard</h1>
        <div className="flex items-center gap-4">
          {/* Kontrol clustering */}
          <div className="flex items-center gap-2">
            <RadioGroup
              value={clusterMode}
              onValueChange={(val) => setClusterMode(val as "auto" | "manual")}
              className="flex items-center gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto">Otomatis</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Manual</Label>
              </div>
            </RadioGroup>
          </div>
          {clusterMode === "manual" && (
            <div className="flex items-center gap-2">
              <Label htmlFor="n_clusters" className="whitespace-nowrap">
                Jumlah Cluster:
              </Label>
              <Input
                id="n_clusters"
                type="number"
                min={2}
                max={10}
                value={manualClusters}
                onChange={(e) => setManualClusters(Number(e.target.value))}
                className="w-20"
              />
            </div>
          )}
          <Button onClick={handleRefresh} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>
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
              {clusters && ` | Cluster digunakan: ${clusters.n_clusters_used}`}
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
              ) : clusters?.centroids ? (
                <div className="space-y-2">
                  {clusters.centroids.map((centroid: number[], idx: number) => (
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