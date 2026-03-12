"use client";

import { useEffect, ReactNode } from "react";
import { useModelStore } from "@/stores/modelStore";

export function DashboardHydration({ children }: { children: ReactNode }) {
  const loadModels = useModelStore((s) => s.loadModels);
  const modelsLoaded = useModelStore((s) => s.modelsLoaded);
  const modelsLoading = useModelStore((s) => s.modelsLoading);

  useEffect(() => {
    if (!modelsLoaded && !modelsLoading) loadModels();
  }, [modelsLoaded, modelsLoading, loadModels]);

  return <>{children}</>;
}
