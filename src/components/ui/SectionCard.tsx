"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, children, className }: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      <h3 className="text-base font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
