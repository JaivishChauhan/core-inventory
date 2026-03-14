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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
}

/**
 * Dashboard — The Command Center.
 * Displays real-time KPI cards showing the warehouse heartbeat.
 * Uses the FRD Corporate Trust design: colored shadows, elevated cards,
 * gradient text, and mobile-first responsive grid.
 *
 * Server Component — data will be fetched server-side from Supabase.
 */

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
 * KPI Metric Card — elevated with colored shadows.
 * FRD §4: Top-row widgets for critical health metrics.
 * FRD §3 Component Styling: White bg, rounded-xl, shadow-soft, lift on hover.
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
        {/* FRD §7: Icon in soft-colored circle */}
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
              className="bg-opacity-10 dark:bg-opacity-20 gap-1"
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
      {/* FRD Visual DNA: Gradient accent bar at bottom */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          backgroundImage: accentColor
            ? `linear-gradient(to right, ${accentColor}, ${accentColor}80)`
            : "linear-gradient(to right, #4F46E5, #7C3AED)",
        }}
      />
    </Card>
  )
}

export default function DashboardPage() {
  // TODO: Replace with Supabase queries via TanStack Query
  const kpis = {
    totalProducts: 247,
    lowStock: 12,
    outOfStock: 3,
    pendingReceipts: 8,
    pendingDeliveries: 5,
    scheduledTransfers: 4,
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header — FRD Typography: gradient text for emphasis */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span>Command </span>
          <span className="text-gradient">Center</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Real-time overview of your warehouse operations.
        </p>
      </div>

      {/* KPI Grid — Mobile: 1 col → SM: 2 col → LG: 3 col (FRD §8) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Products"
          value={kpis.totalProducts}
          description="Active items in catalog"
          icon={<Package className="size-5" />}
          trend={{ value: "+12", direction: "up" }}
        />
        <KpiCard
          title="Low Stock Alerts"
          value={kpis.lowStock}
          description="Below reorder point"
          icon={<AlertTriangle className="size-5" />}
          trend={{ value: "+3", direction: "up" }}
          accentColor="#F59E0B"
          iconBg="bg-amber-50 dark:bg-amber-950/50"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          title="Out of Stock"
          value={kpis.outOfStock}
          description="Zero availability"
          icon={<AlertTriangle className="size-5" />}
          trend={{ value: "-1", direction: "down" }}
          accentColor="#EF4444"
          iconBg="bg-red-50 dark:bg-red-950/50"
          iconColor="text-red-600 dark:text-red-400"
        />
        <KpiCard
          title="Pending Receipts"
          value={kpis.pendingReceipts}
          description="Awaiting validation"
          icon={<PackagePlus className="size-5" />}
          trend={{ value: "+2", direction: "up" }}
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

      {/* Recent Activity Feed — FRD §4 */}
      <div>
        <h2 className="mb-3 text-lg font-bold">Recent Activity</h2>
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4 sm:p-6">
            <Alert className="border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20">
              <Activity className="size-4 text-indigo-600 dark:text-indigo-400" />
              <AlertTitle className="text-indigo-900 dark:text-indigo-200">
                Activity feed will stream from the stock ledger
              </AlertTitle>
              <AlertDescription className="mt-2 flex flex-col gap-3 text-indigo-700/80 sm:flex-row sm:items-center dark:text-indigo-300/80">
                <span>Real-time updates via Supabase subscriptions</span>
                <Badge
                  variant="outline"
                  className="w-fit border-indigo-200 bg-indigo-100/50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-400"
                >
                  Coming Soon
                </Badge>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
