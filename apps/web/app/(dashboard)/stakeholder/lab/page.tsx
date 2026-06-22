// apps/web/app/(dashboard)/stakeholder/lab/page.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, RefreshCw, Loader2, AlertCircle, FlaskConical } from "lucide-react";
import { AppShell, StatusBadge, formatRp } from "@/components/app-shell";
import { batches as mockBatches } from "@/lib/mock-data";

// --- Tipe Data ---
type Batch = {
  id: string;
  pengepul: string;
  createdAt: string;
  estimatedValue: number;
  totalLiter: number;
  jumlahPenyetor: number;
  grade?: string;
  ffa?: number;
  moisture?: number;
  impurity?: number;
  status: "pending" | "approved" | "rejected" | string;
};

// --- Fungsi Fetcher ---
const fetchAllBatches = async (): Promise<Batch[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return mockBatches as Batch[];
};

// --- Mutation ---
const updateBatchStatus = async ({ id, action }: { id: string; action: "approve" | "reject" | "recheck" }) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true, id, action };
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

export default function StakeholderPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  // Query
  const { data: batches = [], isLoading, isError } = useQuery({
    queryKey: ["stakeholder-batches"],
    queryFn: fetchAllBatches,
  });

  // Mutation
  const { mutate: handleAction, isPending: isMutating, variables } = useMutation({
    mutationFn: updateBatchStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-batches"] });
    },
    onError: () => {
      alert("Terjadi kesalahan saat memproses batch.");
    },
  });

  // Filter data berdasarkan tab
  const pendingBatches = batches.filter((b) => b.status === "pending");
  const historyBatches = batches.filter((b) => b.status !== "pending");

  // Loading & Error
  if (isLoading) {
    return (
      <AppShell title="Stakeholder Dashboard" subtitle="Daftar batch dan hasil lab">
        <div className="flex justify-center items-center py-20 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" /> Memuat data...
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Stakeholder Dashboard" subtitle="Daftar batch dan hasil lab">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} /> Gagal memuat data batch.
        </div>
      </AppShell>
    );
  }

  // Render satu batch card (digunakan untuk kedua tab)
  const renderBatchCard = (b: Batch, showActions: boolean) => {
    const isThisCardMutating = isMutating && variables?.id === b.id;
    const hasLabData = b.ffa != null && b.moisture != null && b.impurity != null;

    return (
      <div key={b.id} className="rounded-xl border bg-card p-4 sm:p-6 transition-all" style={{ boxShadow: "var(--shadow-soft)" }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-base sm:text-lg">{b.id}</div>
              <StatusBadge status={b.status} />
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              {b.pengepul} · {b.createdAt} · {b.totalLiter} L
            </div>
          </div>
          <div className="text-left sm:text-right bg-muted/30 sm:bg-transparent p-3 sm:p-0 rounded-lg">
            <div className="text-xs text-muted-foreground">Estimasi nilai</div>
            <div className="text-lg sm:text-xl font-semibold text-accent sm:text-foreground">
              {formatRp(b.estimatedValue)}
            </div>
          </div>
        </div>

        {/* Grid info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t">
          <div>
            <div className="text-xs text-muted-foreground">Jumlah Penyetor</div>
            <div className="text-sm font-medium mt-1">{b.jumlahPenyetor}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Grade</div>
            <div className="text-sm font-medium mt-1 flex items-center gap-2">
              {b.grade ? (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${gradeColor(b.grade)}`}>
                  {b.grade}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">FFA</div>
            <div className="text-sm font-medium mt-1">{b.ffa != null ? `${b.ffa}%` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Moisture</div>
            <div className="text-sm font-medium mt-1">{b.moisture != null ? `${b.moisture}%` : "—"}</div>
          </div>
        </div>

        {/* Detail lab */}
        {hasLabData && (
          <div className="mt-5 pt-5 border-t">
            <div className="space-y-3">
              <Bar label="FFA (Free Fatty Acid)" value={b.ffa!} max={5} hint={b.ffa! < 2 ? "excellent" : b.ffa! < 4 ? "good" : "high"} />
              <Bar label="Moisture" value={b.moisture!} max={1} hint={b.moisture! < 0.15 ? "dry" : "wet"} />
              <Bar label="Impurity" value={b.impurity!} max={2} hint={b.impurity! < 0.5 ? "clean" : "needs filter"} />
            </div>
            <div className="mt-3 text-xs flex justify-between items-center">
              <span className="text-muted-foreground">Auto-pricing</span>
              <span className="font-semibold text-sm">
                {b.grade === "A" ? "Rp 6.500/L" : b.grade === "B" ? "Rp 5.800/L" : "Rp 4.900/L"}
              </span>
            </div>
          </div>
        )}

        {/* Tombol aksi (hanya jika showActions true dan status pending) */}
        {showActions && b.status === "pending" && (
          <div className="mt-6 flex flex-wrap gap-2 justify-end">
            <button
              disabled={isThisCardMutating}
              onClick={() => handleAction({ id: b.id, action: "recheck" })}
              className="px-4 py-2 rounded-lg border text-sm inline-flex items-center gap-1.5 hover:bg-muted disabled:opacity-50 transition-colors w-full sm:w-auto justify-center"
            >
              {isThisCardMutating && variables?.action === "recheck" ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Re-check
            </button>
            <button
              disabled={isThisCardMutating}
              onClick={() => handleAction({ id: b.id, action: "reject" })}
              className="px-4 py-2 rounded-lg border text-sm inline-flex items-center gap-1.5 text-rose-700 hover:bg-rose-50 border-rose-200 disabled:opacity-50 transition-colors w-full sm:w-auto justify-center"
            >
              {isThisCardMutating && variables?.action === "reject" ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              Reject
            </button>
            <button
              disabled={isThisCardMutating}
              onClick={() => handleAction({ id: b.id, action: "approve" })}
              className="px-4 py-2 rounded-lg text-sm text-primary-foreground inline-flex items-center gap-1.5 disabled:opacity-50 transition-opacity w-full sm:w-auto justify-center"
              style={{ background: "var(--gradient-warm)" }}
            >
              {isThisCardMutating && variables?.action === "approve" ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Approve
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppShell title="Stakeholder Dashboard" subtitle="Daftar batch dan hasil lab">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "pending"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Perlu Validasi ({pendingBatches.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("history")}
        >
          Riwayat Tervalidasi ({historyBatches.length})
        </button>
      </div>

      {/* Konten tab */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingBatches.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">
              Tidak ada batch yang perlu divalidasi.
            </div>
          ) : (
            pendingBatches.map((b) => renderBatchCard(b, true))
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {historyBatches.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">
              Belum ada batch yang tervalidasi.
            </div>
          ) : (
            historyBatches.map((b) => renderBatchCard(b, false))
          )}
        </div>
      )}
    </AppShell>
  );
}