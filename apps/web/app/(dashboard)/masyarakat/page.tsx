"use client";
import {
  Droplets,
  Wallet,
  Truck,
  Plus,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { AppShell, StatCard, StatusBadge, formatRp } from "@/components/app-shell";
import { useSubmissions, useMe } from "@/lib/api/hooks";
import type { Metadata } from "next";
import Link from "next/link";

type SetoranStatus = "pending" | "accepted" | "pickedUp" | "processed" | "completed";

const STEP_LABEL: Record<string, string> = {
  pending: "Diajukan",
  accepted: "Diterima",
  pickedUp: "Dijemput",
  processed: "Diproses",
  completed: "Selesai",
};

export default function Page() {
  const { data: user } = useMe();
  const { data: submissions = [], isLoading, error } = useSubmissions();

  // Get user's first name from database
  const firstName = user?.fullName?.split(' ')[0] || 'User';

  if (isLoading) {
    return (
      <AppShell title="Dashboard" subtitle="Memuat data...">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Dashboard" subtitle="Error">
        <div className="text-sm text-red-500">
          {(error as any).response?.data?.message || "Gagal memuat data setoran"}
        </div>
      </AppShell>
    );
  }

  if (!submissions.length) {
    return (
      <AppShell title="Dashboard" subtitle="Belum ada data setoran."
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

  const totalLiter = submissions.reduce(
    (s: number, x: any) => s + (x.actualLiter || x.estimatedLiter),
    0
  );

  const totalRp = submissions.reduce((s: number, x: any) => s + (x.payout?.amount || 0), 0);

  const last = submissions[submissions.length - 1]!;

  return (
    <AppShell
      title={`Halo, ${firstName} 👋`}
      subtitle="Berikut ringkasan setoran minyak jelantahmu."
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
          value={String(submissions.filter((s) => s.status !== "completed").length)}
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
              <div className="font-semibold mt-0.5">Setoran #{last.id}</div>
            </div>
            <StatusBadge status={last.status} />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Volume Estimasi</div>
              <div className="font-medium mt-1">{last.estimatedLiter} L</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Volume Aktual
              </div>
              <div className="font-medium mt-1">
                {last.actualLiter || "-"} L
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="font-medium mt-1">{STEP_LABEL[last.status] || last.status}</div>
            </div>
          </div>
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
              .map((s) => (
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