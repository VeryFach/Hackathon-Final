"use client";

import React, { useState } from "react";
import { User, Mail, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { T } from "@/lib/design-tokens";
import { useUser } from "@/lib/user-context";

export default function ProfilePage() {
  const { user, fetchUser } = useUser();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email] = useState(user?.email || ""); // Email tidak bisa diubah
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setMessage({ type: "error", text: "Nama lengkap wajib diisi." });
      return;
    }

    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/users`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ fullName }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal update profile");
      }

      setMessage({ type: "success", text: "Profile berhasil diupdate!" });
      // Refresh user data
      await fetchUser();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border">
          <h2 className="font-mono font-bold text-foreground text-lg">Informasi Profile</h2>
          <p className="font-sans text-sm text-muted-foreground mt-1">
            Kelola informasi pribadi Anda
          </p>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-full border-2 flex items-center justify-center font-mono text-2xl font-bold"
              style={{
                borderColor: `${T.primary}40`,
                background: `${T.primary}15`,
                color: T.primary,
              }}
            >
              {user?.fullName?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-mono font-bold text-foreground text-lg">
                {user?.fullName || "User"}
              </p>
              <p className="font-sans text-sm text-muted-foreground">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div
              className={`flex items-start gap-2 p-3 border rounded-sm text-xs font-sans mb-4 ${
                message.type === "success" ? "text-green-600" : ""
              }`}
              style={{
                borderColor:
                  message.type === "success"
                    ? `${T.success}30`
                    : `${T.danger}30`,
                background:
                  message.type === "success"
                    ? `${T.success}08`
                    : `${T.danger}08`,
                color: message.type === "success" ? T.success : T.danger,
              }}
            >
              {message.type === "success" ? (
                <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              )}
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase block mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  className="w-full bg-secondary border border-border pl-9 pr-4 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 rounded-sm transition-colors"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase block mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full bg-muted/50 border border-border pl-9 pr-4 py-2.5 font-sans text-sm text-muted-foreground cursor-not-allowed rounded-sm"
                />
              </div>
              <p className="font-sans text-[11px] text-muted-foreground mt-1">
                Email tidak dapat diubah
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 font-mono text-sm tracking-wider rounded-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: T.primary, color: "var(--primary-foreground)" }}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={13} />
                  Simpan Perubahan
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-mono font-bold text-foreground text-lg">Informasi Akun</h2>
          <p className="font-sans text-sm text-muted-foreground mt-1">
            Detail akun Anda
          </p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="font-sans text-sm text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-foreground">{user?.id || "-"}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-sans text-sm text-muted-foreground">Status</span>
            <span
              className="font-mono text-xs px-2 py-1 border rounded-sm"
              style={{ color: T.success, borderColor: `${T.success}40`, background: `${T.success}10` }}
            >
              Aktif
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
