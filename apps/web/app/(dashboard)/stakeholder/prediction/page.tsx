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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, TrendingUp, Calendar, Database, Plus, Trash2, Info } from "lucide-react";

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
  const [serverData, setServerData] = useState<PredictionItem[]>([]);
  const [localData, setLocalData] = useState<PredictionItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [nextValue, setNextValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk form tambah data
  const [newBulan, setNewBulan] = useState("");
  const [newValue, setNewValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const processData = (data: PredictionItem[]) => {
    // --- Ambil 6 realisasi terakhir + 1 prediksi pertama ---
    const realisasi = data
      .filter((item) => item.type === "realisasi")
      .sort((a, b) => a.bulan.localeCompare(b.bulan))
      .slice(-6);

    const prediksi = data
      .filter((item) => item.type === "prediksi")
      .sort((a, b) => a.bulan.localeCompare(b.bulan))
      .slice(0, 1);

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

    // Tambahkan 1 bulan kosong setelah prediksi
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

    const sortedData = Array.from(monthMap.values()).sort((a, b) =>
      a.bulan.localeCompare(b.bulan)
    );

    setChartData(sortedData);

    // Ambil prediksi terakhir
    const lastPrediksi = data
      .filter((item) => item.type === "prediksi")
      .sort((a, b) => a.bulan.localeCompare(b.bulan))
      .pop();
    setNextValue(lastPrediksi?.total_value ?? null);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/predict-fund`);
      const predictionData: PredictionItem[] = response.data.prediction || [];
      setServerData(predictionData);
      const allData = [...predictionData, ...localData];
      processData(allData);
    } catch (err: any) {
      console.error("❌ Error fetching prediction data:", err);
      setError(err.message || "Gagal mengambil data prediksi");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Set default bulan ke bulan setelah data terakhir
  useEffect(() => {
    if (chartData.length === 0) {
      // Default ke bulan sekarang
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      setNewBulan(`${year}-${month}`);
      return;
    }

    // Ambil bulan terakhir yang memiliki data (realisasi atau prediksi)
    const nonEmptyMonths = chartData
      .filter(d => d.realisasi !== null || d.prediksi !== null)
      .map(d => d.bulan);
    
    if (nonEmptyMonths.length === 0) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      setNewBulan(`${year}-${month}`);
      return;
    }

    const lastMonth = nonEmptyMonths[nonEmptyMonths.length - 1];
    const [year, month] = lastMonth.split("-").map(Number);
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = year + 1;
    }
    const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
    setNewBulan(nextMonthStr);
  }, [chartData]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (serverData.length > 0) {
      const allData = [...serverData, ...localData];
      processData(allData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localData]);

  const handleAddData = () => {
    if (!newBulan || !newValue) {
      alert("Silakan isi bulan dan nilai!");
      return;
    }
    const value = parseFloat(newValue);
    if (isNaN(value) || value < 0) {
      alert("Nilai harus berupa angka positif!");
      return;
    }

    // Cek apakah bulan sudah ada di localData atau serverData sebagai realisasi
    const allExisting = [...serverData, ...localData];
    if (allExisting.some((item) => item.bulan === newBulan && item.type === "realisasi")) {
      alert(`Data realisasi untuk bulan ${newBulan} sudah ada!`);
      return;
    }

    const newItem: PredictionItem = {
      bulan: newBulan,
      total_value: value,
      type: "realisasi",
    };

    setLocalData((prev) => [...prev, newItem]);
    setNewBulan("");
    setNewValue("");
    setDialogOpen(false);
  };

  const handleDeleteData = (bulan: string) => {
    setLocalData((prev) => prev.filter((item) => item.bulan !== bulan));
  };

  // Data untuk tabel (gabungan, diurutkan terbaru di atas)
  const tableData = [...serverData, ...localData]
    .sort((a, b) => b.bulan.localeCompare(a.bulan));

  const realisasiCount = chartData.filter((d) => d.realisasi !== null).length;
  const prediksiCount = chartData.filter((d) => d.prediksi !== null).length;
  const lastMonth =
    chartData.length > 0 ? chartData[chartData.length - 1].bulan : "-";

  // Cek apakah newBulan adalah bulan setelah data terakhir (untuk info tooltip)
  const isNextMonth = (() => {
    if (chartData.length === 0) return false;
    const nonEmptyMonths = chartData
      .filter(d => d.realisasi !== null || d.prediksi !== null)
      .map(d => d.bulan);
    if (nonEmptyMonths.length === 0) return false;
    const lastMonth = nonEmptyMonths[nonEmptyMonths.length - 1];
    const [year, month] = lastMonth.split("-").map(Number);
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = year + 1;
    }
    const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
    return newBulan === nextMonthStr;
  })();

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

                <Line
                  type="monotone"
                  dataKey="prediksi"
                  stroke="#d97706"
                  name="Prediksi"
                  strokeWidth={3}
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

      {/* Tabel Data */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Data Realisasi & Prediksi</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Tambah Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Data Realisasi</DialogTitle>
                <DialogDescription>
                  Masukkan bulan dan nilai realisasi baru. 
                  Bulan akan diisi otomatis dengan bulan setelah data terakhir.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bulan" className="text-right">
                    Bulan
                  </Label>
                  <div className="col-span-3 relative">
                    <Input
                      id="bulan"
                      placeholder="YYYY-MM"
                      value={newBulan}
                      onChange={(e) => setNewBulan(e.target.value)}
                      className={isNextMonth ? "border-primary/50 bg-primary/5" : ""}
                    />
                    {isNextMonth && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary">
                        <Info className="h-4 w-4 inline mr-1" />
                        bulan setelah data terakhir
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nilai" className="text-right">
                    Nilai (juta)
                  </Label>
                  <Input
                    id="nilai"
                    type="number"
                    placeholder="100"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddData}>Tambah</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat data...</span>
            </div>
          ) : tableData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono text-xs">Bulan</TableHead>
                    <TableHead className="font-mono text-xs text-right">Realisasi (juta)</TableHead>
                    <TableHead className="font-mono text-xs text-right">Prediksi (juta)</TableHead>
                    <TableHead className="font-mono text-xs text-center">Keterangan</TableHead>
                    <TableHead className="font-mono text-xs text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((item, index) => {
                    const isLocal = localData.some((d) => d.bulan === item.bulan && d.type === item.type);
                    const isRealisasi = item.type === "realisasi";
                    const isPrediksi = item.type === "prediksi";
                    let status = "";
                    if (isRealisasi && isPrediksi) status = "Realisasi & Prediksi";
                    else if (isRealisasi) status = "Realisasi";
                    else if (isPrediksi) status = "Prediksi";
                    else status = "-";

                    let statusColor = "text-muted-foreground";
                    if (status === "Realisasi") statusColor = "text-blue-600";
                    else if (status === "Prediksi") statusColor = "text-amber-600";
                    else if (status === "Realisasi & Prediksi") statusColor = "text-green-600";

                    return (
                      <TableRow key={index} className={isLocal ? "bg-primary/5" : ""}>
                        <TableCell className="font-mono text-sm">{item.bulan}</TableCell>
                        <TableCell className="text-right font-mono">
                          {item.type === "realisasi" ? item.total_value.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.type === "prediksi" ? item.total_value.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className={`text-center text-xs font-medium ${statusColor}`}>
                          {status}
                          {isLocal && " (lokal)"}
                        </TableCell>
                        <TableCell className="text-center">
                          {isLocal && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteData(item.bulan)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">Tidak ada data.</p>
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