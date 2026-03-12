"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { clearCSRFToken } from "@/lib/csrf";
import { useModelStore } from "@/stores/modelStore";
import {
  LayoutDashboard,
  Settings2,
  Users,
  Cpu,
  Package,
  GitBranch,
  Grid3X3,
  Network,
  Play,
  FlaskConical,
  FileText,
  Wrench,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/generaldata", label: "General Data", icon: Settings2 },
  { href: "/dashboard/labordata", label: "Labor", icon: Users },
  { href: "/dashboard/equipmentdata", label: "Equipment", icon: Cpu },
  { href: "/dashboard/productdata", label: "Products", icon: Package },
  { href: "/dashboard/operationsrouting", label: "Operations", icon: GitBranch },
  { href: "/dashboard/alloperations", label: "All Operations", icon: Grid3X3 },
  { href: "/dashboard/ibomscreens", label: "IBOM", icon: Network },
  { href: "/dashboard/runresults", label: "Run & Results", icon: Play },
  { href: "/dashboard/whatif", label: "What-If Studio", icon: FlaskConical },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/parameternames", label: "Model Settings", icon: Wrench },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const model = useModelStore((s) => s.getActiveModel());

  const handleLogout = async () => {
    try {
      await api.post("/api/logout/");
    } catch {
      // no-op
    } finally {
      clearCSRFToken();
      router.push("/login");
    }
  };

  return (
    <aside
      className="flex w-64 shrink-0 flex-col min-h-0 border-r border-slate-800 bg-[#0A1929] text-slate-100"
      aria-label="Main navigation"
    >
      <div className="shrink-0 border-b border-slate-800 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          MODEL WORKSPACE
        </p>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 rounded-l-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-slate-700/80 text-emerald-400"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white",
              ].join(" ")}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-400" : ""}`} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-800 p-3 space-y-1">
        {model && (
          <p className="px-3 py-1.5 text-xs text-slate-400">
            {model.products.length} products - {model.equipment.length} equip - {model.labor.length} labor
          </p>
        )}
        {/* <Link
          href="/library"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-white"
        >
          <Package className="h-4 w-4 shrink-0" />
          Library
        </Link> */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

