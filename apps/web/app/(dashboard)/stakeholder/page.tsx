// apps/web/app/(dashboard)/stakeholder/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, MapPin, Calendar, FlaskConical, DollarSign } from "lucide-react";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

// --- Tipe data ---
type BatchLab = {
  id: string;
  pengepul: string;
  totalLiter: number;
  grade?: string;
  ffa?: number;
  moisture?: number;
  impurity?: number;
  status?: string;
};

type PricingConfig = {
  base: number;
  mA: number;
  mB: number;
  mC: number;
  bonus: number;
};

export default function StakeholderPage() {
  const [depositors, setDepositors] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<{ date: string; value: number }[]>([]);
  const [labBatches, setLabBatches] = useState<BatchLab[]>([]);
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Depositors
      const depRes = await axios.get(`${API_URL}/depositors`);
      setDepositors(depRes.data || []);

      // 2. Collectors
      const colRes = await axios.get(`${API_URL}/collectors`);
      setCollectors(colRes.data || []);

      // 3. Realisasi dari /analyze
      const analyzeRes = await axios.get(`${API_URL}/analyze?refresh=true`);
      const predictionData = analyzeRes.data.prediction || [];
      const realisasiItems = predictionData.filter(
        (item: any) => item.type === "realisasi"
      );
      const transData = realisasiItems.map((item: any) => ({
        date: item.bulan,
        value: item.total_value,
      }));
      transData.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(transData);

      // 4. Lab batches (ambil dari endpoint /stakeholder/lab atau fallback dari mock)
      let labData: BatchLab[] = [];
      try {
        const labRes = await axios.get(`${API_URL}/stakeholder/lab`);
        labData = labRes.data || [];
      } catch {
        // Fallback mock data
        labData = [
          { id: "BATCH-001", pengepul: "Pengepul A", totalLiter: 120, grade: "A", ffa: 1.2, moisture: 0.08, impurity: 0.3, status: "pending" },
          { id: "BATCH-002", pengepul: "Pengepul B", totalLiter: 85, grade: "B", ffa: 2.8, moisture: 0.15, impurity: 0.7, status: "pending" },
          { id: "BATCH-003", pengepul: "Pengepul C", totalLiter: 200, grade: "A", ffa: 0.9, moisture: 0.06, impurity: 0.2, status: "approved" },
          { id: "BATCH-004", pengepul: "Pengepul D", totalLiter: 60, grade: "C", ffa: 4.2, moisture: 0.25, impurity: 1.2, status: "pending" },
        ];
      }
      setLabBatches(labData);

      // 5. Pricing config
      let pricingData: PricingConfig | null = null;
      try {
        const priceRes = await axios.get(`${API_URL}/stakeholder/pricing-config`);
        pricingData = priceRes.data;
      } catch {
        // Fallback
        pricingData = { base: 6200, mA: 1.1, mB: 1.0, mC: 0.85, bonus: 200 };
      }
      setPricing(pricingData);

    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Memuat data...</span>
      </div>
    );
  }

  // Fungsi bantu untuk warna grade
  const gradeColor = (g?: string) => {
    if (g === "A") return "bg-emerald-100 text-emerald-800";
    if (g === "B") return "bg-amber-100 text-amber-800";
    return "bg-stone-100 text-stone-700";
  };

  // Ambil 3 batch terakhir (misal yang pending atau punya lab)
  const recentLabBatches = labBatches.slice(0, 3);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Stakeholder</h1>
          <p className="text-sm text-muted-foreground">
            Sebaran pengepul & penyetor, histori transaksi, lab, dan harga acuan
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md">
          ⚠️ {error}
        </div>
      )}

      {/* PETA */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Peta Persebaran
          </CardTitle>
          <Link href="/stakeholder/map" passHref>
            <Button variant="outline" size="sm">
              Cek Persebaran →
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Map points={depositors} collectors={collectors} />
          <p className="text-xs text-muted-foreground mt-2">
            {depositors.length} penyetor · {collectors.length} pengepul
          </p>
        </CardContent>
      </Card>

      {/* TABEL HISTORI TRANSAKSI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Histori Transaksi (Realisasi)
          </CardTitle>
          <Link href="/stakeholder/prediction" passHref>
            <Button variant="outline" size="sm">
              Cek Prediksi →
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada data realisasi.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono text-xs">Bulan</TableHead>
                    <TableHead className="font-mono text-xs text-right">Nilai (juta)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{tx.date}</TableCell>
                      <TableCell className="text-right font-mono">{tx.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PREVIEW LAB & PRICING (dalam grid 2 kolom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preview Lab */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Lab Approval
            </CardTitle>
            <Link href="/stakeholder/lab" passHref>
              <Button variant="outline" size="sm">
                Lihat Semua →
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentLabBatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data lab.</p>
            ) : (
              <div className="space-y-3">
                {recentLabBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <div className="font-medium text-sm">{batch.id}</div>
                      <div className="text-xs text-muted-foreground">
                        {batch.pengepul} · {batch.totalLiter} L
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {batch.grade && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${gradeColor(batch.grade)}`}>
                          {batch.grade}
                        </span>
                      )}
                      {batch.ffa != null && (
                        <span className="text-xs text-muted-foreground">
                          FFA {batch.ffa}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Pricing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Harga Acuan
            </CardTitle>
            <Link href="/stakeholder/pricing" passHref>
              <Button variant="outline" size="sm">
                Atur Harga →
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pricing ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Harga Dasar</span>
                  <span className="font-medium">{pricing.base.toLocaleString()}/L</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-muted/30 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground">Grade A</div>
                    <div className="font-medium">x{pricing.mA}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(pricing.base * pricing.mA).toLocaleString()}/L
                    </div>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground">Grade B</div>
                    <div className="font-medium">x{pricing.mB}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(pricing.base * pricing.mB).toLocaleString()}/L
                    </div>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground">Grade C</div>
                    <div className="font-medium">x{pricing.mC}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(pricing.base * pricing.mC).toLocaleString()}/L
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Bonus &gt;50L</span>
                  <span className="font-medium">{pricing.bonus.toLocaleString()}/L</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Pengaturan harga belum tersedia.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}