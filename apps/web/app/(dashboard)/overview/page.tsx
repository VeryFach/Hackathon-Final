"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Activity, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { CONFIG } from "@/lib/config";
import { T, STATUS_MAP, ALERT_ICON, ChartTooltipStyle, AxisTickStyle } from "@/lib/design-tokens";

/* ── MetricCard ── */
function MetricCard({ label, value, unit, color, trend }: {
  label: string; value: string; unit?: string; color?: string; trend?: number | null;
}) {
  return (
    <div className="bg-card border border-border relative overflow-hidden rounded-[var(--radius)] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-0">{label}</p>
        <Activity size={14} style={{ color: color ?? T.primary }} />
      </div>
      <p className="font-mono font-black text-foreground leading-none" style={{ fontSize: "1.75rem" }}>
        {value}
        {unit && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
      {trend !== null && trend !== undefined && (
        <p
          className="font-mono text-xs mt-3 flex items-center gap-1"
          style={{ color: trend >= 0 ? T.success : T.danger }}
        >
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}% dari periode lalu
        </p>
      )}
    </div>
  );
}

/* ── Badge ── */
function Badge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: T.info };
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider px-2 py-0.5 border rounded-sm"
      style={{ color: s.color, borderColor: `${s.color}35`, background: `${s.color}10` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

/* ── Section Label ── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-3">
      {children}
    </p>
  );
}

/* ── Overview Page ── */
export default function OverviewPage() {
  const { metrics, areaChart, alerts, table } = CONFIG;

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.id} label={m.label} value={m.value}
            unit={m.unit} color={m.color} trend={m.trend} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="bg-card border border-border relative overflow-hidden rounded-[var(--radius)] p-5 lg:col-span-2">
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: areaChart.color }} />
          <Label>{areaChart.label}</Label>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={areaChart.data}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={areaChart.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={areaChart.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="x" tick={AxisTickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={AxisTickStyle} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={ChartTooltipStyle} />
              <Area type="monotone" dataKey={areaChart.dataKey}
                stroke={areaChart.color} strokeWidth={2}
                fill="url(#areaGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        <div className="bg-card border border-border relative overflow-hidden rounded-[var(--radius)] p-5">
          <Label>Status & Alert</Label>
          <div className="space-y-2">
            {alerts.map((a) => {
              const Icon = ALERT_ICON[a.level] ?? Info;
              const s = STATUS_MAP[a.level] ?? { color: T.info };
              return (
                <div
                  key={a.id}
                  className="flex gap-3 p-3 border rounded-sm"
                  style={{ borderColor: `${s.color}25`, background: `${s.color}07` }}
                >
                  <Icon size={14} style={{ color: s.color }} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-xs font-semibold text-foreground mb-0.5">{a.title}</p>
                    <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border relative overflow-hidden rounded-[var(--radius)]">
        <div className="p-5 border-b border-border">
          <Label>{table.label}</Label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {table.columns.map((col) => (
                  <th key={col}
                    className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase text-left px-5 py-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-foreground font-medium">{row.nama}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{row.kategori}</td>
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{row.nilai}</td>
                  <td className="px-5 py-3"><Badge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
