// apps/web/app/(dashboard)/stakeholder/prediction/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Calendar, Database } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

interface PredictionItem {
  bulan: string;
  total_value: number;
  type: "realisasi" | "prediksi";
}

interface ChartDataItem {
  bulan: string;
  realisasi: number | null;
  prediksi: number | null;
}

export default function PrediksiDanaPage() {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [nextValue, setNextValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/analyze`);
      const predictionData: PredictionItem[] = response.data.prediction || [];
      const next = response.data.prediction_next_value;

      // --- Sederhanakan: hanya ambil 6 realisasi terakhir + 1 prediksi pertama ---
      const realisasi = predictionData
        .filter((item) => item.type === "realisasi")
        .sort((a, b) => a.bulan.localeCompare(b.bulan))
        .slice(-6); // ambil 6 bulan terakhir

      const prediksi = predictionData
        .filter((item) => item.type === "prediksi")
        .sort((a, b) => a.bulan.localeCompare(b.bulan))
        .slice(0, 1); // ambil 1 prediksi pertama (bulan depan)

      // Gabungkan realisasi dan prediksi
      const allItems = [...realisasi, ...prediksi];
      const monthMap = new Map<string, ChartDataItem>();

      allItems.forEach((item) => {
        const bulan = item.bulan;
        if (!monthMap.has(bulan)) {
          monthMap.set(bulan, { bulan, realisasi: null, prediksi: null });
        }
        const entry = monthMap.get(bulan)!;
        if (item.type === "realisasi") {
          entry.realisasi = item.total_value;
        } else {
          entry.prediksi = item.total_value;
        }
      });

      // 🔥 Tambahkan 1 bulan kosong setelah prediksi terakhir
      const sortedKeys = Array.from(monthMap.keys()).sort();
      const lastMonth = sortedKeys[sortedKeys.length - 1];
      if (lastMonth) {
        const [year, month] = lastMonth.split("-").map(Number);
        let nextYear = year;
        let nextMonth = month + 1;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear = year + 1;
        }
        const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
        monthMap.set(nextMonthStr, { bulan: nextMonthStr, realisasi: null, prediksi: null });
      }

      // Urutkan berdasarkan bulan
      const sortedData = Array.from(monthMap.values()).sort((a, b) =>
        a.bulan.localeCompare(b.bulan)
      );

      setChartData(sortedData);
      setNextValue(next);
    } catch (err: any) {
      console.error("❌ Error fetching prediction data:", err);
      setError(err.message || "Gagal mengambil data prediksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hitung statistik
  const realisasiCount = chartData.filter((d) => d.realisasi !== null).length;
  const prediksiCount = chartData.filter((d) => d.prediksi !== null).length;
  const lastMonth =
    chartData.length > 0 ? chartData[chartData.length - 1].bulan : "-";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prediksi Dana</h1>
          <p className="text-sm text-muted-foreground">
            Berdasarkan riwayat pembelian dari pengepul
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediksi Bulan Depan</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : nextValue !== null ? (
              <div className="text-2xl font-bold text-primary">
                Rp {nextValue.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-1">juta</span>
              </div>
            ) : (
              <p className="text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Periode Terakhir</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Historis</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realisasiCount}</div>
            <p className="text-xs text-muted-foreground">bulan realisasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediksi Tersedia</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prediksiCount}</div>
            <p className="text-xs text-muted-foreground">bulan ke depan</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Tren Dana</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-80 text-red-500">
              <p>Error: {error}</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="bulan"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={{ stroke: "var(--border)" }}
                  label={{
                    value: "Juta Rupiah",
                    angle: -90,
                    position: "insideLeft",
                    fill: "var(--muted-foreground)",
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "var(--radius)",
                    color: "var(--foreground)",
                  }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString()} juta`, ""]}
                />
                <Legend />

                {/* Garis Realisasi */}
                <Line
                  type="monotone"
                  dataKey="realisasi"
                  stroke="#2563eb"
                  name="Realisasi"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#2563eb" }}
                  activeDot={{ r: 10 }}
                  connectNulls={false}
                />

                {/* Garis Prediksi */}
                <Line
                  type="monotone"
                  dataKey="prediksi"
                  stroke="#d97706"
                  name="Prediksi"
                  strokeWidth={3}
                  // strokeDasharray="8 4"
                  dot={{ r: 6, fill: "#d97706" }}
                  activeDot={{ r: 10 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-muted-foreground">
              <p>Tidak ada data untuk ditampilkan.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interpretasi */}
      <Card>
        <CardHeader>
          <CardTitle>Interpretasi Prediksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Grafik di atas menunjukkan tren{" "}
              <span className="font-medium text-foreground">realisasi dana</span>{" "}
              (garis biru) dari pembelian pengepul selama beberapa bulan
              terakhir, serta{" "}
              <span className="font-medium text-foreground">prediksi</span>{" "}
              (garis oranye putus-putus) untuk bulan mendatang.
            </p>
            <p>
              Prediksi dihasilkan menggunakan model{" "}
              <span className="font-medium">Prophet</span> yang mempelajari pola
              musiman dan tren dari data historis.
            </p>
            {nextValue !== null && (
              <p className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                <span className="font-semibold">
                  Perkiraan dana yang perlu disiapkan bulan depan:
                </span>{" "}
                <span className="text-primary font-bold text-lg">
                  Rp {nextValue.toLocaleString()} juta
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}