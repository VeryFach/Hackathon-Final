"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Mengganti useNavigate dari React Router
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Loader2, AlertCircle } from "lucide-react";

import { AppShell, formatRp } from "@/components/app-shell";
// Mock data untuk fetcher sementara
import { inventory as mockInventory } from "@/lib/mock-data";
// import { api } from "@/lib/api"; // Uncomment ini jika sudah siap pakai Axios

// --- Tipe Data (Sebaiknya ditaruh di file types terpisah nantinya) ---
type InventoryItem = {
  id: string;
  status: string;
  source: string;
  liter: number;
  masuk: string;
};

// --- FUNGSI FETCHER REACT QUERY ---
const fetchAvailableInventory = async (): Promise<InventoryItem[]> => {
  // --- CONTOH JIKA MENGGUNAKAN API ASLI ---
  // const response = await api.get("/pengepul/inventory/available");
  // return response.data;

  // --- MENGGUNAKAN MOCK DATA ---
  await new Promise((resolve) => setTimeout(resolve, 600)); // Simulasi delay
  return mockInventory.filter(
    (i: any) => i.status === "ready" || i.status === "stored",
  );
};

// --- FUNGSI MUTATION REACT QUERY ---
const submitBatch = async (data: {
  selectedIds: string[];
  totalLiter: number;
}) => {
  // --- CONTOH JIKA MENGGUNAKAN API ASLI ---
  // const response = await api.post("/pengepul/batches", data);
  // return response.data;

  // --- MENGGUNAKAN MOCK DATA ---
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulasi proses submit
  return { success: true, message: "Batch berhasil dibuat" };
};

export default function NewBatchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Fetching data inventory dengan React Query
  const {
    data: available = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["available-inventory"],
    queryFn: fetchAvailableInventory,
  });

  // 2. State untuk menyimpan item yang dipilih (Set)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 3. Efek untuk men-set default pilihan ke item yang "ready" setelah data berhasil di-fetch
  useEffect(() => {
    if (available.length > 0 && selected.size === 0) {
      const defaultReady = available
        .filter((a) => a.status === "ready")
        .map((a) => a.id);
      setSelected(new Set(defaultReady));
    }
  }, [available]); // Hanya run saat 'available' berubah (ter-fetch)

  // 4. Mutation untuk Submit Form
  const { mutate, isPending: isSubmitting } = useMutation({
    mutationFn: submitBatch,
    onSuccess: () => {
      // Invalidate query agar data refresh saat kembali ke halaman sebelumnya
      queryClient.invalidateQueries({ queryKey: ["pengepul-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["available-inventory"] });
      // Redirect ke halaman batches
      router.push("/pengepul/batches");
    },
    onError: (error) => {
      console.error("Gagal submit batch:", error);
      alert("Terjadi kesalahan saat submit batch.");
    },
  });

  // --- LOGIKA PERHITUNGAN ---
  const toggle = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSelected(n);
  };

  const picked = available.filter((a) => selected.has(a.id));
  const totalLiter = picked.reduce((s, x) => s + x.liter, 0);
  const value = totalLiter * 6500;

  // --- HANDLER SUBMIT ---
  const handleSubmit = () => {
    if (picked.length === 0) return;

    // Konversi Set ke Array untuk payload API
    const selectedIds = Array.from(selected);
    mutate({ selectedIds, totalLiter });
  };

  // --- TAMPILAN LOADING / ERROR UTAMA ---
  if (isLoading) {
    return (
      <AppShell
        title="Buat Batch Baru"
        subtitle="Gabungkan setoran ke batch untuk dikirim ke stakeholder."
      >
        <div className="flex justify-center items-center py-20 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" /> Memuat data setoran...
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell
        title="Buat Batch Baru"
        subtitle="Gabungkan setoran ke batch untuk dikirim ke stakeholder."
      >
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} /> Gagal memuat data. Silakan coba lagi.
        </div>
      </AppShell>
    );
  }

  // --- TAMPILAN UTAMA ---
  return (
    <AppShell
      title="Buat Batch Baru"
      subtitle="Gabungkan setoran ke batch untuk dikirim ke stakeholder."
    >
      {/* RESPONSIF GRID: 
        1 kolom di HP (grid-cols-1) 
        3 kolom (2 Kiri : 1 Kanan) di Desktop (lg:grid-cols-3) 
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative items-start">
        {/* KOLOM KIRI: Daftar Setoran (Ambil 2 kolom di Desktop) */}
        <div
          className="lg:col-span-2 rounded-xl border bg-card p-4 sm:p-6"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="font-semibold mb-4 text-sm sm:text-base">
            Pilih setoran untuk digabung
          </div>

          {available.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
              Tidak ada setoran yang tersedia.
            </div>
          ) : (
            <div className="space-y-2">
              {available.map((i) => (
                <label
                  key={i.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selected.has(i.id)
                      ? "border-accent bg-accent/5"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                      type="checkbox"
                      checked={selected.has(i.id)}
                      onChange={() => toggle(i.id)}
                      className="accent-[oklch(0.65_0.14_40)] mt-1 sm:mt-0"
                    />
                    {/* Responsif untuk layar super kecil: ID tampil di atas */}
                    <div className="font-medium text-sm sm:hidden">{i.id}</div>
                  </div>

                  {/* Grid untuk detail:
                    HP: Stack vertikal, Text lebih kecil
                    Desktop: Sejajar ke kanan (grid-cols-4)
                  */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm w-full ml-7 sm:ml-0">
                    <div className="font-medium hidden sm:block">{i.id}</div>
                    <div className="text-muted-foreground text-xs sm:text-sm">
                      {i.source}
                    </div>
                    <div className="font-semibold sm:font-normal">
                      {i.liter} L
                    </div>
                    <div className="text-muted-foreground text-xs sm:text-sm">
                      {i.masuk}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* KOLOM KANAN: Ringkasan (Sticky di Desktop) */}
        <div
          className="rounded-xl border bg-card p-4 sm:p-6 h-fit sticky top-4 sm:top-6"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="size-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-sage)" }}
            >
              <Layers className="size-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Batch baru</div>
              <div className="font-semibold text-sm sm:text-base">BTC-126</div>
            </div>
          </div>

          <div className="space-y-3 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Setoran dipilih</span>
              <span className="font-medium">{picked.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total liter</span>
              <span className="font-medium">{totalLiter.toFixed(1)} L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimasi nilai</span>
              <span className="font-medium text-accent">{formatRp(value)}</span>
            </div>
          </div>

          <button
            disabled={picked.length === 0 || isSubmitting}
            onClick={handleSubmit}
            className="mt-6 w-full py-2.5 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50 flex justify-center items-center gap-2 transition-opacity"
            style={{ background: "var(--gradient-warm)" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Memproses...
              </>
            ) : (
              "Submit ke Stakeholder"
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
