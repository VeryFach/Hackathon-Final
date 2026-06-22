"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Loader2, Navigation, MapPin, ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

// Helper: Haversine formula
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

// Fungsi format Rupiah
function formatRp(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

// Data dummy default (dengan harga)
const DEFAULT_COLLECTORS = [
  { id: "1", nama: "Pengepul A", latitude: -6.2, longitude: 106.8, address: "Jl. Kemang Raya", pricePerLiter: 6500 },
  { id: "2", nama: "Pengepul B", latitude: -6.25, longitude: 106.85, address: "Jl. Sudirman", pricePerLiter: 6200 },
  { id: "3", nama: "Pengepul C", latitude: -6.15, longitude: 106.9, address: "Jl. Gatot Subroto", pricePerLiter: 6800 },
  { id: "4", nama: "Pengepul D", latitude: -6.18, longitude: 106.75, address: "Jl. Pajajaran", pricePerLiter: 5900 },
  { id: "5", nama: "Pengepul E", latitude: -6.3, longitude: 106.8, address: "Jl. Merdeka", pricePerLiter: 6400 },
];

export default function CariPengepulTerdekat() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [usingDummy, setUsingDummy] = useState(false);

  // Ambil daftar pengepul (dengan fallback dummy)
  const fetchCollectors = async () => {
    try {
      const res = await axios.get(`${API_URL}/collectors`);
      const data = res.data || [];
      // Pastikan setiap collector punya pricePerLiter (default 6200 jika tidak ada)
      const enriched = data.map((c: any) => ({
        ...c,
        pricePerLiter: c.pricePerLiter || 6200, // default
      }));
      setCollectors(enriched);
      setUsingDummy(false);
    } catch (err) {
      console.error("Gagal ambil pengepul, pakai dummy:", err);
      setCollectors(DEFAULT_COLLECTORS);
      setUsingDummy(true);
    }
  };

  // Dapatkan lokasi pengguna
  const getLocation = () => {
    setIsLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Browser Anda tidak mendukung geolokasi.");
      setIsLocating(false);
      setLoading(false);
      setUserLocation({ lat: -6.2088, lng: 106.8456 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        setLoading(false);
      },
      (err) => {
        setError("Gagal mendapatkan lokasi: " + err.message);
        setIsLocating(false);
        setLoading(false);
        setUserLocation({ lat: -6.2088, lng: 106.8456 });
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchCollectors();
      getLocation();
    };
    loadData();
  }, []);

  // Refresh data
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchCollectors().then(() => {
      getLocation();
      setLoading(false);
    });
  };

  // Hitung jarak & urutkan
  const collectorsWithDistance = userLocation
    ? collectors
        .map((c) => ({
          ...c,
          distance: getDistance(userLocation.lat, userLocation.lng, c.latitude, c.longitude),
        }))
        .sort((a, b) => (a.distance || 999) - (b.distance || 999))
    : [];

  const nearestCollector = collectorsWithDistance[0];

  if (loading) {
    return (
      <AppShell title="Cari Pengepul Terdekat" subtitle="Memuat peta...">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Memuat peta...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Cari Pengepul Terdekat"
      subtitle="Temukan pengepul minyak jelantah di sekitarmu"
    >
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/masyarakat"
          className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Kembali ke dashboard
        </Link>
        <button
          onClick={handleRefresh}
          className="text-xs text-accent hover:underline inline-flex items-center gap-1"
        >
          <RefreshCw className="size-3" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {usingDummy && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Mode dummy: menampilkan data contoh (API tidak tersedia).</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peta */}
        <div className="lg:col-span-2 h-[500px] rounded-xl overflow-hidden border">
          <Map
            collectors={collectors.map((c) => ({
              latitude: c.latitude,
              longitude: c.longitude,
              nama: c.nama || c.fullName || c.name || "Pengepul",
              id: c.id,
              pricePerLiter: c.pricePerLiter || 6200, // pastikan ada
            }))}
            userLocation={userLocation}
            showRadius={true}
            radius={1}
            showDepositors={false}
            showRecommendations={false}
          />
        </div>

        {/* Daftar pengepul terdekat */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-sm">📍 Pengepul Terdekat</div>
              {isLocating && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {collectorsWithDistance.length === 0 ? (
              <div className="text-sm text-muted-foreground">Tidak ada pengepul terdaftar.</div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {collectorsWithDistance.map((c, idx) => {
                  const harga = c.pricePerLiter ? formatRp(c.pricePerLiter) : "—";
                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg border transition ${
                        idx === 0 ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm flex items-center gap-2">
                            {idx === 0 && (
                              <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Terdekat</span>
                            )}
                            {c.nama || c.fullName || c.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {c.address || "Alamat tidak tersedia"}
                          </div>
                          {/* <div className="text-xs font-medium text-accent mt-1">
                            💰 Harga beli: {harga}/L
                          </div> */}
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <div className="text-sm font-semibold text-primary whitespace-nowrap">
                            {c.distance !== undefined ? `${c.distance.toFixed(1)} km` : "—"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {harga}/L
                          </div>
                        </div>
                      </div>

                      {userLocation && (
                        <a
                          href={`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${c.latitude},${c.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          <MapPin className="h-3 w-3" /> Petunjuk arah
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info tambahan: pengepul terdekat */}
          {nearestCollector && userLocation && (
            <div className="rounded-xl border bg-card p-4" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="text-xs text-muted-foreground">Pengepul terdekat</div>
              <div className="font-semibold mt-1">{nearestCollector.nama || nearestCollector.fullName}</div>
              <div className="text-sm text-muted-foreground">
                Jarak {nearestCollector.distance?.toFixed(1)} km
              </div>
              <div className="text-sm text-accent font-medium mt-1">
                Harga beli: {nearestCollector.pricePerLiter ? formatRp(nearestCollector.pricePerLiter) : "—"}/L
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Estimasi waktu tempuh: ~{Math.round((nearestCollector.distance || 0) / 20 * 60)} menit
              </div>
              <div className="mt-3">
                <a
                  href={`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${nearestCollector.latitude},${nearestCollector.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                >
                  <Navigation className="h-4 w-4" /> Navigasi ke sini
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}