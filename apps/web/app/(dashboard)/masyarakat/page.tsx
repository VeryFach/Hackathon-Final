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
import { setoranList, type SetoranStatus } from "@/lib/mock-data";
import type { Metadata } from "next";
import Link from "next/link";

const STEPS: SetoranStatus[] = [
  "diajukan",
  "dijemput",
  "diterima",
  "diproses",
  "selesai",
];

const STEP_LABEL: Record<SetoranStatus, string> = {
  diajukan: "Diajukan",
  dijemput: "Dijemput",
  diterima: "Diterima",
  diproses: "Diproses",
  selesai: "Selesai",
};

export default function Page() {
  if (!setoranList.length) {
    return (
      <AppShell title="Dashboard" subtitle="Belum ada data setoran.">
        <div className="text-sm text-muted-foreground">
          Kamu belum punya aktivitas setoran.
        </div>
      </AppShell>
    );
  }

  const totalLiter = setoranList.reduce(
    (s, x) => s + (x.volumeAktual ?? x.volumeEstimasi),
    0
  );

  const totalRp = setoranList.reduce((s, x) => s + (x.total ?? 0), 0);

  const last = setoranList[setoranList.length - 1]!;
  const currentIdx = STEPS.indexOf(last.status);

  return (
    <AppShell
      title="Halo, Andi 👋"
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
          value={String(setoranList.filter((s) => s.status !== "selesai").length)}
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

          <div className="mt-8 relative">
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-border" />

            <div
              className="absolute top-3 left-0 h-0.5 transition-all"
              style={{
                width: `${(currentIdx / (STEPS.length - 1)) * 100}%`,
                background: "var(--gradient-warm)",
              }}
            />

            <div className="relative grid grid-cols-5">
              {STEPS.map((s, i) => {
                const done = i <= currentIdx;

                return (
                  <div key={s} className="flex flex-col items-center">
                    <div
                      className={`size-6 rounded-full grid place-items-center ${
                        done
                          ? "text-white"
                          : "bg-card border text-muted-foreground"
                      }`}
                      style={
                        done
                          ? { background: "var(--gradient-warm)" }
                          : undefined
                      }
                    >
                      {done ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <Circle className="size-3" />
                      )}
                    </div>

                    <div
                      className={`mt-2 text-[11px] ${
                        done
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {STEP_LABEL[s]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Pengepul</div>
              <div className="font-medium mt-1">{last.pengepul}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Estimasi volume
              </div>
              <div className="font-medium mt-1">
                {last.volumeEstimasi} L
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Lokasi</div>
              <div className="font-medium mt-1">{last.lokasi}</div>
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
            {setoranList
              .slice(0, 4)
              .reverse()
              .map((s) => (
                <Link
                  key={s.id}
                  href={`/masyarakat/setoran/${s.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/60 transition"
                >
                  <div>
                    <div className="text-sm font-medium">{s.id}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.volumeEstimasi} L · {s.pengepul}
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