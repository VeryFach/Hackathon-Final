// apps/web/app/(dashboard)/stakeholder/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, TrendingUp } from "lucide-react";

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
  const [collectors, setCollectors] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any>(null);
  
  // State untuk prediksi
  const [prediction, setPrediction] = useState<any>(null);
  const [predictDays, setPredictDays] = useState<number>(7);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

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
      const payload: any = {
        coordinates: coords,
      };
      if (clusterMode === "manual") {
        payload.n_clusters = manualClusters;
      }
      // Jika auto, biarkan n_clusters = null (backend akan auto-determine)
      const response = await axios.post(`${API_URL}/cluster`, payload);
      setClusters(response.data);
    } catch (err: any) {
      console.error("❌ Cluster error:", err);
      setError(err.message || "Failed to fetch clusters");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrediction = async () => {
    setLoadingPrediction(true);
    try {
      const response = await axios.post(`${API_URL}/predict`, null, {
        params: { days: predictDays },
      });
      setPrediction(response.data);
    } catch (err: any) {
      console.error("❌ Prediction error:", err);
      setPrediction(null);
    } finally {
      setLoadingPrediction(false);
    }
  };

  // Ambil data penyetor, pengepul, dan prediksi saat mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. Ambil depositors
        const depRes = await axios.get(`${API_URL}/depositors`);
        let coords = FALLBACK_COORDINATES;
        if (depRes.data && depRes.data.length > 0) {
          coords = depRes.data;
          setCoordinates(coords);
        }

        // 2. Ambil collectors
        const colRes = await axios.get(`${API_URL}/collectors`);
        if (colRes.data && colRes.data.length > 0) {
          setCollectors(colRes.data);
        }

        // 3. Lakukan clustering
        await fetchClusters(coords);

        // 4. Ambil prediksi
        await fetchPrediction();
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
    fetchPrediction();
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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-foreground">Stakeholder Dashboard</h1>
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
          <Button onClick={handleRefresh} disabled={loading || loadingPrediction}>
            {(loading || loadingPrediction) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Area Prediksi AI */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2 flex flex-row justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> 
            Prediksi Volume Mendatang
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="predictDays" className="text-xs text-muted-foreground">Periode (Hari):</Label>
            <Input 
              id="predictDays" 
              type="number" 
              value={predictDays} 
              onChange={(e) => setPredictDays(Number(e.target.value))}
              className="w-16 h-8 text-xs bg-background"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingPrediction ? (
             <div className="flex items-center text-sm text-muted-foreground">
               <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghitung prediksi...
             </div>
          ) : prediction ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-background rounded-md border">
                <p className="text-xs text-muted-foreground">Estimasi Volume</p>
                <p className="text-xl font-bold">{prediction.estimated_volume || 0} L</p>
              </div>
              <div className="p-3 bg-background rounded-md border">
                <p className="text-xs text-muted-foreground">Tingkat Akurasi</p>
                <p className="text-xl font-bold">{prediction.confidence || 0}%</p>
              </div>
              <div className="p-3 bg-background rounded-md border md:col-span-2">
                <p className="text-xs text-muted-foreground">Catatan AI</p>
                <p className="text-sm font-medium mt-1">{prediction.insight || "Data belum cukup."}</p>
              </div>
            </div>
          ) : (
             <p className="text-sm text-muted-foreground">Data prediksi belum tersedia.</p>
          )}
        </CardContent>
      </Card>

      {/* Area Peta & Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Peta Persebaran & Rekomendasi</CardTitle>
          </CardHeader>
          <CardContent>
            <Map 
              points={coordinates} 
              clusters={clusters} 
              collectors={collectors} 
            />
            {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
            <p className="text-xs text-muted-foreground mt-2">
              {coordinates.length} penyetor | {collectors.length} pengepul
              {clusters && ` | Cluster: ${clusters.n_clusters_used || Object.keys(clusters.cluster_counts).length}`}
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
    </div>
  );
}