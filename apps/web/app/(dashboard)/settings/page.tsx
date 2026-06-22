"use client";

import React from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="bg-card border border-dashed border-border relative overflow-hidden rounded-[var(--radius)] p-5">
      <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
        <Settings size={24} className="text-muted-foreground/30" />
        <p className="font-mono text-sm text-muted-foreground">Settings</p>
        <p className="font-sans text-xs text-muted-foreground/60 max-w-xs">
          Tambahkan form konfigurasi, toggle fitur, atau preferensi pengguna di sini.
        </p>
      </div>
    </div>
  );
}
