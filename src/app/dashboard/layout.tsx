import { ReactNode } from "react"
import { DashboardLayout as DashboardShell } from "@/components/dashboard/DashboardLayout"
import { DashboardHydration } from "./DashboardHydration"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell>
      <DashboardHydration>{children}</DashboardHydration>
    </DashboardShell>
  )
}

