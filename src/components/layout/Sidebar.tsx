"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { clearCSRFToken } from "@/lib/csrf";
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
  { href: "/dashboard/eqipmentdata", label: "Equipment", icon: Cpu },
  { href: "/dashboard/productdata", label: "Products", icon: Package },
  { href: "/dashboard/operationsrouting", label: "Operations", icon: GitBranch },
  { href: "/dashboard/alloperations", label: "All Operations", icon: Grid3X3 },
  { href: "/dashboard/ibomscreens", label: "IBOM", icon: Network },
  { href: "/dashboard/runresults", label: "Run & Results", icon: Play },
  { href: "/dashboard/whatif", label: "What-If Studio", icon: FlaskConical },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/parameternames", label: "Model Settings", icon: Wrench },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
    <aside className="w-64 shrink-0 h-full flex flex-col bg-[#0b1220] border-r border-white/10">
      {/* Section title */}
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
          Model Workspace
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal-600/30 text-white border-l-2 border-teal-400 -ml-[2px] pl-[14px]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Library + Logout */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/library"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Package className="h-4 w-4 shrink-0" />
          Library
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-red-600/90 hover:bg-red-600 text-white"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
