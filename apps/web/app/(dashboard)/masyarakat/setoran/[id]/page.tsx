"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell, StatusBadge, formatRp } from "@/components/app-shell";
import { setoranList, type SetoranStatus } from "@/lib/mock-data";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";

export default function SetoranDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params); // ✅ IMPORTANT FIX

  const s = setoranList.find((x) => x.id === id);

  if (!s) notFound();

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

  const currentIdx = STEPS.indexOf(s.status);

   return (
    <AppShell title={`Setoran ${s.id}`} subtitle={s.pengepul}>
      <Link
        href="/masyarakat/setoran"
        className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-3" /> Kembali ke riwayat
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className="rounded-xl border bg-card p-6"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="font-semibold">Timeline</div>
              <StatusBadge status={s.status} />
            </div>

            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const done = i <= currentIdx;

                const tl = s.timeline.find(
                  (t: { status: SetoranStatus; at: string }) =>
                    t.status === step
                );

                return (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`size-7 rounded-full grid place-items-center ${
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

                      {i < STEPS.length - 1 && (
                        <div
                          className={`w-0.5 h-8 ${
                            i < currentIdx ? "bg-accent" : "bg-border"
                          }`}
                        />
                      )}
                    </div>

                    <div className="pb-4">
                      <div
                        className={`text-sm ${
                          done ? "font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {STEP_LABEL[step]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tl?.at ?? "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <div
            className="rounded-xl border bg-card p-6"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <div className="text-xs text-muted-foreground">
              Total Pembayaran
            </div>
            <div className="mt-1 text-3xl font-semibold">
              {s.total ? formatRp(s.total) : "—"}
            </div>

            <div className="mt-4 pt-4 border-t text-sm space-y-2">
              <Row k="Volume estimasi" v={`${s.volumeEstimasi} L`} />
              <Row
                k="Volume aktual"
                v={s.volumeAktual ? `${s.volumeAktual} L` : "—"}
              />
              <Row
                k="Harga/liter"
                v={s.hargaPerLiter ? formatRp(s.hargaPerLiter) : "—"}
              />
              <Row k="Grade" v={s.grade ?? "—"} />
              <Row k="Batch" v={s.batchId ?? "—"} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="text-xs font-medium mb-2">Lokasi & Catatan</div>
            <div className="text-sm">{s.lokasi}</div>
            {s.catatan && (
              <div className="text-xs text-muted-foreground mt-2">
                {s.catatan}
              </div>
            )}
          </div>
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