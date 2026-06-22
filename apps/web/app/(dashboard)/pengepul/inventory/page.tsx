"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { AppShell, StatusBadge } from "@/components/app-shell";

// Mock data untuk fetcher sementara
import { inventory as mockInventory } from "@/lib/mock-data";
// import { api } from "@/lib/api"; // Uncomment ini jika menggunakan Axios nantinya

// --- Tipe Data ---
type InventoryItem = {
  id: string;
  source: string;
  liter: number;
  masuk: string;
  status: string;
};

// --- Fungsi Fetcher API ---
const fetchInventory = async (): Promise<InventoryItem[]> => {
  // --- CONTOH JIKA MENGGUNAKAN API ASLI ---
  // const response = await api.get("/pengepul/inventory");
  // return response.data;

  // --- MENGGUNAKAN MOCK DATA ---
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulasi proses loading
  return mockInventory;
};

export default function InventoryPage() {
  // 1. Integrasi React Query
  const { data: inventory = [], isLoading, isError } = useQuery({
    queryKey: ["pengepul-inventory"],
    queryFn: fetchInventory,
  });

  // 2. Tampilan Loading
  if (isLoading) {
    return (
      <AppShell title="Inventory / Storage" subtitle="Stok minyak jelantah di gudang.">
        <div className="flex justify-center items-center py-20 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" /> Memuat data inventory...
        </div>
      </AppShell>
    );
  }

  // 3. Tampilan Error
  if (isError) {
    return (
      <AppShell title="Inventory / Storage" subtitle="Stok minyak jelantah di gudang.">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} /> Gagal memuat data inventory. Silakan coba lagi.
        </div>
      </AppShell>
    );
  }

  // 4. Kalkulasi Data (Hanya berjalan jika data sudah tersedia)
  const total = inventory.reduce((s, x) => s + x.liter, 0);
  const ready = inventory.filter((i) => i.status === "ready").reduce((s, x) => s + x.liter, 0);

  // 5. Tampilan Utama
  return (
    <AppShell title="Inventory / Storage" subtitle="Stok minyak jelantah di gudang.">
      
      {/* RESPONSIF GRID: 1 kolom di HP, 3 kolom di layar yang lebih besar (sm) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs text-muted-foreground">Total Liter</div>
          <div className="text-2xl font-semibold mt-1">{total.toFixed(1)} L</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs text-muted-foreground">Siap di-batch</div>
          <div className="text-2xl font-semibold mt-1">{ready.toFixed(1)} L</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs text-muted-foreground">Drum aktif</div>
          <div className="text-2xl font-semibold mt-1">{inventory.length}</div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
        
        {/* RESPONSIF TABEL: overflow-x-auto agar tabel bisa digeser menyamping di HP */}
        <div className="overflow-x-auto">
          {/* min-w-[700px] mencegah kolom tergencet dan merusak layout di layar sempit */}
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 whitespace-nowrap">Drum ID</th>
                <th className="text-left px-5 py-3 whitespace-nowrap">Sumber</th>
                <th className="text-left px-5 py-3 whitespace-nowrap">Liter</th>
                <th className="text-left px-5 py-3 whitespace-nowrap">Masuk</th>
                <th className="text-left px-5 py-3 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Gudang sedang kosong.
                  </td>
                </tr>
              ) : (
                inventory.map((i) => (
                  <tr key={i.id} className="border-t hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium whitespace-nowrap">{i.id}</td>
                    <td className="px-5 py-3 whitespace-nowrap">{i.source}</td>
                    <td className="px-5 py-3 whitespace-nowrap">{i.liter} L</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{i.masuk}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusBadge status={i.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </AppShell>
  );
}