"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell, StatusBadge, formatRp } from "@/components/app-shell";
import { useSubmissions } from "@/lib/api/hooks";
import { ArrowRight, Plus, AlertCircle } from "lucide-react";

// --- Helper: cek mode dummy ---
const isDummyMode = () => {
  if (typeof window === "undefined") return false;
  const urlParams = new URLSearchParams(window.location.search);
  const envDummy = process.env.NEXT_PUBLIC_USE_DUMMY === "true";
  const queryDummy = urlParams.get("dummy") === "true";
  return envDummy || queryDummy;
};

// --- Data dummy ---
const DUMMY_SUBMISSIONS = [
  {
    id: "SET-001",
    estimatedLiter: 10,
    actualLiter: 9,
    status: "completed",
    collector: { fullName: "Budi Pengepul" },
    labResult: { grade: "A" },
    payout: { amount: 55800 },
    createdAt: "2025-01-20T10:00:00Z",
  },
  {
    id: "SET-002",
    estimatedLiter: 5,
    actualLiter: null,
    status: "pending",
    collector: null,
    labResult: null,
    payout: null,
    createdAt: "2025-01-19T14:30:00Z",
  },
  {
    id: "SET-003",
    estimatedLiter: 15,
    actualLiter: 14,
    status: "accepted",
    collector: { fullName: "Ani Pengepul" },
    labResult: { grade: "B" },
    payout: { amount: 81200 },
    createdAt: "2025-01-18T09:15:00Z",
  },
  {
    id: "SET-004",
    estimatedLiter: 8,
    actualLiter: null,
    status: "rejected",
    collector: null,
    labResult: null,
    payout: null,
    createdAt: "2025-01-17T16:45:00Z",
  },
  {
    id: "SET-005",
    estimatedLiter: 20,
    actualLiter: 22,
    status: "processed",
    collector: { fullName: "Cahyo Pengepul" },
    labResult: { grade: "A" },
    payout: { amount: 136400 },
    createdAt: "2025-01-16T11:20:00Z",
  },
  {
    id: "SET-006",
    estimatedLiter: 12,
    actualLiter: 11,
    status: "pickedUp",
    collector: { fullName: "Dewi Pengepul" },
    labResult: { grade: "B" },
    payout: { amount: 63800 },
    createdAt: "2025-01-15T08:00:00Z",
  },
];

export default function SetoranPage() {
  const [isDummy, setIsDummy] = useState(false);
  const [dummyData, setDummyData] = useState<any[]>([]);
  const [dummyLoading, setDummyLoading] = useState(true);

  // Hook asli
  const { data: submissions = [], isLoading, error } = useSubmissions();

  // Deteksi dummy
  useEffect(() => {
    const dummy = isDummyMode();
    setIsDummy(dummy);
    if (dummy) {
      setDummyLoading(true);
      setTimeout(() => {
        setDummyData(DUMMY_SUBMISSIONS);
        setDummyLoading(false);
      }, 600);
    }
  }, []);

  const displayData = isDummy ? dummyData : submissions;
  const loadingState = isDummy ? dummyLoading : isLoading;

  if (loadingState) {
    return (
      <AppShell
        title="Riwayat Setoran"
        subtitle="Memuat data..."
        actions={
          <Link
            href="/masyarakat/setoran/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-warm)" }}
          >
            <Plus className="size-4" /> Setoran Baru
          </Link>
        }
      >
        <div className="text-sm text-muted-foreground">Loading...</div>
      </AppShell>
    );
  }

  if (!isDummy && error) {
    return (
      <AppShell
        title="Riwayat Setoran"
        subtitle="Error"
        actions={
          <Link
            href="/masyarakat/setoran/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-warm)" }}
          >
            <Plus className="size-4" /> Setoran Baru
          </Link>
        }
      >
        <div className="text-sm text-red-500">
          {(error as any)?.response?.data?.message || "Gagal memuat data setoran"}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Riwayat Setoran"
      subtitle="Semua transaksi setoran minyak jelantahmu."
      actions={
        <Link
          href="/masyarakat/setoran/new"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
          style={{ background: "var(--gradient-warm)" }}
        >
          <Plus className="size-4" /> Setoran Baru
        </Link>
      }
    >
      {/* Banner dummy */}
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

      {displayData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-sm text-muted-foreground mb-4">Belum ada setoran.</div>
          <Link
            href="/masyarakat/setoran/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-warm)" }}
          >
            <Plus className="size-4" /> Buat Setoran Pertama
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {[...displayData]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((s: any) => (
              <div
                key={s.id}
                className="rounded-xl border bg-card p-4 sm:p-5"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 flex-1">
                    <div>
                      <div className="text-xs text-muted-foreground">ID</div>
                      <div className="font-medium text-sm">{s.id.slice(0, 8)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Volume</div>
                      <div className="font-medium text-sm">
                        {(s.actualLiter ?? s.estimatedLiter)} L
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Pengepul</div>
                      <div className="font-medium text-sm">
                        {s.collector?.fullName || "Belum diassign"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Grade</div>
                      <div className="font-medium text-sm">
                        {s.labResult?.grade ? (
                          <span className="inline-flex size-6 items-center justify-center rounded-md bg-accent/10 text-accent text-xs font-semibold">
                            {s.labResult.grade}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="font-medium text-sm">
                        {s.payout?.amount ? formatRp(s.payout.amount) : <span className="text-muted-foreground">—</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3">
                    <StatusBadge status={s.status} />
                    <Link
                      href={`/masyarakat/setoran/${s.id}`}
                      className="text-xs text-accent hover:underline inline-flex items-center gap-1"
                    >
                      Detail <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </AppShell>
  );
}