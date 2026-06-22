"use client";
import React, { useState } from "react";
import {
  User,
  MapPin,
  Package,
  Save,
  Trash2,
  Shield,
  Mail,
  Key,
} from "lucide-react";

// Tipe data berdasarkan Prisma Schema
type Role = "USER" | "DEPOSITOR" | "COLLECTOR";

interface UserProfileData {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  // Depositor Fields
  address?: string;
  // Collector Fields
  warehouseAddress?: string;
  serviceRadiusKm?: number;
  capacityLiter?: number;
  // Shared Geospatial
  latitude?: number;
  longitude?: number;
}

export default function UserProfileManager() {
  // State untuk nyimpen data form (Simulasi Read/Update)
  const [formData, setFormData] = useState<UserProfileData>({
    id: "usr-123",
    fullName: "Raka Fadillah",
    email: "raka@example.com",
    role: "COLLECTOR",
    warehouseAddress: "Jl. Suhat No. 15",
    serviceRadiusKm: 10,
    capacityLiter: 500,
    latitude: -7.9522,
    longitude: 112.6145,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic UPDATE ke backend taruh di sini (misal via fetch/axios ke Next.js API route)
    console.log("Menyimpan data profile:", formData);
    alert("Profile berhasil diperbarui!");
  };

  const handleDelete = () => {
    // Logic DELETE ke backend
    if (confirm("Yakin ingin menghapus akun ini beserta profilnya?")) {
      console.log("Menghapus user", formData.id);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 pt-0 md:pt-0 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold bg-[image:var(--gradient-sage)] text-transparent bg-clip-text">
            Pengaturan Profil
          </h1>
          <p className="text-muted-foreground mt-2">
            Kelola informasi dasar dan data spesifik sesuai peran Anda.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card: Informasi Dasar (Tabel User) */}
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
                    className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-3 appearance-none focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  >
                    <option value="USER">Standard User</option>
                    <option value="DEPOSITOR">Depositor (Penyetor)</option>
                    <option value="COLLECTOR">Collector (Pengepul)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Dynamic Fields berdasarkan Role */}
          {formData.role !== "USER" && (
            <div className="bg-card text-card-foreground p-6 rounded-[var(--radius)] border border-border shadow-soft transition-all">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 border-b border-border pb-3">
                <MapPin className="w-5 h-5 text-accent" />
                Data {formData.role === "DEPOSITOR" ? "Penyetor" : "Pengepul"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Field Khusus Depositor */}
                {formData.role === "DEPOSITOR" && (
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">
                      Alamat Lengkap
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}

                {/* Field Khusus Collector */}
                {formData.role === "COLLECTOR" && (
                  <>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <label className="text-sm font-medium">
                        Alamat Gudang (Warehouse)
                      </label>
                      <input
                        type="text"
                        name="warehouseAddress"
                        value={formData.warehouseAddress || ""}
                        onChange={handleChange}
                        className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Radius Servis (Km)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="serviceRadiusKm"
                          value={formData.serviceRadiusKm || ""}
                          onChange={handleChange}
                          className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Kapasitas (Liter)
                      </label>
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

                {/* Shared Fields: Latitude & Longitude */}
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
              className="flex items-center gap-2 px-6 py-2 bg-[image:var(--gradient-sage)] text-primary-foreground rounded-md shadow-elevated hover:opacity-90 transition-opacity w-full sm:w-auto justify-center font-medium"
            >
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
