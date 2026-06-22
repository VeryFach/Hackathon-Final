"use client";
import {
  LayoutDashboard,
  Plus,
  History,
  Inbox,
  Boxes,
  Layers,
  PackageCheck,
  ClipboardCheck,
  FlaskConical,
  Tags,
  Map as MapIcon,
  Leaf,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type Role = "masyarakat" | "pengepul" | "stakeholder";

export function getRoleFromPath(pathname: string): Role {
  if (pathname.startsWith("/pengepul")) return "pengepul";
  if (pathname.startsWith("/stakeholder")) return "stakeholder";
  return "masyarakat";
}

const ROLE_LABEL: Record<Role, string> = {
  masyarakat: "Masyarakat",
  pengepul: "Pengepul",
  stakeholder: "Stakeholder",
};

const ROLE_HOME: Record<Role, string> = {
  masyarakat: "/",
  pengepul: "/pengepul",
  stakeholder: "/stakeholder",
};

export function AppShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const role = getRoleFromPath(pathname);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card/60 backdrop-blur flex items-center justify-between px-8">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <button className="size-9 grid place-items-center rounded-lg border bg-background hover:bg-muted transition">
              <Bell className="size-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-8 py-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    selesai: "bg-emerald-100 text-emerald-800 border-emerald-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    diproses: "bg-amber-100 text-amber-800 border-amber-200",
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    draft: "bg-stone-100 text-stone-700 border-stone-200",
    diterima: "bg-sky-100 text-sky-800 border-sky-200",
    dijemput: "bg-sky-100 text-sky-800 border-sky-200",
    diajukan: "bg-stone-100 text-stone-700 border-stone-200",
    rejected: "bg-rose-100 text-rose-800 border-rose-200",
    raw: "bg-stone-100 text-stone-700 border-stone-200",
    stored: "bg-sky-100 text-sky-800 border-sky-200",
    ready: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: typeof Leaf;
  tone?: "default" | "warm" | "sage";
}) {
  const bg =
    tone === "warm"
      ? { background: "var(--gradient-warm)", color: "white" }
      : tone === "sage"
        ? { background: "var(--gradient-sage)", color: "white" }
        : undefined;
  return (
    <div
      className="rounded-xl border bg-card p-5"
      style={{ ...(bg ?? {}), boxShadow: "var(--shadow-soft)" }}
    >
      <div className="flex items-center justify-between">
        <div className={`text-xs ${bg ? "text-white/80" : "text-muted-foreground"}`}>{label}</div>
        {Icon && <Icon className={`size-4 ${bg ? "text-white/80" : "text-muted-foreground"}`} />}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className={`mt-1 text-xs ${bg ? "text-white/70" : "text-muted-foreground"}`}>{hint}</div>}
    </div>
  );
}

export function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}