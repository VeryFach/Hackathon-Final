import React from "react";
import { cn } from "@/lib/utils";
import { T } from "@/lib/design-tokens";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color?: string;
  delta?: {
    value: string;
    up: boolean;
  };
  className?: string;
}

export function MetricTile({
  label,
  value,
  unit,
  icon: Icon,
  color,
  delta,
  className,
}: MetricTileProps) {
  return (
    <div className={cn("bg-card border border-border rounded-[var(--radius)] p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          {label}
        </p>
        <Activity
          size={14}
          style={{ color: color ?? T.primary }}
        />
      </div>
      <p
        className="font-mono font-black text-foreground leading-none"
        style={{ fontSize: "1.75rem" }}
      >
        {value}
        {unit && (
          <span className="text-base font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        )}
      </p>
      {delta && (
        <p
          className="font-mono text-xs mt-3 flex items-center gap-1"
          style={{ color: delta.up ? T.success : T.danger }}
        >
          {delta.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {delta.value}
        </p>
      )}
    </div>
  );
}
