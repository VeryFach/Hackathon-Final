"use client";

import { useState, useEffect } from "react";
import {
  Droplets,
  Wallet,
  Truck,
  Plus,
  ArrowRight,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { AppShell, StatCard, StatusBadge, formatRp } from "@/components/app-shell";
import { useSubmissions, useMe } from "@/lib/api/hooks";
import Link from "next/link";

type SetoranStatus = "pending" | "accepted" | "pickedUp" | "processed" | "completed";

const STEP_LABEL: Record<string, string> = {
  pending: "Diajukan",
  accepted: "Diterima",
  pickedUp: "Dijemput",
  processed: "Diproses",
  completed: "Selesai",
};

// --- DUMMY DATA ---
const DUMMY_USER = {
  fullName: "Budi Santoso",
};

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

// --- Helper: cek mode dummy ---
const isDummyMode = () => {
  if (typeof window === "undefined") return false;
  const urlParams = new URLSearchParams(window.location.search);
  const envDummy = process.env.NEXT_PUBLIC_USE_DUMMY === "true";
  const queryDummy = urlParams.get("dummy") === "true";
  return envDummy || queryDummy;
};

export default function Page() {
  const [isDummy, setIsDummy] = useState(false);
  const [dummyUser, setDummyUser] = useState<any>(null);
  const [dummySubmissions, setDummySubmissions] = useState<any[]>([]);
  const [dummyLoading, setDummyLoading] = useState(true);

  // Hook asli (hanya dipanggil jika bukan dummy)
  const { data: realUser, isLoading: userLoading } = useMe();
  const { data: realSubmissions = [], isLoading: subLoading, error } = useSubmissions();

  // Deteksi dummy dan muat data
  useEffect(() => {
    const dummy = isDummyMode();
    setIsDummy(dummy);
    if (dummy) {
      setDummyLoading(true);
      setTimeout(() => {
        setDummyUser(DUMMY_USER);
        setDummySubmissions(DUMMY_SUBMISSIONS);
        setDummyLoading(false);
      }, 600);
    }
  }, []);

  // Tentukan data yang akan ditampilkan
  const user = isDummy ? dummyUser : realUser;
  const submissions = isDummy ? dummySubmissions : realSubmissions;
  const isLoading = isDummy ? dummyLoading : (userLoading || subLoading);

  // Error hanya untuk mode real
  const showError = !isDummy && error;

  if (isLoading) {
    return (
      <AppShell title="Dashboard" subtitle="Memuat data...">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </AppShell>
    );
  }

  if (showError) {
    return (
      <AppShell title="Dashboard" subtitle="Error">
        <div className="text-sm text-red-500">
          {(error as any)?.response?.data?.message || "Gagal memuat data setoran"}
        </div>
      </AppShell>
    );
  }

  const firstName = user?.fullName?.split(' ')[0] || 'User';

  // --- Perhitungan statistik ---
  const totalLiter = submissions.reduce(
    (s: number, x: any) => s + (x.actualLiter || x.estimatedLiter),
    0
  );
  const totalRp = submissions.reduce((s: number, x: any) => s + (x.payout?.amount || 0), 0);
  const activeSubmissions = submissions.filter((s: any) => s.status !== "completed");
  const last = submissions.length > 0 ? submissions[submissions.length - 1] : null;

  // Jika tidak ada data sama sekali (hanya untuk mode real, karena dummy selalu ada data)
  if (submissions.length === 0 && !isDummy) {
    return (
      <AppShell
        title="Dashboard"
        subtitle="Belum ada data setoran."
        actions={
          <Link
            href="/masyarakat/setoran/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-warm)" }}
          >
            <Plus className="size-4" /> Ajukan Setoran
          </Link>
        }
      >
        <div className="text-sm text-muted-foreground">
          Kamu belum punya aktivitas setoran.
        </div>
      </AppShell>
    );
  }

  // --- Render utama ---
  return (
    <AppShell
      title={`Halo, ${firstName} 👋`}
      subtitle="Berikut ringkasan setoran minyak jelantahmu."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/masyarakat/pengepul-terdekat"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border hover:bg-muted"
          >
            <MapPin className="size-4" /> Cari Pengepul
          </Link>
          <Link
            href="/masyarakat/setoran/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-warm)" }}
          >
            <Plus className="size-4" /> Ajukan Setoran
          </Link>
        </div>
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

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Liter Disetor"
          value={`${totalLiter.toFixed(1)} L`}
          hint="Sepanjang waktu"
          icon={Droplets}
          tone="sage"
        />
        <StatCard
          label="Total Penghasilan"
          value={formatRp(totalRp)}
          hint="Sudah dibayarkan"
          icon={Wallet}
          tone="warm"
        />
        <StatCard
          label="Setoran Aktif"
          value={String(activeSubmissions.length)}
          hint="Dalam proses"
          icon={Truck}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {/* LIVE TRACKING */}
        <div
          className="col-span-2 rounded-xl border bg-card p-6"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Live tracking</div>
              <div className="font-semibold mt-0.5">
                {last ? `Setoran #${last.id}` : "Belum ada setoran"}
              </div>
            </div>
            {last && <StatusBadge status={last.status} />}
          </div>

          {last ? (
            <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Volume Estimasi</div>
                <div className="font-medium mt-1">{last.estimatedLiter} L</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Volume Aktual</div>
                <div className="font-medium mt-1">{last.actualLiter || "-"} L</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="font-medium mt-1">{STEP_LABEL[last.status] || last.status}</div>
              </div>
            </div>
          ) : (
            <div className="mt-8 text-sm text-muted-foreground">
              Belum ada setoran untuk dilacak.
            </div>
          )}
        </div>

        {/* HISTORY */}
        <div
          className="rounded-xl border bg-card p-6"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold">Riwayat Terkini</div>
            <Link
              href="/masyarakat/setoran"
              className="text-xs text-accent inline-flex items-center gap-1 hover:underline"
            >
              Semua <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {submissions
              .slice(0, 4)
              .reverse()
              .map((s: any) => (
                <Link
                  key={s.id}
                  href={`/masyarakat/setoran/${s.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/60 transition"
                >
                  <div>
                    <div className="text-sm font-medium">{s.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.estimatedLiter} L · {STEP_LABEL[s.status] || s.status}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}