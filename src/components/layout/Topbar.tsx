"use client";

import Link from "next/link";
import { useModelStore } from "@/stores/modelStore";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  FileCheck,
  Download,
  RotateCw,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const model = useModelStore((s) => s.getActiveModel());
  const modelTitle = model?.general?.model_title || model?.name || "No model selected";

  return (
    <header className="h-14 shrink-0 bg-[#0b1220] border-b border-white/10 flex items-center justify-between px-4 text-white">
      {/* Left: back + model title */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href="/dashboard/overview"
          className="flex items-center gap-1 text-sm text-white/90 hover:text-white transition"
        >
          <ChevronLeft className="h-5 w-5 shrink-0" />
          <span className="truncate font-medium">{modelTitle}</span>
          <span className="text-white/50">—</span>
        </Link>
      </div>

      {/* Center: status pills */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/50 bg-white/5 text-white">
          Basecase
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-600 text-white">
          Results Current
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-white/70">Standard</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white gap-1 h-8"
            >
              <FileCheck className="h-4 w-4" />
              Checkpoint
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Save checkpoint</DropdownMenuItem>
            <DropdownMenuItem>Restore checkpoint</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 hover:text-white h-8"
          onClick={() => {}}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 gap-1"
          onClick={() => {}}
        >
          <RotateCw className="h-4 w-4" />
          Recalculate
        </Button>
      </div>
    </header>
  );
}
