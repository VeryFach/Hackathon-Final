"use client";

import React from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Plus } from "lucide-react";
import { CONFIG } from "@/lib/config";
import { T, ChartTooltipStyle, AxisTickStyle } from "@/lib/design-tokens";

/* ── Section Label ── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-3">
      {children}
    </p>
  );
}

/* ── Analytics Page ── */
export default function AnalyticsPage() {
  const { areaChart, barChart } = CONFIG;

  // Multi-series line data
  const lineData = areaChart.data.map((d, i) => ({
    x: d.x, series1: d.value, series2: Math.round(d.value * 0.7 + i * 3),
  }));

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Line chart — multi series */}
        <div className="bg-card border border-border relative overflow-hidden rounded-[var(--radius)] p-5">
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: T.primary }} />
          <Label>Perbandingan Seri</Label>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="x" tick={AxisTickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={AxisTickStyle} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={ChartTooltipStyle} />
              <Line type="monotone" dataKey="series1" stroke={T.primary} strokeWidth={2} dot={false} name="Seri 1" />
              <Line type="monotone" dataKey="series2" stroke={T.info} strokeWidth={2} dot={false} name="Seri 2" strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex gap-4 mt-3">
            {[{ label: "Seri 1", color: T.primary }, { label: "Seri 2", color: T.info }].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: s.color }} />
                <span className="font-mono text-[10px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-card border border-border relative overflow-hidden rounded-[var(--radius)] p-5">
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: barChart.color }} />
          <Label>{barChart.label}</Label>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barChart.data} barSize={28}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="x" tick={AxisTickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={AxisTickStyle} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={ChartTooltipStyle} />
              <Bar dataKey={barChart.dataKey} fill={barChart.color} radius={[2, 2, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Placeholder panel */}
      <div className="bg-card border border-dashed border-border relative overflow-hidden rounded-[var(--radius)] p-5">
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <Plus size={20} className="text-muted-foreground/40" />
          <p className="font-mono text-xs text-muted-foreground">Tambahkan chart atau tabel di sini</p>
          <p className="font-sans text-[11px] text-muted-foreground/60">
            Salin salah satu komponen di atas dan sesuaikan datanya.
          </p>
        </div>
      </div>
    </div>
  );
}
