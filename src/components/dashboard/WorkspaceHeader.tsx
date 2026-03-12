"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { useModelStore } from "@/stores/modelStore";
import { useScenarioStore } from "@/stores/scenarioStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  ChevronDown,
  Circle,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type WorkspaceHeaderProps = {
  children?: ReactNode;
};

export function WorkspaceHeader({ children }: WorkspaceHeaderProps) {
  const model = useModelStore((s) => s.getActiveModel());
  const modelTitle = model?.general?.model_title || model?.name || "No model selected";
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const activeScenario = useScenarioStore((s) => s.scenarios.find((sc) => sc.id === s.activeScenarioId));
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const now = new Date();
  const defaultName = `Checkpoint ${now.toLocaleString()}`;

  return (
    <header className="flex flex-col gap-3 border-b border-slate-800 bg-[#0A1929] px-6 py-3 w-full shrink-0">
      <div className="flex items-center justify-between gap-4 min-w-0">
        {/* Left: Trooba Flow > breadcrumb + Basecase + Recalc Needed */}
        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
          <Link
            href="/library"
            className="flex items-center gap-2 shrink-0 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Trooba Flow
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <span className="text-sm font-normal text-slate-200 truncate max-w-[200px] sm:max-w-[280px]">
            {modelTitle}
            {modelTitle.length > 20 ? " — …" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/70 bg-transparent px-2.5 py-1 text-[11px] font-medium text-emerald-400 shrink-0">
            <Circle className="h-1.5 w-1.5 fill-emerald-400" />
            Basecase
          </span>
          <span className="inline-flex items-center rounded-md bg-[#FFC107] px-2.5 py-1 text-[11px] font-medium text-slate-900 shrink-0">
            Recalc Needed
          </span>
          {activeScenarioId && activeScenario ? (
            <span className="inline-flex items-center rounded-md bg-amber-500/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-950 shrink-0">
              What-if: {activeScenario.name}
            </span>
          ) : null}
        </div>

        {/* Right: Checkpoint button + dropdown (arrow only) */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-md bg-transparent text-sm font-medium text-white hover:bg-slate-700/50 hover:text-white border-0"
            onClick={() => setShowSaveDialog(true)}
          >
            <FileCheck className="h-4 w-4 shrink-0" />
            Checkpoint
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md bg-transparent text-white hover:bg-slate-700/60"
              >
                <ChevronDown className="h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-lg shadow-lg p-0">
              <div className="px-3 py-2.5 font-semibold text-sm text-slate-900 border-b border-slate-200">
                Recent Checkpoints
              </div>
              <div className="px-3 py-4 text-sm text-slate-500 text-center">
                No checkpoints yet
              </div>
              <div className="border-t border-slate-200 px-2 py-2">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 shrink-0" />
                  View all checkpoints
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {children && (
        <div className="text-xs text-slate-400 flex items-center gap-2">
          {children}
        </div>
      )}

      {/* Save Checkpoint dialog (opens when main button clicked) */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Checkpoint</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mb-3">
            Save a snapshot of the current model state that you can restore later.
          </p>
          <div className="space-y-2">
            <Label htmlFor="checkpoint-name">Checkpoint Name</Label>
            <Input
              id="checkpoint-name"
              defaultValue={defaultName}
              className="h-10"
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Circle className="h-3 w-3" />
            <span>{now.toLocaleString()}</span>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setShowSaveDialog(false)}
            >
              Save Checkpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

