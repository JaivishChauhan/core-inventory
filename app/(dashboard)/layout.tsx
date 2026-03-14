import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Topbar } from "@/components/layout/topbar"

/**
 * Dashboard layout — the app shell wrapping all authenticated routes.
 * FRD §3: Persistent sidebar + top bar + fluid full-height content area.
 * FRD §5: Container max-w-7xl with responsive padding.
 * FRD §8: Mobile-first padding (px-4 sm:px-6).
 *
 * Server Component — sidebar and topbar are client components within.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider className="min-h-svh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <Topbar />
        {/* FRD §5: Responsive padding, content scrolls independently */}
        <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
