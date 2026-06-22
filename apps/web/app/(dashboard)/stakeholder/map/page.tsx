// apps/web/app/(dashboard)/map/page.tsx
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

export default function MapPage() {
  const [coordinates, setCoordinates] = useState(FALLBACK_COORDINATES);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDepositors, setLoadingDepositors] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk kontrol cluster
  const [clusterMode, setClusterMode] = useState<"auto" | "manual">("auto");
  const [manualClusters, setManualClusters] = useState<number>(3);

  // Filter state
  const [showDepositors, setShowDepositors] = useState(true);
  const [showCollectors, setShowCollectors] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);

  const fetchClusters = async (coords: typeof coordinates) => {
    if (!coords || coords.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        coordinates: coords,
      };
      if (clusterMode === "manual") {
        payload.n_clusters = manualClusters;
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

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const depRes = await axios.get(`${API_URL}/depositors`);
        let coords = FALLBACK_COORDINATES;
        if (depRes.data && depRes.data.length > 0) {
          coords = depRes.data;
          setCoordinates(coords);
        }

        const colRes = await axios.get(`${API_URL}/collectors`);
        if (colRes.data && colRes.data.length > 0) {
          setCollectors(colRes.data);
        }

        await fetchClusters(coords);
      } catch (err) {
        console.error("❌ Failed to fetch initial data:", err);
      } finally {
        setLoadingDepositors(false);
      }
    };
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    fetchClusters(coordinates);
  };

  if (loadingDepositors) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header & Kontrol */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Peta Persebaran & Rekomendasi</h1>
        <div className="flex items-center gap-4 flex-wrap">
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
              <Label htmlFor="n_clusters" className="whitespace-nowrap">Jumlah Cluster:</Label>
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
            Refresh Peta
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/20 rounded-md border border-border">
        <span className="text-sm font-medium text-muted-foreground">Tampilkan:</span>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDepositors}
            onChange={(e) => setShowDepositors(e.target.checked)}
            className="accent-primary"
          />
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
          Penyetor
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showCollectors}
            onChange={(e) => setShowCollectors(e.target.checked)}
            className="accent-primary"
          />
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          Pengepul
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showRecommendations}
            onChange={(e) => setShowRecommendations(e.target.checked)}
            className="accent-primary"
          />
          <span className="inline-block w-3 h-3 rounded-full bg-red-500"/>
          Rekomendasi
        </label>
      </div>

      {/* Peta (di atas) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {coordinates.length} penyetor | {collectors.length} pengepul
            {clusters && ` | ${Object.keys(clusters.cluster_counts).length} cluster`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Map
            points={coordinates}
            clusters={clusters}
            collectors={collectors}
            showDepositors={showDepositors}
            showCollectors={showCollectors}
            showRecommendations={showRecommendations}
          />
          {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
        </CardContent>
      </Card>

      {/* Keterangan Cluster & Rekomendasi (di bawah) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Cluster Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Memuat data cluster...</p>
            ) : clusters?.cluster_counts ? (
              <div className="space-y-2">
                {Object.entries(clusters.cluster_counts).map(([clusterId, count]) => (
                  <div key={clusterId} className="flex justify-between items-center border-b pb-2">
                    <span>
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor: ["#2563eb", "#7c3aed", "#d97706", "#059669", "#dc2626"][
                            parseInt(clusterId) % 5
                          ],
                        }}
                      />
                      Cluster {parseInt(clusterId) + 1}
                    </span>
                    <span className="font-mono">{count as number} penyetor</span>
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
  );
}