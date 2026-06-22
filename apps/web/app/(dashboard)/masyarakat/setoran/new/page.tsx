// apps/web/app/(dashboard)/masyarakat/setoran/new/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import axios from "axios";
import { Camera, Droplets, ArrowLeft, Loader2, MapPin, Check, Navigation, AlertCircle } from "lucide-react";
import { AppShell, formatRp } from "@/components/app-shell";
import { useCreateSubmission } from "@/lib/api/hooks";
import type { CreateSubmissionDto } from "@/lib/api";

// Import Map secara dinamis (karena Leaflet butuh window)
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

// --- Helper: Haversine formula ---
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Data dummy untuk bypass ---
const DUMMY_COLLECTORS = [
  { id: "col-1", nama: "Pengepul A", latitude: -6.2088, longitude: 106.8456, address: "Jl. Kemang Raya 12", pricePerLiter: 6500 },
  { id: "col-2", nama: "Pengepul B", latitude: -6.2150, longitude: 106.8500, address: "Jl. Sudirman 5", pricePerLiter: 6200 },
  { id: "col-3", nama: "Pengepul C", latitude: -6.2000, longitude: 106.8400, address: "Jl. Gatot Subroto 8", pricePerLiter: 6800 },
];

// --- Cek mode dummy ---
const isDummyMode = () => {
  if (typeof window === "undefined") return false;
  const urlParams = new URLSearchParams(window.location.search);
  const envDummy = process.env.NEXT_PUBLIC_USE_DUMMY === "true";
  const queryDummy = urlParams.get("dummy") === "true";
  return envDummy || queryDummy;
};

export default function NewSetoran() {
  const router = useRouter();
  const createMutation = useCreateSubmission();

  // --- State form ---
  const [volume, setVolume] = useState<number>(5);
  const [lokasi, setLokasi] = useState("");
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState("");

  // --- State pengepul & lokasi pengguna ---
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [loadingCollectors, setLoadingCollectors] = useState(true);
  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isDummy, setIsDummy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Deteksi dummy & ambil data ---
  useEffect(() => {
    const dummy = isDummyMode();
    setIsDummy(dummy);

    const fetchCollectors = async () => {
      try {
        if (dummy) {
          setCollectors(DUMMY_COLLECTORS);
          setLoadingCollectors(false);
          return;
        }
        const res = await axios.get(`${API_URL}/collectors`);
        setCollectors(res.data || []);
      } catch {
        if (!dummy) {
          setCollectors(DUMMY_COLLECTORS);
        }
      } finally {
        setLoadingCollectors(false);
      }
    };

    const getLocation = () => {
      if (!navigator.geolocation) {
        setUserLocation({ lat: -6.2088, lng: 106.8456 });
        return;
      }
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => {
          setUserLocation({ lat: -6.2088, lng: 106.8456 });
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    };

    fetchCollectors();
    getLocation();
  }, []);

  // --- Hitung jarak & urutkan pengepul ---
  const collectorsWithDistance = useMemo(() => {
    if (!userLocation) return collectors.map(c => ({ ...c, distance: Infinity }));
    return collectors
      .map((c) => ({
        ...c,
        distance: getDistance(userLocation.lat, userLocation.lng, c.latitude, c.longitude),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [collectors, userLocation]);

  const selectedCollector = collectorsWithDistance.find(c => c.id === selectedCollectorId);

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validasi wajib pilih pengepul
    if (!selectedCollectorId) {
      setError("Silakan pilih pengepul terlebih dahulu.");
      return;
    }

    if (!lokasi.trim()) {
      setError("Lokasi pickup harus diisi.");
      return;
    }

    if (volume < 1) {
      setError("Volume minimal 1 liter.");
      return;
    }

    // --- Mode dummy ---
    if (isDummy) {
      setSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      setSubmitting(false);
      router.push("/masyarakat/setoran");
      router.refresh();
      return;
    }

    try {
      const data: CreateSubmissionDto = {
        estimatedLiter: volume,
        latitude: userLocation ? String(userLocation.lat) : "-6.2088",
        longitude: userLocation ? String(userLocation.lng) : "106.8456",
        address: lokasi,
        notes: catatan || undefined,
        collectorId: selectedCollectorId,
      };

      await createMutation.mutateAsync(data);
      router.push("/masyarakat/setoran");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal membuat setoran.");
    }
  };

  // --- Loading awal ---
  if (loadingCollectors) {
    return (
      <AppShell title="Ajukan Setoran" subtitle="Memuat data pengepul...">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Memuat data pengepul...</span>
        </div>
      </AppShell>
    );
  }

  const hargaEstimasi = volume * (selectedCollector?.pricePerLiter || 6200);
  const isSubmitting = createMutation.isPending || submitting;

  return (
    <AppShell
      title="Ajukan Setoran"
      subtitle="Isi detail minyak jelantah yang ingin kamu setor."
    >
      {/* Banner dummy */}
      {isDummy && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Mode Dummy</strong> — API tidak dipanggil. Data hanya simulasi.
            <span className="block text-xs text-amber-600 mt-0.5">
              Untuk menonaktifkan, hapus parameter <code className="bg-amber-100 px-1 rounded">?dummy=true</code> dari URL.
            </span>
          </span>
        </div>
      )}

      <Link
        href="/masyarakat/setoran"
        className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-3" /> Kembali
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- FORM (kiri) --- */}
        <form
          className="lg:col-span-2 space-y-5 rounded-xl border bg-card p-6"
          style={{ boxShadow: "var(--shadow-soft)" }}
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Volume */}
          <div>
            <label className="text-sm font-medium">Estimasi Volume (L)</label>
            <div className="mt-2 flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={30}
                step={0.5}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-[oklch(0.65_0.14_40)]"
              />
              <div className="w-28 flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={0.5}
                  value={volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 30) {
                      setVolume(val);
                    }
                  }}
                  className="w-20 px-2 py-1.5 rounded-lg border bg-background text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-sm text-muted-foreground">L</span>
              </div>
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="text-sm font-medium">Lokasi Pickup</label>
            <input
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="cth. Jl. Kemang Raya 12"
              required
              className="mt-2 w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Foto */}
          <div>
            <label className="text-sm font-medium">Foto Minyak (opsional)</label>
            <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground hover:bg-muted/40 cursor-pointer">
              <Camera className="size-6 mx-auto mb-2" />
              Klik untuk upload foto
            </div>
          </div>

          {/* Catatan */}
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

          {/* Tombol submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "var(--gradient-warm)" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isDummy ? "Simulasi..." : "Memproses..."}
              </>
            ) : (
              "Kirim Permintaan Setoran"
            )}
          </button>
        </form>

        {/* --- PANEL KANAN --- */}
        <div className="space-y-4">
          {/* Estimasi pendapatan */}
          <div className="rounded-xl border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div className="text-xs text-muted-foreground">Estimasi pendapatan</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">
              {formatRp(hargaEstimasi)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Berdasarkan harga {
                selectedCollector 
                  ? `${selectedCollector.nama} (${formatRp(selectedCollector.pricePerLiter)}/L)`
                  : "dasar Rp 6.200/L"
              }
            </div>
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume</span>
                <span>{volume} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pengepul</span>
                <span className="text-right max-w-[120px] truncate">
                  {selectedCollector ? selectedCollector.nama : "Belum dipilih"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Harga/L</span>
                <span>
                  {selectedCollector ? formatRp(selectedCollector.pricePerLiter) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lokasi</span>
                <span className="text-right max-w-[120px] truncate">{lokasi || "-"}</span>
              </div>
            </div>
            {!selectedCollector && (
              <div className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                ⚠️ Pilih pengepul untuk melihat estimasi pendapatan yang akurat.
              </div>
            )}
          </div>

          {/* Peta + daftar pengepul */}
          <div className="rounded-xl border bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                Pilih Pengepul
              </div>
              {isLocating && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {userLocation && (
              <div className="h-40 rounded-lg overflow-hidden mb-3 border">
                <Map
                  collectors={collectorsWithDistance.map(c => ({
                    latitude: c.latitude,
                    longitude: c.longitude,
                    nama: c.nama,
                    id: c.id,
                  }))}
                  userLocation={userLocation}
                  showRadius={false}
                  showDepositors={false}
                  showRecommendations={false}
                />
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {collectorsWithDistance.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada pengepul terdaftar.</p>
              ) : (
                collectorsWithDistance.map((c, idx) => {
                  const isSelected = selectedCollectorId === c.id;
                  const jarak = c.distance !== undefined ? `${c.distance.toFixed(1)} km` : "—";
                  const harga = c.pricePerLiter ? formatRp(c.pricePerLiter) + "/L" : "—";

                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        isSelected
                          ? "bg-primary/10 border-primary/50 ring-1 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedCollectorId(c.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{c.nama}</span>
                            {isSelected && (
                              <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="size-3" /> Dipilih
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {c.address || "Alamat tidak tersedia"} · {jarak}
                          </div>
                          <div className="text-xs text-accent font-medium mt-0.5">
                            💰 Harga beli: {harga}
                          </div>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <div className="text-sm font-medium text-accent">{harga}</div>
                          <div className="text-xs text-muted-foreground">
                            {idx === 0 && "★ Terdekat"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Link
              href="/masyarakat/pengepul-terdekat"
              className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Navigation className="size-3" /> Lihat semua pengepul di peta
            </Link>
          </div>

          {/* Tips */}
          <div className="rounded-xl border bg-card p-5">
            <div className="text-xs font-medium mb-3 flex items-center gap-2">
              <Droplets className="size-4 text-accent" /> Tips
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• Saring minyak sebelum disetor</li>
              <li>• Gunakan wadah plastik tertutup</li>
              <li>• Grade A = jernih, FFA &lt; 2%</li>
              <li>• Pilih pengepul dengan harga terbaik</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}