"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, MapPin, Package, Save, Trash2, Shield, Mail, Key, Loader2 } from "lucide-react";
import { api } from "@/lib/axios";

// --- 1. API SERVICES ---
export const profileApi = {
  getDepositor: async () => {
    const { data } = await api.get("/profiles/depositor");
    return data;
  },
  updateDepositor: async (payload: any) => {
    const { data } = await api.patch("/profiles/depositor", payload);
    return data;
  },
  getCollector: async () => {
    const { data } = await api.get("/profiles/collector");
    return data;
  },
  updateCollector: async (payload: any) => {
    const { data } = await api.patch("/profiles/collector", payload);
    return data;
  },
  updateBaseUser: async (payload: any) => {
    const { data } = await api.patch("/users/me", payload); 
    return data;
  }
};

// --- 2. TYPES ---
// Disesuaikan dengan enum UserRole di Prisma Schema
type Role = "stakeholder" | "masyarakat" | "pengepul";

interface UserProfileData {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  // Field Profil Masyarakat (Depositor)
  address?: string;
  // Field Profil Pengepul (Collector)
  warehouseAddress?: string;
  serviceRadiusKm?: number;
  capacityLiter?: number;
  // Shared Geospatial
  latitude?: number;
  longitude?: number;
}

// --- 3. MAIN COMPONENT ---
export default function UserProfileManager() {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<UserProfileData>({
    id: "",
    fullName: "",
    email: "",
    role: "masyarakat", // Default role
  });

  // Asumsi role didapat dari state autentikasi (JWT/Zustand)
  const currentUserRole: Role = "pengepul"; 

  // --- REACT QUERY: FETCH DATA ---
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile", currentUserRole],
    queryFn: () => 
      currentUserRole === "masyarakat" 
        ? profileApi.getDepositor() 
        : profileApi.getCollector(),
    enabled: currentUserRole !== "stakeholder", // Stakeholder tidak punya profile tambahan di schema
  });

  useEffect(() => {
    if (profileData) {
      setFormData((prev) => ({
        ...prev,
        ...profileData,
        latitude: profileData.latitude ? parseFloat(profileData.latitude) : undefined,
        longitude: profileData.longitude ? parseFloat(profileData.longitude) : undefined,
      }));
    }
  }, [profileData]);

  // --- REACT QUERY: MUTATIONS ---
  const updateDepositorMutation = useMutation({
    mutationFn: profileApi.updateDepositor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "masyarakat"] });
      alert("Profil Masyarakat berhasil diperbarui!");
    },
  });

  const updateCollectorMutation = useMutation({
    mutationFn: profileApi.updateCollector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "pengepul"] });
      alert("Profil Pengepul berhasil diperbarui!");
    },
  });

  // --- HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : value 
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.role === "masyarakat") {
      updateDepositorMutation.mutate({
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
    } else if (formData.role === "pengepul") {
      updateCollectorMutation.mutate({
        warehouseAddress: formData.warehouseAddress,
        serviceRadiusKm: formData.serviceRadiusKm,
        capacityLiter: formData.capacityLiter,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
    }
  };

  const handleDelete = () => {
    if (confirm("Yakin ingin menghapus akun ini beserta profilnya?")) {
      console.log("Menghapus user", formData.id);
    }
  };

  const isSaving = updateDepositorMutation.isPending || updateCollectorMutation.isPending;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 pt-0 md:pt-0 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-[image:var(--gradient-sage)] text-transparent bg-clip-text">
            Pengaturan Profil
          </h1>
          <p className="text-muted-foreground mt-2">
            Kelola informasi dasar dan data spesifik sesuai peran Anda.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card: Informasi Dasar */}
          <div className="bg-card text-card-foreground p-6 rounded-[var(--radius)] border border-border shadow-soft">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-border pb-3">
              <User className="w-5 h-5 text-primary" />
              Informasi Dasar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password Baru</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Kosongkan jika tidak ingin ganti"
                    className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Peran (Role)</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled 
                    className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-3 appearance-none focus:outline-none focus:ring-2 focus:ring-ring transition-all opacity-75 cursor-not-allowed"
                  >
                    <option value="stakeholder">Stakeholder</option>
                    <option value="masyarakat">Masyarakat (Penyetor)</option>
                    <option value="pengepul">Pengepul</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Dynamic Fields (Tidak muncul untuk Stakeholder) */}
          {formData.role !== "stakeholder" && (
            <div className="bg-card text-card-foreground p-6 rounded-[var(--radius)] border border-border shadow-soft transition-all">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-border pb-3">
                <MapPin className="w-5 h-5 text-accent" />
                Data {formData.role === "masyarakat" ? "Masyarakat" : "Pengepul"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.role === "masyarakat" && (
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Alamat Lengkap</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}

                {formData.role === "pengepul" && (
                  <>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <label className="text-sm font-medium">Alamat Gudang (Warehouse)</label>
                      <input
                        type="text"
                        name="warehouseAddress"
                        value={formData.warehouseAddress || ""}
                        onChange={handleChange}
                        className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Radius Servis (Km)</label>
                      <input
                        type="number"
                        name="serviceRadiusKm"
                        value={formData.serviceRadiusKm || ""}
                        onChange={handleChange}
                        className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kapasitas (Liter)</label>
                      <div className="relative">
                        <Package className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <input
                          type="number"
                          name="capacityLiter"
                          value={formData.capacityLiter || ""}
                          onChange={handleChange}
                          className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude || ""}
                    onChange={handleChange}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude || ""}
                    onChange={handleChange}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-border mt-8 gap-4">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-md transition-colors w-full sm:w-auto justify-center"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Akun
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-[image:var(--gradient-sage)] text-primary-foreground rounded-md shadow-elevated hover:opacity-90 transition-opacity w-full sm:w-auto justify-center font-medium disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}