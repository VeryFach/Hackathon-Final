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
import { Loader2, MapPin, Calendar } from "lucide-react";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

export default function StakeholderPage() {
  const [depositors, setDepositors] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<{ date: string; value: number }[]>([]);
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
      const analyzeRes = await axios.get(`${API_URL}/analyze`);
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Stakeholder</h1>
          <p className="text-sm text-muted-foreground">
            Sebaran pengepul & penyetor serta histori transaksi realisasi
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
    </div>
  );
}