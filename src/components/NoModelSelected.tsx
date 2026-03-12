"use client";

import Link from "next/link";
import { useModelStore } from "@/stores/modelStore";
import { Button } from "@/components/ui/button";
import { Library } from "lucide-react";

export function NoModelSelected() {
  const modelsLoading = useModelStore((s) => s.modelsLoading);
  const modelsLoaded = useModelStore((s) => s.modelsLoaded);

  if (modelsLoading || !modelsLoaded) {
    return (
      <div className="p-6 space-y-4 text-foreground">
        <div className="h-7 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-8 rounded-xl bg-card border border-border text-card-foreground max-w-md">
      <h2 className="text-lg font-semibold mb-2">No model selected</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Open or create a model from the Library to view and edit data on this page.
      </p>
      <Button asChild variant="default">
        <Link href="/library" className="inline-flex items-center gap-2">
          <Library className="h-4 w-4" />
          Go to Library
        </Link>
      </Button>
    </div>
  );
}
