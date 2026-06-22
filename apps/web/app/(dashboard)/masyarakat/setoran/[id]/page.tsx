"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { AppShell, StatusBadge, formatRp } from "@/components/app-shell";
import { useSubmission } from "@/lib/api/hooks";
import { ArrowLeft, CheckCircle2, Circle, AlertCircle } from "lucide-react";

// --- DUMMY DATA ---
const DUMMY_SUBMISSIONS: Record<string, any> = {
  "SET-001": {
    id: "SET-001",
    estimatedLiter: 10,
    actualLiter: 9,
    status: "completed",
    collector: { fullName: "Budi Pengepul" },
    labResult: { grade: "A" },
    payout: { amount: 55800 },
    createdAt: "2025-01-20T10:00:00Z",
    address: "Jl. Kemang Raya No. 12",
    notes: "Minyak sudah disaring",
    batchId: "BATCH-001",
  },
  "SET-002": {
    id: "SET-002",
    estimatedLiter: 5,
    actualLiter: null,
    status: "pending",
    collector: null,
    labResult: null,
    payout: null,
    createdAt: "2025-01-19T14:30:00Z",
    address: "Jl. Sudirman No. 5",
    notes: null,
    batchId: null,
  },
  "SET-003": {
    id: "SET-003",
    estimatedLiter: 15,
    actualLiter: 14,
    status: "accepted",
    collector: { fullName: "Ani Pengepul" },
    labResult: { grade: "B" },
    payout: { amount: 81200 },
    createdAt: "2025-01-18T09:15:00Z",
    address: "Jl. Gatot Subroto No. 8",
    notes: "Tunggu konfirmasi",
    batchId: "BATCH-002",
  },
  "SET-004": {
    id: "SET-004",
    estimatedLiter: 8,
    actualLiter: null,
    status: "rejected",
    collector: null,
    labResult: null,
    payout: null,
    createdAt: "2025-01-17T16:45:00Z",
    address: "Jl. Pajajaran No. 3",
    notes: "Minyak terlalu kotor",
    batchId: null,
  },
  "SET-005": {
    id: "SET-005",
    estimatedLiter: 20,
    actualLiter: 22,
    status: "processed",
    collector: { fullName: "Cahyo Pengepul" },
    labResult: { grade: "A" },
    payout: { amount: 136400 },
    createdAt: "2025-01-16T11:20:00Z",
    address: "Jl. Merdeka No. 10",
    notes: "Volume aktual lebih banyak",
    batchId: "BATCH-003",
  },
  "SET-006": {
    id: "SET-006",
    estimatedLiter: 12,
    actualLiter: 11,
    status: "pickedUp",
    collector: { fullName: "Dewi Pengepul" },
    labResult: { grade: "B" },
    payout: { amount: 63800 },
    createdAt: "2025-01-15T08:00:00Z",
    address: "Jl. Diponegoro No. 7",
    notes: "Sudah dijemput",
    batchId: "BATCH-004",
  },
};

const isDummyMode = () => {
  if (typeof window === "undefined") return false;
  const urlParams = new URLSearchParams(window.location.search);
  const envDummy = process.env.NEXT_PUBLIC_USE_DUMMY === "true";
  const queryDummy = urlParams.get("dummy") === "true";
  return envDummy || queryDummy;
};

export default function SetoranDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [isDummy, setIsDummy] = useState(false);
  const [dummyData, setDummyData] = useState<any>(null);
  const [dummyLoading, setDummyLoading] = useState(true);

  const { data: realSubmission, isLoading: realLoading, error: realError } = useSubmission(id);

  useEffect(() => {
    const dummy = isDummyMode();
    setIsDummy(dummy);
    if (dummy) {
      setDummyLoading(true);
      setTimeout(() => {
        const data = DUMMY_SUBMISSIONS[id];
        setDummyData(data || null);
        setDummyLoading(false);
      }, 600);
    }
  }, [id]);

  const submission = isDummy ? dummyData : realSubmission;
  const isLoading = isDummy ? dummyLoading : realLoading;
  const error = isDummy ? null : realError;

  if (isLoading) {
    return (
      <AppShell title="Detail Setoran" subtitle="Memuat data...">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </AppShell>
    );
  }

  if (error || !submission) {
    const errorMessage = (error as any)?.response?.data?.message || "Data tidak ditemukan";
    return (
      <AppShell title="Detail Setoran" subtitle="Error">
        <div className="text-sm text-red-500">{errorMessage}</div>
        <Link
          href="/masyarakat/setoran"
          className="text-xs text-accent inline-flex items-center gap-1 hover:underline mt-4"
        >
          <ArrowLeft className="size-3" /> Kembali ke riwayat
        </Link>
      </AppShell>
    );
  }

  const s = submission;
  const statusSteps = ["pending", "accepted", "pickedUp", "processed", "completed"];
  const statusLabels: Record<string, string> = {
    pending: "Diajukan",
    accepted: "Diterima",
    pickedUp: "Dijemput",
    processed: "Diproses",
    completed: "Selesai",
  };
  const currentIdx = statusSteps.indexOf(s.status);

  return (
    <AppShell title={`Setoran ${s.id.slice(0, 8)}`} subtitle={s.collector?.fullName || "Belum diassign"}>
      {isDummy && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Mode Dummy</strong> — Menampilkan data simulasi. API tidak dipanggil.
            <span className="block text-xs text-amber-600 mt-0.5">
              Untuk menonaktifkan, hapus parameter <code className="bg-amber-100 px-1 rounded">?dummy=true</code> dari URL.
            </span>
          </span>
        </div>
      )}

      <Link
        href="/masyarakat/setoran"
        className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-3" /> Kembali ke riwayat
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            className="rounded-xl border bg-card p-6"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="font-semibold">Informasi Setoran</div>
              <StatusBadge status={s.status} />
            </div>

            <div className="space-y-4">
              {statusSteps.map((step, i) => {
                const done = i <= currentIdx;
                return (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`size-7 rounded-full grid place-items-center ${
                          done ? "text-white" : "bg-card border text-muted-foreground"
                        }`}
                        style={done ? { background: "var(--gradient-warm)" } : undefined}
                      >
                        {done ? <CheckCircle2 className="size-4" /> : <Circle className="size-3" />}
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className={`w-0.5 h-8 ${i < currentIdx ? "bg-accent" : "bg-border"}`} />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className={`text-sm ${done ? "font-medium" : "text-muted-foreground"}`}>
                        {statusLabels[step]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div
            className="rounded-xl border bg-card p-6"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <div className="text-xs text-muted-foreground">Total Pembayaran</div>
            <div className="mt-1 text-3xl font-semibold">
              {s.payout?.amount ? formatRp(s.payout.amount) : "—"}
            </div>

            <div className="mt-4 pt-4 border-t text-sm space-y-2">
              <Row k="Volume estimasi" v={`${s.estimatedLiter} L`} />
              <Row k="Volume aktual" v={s.actualLiter ? `${s.actualLiter} L` : "—"} />
              <Row k="Grade" v={s.labResult?.grade ?? "—"} />
              <Row k="Batch" v={s.batchId ?? "—"} />
              <Row k="Lokasi" v={s.address || "—"} />
            </div>
          </div>

          {s.notes && (
            <div className="rounded-xl border bg-card p-5">
              <div className="text-xs font-medium mb-2">Catatan</div>
              <div className="text-sm text-muted-foreground">{s.notes}</div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}