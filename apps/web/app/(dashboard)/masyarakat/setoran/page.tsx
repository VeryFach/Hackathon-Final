"use client"
import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell, StatusBadge, formatRp } from "@/components/app-shell";
import { useSubmissions } from "@/lib/api/hooks";
import { ArrowRight, Plus } from "lucide-react";

export default function SetoranPage() {
  const { data: submissions = [], isLoading, error } = useSubmissions();

  if (isLoading) {
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

  if (error) {
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
      {submissions.length === 0 ? (
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
          {[...submissions].reverse().map((s: any) => (
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
      )}
    </AppShell>
  );
}