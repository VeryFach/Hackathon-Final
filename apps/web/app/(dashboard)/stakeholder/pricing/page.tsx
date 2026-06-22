"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, AlertCircle } from "lucide-react";

import { AppShell, formatRp } from "@/components/app-shell";
// import { api } from "@/lib/api"; // Uncomment jika sudah menggunakan Axios

// --- Tipe Data ---
type PricingConfig = {
  base: number;
  mA: number;
  mB: number;
  mC: number;
  bonus: number;
};

// --- FUNGSI FETCHER & MUTATION API ---
const fetchPricingConfig = async (): Promise<PricingConfig> => {
  // const response = await api.get("/stakeholder/pricing-config");
  // return response.data;
  
  await new Promise((resolve) => setTimeout(resolve, 600)); // Simulasi network
  return { base: 6200, mA: 1.1, mB: 1.0, mC: 0.85, bonus: 200 };
};

const updatePricingConfig = async (data: PricingConfig) => {
  // const response = await api.put("/stakeholder/pricing-config", data);
  // return response.data;
  
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulasi network
  return { success: true };
};

export default function PricingControlPage() {
  const queryClient = useQueryClient();

  // --- STATE LOKAL (Untuk Form) ---
  const [base, setBase] = useState(0);
  const [mA, setMA] = useState(0);
  const [mB, setMB] = useState(0);
  const [mC, setMC] = useState(0);
  const [bonus, setBonus] = useState(0);

  // 1. Fetch Data dari Server
  const { data, isLoading, isError } = useQuery({
    queryKey: ["stakeholder-pricing"],
    queryFn: fetchPricingConfig,
  });

  // 2. Sinkronisasi data server ke state lokal saat pertama kali dimuat
  useEffect(() => {
    if (data) {
      setBase(data.base);
      setMA(data.mA);
      setMB(data.mB);
      setMC(data.mC);
      setBonus(data.bonus);
    }
  }, [data]);

  // 3. Mutation untuk Simpan Data
  const { mutate, isPending } = useMutation({
    mutationFn: updatePricingConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-pricing"] });
      alert("Pengaturan harga berhasil disimpan!");
    },
    onError: () => {
      alert("Gagal menyimpan pengaturan harga. Silakan coba lagi.");
    },
  });

  const handleSave = () => {
    mutate({ base, mA, mB, mC, bonus });
  };

  // --- TAMPILAN LOADING / ERROR ---
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

  // --- TAMPILAN UTAMA ---
  return (
    <AppShell title="Pricing Control" subtitle="Atur harga dasar dan multiplier grade.">
      {/* RESPONSIF GRID: 1 kolom penuh di HP, 3 kolom (2 kiri : 1 kanan) di Desktop (lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative items-start">
        
        {/* KOLOM KIRI (Form Input) */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-4 sm:p-6 space-y-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <Field label="Harga Dasar (Rp/Liter)" value={base} onChange={setBase} step={100} />
          
          {/* RESPONSIF INPUT: Menumpuk di HP, 3 kolom sejajar di atas ukuran layar small (sm) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Multiplier Grade A" value={mA} onChange={setMA} step={0.05} float />
            <Field label="Multiplier Grade B" value={mB} onChange={setMB} step={0.05} float />
            <Field label="Multiplier Grade C" value={mC} onChange={setMC} step={0.05} float />
          </div>
          
          <Field label="Bonus per Liter (Volume > 50L)" value={bonus} onChange={setBonus} step={50} />

          <div>
            <label className="text-sm font-medium">Lokasi Penerimaan</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Semarang"].map((c) => (
                <span key={c} className="text-xs px-3 py-1.5 sm:py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-primary-foreground flex justify-center items-center gap-2 transition-opacity disabled:opacity-50 mt-4"
            style={{ background: "var(--gradient-warm)" }}
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} /> Simpan Perubahan
              </>
            )}
          </button>
        </div>

        {/* KOLOM KANAN (Preview Panel) - Sticky di Desktop */}
        <div className="rounded-xl border bg-card p-4 sm:p-6 h-fit lg:sticky lg:top-6 order-first lg:order-none" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="font-semibold mb-4 text-sm sm:text-base">Preview Harga</div>
          <div className="space-y-3">
            {[{ g: "A", m: mA }, { g: "B", m: mB }, { g: "C", m: mC }].map((r) => (
              <div key={r.g} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="inline-flex size-7 items-center justify-center rounded-md bg-accent/10 text-accent text-sm font-semibold">
                  {r.g}
                </span>
                <span className="font-medium">
                  {/* Fallback ke 0 jika hasil perkalian NaN (karena input kosong) */}
                  {formatRp(Math.round((base || 0) * (r.m || 0)))}/L
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground leading-relaxed">
            + <span className="font-medium text-foreground">{formatRp(bonus || 0)}/L</span> untuk volume {`>`} 50L
          </div>
        </div>
        
      </div>
    </AppShell>
  );
}

// --- Komponen Field ---
function Field({ 
  label, 
  value, 
  onChange, 
  step = 1, 
  float = false 
}: { 
  label: string; 
  value: number; 
  onChange: (n: number) => void; 
  step?: number; 
  float?: boolean 
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type="number"
        value={Number.isNaN(value) ? "" : value} // Menghindari tampilan "NaN" jika input dihapus kosong
        step={step}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") {
            onChange(0); // Fallback ke 0 jika user menghapus semua angka
            return;
          }
          onChange(float ? parseFloat(val) : parseInt(val, 10));
        }}
        className="mt-2 w-full px-3 py-2.5 sm:py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
      />
    </div>
  );
}