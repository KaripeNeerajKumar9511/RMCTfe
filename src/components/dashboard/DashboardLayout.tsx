"use client";

import { ReactNode } from "react";
import { DashboardSidebar } from "./Sidebar";
import { WorkspaceHeader } from "./WorkspaceHeader";

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9FAFB] text-slate-900">
      {/* Full-width topbar from left to right */}
      <WorkspaceHeader />

      {/* Sidebar + main content below the topbar; only main scrolls */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden px-6 py-6">
          <div className="mx-auto max-w-6xl w-full flex-1 min-h-0 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

