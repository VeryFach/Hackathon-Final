"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight, Bell, Search, Menu, X, LogOut, User, Settings, ChevronDown,
} from "lucide-react";
import { CONFIG } from "@/lib/config";
import { T } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/user-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, loading: userLoading } = useUser();

  const activeItem = CONFIG.navItems.find((n) => n.href === pathname);

  const navigate = (href: string) => {
    setSidebarOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/login");
    }
  };

  const handleProfileClick = () => {
    setProfileOpen((v) => !v);
  };

  // Close profile dropdown when clicking outside
  const handleProfileAction = (action: string) => {
    setProfileOpen(false);
    if (action === "logout") {
      handleLogout();
    } else if (action === "profile") {
      // Navigate to profile page in the future
      setProfileOpen(false);
    } else if (action === "settings") {
      navigate("/settings");
    }
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (profileOpen) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [profileOpen]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* ── Top Bar (Fixed) ── */}
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
          <div className="w-5 h-5 rounded-sm flex-shrink-0" style={{ background: T.primary }} />
          <span className="font-mono font-black text-foreground tracking-tight">
            {CONFIG.appName}
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs relative mx-2 hidden sm:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full bg-secondary border border-border pl-8 pr-4 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 rounded-sm"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 relative">
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: T.danger }} />
          </button>

          {/* User badge with dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleProfileClick();
              }}
              className="flex items-center gap-2 pl-2 border-l border-border ml-1 hover:bg-muted/50 transition-colors rounded-sm px-2 py-1"
            >
              <div
                className="w-7 h-7 rounded-full border flex items-center justify-center font-mono text-[11px] font-bold"
                style={{ borderColor: `${T.primary}30`, background: `${T.primary}15`, color: T.primary }}
              >
                {userLoading ? "..." : user?.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="font-mono text-xs text-muted-foreground hidden sm:block">
                {userLoading ? "Loading..." : user?.fullName || "User"}
              </span>
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-[var(--radius)] shadow-lg z-50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* User info */}
                <div className="p-3 border-b border-border">
                  <p className="font-mono text-xs font-bold text-foreground">
                    {user?.fullName || "User"}
                  </p>
                  <p className="font-sans text-[11px] text-muted-foreground truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => handleProfileAction("profile")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <User size={14} />
                    <span className="font-sans text-xs">Profil</span>
                  </button>
                  <button
                    onClick={() => handleProfileAction("settings")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Settings size={14} />
                    <span className="font-sans text-xs">Pengaturan</span>
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => handleProfileAction("logout")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} />
                    <span className="font-sans text-xs">Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body (with top padding for fixed header) ── */}
      <div className="pt-14 flex flex-1 min-h-screen">
        {/* Backdrop for sidebar */}
        {sidebarOpen && (
          <div
            className="fixed top-14 left-0 right-0 bottom-0 z-20 bg-foreground/20 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      
        {/* Sidebar Drawer */}
        <aside
          className={cn(
            "fixed top-14 left-0 bottom-0 z-30 w-56 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-out",
            sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
          )}
        >
          <nav className="p-3 flex-1 space-y-0.5 overflow-y-auto">
            {CONFIG.navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors rounded-sm",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon size={15} />
                  <span className="font-mono text-xs tracking-wide">{item.label}</span>
                  {isActive && <ChevronRight size={12} className="ml-auto opacity-60" />}
                </button>
              );
            })}
          </nav>
      
          {/* Footer sidebar - always visible at bottom */}
          <div className="p-4 border-t border-border space-y-3 flex-shrink-0">
            <div>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                {CONFIG.appName}
              </p>
              <p className="font-sans text-[11px] text-muted-foreground/70 leading-relaxed">
                {CONFIG.appTagline}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors rounded-sm font-mono text-xs"
            >
              <LogOut size={13} /> Keluar
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <span className="font-mono text-[10px] tracking-widest uppercase">{CONFIG.appName}</span>
                <ChevronRight size={11} />
                <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: T.primary }}>
                  {activeItem?.label ?? "Dashboard"}
                </span>
              </div>
              <h1 className="font-mono font-black text-foreground text-2xl uppercase tracking-tight">
                {activeItem?.label ?? "Dashboard"}
              </h1>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
