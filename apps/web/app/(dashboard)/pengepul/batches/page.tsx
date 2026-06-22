"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { AppShell, StatusBadge, formatRp } from "@/components/app-shell";
import { pengepulService } from "@/lib/api";

// --- Tipe Data ---
type Batch = {
  id: string;
  createdAt: string;
  totalLiter: number;
  jumlahPenyetor: number;
  grade?: string;
  estimatedValue: number;
  status: string;
};

// --- Fungsi Fetcher API ---
const fetchBatches = async (): Promise<Batch[]> => {
  return pengepulService.getBatches();
};

export default function BatchesPage() {
  // 1. Integrasi React Query
  const { data: batches = [], isLoading, isError } = useQuery({
    queryKey: ["pengepul-batches"],
    queryFn: fetchBatches,
    retry: false,
  });

  // 2. Tampilan Loading
  if (isLoading) {
    return (
      <AppShell title="Riwayat Batch" subtitle="Pengiriman ke stakeholder.">
        <div className="flex justify-center items-center py-20 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" /> Memuat data batch...
        </div>
      </AppShell>
    );
  }

  // 3. Tampilan Error
  if (isError) {
    return (
      <AppShell title="Riwayat Batch" subtitle="Pengiriman ke stakeholder.">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} /> Gagal memuat data riwayat. Silakan coba lagi.
        </div>
      </AppShell>
    );
  }

  // 4. Tampilan Utama
  return (
    <AppShell title="Riwayat Batch" subtitle="Pengiriman ke stakeholder.">
      <div className="rounded-xl border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
        
        {/* RESPONSIF: Wrapper overflow-x-auto memungkinkan tabel di-scroll ke samping di layar HP */}
        <div className="overflow-x-auto">
          {/* min-w-[800px] mencegah tabel mengecil dan rusak bentuknya di layar sempit */}
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 whitespace-nowrap">Batch ID</th>
                <th className="text-left px-5 py-3 whitespace-nowrap">Tanggal</th>
                <th className="text-left px-5 py-3 whitespace-nowrap">Liter</th>
                <th className="text-left px-5 py-3 whitespace-nowrap">Penyetor</th>
                <th className="text-left px-5 py-3 whitespace-nowrap">Grade</th>
                <th className="text-left px-5 py-3 whitespace-nowrap">Nilai</th>
                <th className="text-left px-5 py-3 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada riwayat batch.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="border-t hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium whitespace-nowrap">{b.id}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{b.createdAt}</td>
                    <td className="px-5 py-3 whitespace-nowrap">{b.totalLiter} L</td>
                    <td className="px-5 py-3 whitespace-nowrap">{b.jumlahPenyetor}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {b.grade ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-md bg-accent/10 text-accent text-xs font-semibold">
                          {b.grade}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">{formatRp(b.estimatedValue)}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusBadge status={b.status} />
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
