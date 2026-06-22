"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from "lucide-react";

import { CONFIG } from "@/lib/config";
import { T } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/user-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, loading: userLoading } = useUser();

  // =========================
  // ROLE + NAV CONFIG
  // =========================
  const role = user?.role ?? "masyarakat";
  const navItems = CONFIG.navItems[role];

  // =========================
  // ACTIVE ITEM (GLOBAL SEARCH)
  // =========================
  const activeItem = Object.values(CONFIG.navItems)
    .flat()
    .find((n) => n.href === pathname);

  const navigate = (href: string) => {
    setSidebarOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        },
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/login");
    }
  };

  const handleProfileAction = (action: string) => {
    setProfileOpen(false);

    if (action === "logout") handleLogout();
    if (action === "settings") navigate("/settings");
  };

  React.useEffect(() => {
    const handleClickOutside = () => {
      if (profileOpen) setProfileOpen(false);
    };

    if (profileOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [profileOpen]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="fixed top-0 left-0 right-0 h-14 border-b border-border bg-card flex items-center px-4 gap-3 z-40">
        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="p-2 -ml-1 text-muted-foreground hover:text-foreground transition-colors rounded-sm"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-sm"
            style={{ background: T.primary }}
          />
          <span className="font-mono font-black tracking-tight">
            {CONFIG.appName}
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs relative mx-2 hidden sm:block">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="w-full bg-secondary border border-border pl-8 pr-4 py-2 text-sm rounded-sm focus:outline-none"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 relative">
          <button className="relative p-2 text-muted-foreground hover:text-foreground">
            <Bell size={16} />
            <span
              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
              style={{ background: T.danger }}
            />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProfileOpen((v) => !v);
              }}
              className="flex items-center gap-2 pl-2 border-l border-border px-2 py-1 rounded-sm hover:bg-muted/50"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{
                  background: `${T.primary}15`,
                  color: T.primary,
                  border: `1px solid ${T.primary}30`,
                }}
              >
                {userLoading
                  ? "..."
                  : user?.fullName?.charAt(0).toUpperCase() || "U"}
              </div>

              <span className="hidden sm:block text-xs text-muted-foreground">
                {userLoading ? "Loading..." : user?.fullName || "User"}
              </span>

              <ChevronDown size={12} />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-border">
                  <p className="text-xs font-bold">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => handleProfileAction("settings")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50"
                >
                  <Settings size={14} />
                  Settings
                </button>

                <button
                  onClick={() => handleProfileAction("logout")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================
          BODY
      ========================= */}
      <div className="pt-14 flex min-h-screen">
        {/* BACKDROP */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-14 bg-black/20 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={cn(
            "fixed top-14 left-0 bottom-0 w-56 bg-card border-r border-border z-30 transition-transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <nav className="p-3 space-y-1 overflow-y-auto">
            {navItems?.map((item) => {
              const Icon = item.icon;

              if (!Icon) return null;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-sm text-left transition",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon size={15} />
                  <span className="font-mono text-xs">{item.label}</span>

                  {isActive && (
                    <ChevronRight size={12} className="ml-auto opacity-60" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* FOOTER */}
          <div className="p-4 border-t border-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {CONFIG.appName}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {CONFIG.appTagline}
            </p>

            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center gap-2 text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-sm"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* breadcrumb */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{CONFIG.appName}</span>
              <ChevronRight size={10} />
              <span className="text-primary">
                {activeItem?.label ?? "Dashboard"}
              </span>
            </div>

            <h1 className="text-2xl font-bold mt-1">
              {activeItem?.label ?? "Dashboard"}
            </h1>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
