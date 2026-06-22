// apps/web/app/(dashboard)/stakeholder/pricing/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, AlertCircle, RotateCcw, Info } from "lucide-react";

import { AppShell, formatRp } from "@/components/app-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// --- Tipe Data ---
type PricingConfig = {
  base: number;
  mA: number;
  mB: number;
  mC: number;
  bonus: number;
  updatedAt?: string;
  updatedBy?: string;
};

// --- API Functions (mock) ---
const fetchPricingConfig = async (): Promise<PricingConfig> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { base: 6200, mA: 1.1, mB: 1.0, mC: 0.85, bonus: 200, updatedAt: "2025-01-15 10:30", updatedBy: "Admin" };
};

const updatePricingConfig = async (data: PricingConfig) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
};

// --- Validasi ---
const validate = (values: PricingConfig) => {
  const errors: Record<string, string> = {};
  if (values.base < 1000) errors.base = "Harga dasar minimal Rp 1.000";
  if (values.mA < 0.5 || values.mA > 2.0) errors.mA = "Multiplier harus antara 0.5 dan 2.0";
  if (values.mB < 0.5 || values.mB > 2.0) errors.mB = "Multiplier harus antara 0.5 dan 2.0";
  if (values.mC < 0.5 || values.mC > 2.0) errors.mC = "Multiplier harus antara 0.5 dan 2.0";
  if (values.bonus < 0) errors.bonus = "Bonus tidak boleh negatif";
  return errors;
};

export default function PricingControlPage() {
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<PricingConfig>({ base: 0, mA: 0, mB: 0, mC: 0, bonus: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<PricingConfig | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["stakeholder-pricing"],
    queryFn: fetchPricingConfig,
  });

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  const { mutate, isPending } = useMutation({
    mutationFn: updatePricingConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-pricing"] });
      alert("Pengaturan harga berhasil disimpan!");
      setConfirmDialogOpen(false);
    },
    onError: () => {
      alert("Gagal menyimpan pengaturan harga.");
      setConfirmDialogOpen(false);
    },
  });

  const handleChange = <K extends keyof PricingConfig>(key: K, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSave = () => {
    const validationErrors = validate(config);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setPendingSave(config);
    setConfirmDialogOpen(true);
  };

  const confirmSave = () => {
    if (pendingSave) mutate(pendingSave);
  };

  const handleReset = () => {
    if (data) {
      setConfig(data);
      setErrors({});
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Pricing Control" subtitle="Atur harga dasar dan multiplier grade.">
        <div className="flex justify-center items-center py-20 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" /> Memuat pengaturan harga...
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Pricing Control" subtitle="Atur harga dasar dan multiplier grade.">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} /> Gagal memuat pengaturan. Silakan coba lagi.
        </div>
      </AppShell>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <AppShell title="Pricing Control" subtitle="Atur harga dasar dan multiplier grade.">
      {/* Info versi & Reset */}
      <div className="flex flex-wrap justify-between items-center mb-4 text-xs text-muted-foreground gap-2">
        <span>
          {data?.updatedAt && (
            <>Terakhir diperbarui: {data.updatedAt} {data.updatedBy && `oleh ${data.updatedBy}`}</>
          )}
        </span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <RotateCcw size={14} /> Reset ke default
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative items-start">
        {/* Form (kiri) */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-4 sm:p-6 space-y-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <Field
            label="Harga Dasar (Rp/Liter)"
            value={config.base}
            onChange={(v) => handleChange("base", v)}
            step={100}
            error={errors.base}
            tooltip="Harga patokan sebelum dikalikan multiplier grade"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="Multiplier Grade A"
              value={config.mA}
              onChange={(v) => handleChange("mA", v)}
              step={0.05}
              float
              error={errors.mA}
              tooltip="Faktor pengali untuk grade A (contoh: 1.1 = 10% di atas harga dasar)"
            />
            <Field
              label="Multiplier Grade B"
              value={config.mB}
              onChange={(v) => handleChange("mB", v)}
              step={0.05}
              float
              error={errors.mB}
              tooltip="Faktor pengali untuk grade B"
            />
            <Field
              label="Multiplier Grade C"
              value={config.mC}
              onChange={(v) => handleChange("mC", v)}
              step={0.05}
              float
              error={errors.mC}
              tooltip="Faktor pengali untuk grade C"
            />
          </div>

          <Field
            label="Bonus per Liter (Volume > 50L)"
            value={config.bonus}
            onChange={(v) => handleChange("bonus", v)}
            step={50}
            error={errors.bonus}
            tooltip="Tambahan harga per liter jika volume batch melebihi 50 liter"
          />

          <div>
            <label className="text-sm font-medium">Lokasi Penerimaan</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Semarang"].map((c) => (
                <span key={c} className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-primary-foreground flex justify-center items-center gap-2 transition-opacity disabled:opacity-50 mt-4"
            style={{ background: hasErrors ? "var(--muted)" : "var(--gradient-warm)" }}
          >
            {isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
            ) : (
              <><Save size={16} /> Simpan Perubahan</>
            )}
          </button>
        </div>

        {/* Preview (kanan) */}
        <div className="rounded-xl border bg-card p-4 sm:p-6 h-fit lg:sticky lg:top-6 order-first lg:order-none" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="font-semibold mb-4 text-sm flex items-center gap-2">
            Preview Harga
            <span title="Harga per grade = harga dasar × multiplier + bonus (jika volume >50L)">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </span>
          </div>
          <div className="space-y-3">
            {[
              { grade: "A", mult: config.mA },
              { grade: "B", mult: config.mB },
              { grade: "C", mult: config.mC },
            ].map(({ grade, mult }) => {
              const basePrice = Math.round((config.base || 0) * (mult || 0));
              return (
                <div key={grade} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="inline-flex size-7 items-center justify-center rounded-md bg-accent/10 text-accent text-sm font-semibold">
                    {grade}
                  </span>
                  <div className="text-right">
                    <span className="font-medium">{formatRp(basePrice)}/L</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({((mult || 0) * 100).toFixed(0)}% dari base)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground leading-relaxed flex justify-between">
            <span>Bonus volume &gt;50L</span>
            <span className="font-medium text-foreground">{formatRp(config.bonus || 0)}/L</span>
          </div>
          {/* Contoh perhitungan */}
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
            <div className="flex justify-between">
              <span>Contoh: Grade A, 100L</span>
              <span className="font-medium text-foreground">
                {formatRp(Math.round(((config.base || 0) * (config.mA || 0) + (config.bonus || 0)) * 100))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Konfirmasi */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Perubahan</DialogTitle>
            <DialogDescription>
              Perubahan akan langsung berlaku untuk semua transaksi baru.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Harga Dasar:</span>
            <span className="font-mono">{formatRp(pendingSave?.base || 0)}</span>
            <span className="text-muted-foreground">Grade A:</span>
            <span className="font-mono">x{pendingSave?.mA || 0}</span>
            <span className="text-muted-foreground">Grade B:</span>
            <span className="font-mono">x{pendingSave?.mB || 0}</span>
            <span className="text-muted-foreground">Grade C:</span>
            <span className="font-mono">x{pendingSave?.mC || 0}</span>
            <span className="text-muted-foreground">Bonus:</span>
            <span className="font-mono">{formatRp(pendingSave?.bonus || 0)}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={confirmSave} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

// --- Komponen Field dengan error & tooltip (menggunakan title) ---
function Field({
  label,
  value,
  onChange,
  step = 1,
  float = false,
  error,
  tooltip,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  float?: boolean;
  error?: string;
  tooltip?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <label className="text-sm font-medium">{label}</label>
        {tooltip && (
          <span title={tooltip} className="text-muted-foreground cursor-help">
            <Info className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <input
        type="number"
        value={Number.isNaN(value) ? "" : value}
        step={step}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") { onChange(0); return; }
          onChange(float ? parseFloat(val) : parseInt(val, 10));
        }}
        className={`mt-2 w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
          error ? "border-red-500 focus:ring-red-500" : ""
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}