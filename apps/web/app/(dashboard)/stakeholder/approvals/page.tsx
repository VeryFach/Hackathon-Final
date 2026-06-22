"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, RefreshCw, Loader2, AlertCircle } from "lucide-react";

import { AppShell, StatusBadge, formatRp } from "@/components/app-shell";
// Mock data untuk fetcher sementara
import { batches as mockBatches } from "@/lib/mock-data";
// import { api } from "@/lib/api"; // Uncomment jika sudah siap menggunakan Axios

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
  status: "pending" | "approved" | "rejected" | string;
};

// --- FUNGSI FETCHER & MUTATION API ---
const fetchApprovalBatches = async (): Promise<Batch[]> => {
  // const response = await api.get("/stakeholder/batches/approvals");
  // return response.data;
  await new Promise((resolve) => setTimeout(resolve, 600));
  return mockBatches as Batch[];
};

const updateBatchStatus = async ({ id, action }: { id: string; action: "approve" | "reject" | "recheck" }) => {
  // const response = await api.post(`/stakeholder/batches/${id}/${action}`);
  // return response.data;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true, id, action };
};

export default function StakeholderApprovalsPage() {
  const queryClient = useQueryClient();

  // 1. Fetch Data
  const { data: batches = [], isLoading, isError } = useQuery({
    queryKey: ["stakeholder-approvals"],
    queryFn: fetchApprovalBatches,
  });

  // 2. Mutation untuk Aksi Tombol
  const { mutate: handleAction, isPending: isMutating, variables } = useMutation({
    mutationFn: updateBatchStatus,
    onSuccess: () => {
      // Refresh data setelah berhasil update
      queryClient.invalidateQueries({ queryKey: ["stakeholder-approvals"] });
    },
    onError: () => {
      alert("Terjadi kesalahan saat memproses batch.");
    },
  });

  // 3. State Loading
  if (isLoading) {
    return (
      <AppShell title="Approval Batch" subtitle="Validasi batch dari pengepul.">
        <div className="flex justify-center items-center py-20 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" /> Memuat data persetujuan...
        </div>
      </AppShell>
    );
  }

  // 4. State Error
  if (isError) {
    return (
      <AppShell title="Approval Batch" subtitle="Validasi batch dari pengepul.">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} /> Gagal memuat daftar approval. Silakan coba lagi.
        </div>
      </AppShell>
    );
  }

  // 5. Tampilan Utama
  return (
    <AppShell title="Approval Batch" subtitle="Validasi batch dari pengepul.">
      <div className="space-y-4">
        {batches.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">
            Tidak ada batch yang perlu divalidasi saat ini.
          </div>
        ) : (
          batches.map((b) => {
            // Cek apakah tombol pada kartu ini sedang diproses
            const isThisCardMutating = isMutating && variables?.id === b.id;

            return (
              <div key={b.id} className="rounded-xl border bg-card p-4 sm:p-6 transition-all" style={{ boxShadow: "var(--shadow-soft)" }}>
                
                {/* RESPONSIF HEADER: Stack ke bawah di HP (flex-col), sejajar di Desktop (sm:flex-row) */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-base sm:text-lg">{b.id}</div>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {b.pengepul} · {b.createdAt}
                    </div>
                  </div>
                  {/* Estimasi Nilai: Rata kiri di HP, rata kanan di Desktop */}
                  <div className="text-left sm:text-right bg-muted/30 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                    <div className="text-xs text-muted-foreground">Estimasi nilai</div>
                    <div className="text-lg sm:text-xl font-semibold text-accent sm:text-foreground">
                      {formatRp(b.estimatedValue)}
                    </div>
                  </div>
                </div>

                {/* RESPONSIF GRID DATA: 2 kolom di HP, 4 kolom di Desktop (md:grid-cols-4) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t">
                  <Item k="Total Volume" v={`${b.totalLiter} L`} />
                  <Item k="Jumlah Penyetor" v={String(b.jumlahPenyetor)} />
                  <Item k="Grade" v={b.grade ?? "—"} />
                  <Item k="FFA / Moisture" v={b.ffa ? `${b.ffa}% / ${b.moisture}%` : "—"} />
                </div>

                {/* RESPONSIF BUTTONS: Bungkus baris (flex-wrap) agar tidak keluar layar di HP */}
                {b.status === "pending" && (
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
          })
        )}
      </div>
    </AppShell>
  );
}

// Komponen Sub-Item
function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="text-sm font-medium mt-1">{v}</div>
    </div>
  );
}