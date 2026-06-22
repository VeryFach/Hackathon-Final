"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Users, Truck, Layers, ArrowRight } from "lucide-react";

import { AppShell, StatCard, StatusBadge } from "@/components/app-shell";
import { batches as mockBatches, incomingRequests as mockRequests, inventory as mockInventory } from "@/lib/mock-data"; 
// import { api } from "@/lib/api"; // Uncomment ini jika sudah siap pakai Axios

// Fungsi fetcher untuk React Query
const fetchDashboardData = async () => {
  // --- CONTOH JIKA MENGGUNAKAN API ASLI ---
  // const response = await api.get("/pengepul/dashboard");
  // return response.data;

  // --- MENGGUNAKAN MOCK DATA SEMENTARA ---
  // Simulasi delay jaringan (opsional, hapus jika tidak perlu)
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    inventory: mockInventory,
    incomingRequests: mockRequests,
    batches: mockBatches,
  };
};

export default function PengepulHomePage() {
  // Implementasi React Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pengepul-dashboard"],
    queryFn: fetchDashboardData,
  });

  // Tampilan saat loading
  if (isLoading) {
    return (
      <AppShell title="Operasional Pengepul" subtitle="Hijau Lestari — Jakarta Selatan">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">Memuat data dashboard...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Tampilan saat error
  if (isError || !data) {
    return (
      <AppShell title="Operasional Pengepul" subtitle="Hijau Lestari — Jakarta Selatan">
        <div className="p-6 text-center text-red-500 border border-red-200 rounded-lg bg-red-50">
          Terjadi kesalahan saat memuat data. Silakan muat ulang halaman.
        </div>
      </AppShell>
    );
  }

  // Ekstrak data setelah dipastikan tersedia
  const { inventory, incomingRequests, batches } = data;
  const totalStok = inventory.reduce((s: any, x: any) => s + x.liter, 0);

  return (
    <AppShell title="Operasional Pengepul" subtitle="Hijau Lestari — Jakarta Selatan">
      {/* RESPONSIF: 
        1 kolom di HP (grid-cols-1)
        2 kolom di Tablet (sm:grid-cols-2)
        4 kolom di Desktop (lg:grid-cols-4)
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Stok" value={`${totalStok.toFixed(1)} L`} hint="Siap diproses" icon={Droplets} tone="sage" />
        <StatCard label="Penyetor Aktif" value="84" hint="30 hari terakhir" icon={Users} />
        <StatCard label="Pending Pickup" value={String(incomingRequests.length)} hint="Permintaan baru" icon={Truck} tone="warm" />
        <StatCard label="Batch Aktif" value={String(batches.filter((b: any) => b.status !== "approved").length)} hint="Draft / pending" icon={Layers} />
      </div>

      {/* RESPONSIF: 
        1 kolom di HP & Tablet kecil (grid-cols-1)
        2 kolom berdampingan di Desktop (lg:grid-cols-2)
      */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Permintaan Masuk */}
        <div className="rounded-xl border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Permintaan Masuk</div>
            {/* Ubah 'to' menjadi 'href' untuk Next.js Link */}
            <Link href="/pengepul/requests" className="text-xs text-accent inline-flex items-center gap-1 hover:underline">
              Semua <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {incomingRequests.slice(0, 4).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition">
                <div>
                  <div className="text-sm font-medium">{r.user}</div>
                  <div className="text-xs text-muted-foreground">{r.liter} L · {r.lokasi} · {r.jarak}</div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted">Tolak</button>
                  <button className="text-xs px-3 py-1.5 rounded-md text-primary-foreground" style={{ background: "var(--gradient-warm)" }}>
                    Terima
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card Batch Aktif */}
        <div className="rounded-xl border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Batch Aktif</div>
            {/* Ubah 'to' menjadi 'href' untuk Next.js Link */}
            <Link href="/pengepul/batches" className="text-xs text-accent inline-flex items-center gap-1 hover:underline">
              Semua <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {batches.map((b: any) => (
              <div key={b.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{b.id}</div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{b.totalLiter} L · {b.jumlahPenyetor} penyetor</div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: b.status === "approved" ? "100%" : b.status === "pending" ? "70%" : "30%",
                      background: "var(--gradient-warm)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}