"use client";

import { use } from "react";
import Link from "next/link";
import { AppShell, StatusBadge, formatRp } from "@/components/app-shell";
import { useSubmission } from "@/lib/api/hooks";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";

export default function SetoranDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: submission, isLoading, error } = useSubmission(id);

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

  const s = submission as any;

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

                      {i < statusSteps.length - 1 && (
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
                        {statusLabels[step]}
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
              {s.payout?.amount ? formatRp(s.payout.amount) : "—"}
            </div>

            <div className="mt-4 pt-4 border-t text-sm space-y-2">
              <Row k="Volume estimasi" v={`${s.estimatedLiter} L`} />
              <Row
                k="Volume aktual"
                v={s.actualLiter ? `${s.actualLiter} L` : "—"}
              />
              <Row
                k="Grade"
                v={s.labResult?.grade ?? "—"}
              />
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