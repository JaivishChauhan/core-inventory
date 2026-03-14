"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Clock3,
  Filter,
  Package,
  PackagePlus,
  Truck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MOVE_STATUS_CONFIG, MOVE_TYPE_LABELS } from "@/lib/constants"

type DashboardLocation = {
  id: string
  name: string
  type: string
  warehouseId: string
  warehouseName: string
}

type DashboardData = {
  kpis: {
    totalProducts: number
    lowStockCount: number
    outOfStockCount: number
    pendingReceipts: number
    pendingDeliveries: number
    scheduledTransfers: number
  }
  recentMoves: Array<{
    id: string
    productName: string
    sku: string
    quantity: number
    moveType: keyof typeof MOVE_TYPE_LABELS
    status: keyof typeof MOVE_STATUS_CONFIG
    createdAt: string
    reference: string | null
    sourceLocationName: string
    sourceWarehouseName: string | null
    destLocationName: string
    destWarehouseName: string | null
  }>
  filterOptions: {
    categories: string[]
    locations: DashboardLocation[]
    warehouses: Array<{
      id: string
      name: string
      code: string
      address: string | null
    }>
  }
}

type DashboardFilterState = {
  moveType: "adjustment" | "all" | "delivery" | "internal_transfer" | "receipt"
  status: "all" | "canceled" | "done" | "draft" | "ready" | "waiting"
  warehouseId: string
  locationId: string
  category: string
}

function KpiCard({
  title,
  value,
  description,
  icon,
  accentClassName,
}: {
  title: string
  value: number
  description: string
  icon: ReactNode
  accentClassName?: string
}) {
  return (
    <Card className="card-hover group relative overflow-hidden border-border/60 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-xl bg-muted/60 p-2.5 text-primary transition-transform duration-200 group-hover:scale-110">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold tracking-tight">{value}</div>
        <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
      </CardContent>
      <div
        className={`absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-indigo-600 to-violet-600 ${accentClassName ?? ""}`}
      />
    </Card>
  )
}

export function DashboardOverview() {
  const [filters, setFilters] = useState<DashboardFilterState>({
    moveType: "all",
    status: "all",
    warehouseId: "all",
    locationId: "all",
    category: "all",
  })

  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["dashboard", filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams()

      if (filters.moveType !== "all") searchParams.set("moveType", filters.moveType)
      if (filters.status !== "all") searchParams.set("status", filters.status)
      if (filters.warehouseId !== "all") searchParams.set("warehouseId", filters.warehouseId)
      if (filters.locationId !== "all") searchParams.set("locationId", filters.locationId)
      if (filters.category !== "all") searchParams.set("category", filters.category)

      const res = await fetch(`/api/inventory/dashboard?${searchParams.toString()}`)
      return res.json() as Promise<DashboardData>
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const locations = useMemo(() => {
    const allLocations = data?.filterOptions.locations ?? []
    return allLocations.filter(
      (location) =>
        location.type === "internal" &&
        (filters.warehouseId === "all" || location.warehouseId === filters.warehouseId)
    )
  }, [data?.filterOptions.locations, filters.warehouseId])

  const activeFilterCount = [
    filters.moveType,
    filters.status,
    filters.warehouseId,
    filters.locationId,
    filters.category,
  ].filter((value) => value !== "all").length

  const kpis = data?.kpis ?? {
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    scheduledTransfers: 0,
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span>Command </span>
            <span className="text-gradient">Center</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Real-time overview of inventory health, open operational work, and the
            latest ledger activity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="size-4" />
          {activeFilterCount > 0
            ? `${activeFilterCount} dashboard filter${activeFilterCount > 1 ? "s" : ""} active`
            : "Showing all live inventory data"}
        </div>
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <Select
              value={filters.moveType}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  moveType: value as DashboardFilterState["moveType"],
                }))
              }
            >
              <SelectTrigger className="w-full xl:w-[190px]">
                <SelectValue placeholder="Document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="receipt">Receipts</SelectItem>
                <SelectItem value="delivery">Deliveries</SelectItem>
                <SelectItem value="internal_transfer">Internal</SelectItem>
                <SelectItem value="adjustment">Adjustments</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  status: value as DashboardFilterState["status"],
                }))
              }
            >
              <SelectTrigger className="w-full xl:w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.warehouseId}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  warehouseId: value,
                  locationId: value === current.warehouseId ? current.locationId : "all",
                }))
              }
            >
              <SelectTrigger className="w-full xl:w-[220px]">
                <SelectValue placeholder="Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {data?.filterOptions.warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.locationId}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, locationId: value }))
              }
            >
              <SelectTrigger className="w-full xl:w-[220px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} ({location.warehouseName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, category: value }))
              }
            >
              <SelectTrigger className="w-full xl:w-[220px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {data?.filterOptions.categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  moveType: "all",
                  status: "all",
                  warehouseId: "all",
                  locationId: "all",
                  category: "all",
                })
              }
            >
              Clear Filters
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Warehouse, location, and category filters shape inventory health metrics.
            Document and status filters refine the operational queues and recent activity.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Products In Stock"
          value={kpis.totalProducts}
          description="Catalog items with available inventory"
          icon={<Package className="size-5" />}
        />
        <KpiCard
          title="Low Stock"
          value={kpis.lowStockCount}
          description="Products at or below reorder threshold"
          icon={<AlertTriangle className="size-5" />}
        />
        <KpiCard
          title="Out of Stock"
          value={kpis.outOfStockCount}
          description="Products with zero available quantity"
          icon={<AlertTriangle className="size-5" />}
          accentClassName="from-red-500 to-red-400"
        />
        <KpiCard
          title="Pending Receipts"
          value={kpis.pendingReceipts}
          description="Incoming stock waiting to be validated"
          icon={<PackagePlus className="size-5" />}
        />
        <KpiCard
          title="Pending Deliveries"
          value={kpis.pendingDeliveries}
          description="Outgoing orders in draft, waiting, or ready"
          icon={<Truck className="size-5" />}
        />
        <KpiCard
          title="Scheduled Transfers"
          value={kpis.scheduledTransfers}
          description="Internal movements queued across warehouses"
          icon={<ArrowLeftRight className="size-5" />}
        />
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-indigo-600" />
              <CardTitle className="text-lg">Recent Ledger Activity</CardTitle>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Clock3 className="size-3.5" />
              Live feed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-xl border border-border/60 bg-muted/20"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="p-10 text-center text-sm text-destructive">
              Failed to load dashboard activity. Please refresh the page.
            </div>
          ) : data?.recentMoves.length ? (
            <div className="divide-y divide-border/60">
              {data.recentMoves.map((move) => (
                <div
                  key={move.id}
                  className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{MOVE_TYPE_LABELS[move.moveType]}</Badge>
                      <Badge
                        variant={
                          move.status === "done"
                            ? "success"
                            : move.status === "canceled"
                              ? "destructive"
                              : move.status === "waiting"
                                ? "warning"
                                : "outline"
                        }
                      >
                        {MOVE_STATUS_CONFIG[move.status].label}
                      </Badge>
                      {move.reference ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {move.reference}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <p className="font-semibold">
                        {move.productName}{" "}
                        <span className="font-mono text-xs text-muted-foreground">
                          {move.sku}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {move.sourceLocationName}
                        {move.sourceWarehouseName ? ` (${move.sourceWarehouseName})` : ""}
                        {" -> "}
                        {move.destLocationName}
                        {move.destWarehouseName ? ` (${move.destWarehouseName})` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 lg:text-right">
                    <div>
                      <p className="font-mono text-lg font-semibold">{move.quantity}</p>
                      <p className="text-xs text-muted-foreground">Quantity</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(move.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <Activity className="size-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-muted-foreground">
                  No ledger activity matches the current filters.
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Try clearing filters or create a new operation to populate the feed.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
