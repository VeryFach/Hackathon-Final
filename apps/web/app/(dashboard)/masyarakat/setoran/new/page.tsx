"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, MapPin, Droplets, ArrowLeft } from "lucide-react";
import { AppShell, formatRp } from "@/components/app-shell";
import { useCreateSubmission } from "@/lib/api/hooks";
import type { CreateSubmissionDto } from "@/lib/api";

export default function NewSetoran() {
  const [volume, setVolume] = useState(5);
  const [lokasi, setLokasi] = useState("");
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");
  
  const router = useRouter();
  const createMutation = useCreateSubmission();
  
  const hargaEstimasi = volume * 6200;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data: CreateSubmissionDto = {
        estimatedLiter: volume,
        latitude: "-6.2088",
        longitude: "106.8456",
        address: lokasi,
        notes: catatan,
      };

      await createMutation.mutateAsync(data);
      
      router.push("/masyarakat/setoran");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal membuat setoran.");
    }
  };

  return (
    <AppShell 
      title="Ajukan Setoran" 
      subtitle="Isi detail minyak jelantah yang ingin kamu setor."
    >
      <Link 
        href="/" 
        className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-3" /> Kembali
      </Link>

      <div className="grid grid-cols-3 gap-6">
        <form
          className="col-span-2 space-y-5 rounded-xl border bg-card p-6"
          style={{ boxShadow: "var(--shadow-soft)" }}
          onSubmit={handleSubmit}
        >
          <div>
            <label className="text-sm font-medium">Estimasi Volume</label>
            <div className="mt-2 flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={30}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-[oklch(0.65_0.14_40)]"
              />
              <div className="w-24 text-right">
                <span className="text-2xl font-semibold">{volume}</span>
                <span className="text-sm text-muted-foreground ml-1">L</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Lokasi Pickup</label>
            <input
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="cth. Jl. Kemang Raya 12"
              className="mt-2 w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Foto Minyak (opsional)</label>
            <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground hover:bg-muted/40 cursor-pointer">
              <Camera className="size-6 mx-auto mb-2" />
              Klik untuk upload foto
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Catatan (opsional)</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Catatan untuk pengepul..."
              className="mt-2 w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-3 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50"
            style={{ background: "var(--gradient-warm)" }}
          >
            {createMutation.isPending ? "Memproses..." : "Kirim Permintaan Setoran"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div className="text-xs text-muted-foreground">Estimasi pendapatan</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">
              {formatRp(hargaEstimasi)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Berdasarkan harga dasar Rp 6.200/L
            </div>
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume</span>
                <span>{volume} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pengepul</span>
                <span>Akan diassign otomatis</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade estimasi</span>
                <span>B</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="text-xs font-medium mb-3 flex items-center gap-2">
              <Droplets className="size-4 text-accent" /> Tips
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• Saring minyak sebelum disetor</li>
              <li>• Gunakan wadah plastik tertutup</li>
              <li>• Grade A = jernih, FFA &lt; 2%</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}