import {
  Package,
  AlertTriangle,
  PackagePlus,
  Truck,
  ArrowLeftRight,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"
import { getInventoryKpis } from "@/lib/db/queries/stock"
import type React from "react"

export const metadata: Metadata = {
  title: "Dashboard",
}

/** @internal Props for a single KPI card widget */
interface KpiCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: { value: string; direction: "up" | "down" | "neutral" }
  accentColor?: string
  iconBg?: string
  iconColor?: string
}

/**
 * KpiCard — elevated metric widget.
 * FRD §4: Top-row widgets for critical health metrics.
 * Colored shadow, lift on hover, gradient accent bar.
 */
function KpiCard({
  title,
  value,
  description,
  icon,
  trend,
  accentColor,
  iconBg = "bg-indigo-50 dark:bg-indigo-950/50",
  iconColor = "text-indigo-600 dark:text-indigo-400",
}: KpiCardProps) {
  return (
    <Card className="card-hover shadow-soft group relative overflow-hidden border border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`rounded-xl p-2.5 ${iconBg} ${iconColor} transition-all duration-200 group-hover:scale-110`}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold tracking-tight">{value}</div>
        <div className="mt-1.5 flex items-center gap-2">
          {trend && (
            <Badge
              variant={
                trend.direction === "up"
                  ? "success"
                  : trend.direction === "down"
                    ? "destructive"
                    : "secondary"
              }
              className="gap-1 bg-opacity-10 dark:bg-opacity-20"
            >
              {trend.direction === "up" ? (
                <TrendingUp className="size-3" />
              ) : trend.direction === "down" ? (
                <TrendingDown className="size-3" />
              ) : null}
              {trend.value}
            </Badge>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
      {/* FRD: Gradient accent bar on hover */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          backgroundImage: accentColor
            ? `linear-gradient(to right, ${accentColor}, ${accentColor}80)`
            : "linear-gradient(to right, #4F46E5, #7C3AED)",
        }}
      />
    </Card>
  )
}

/**
 * DashboardPage — The Command Center.
 * Server Component: fetches real KPIs directly from Postgres via the stock query utility.
 * No client-side waterfall — data arrives in the initial HTML payload.
 */
export default async function DashboardPage() {
  const kpis = await getInventoryKpis()

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span>Command </span>
          <span className="text-gradient">Center</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Real-time overview of your warehouse operations.
        </p>
      </div>

      {/* KPI grid: 1 col → 2 col → 3 col */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Products"
          value={kpis.totalProducts}
          description="Active items in catalog"
          icon={<Package className="size-5" />}
        />
        <KpiCard
          title="Low Stock Alerts"
          value={kpis.lowStockCount}
          description="Below reorder point"
          icon={<AlertTriangle className="size-5" />}
          accentColor="#F59E0B"
          iconBg="bg-amber-50 dark:bg-amber-950/50"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          title="Out of Stock"
          value={kpis.outOfStockCount}
          description="Zero availability"
          icon={<AlertTriangle className="size-5" />}
          accentColor="#EF4444"
          iconBg="bg-red-50 dark:bg-red-950/50"
          iconColor="text-red-600 dark:text-red-400"
        />
        <KpiCard
          title="Pending Receipts"
          value={kpis.pendingReceipts}
          description="Awaiting validation"
          icon={<PackagePlus className="size-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          title="Pending Deliveries"
          value={kpis.pendingDeliveries}
          description="Ready for dispatch"
          icon={<Truck className="size-5" />}
        />
        <KpiCard
          title="Scheduled Transfers"
          value={kpis.scheduledTransfers}
          description="Internal movements queued"
          icon={<ArrowLeftRight className="size-5" />}
        />
      </div>

      {/* Recent Activity placeholder */}
      <div>
        <h2 className="mb-3 text-lg font-bold">Recent Activity</h2>
        <Card className="border-border/50 shadow-soft">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
              <Activity className="mt-0.5 size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  Activity feed streams from the stock ledger
                </p>
                <p className="mt-1 text-sm text-indigo-700/80 dark:text-indigo-300/80">
                  Real-time updates via polling — live feed coming in Phase 2.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
