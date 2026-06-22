import React from "react";
import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase mb-4",
        className
      )}
    >
      {children}
    </p>
  );
}
