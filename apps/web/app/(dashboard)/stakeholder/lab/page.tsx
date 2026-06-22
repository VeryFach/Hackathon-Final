"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Loader2, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";

// Mock data untuk fetcher sementara
import { batches as mockBatches } from "@/lib/mock-data";
// import { api } from "@/lib/api"; // Uncomment jika sudah menggunakan Axios

// --- Tipe Data ---
type Batch = {
  id: string;
  pengepul: string;
  totalLiter: number;
  grade?: string;
  ffa?: number;
  moisture?: number;
  impurity?: number;
};

// --- Fungsi Fetcher API ---
const fetchLabResults = async (): Promise<Batch[]> => {
  // const response = await api.get("/stakeholder/lab/results");
  // return response.data;
  await new Promise((resolve) => setTimeout(resolve, 600)); // Simulasi loading
  // Hanya ambil batch yang memiliki nilai ffa (sudah diuji)
  return mockBatches.filter((b: any) => b.ffa != null) as Batch[];
};

// --- Komponen Pembantu ---
function gradeColor(g?: string) {
  if (g === "A") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (g === "B") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-stone-100 text-stone-700 border-stone-200";
}

function Bar({ label, value, max, hint }: { label: string; value: number; max: number; hint?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}% {hint && <span className="text-muted-foreground font-normal">· {hint}</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--gradient-warm)" }} />
      </div>
    </div>
  );
}

export default function LabResultsPage() {
  // 1. Integrasi React Query
  const { data: testedBatches = [], isLoading, isError } = useQuery({
    queryKey: ["stakeholder-lab-results"],
    queryFn: fetchLabResults,
  });

  // 2. Tampilan Loading
  if (isLoading) {
    return (
      <AppShell title="Lab Results" subtitle="Parameter kualitas tiap batch.">
        <div className="flex justify-center items-center py-20 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" /> Memuat data hasil lab...
        </div>
      </AppShell>
    );
  }

  // 3. Tampilan Error
  if (isError) {
    return (
      <AppShell title="Lab Results" subtitle="Parameter kualitas tiap batch.">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} /> Gagal memuat data lab. Silakan coba lagi.
        </div>
      </AppShell>
    );
  }

  // 4. Tampilan Utama
  return (
    <AppShell title="Lab Results" subtitle="Parameter kualitas tiap batch.">
      
      {testedBatches.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">
          Belum ada batch yang selesai diuji lab.
        </div>
      ) : (
        /* RESPONSIF GRID: 1 kolom di layar kecil (HP), 2 kolom di layar desktop (md) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {testedBatches.map((b) => (
            <div key={b.id} className="rounded-xl border bg-card p-4 sm:p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg flex items-center justify-center bg-accent/10 shrink-0">
                    <FlaskConical className="size-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{b.id}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {b.pengepul} <span className="hidden sm:inline">·</span><br className="sm:hidden" /> {b.totalLiter} L
                    </div>
                  </div>
                </div>
                <div className={`size-10 sm:size-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold border shrink-0 ${gradeColor(b.grade)}`}>
                  {b.grade}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Bar label="FFA (Free Fatty Acid)" value={b.ffa!} max={5} hint={b.ffa! < 2 ? "excellent" : b.ffa! < 4 ? "good" : "high"} />
                <Bar label="Moisture" value={b.moisture!} max={1} hint={b.moisture! < 0.15 ? "dry" : "wet"} />
                <Bar label="Impurity" value={b.impurity!} max={2} hint={b.impurity! < 0.5 ? "clean" : "needs filter"} />
              </div>

              <div className="mt-5 pt-4 border-t text-xs flex justify-between items-center">
                <span className="text-muted-foreground">Auto-pricing</span>
                <span className="font-semibold text-sm">
                  {b.grade === "A" ? "Rp 6.500/L" : b.grade === "B" ? "Rp 5.800/L" : "Rp 4.900/L"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </AppShell>
  );
}