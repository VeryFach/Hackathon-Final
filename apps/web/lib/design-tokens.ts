/**
 * Semantic design tokens matching the template design system.
 * Ganti --accent-hue di globals.css untuk ubah warna utama.
 */
export const T = {
  primary: "var(--primary)",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#6366f1",
} as const;

export type SemanticColor = keyof typeof T;

/** Status/badge mapping */
export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "Aktif", color: T.success },
  warning: { label: "Perhatian", color: T.warning },
  danger: { label: "Kritis", color: T.danger },
  info: { label: "Info", color: T.info },
  success: { label: "Baik", color: T.success },
};

/** Shared chart tooltip style */
export const ChartTooltipStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 11,
  color: "var(--foreground)",
  borderRadius: "var(--radius)",
};

/** Shared chart axis tick style */
export const AxisTickStyle = {
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 10,
  fill: "var(--muted-foreground)",
};
