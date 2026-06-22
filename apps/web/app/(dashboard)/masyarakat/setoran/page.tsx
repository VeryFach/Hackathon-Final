"use client"
import Link from "next/link";
import { AppShell, StatusBadge, formatRp } from "@/components/app-shell";
import { setoranList } from "@/lib/mock-data";
import { ArrowRight, Plus } from "lucide-react";

export default function SetoranPage() {
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
      <div className="space-y-3">
        {[...setoranList].reverse().map((s) => (
          <div
            key={s.id}
            className="rounded-xl border bg-card p-4 sm:p-5"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              
              {/* Data grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 flex-1">
                <div>
                  <div className="text-xs text-muted-foreground">ID</div>
                  <div className="font-medium text-sm">{s.id}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Volume</div>
                  <div className="font-medium text-sm">
                    {(s.volumeAktual ?? s.volumeEstimasi)} L
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Pengepul</div>
                  <div className="font-medium text-sm">{s.pengepul}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Grade</div>
                  <div className="font-medium text-sm">
                    {s.grade ? (
                      <span className="inline-flex size-6 items-center justify-center rounded-md bg-accent/10 text-accent text-xs font-semibold">
                        {s.grade}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-medium text-sm">
                    {s.total ? formatRp(s.total) : <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
              </div>

              {/* Actions */}
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
    </AppShell>
  );
}