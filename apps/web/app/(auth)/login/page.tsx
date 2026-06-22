"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { User, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { T } from "@/lib/design-tokens";
import { CONFIG } from "@/lib/config";
import { authService } from "@/lib/api/auth";
import { getRoleHome } from "@/lib/auth-storage";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setApiError("");

    try {
      const auth = await authService.login(data);
      router.replace(getRoleHome(auth.user.role));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Terjadi kesalahan saat login. Silakan coba lagi.";
      setApiError(errorMessage);
    }
  };

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
            Masuk
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            {CONFIG.appTagline}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase block mb-1.5">
              Email
            </label>
            <div className="relative">
              <User
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="email"
                autoComplete="email"
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

          {/* Password */}
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
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full bg-secondary border pl-9 pr-10 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 rounded-sm transition-colors ${
                  errors.password ? "border-red-500/50" : "border-border"
                }`}
                {...register("password", {
                  required: "Password wajib diisi",
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

          {/* Error API */}
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

          {/* Submit */}
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
                Memverifikasi...
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="font-sans text-sm text-center mt-6 text-muted-foreground">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-mono text-xs hover:underline"
            style={{ color: T.primary }}
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
