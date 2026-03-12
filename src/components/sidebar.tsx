"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import api from "@/lib/api"
import { clearCSRFToken } from "@/lib/csrf"

const navItems = [
  { href: "/library", label: "Library" },
  { href: "/dashboard/overview", label: "Overview" },
  { href: "/dashboard/generaldata", label: "General Data" },
  { href: "/dashboard/labordata", label: "Labor Data" },
  { href: "/dashboard/equipmentdata", label: "Equipment Data" },
  { href: "/dashboard/productdata", label: "Product Data" },
  { href: "/dashboard/operationsrouting", label: "Operations Routing" },
  { href: "/dashboard/alloperations", label: "All Operations" },
  { href: "/dashboard/ibomscreens", label: "IBOM" },
  { href: "/dashboard/runresults", label: "Run & Results" },
  { href: "/dashboard/whatif", label: "What-If Studio" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/parameternames", label: "Parameter Names" },
  { href: "/settings", label: "Settings" },
] as const

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await api.post("/api/logout/")
    } catch {
      // ignore errors; best-effort logout
    } finally {
      clearCSRFToken()
      router.push("/login")
    }
  }

  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo / Title */}
      <div className="text-2xl font-bold p-6 border-b border-gray-700">
        RMCT Dashboard
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`block px-4 py-2 rounded transition ${
                isActive ? "bg-gray-700 text-white" : "hover:bg-gray-700"
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  )
}