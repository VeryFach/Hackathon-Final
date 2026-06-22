import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  color: string;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ label, color, dot = true, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 border rounded-sm",
        className
      )}
      style={{
        color,
        borderColor: `${color}40`,
        background: `${color}12`,
      }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: color }}
        />
      )}
      {label}
    </span>
  );
}
