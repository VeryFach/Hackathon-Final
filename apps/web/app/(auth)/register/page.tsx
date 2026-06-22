"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Mail,
  Users,
} from "lucide-react";
import { T } from "@/lib/design-tokens";
import { CONFIG } from "@/lib/config";
import { api } from "@/lib/axios"; // Sesuaikan path ini dengan lokasi file axios Anda

// Mendefinisikan tipe data form
type RegisterFormValues = {
  fullName: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState("");

  // Setup react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      role: "masyarakat", // Default role sesuai curl
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setApiError("");

    try {
      // Menyusun payload agar persis dengan format curl (tanpa confirmPassword)
      const payload = {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role,
      };

      // Menggunakan instance axios kustom
      await api.post("/auth/register", payload, {
        headers: {
          accept: "*/*",
        },
      });

      // Redirect ke halaman login setelah sukses
      router.push("/login");
    } catch (err: any) {
      // Menangani error dari Axios
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Terjadi kesalahan. Silakan coba lagi.";
      setApiError(errorMessage);
    }
  };

  // Watch password untuk validasi confirm password
  const password = watch("password");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div
            className="w-8 h-8 rounded-sm flex-shrink-0"
            style={{ background: T.primary }}
          />
          <span className="font-mono font-black text-foreground text-xl tracking-tight">
            {CONFIG.appName}
          </span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-mono font-black text-foreground text-2xl tracking-tight mb-1">
            Daftar
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Buat akun baru untuk mulai
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Input Nama Lengkap */}
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
                placeholder="Nama lengkap"
                className={`w-full bg-secondary border pl-9 pr-4 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 rounded-sm transition-colors ${
                  errors.fullName ? "border-red-500/50" : "border-border"
                }`}
                {...register("fullName", {
                  required: "Nama lengkap wajib diisi",
                })}
              />
            </div>
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1.5 font-sans">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Input Email */}
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
                placeholder="nama@email.com"
                className={`w-full bg-secondary border pl-9 pr-4 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 rounded-sm transition-colors ${
                  errors.email ? "border-red-500/50" : "border-border"
                }`}
                {...register("email", {
                  required: "Email wajib diisi",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Format email tidak valid",
                  },
                })}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1.5 font-sans">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Input Peran */}
          <div>
            <label className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase block mb-1.5">
              Peran (Role)
            </label>
            <div className="relative">
              <Users
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <select
                className="w-full bg-secondary border border-border pl-9 pr-4 py-2.5 font-sans text-sm text-foreground focus:outline-none focus:border-primary/60 rounded-sm transition-colors appearance-none"
                {...register("role", { required: "Peran wajib dipilih" })}
              >
                <option value="masyarakat">Masyarakat</option>
                 <option value="pengepul">Pengepul</option>
              </select>
            </div>
          </div>

          {/* Input Password */}
          <div>
            <label className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full bg-secondary border pl-9 pr-10 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 rounded-sm transition-colors ${
                  errors.password ? "border-red-500/50" : "border-border"
                }`}
                {...register("password", {
                  required: "Password wajib diisi",
                  minLength: {
                    value: 6,
                    message: "Password minimal 6 karakter",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1.5 font-sans">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Input Konfirmasi Password */}
          <div>
            <label className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase block mb-1.5">
              Konfirmasi Password
            </label>
            <div className="relative">
              <Lock
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full bg-secondary border pl-9 pr-4 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 rounded-sm transition-colors ${
                  errors.confirmPassword ? "border-red-500/50" : "border-border"
                }`}
                {...register("confirmPassword", {
                  required: "Konfirmasi password wajib diisi",
                  validate: (value) =>
                    value === password || "Password tidak cocok",
                })}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1.5 font-sans">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Tampilan Error API */}
          {apiError && (
            <div
              className="flex items-start gap-2 p-3 border rounded-sm text-xs font-sans"
              style={{
                borderColor: `${T.danger}30`,
                background: `${T.danger}08`,
                color: T.danger,
              }}
            >
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              {apiError}
            </div>
          )}

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 font-mono text-sm tracking-wider rounded-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: T.primary,
              color: "var(--primary-foreground)",
            }}
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              "Daftar"
            )}
          </button>
        </form>

        <p className="font-sans text-sm text-center mt-6 text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-mono text-xs hover:underline"
            style={{ color: T.primary }}
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
