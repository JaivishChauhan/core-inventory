"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  ClipboardCheck,
  Clock3,
  Filter,
  IndianRupee,
  Package,
  PackagePlus,
  Plus,
  Truck,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
} from "recharts"
import { MOVE_STATUS_CONFIG, MOVE_TYPE_LABELS } from "@/lib/constants"

function formatINR(valueInCents: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(valueInCents / 100)
}

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
    totalInventoryValue: number
  }
  charts: {
    stockByCategory: Array<{ category: string; value: number }>
    recentFlow: Array<{ date: string; receipts: number; deliveries: number }>
    stockTrend: Array<{ date: string; stock: number }>
    topProducts: Array<{ name: string; quantity: number; value: number }>
    warehouseDistribution: Array<{
      warehouse: string
      stock: number
      fill: string
    }>
    moveTypeDistribution: Array<{ type: string; count: number }>
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
  href,
  accentClassName,
}: {
  title: string
  value: number
  description: string
  icon: ReactNode
  href?: string
  accentClassName?: string
}) {
  const content = (
    <Card
      className={`card-hover group shadow-soft relative overflow-hidden border-border/60 ${href ? "cursor-pointer" : ""}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-xl bg-muted/60 p-2.5 text-primary transition-transform duration-200 group-hover:scale-110">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold tracking-tight">
          {title === "Total Inventory Value" ? formatINR(value * 100) : value}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
      </CardContent>
      <div
        className={`absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-indigo-600 to-violet-600 ${accentClassName ?? ""}`}
      />
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
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

      if (filters.moveType !== "all")
        searchParams.set("moveType", filters.moveType)
      if (filters.status !== "all") searchParams.set("status", filters.status)
      if (filters.warehouseId !== "all")
        searchParams.set("warehouseId", filters.warehouseId)
      if (filters.locationId !== "all")
        searchParams.set("locationId", filters.locationId)
      if (filters.category !== "all")
        searchParams.set("category", filters.category)

      const res = await fetch(
        `/api/inventory/dashboard?${searchParams.toString()}`
      )

      if (!res.ok) {
        throw new Error(`Dashboard request failed with status ${res.status}`)
      }

      return res.json() as Promise<DashboardData>
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const filterOptions = {
    categories: data?.filterOptions?.categories ?? [],
    locations: data?.filterOptions?.locations ?? [],
    warehouses: data?.filterOptions?.warehouses ?? [],
  }

  const locations = useMemo(() => {
    const allLocations = filterOptions.locations
    return allLocations.filter(
      (location) =>
        location.type === "internal" &&
        (filters.warehouseId === "all" ||
          location.warehouseId === filters.warehouseId)
    )
  }, [filterOptions.locations, filters.warehouseId])

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
    totalInventoryValue: 0,
  }

  const charts = {
    stockByCategory: data?.charts?.stockByCategory ?? [],
    recentFlow: data?.charts?.recentFlow ?? [],
    stockTrend: data?.charts?.stockTrend ?? [],
    topProducts: data?.charts?.topProducts ?? [],
    warehouseDistribution: data?.charts?.warehouseDistribution ?? [],
    moveTypeDistribution: data?.charts?.moveTypeDistribution ?? [],
  }

  const recentMoves = data?.recentMoves ?? []

  // Define colors for the Pie chart
  const PIE_COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#8b5cf6", "#f43f5e"]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span>Command </span>
            <span className="text-gradient">Center</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Real-time overview of inventory health, open operational work, and
            the latest ledger activity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="size-4" />
          {activeFilterCount > 0
            ? `${activeFilterCount} dashboard filter${activeFilterCount > 1 ? "s" : ""} active`
            : "Showing all live inventory data"}
        </div>
      </div>

      <Card className="shadow-soft border-border/60">
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
                  locationId:
                    value === current.warehouseId ? current.locationId : "all",
                }))
              }
            >
              <SelectTrigger className="w-full xl:w-[220px]">
                <SelectValue placeholder="Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {filterOptions.warehouses.map((warehouse) => (
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
                {filterOptions.categories.map((category) => (
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
            Warehouse, location, and category filters shape inventory health
            metrics. Document and status filters refine the operational queues
            and recent activity.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Products In Stock"
          value={kpis.totalProducts}
          description="Catalog items with available inventory"
          icon={<Package className="size-5" />}
          href="/products"
        />
        <KpiCard
          title="Low Stock"
          value={kpis.lowStockCount}
          description="Products at or below reorder threshold"
          icon={<AlertTriangle className="size-5" />}
          href="/products"
        />
        <KpiCard
          title="Out of Stock"
          value={kpis.outOfStockCount}
          description="Products with zero available quantity"
          icon={<AlertTriangle className="size-5" />}
          accentClassName="from-red-500 to-red-400"
          href="/products"
        />
        <KpiCard
          title="Pending Receipts"
          value={kpis.pendingReceipts}
          description="Incoming stock waiting to be validated"
          icon={<PackagePlus className="size-5" />}
          href="/operations/receipts"
        />
        <KpiCard
          title="Pending Deliveries"
          value={kpis.pendingDeliveries}
          description="Outgoing orders in draft, waiting, or ready"
          icon={<Truck className="size-5" />}
          href="/operations/deliveries"
        />
        <KpiCard
          title="Scheduled Transfers"
          value={kpis.scheduledTransfers}
          description="Internal movements queued across warehouses"
          icon={<ArrowLeftRight className="size-5" />}
          href="/operations/transfers"
        />
        <KpiCard
          title="Total Inventory Value"
          value={kpis.totalInventoryValue / 100}
          description="Estimated holding value (based on current price)"
          icon={<IndianRupee className="size-5" />}
          accentClassName="from-emerald-600 to-teal-500"
        />
      </div>

      {/* ─── Advanced Analytics Charts ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Inventory Flow Chart */}
        <Card className="shadow-soft border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="size-4 text-indigo-600" />
                  Recent Inventory Flow
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Receipts vs. Deliveries over the last 7 days
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] w-full pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts.recentFlow}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  dy={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                />
                <Bar
                  dataKey="receipts"
                  name="Receipts"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="deliveries"
                  name="Deliveries"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock Distribution Pie Chart */}
        <Card className="shadow-soft border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="size-4 text-violet-600" />
                  Stock Distribution
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Top 5 categories by allocated quantity
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex h-[300px] w-full items-center justify-center pb-4">
            {charts.stockByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={charts.stockByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="category"
                  >
                    {charts.stockByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted-foreground">
                No stock available across categories.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Trend Line Chart */}
        <Card className="shadow-soft border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-emerald-600" />
                  Stock Level Trend
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Total inventory over the last 30 days
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] w-full pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={charts.stockTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="stockGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  dy={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="stock"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#stockGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products by Quantity */}
        <Card className="shadow-soft border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="size-4 text-indigo-600" />
                  Top Products
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Highest stock quantities by product
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] w-full pb-4">
            {charts.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.topProducts}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="quantity"
                    fill="#4f46e5"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No product data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warehouse Distribution */}
        <Card className="shadow-soft border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="size-4 text-violet-600" />
                  Warehouse Distribution
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Stock allocation across warehouses
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] w-full pb-4">
            {charts.warehouseDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="20%"
                  outerRadius="90%"
                  data={charts.warehouseDistribution}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    minAngle={15}
                    background
                    clockWise
                    dataKey="stock"
                    cornerRadius={10}
                  />
                  <Legend
                    iconSize={10}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No warehouse data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Move Type Distribution */}
        <Card className="shadow-soft border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowLeftRight className="size-4 text-emerald-600" />
                  Operation Types
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Distribution of move types in the last 30 days
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] w-full pb-4">
            {charts.moveTypeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.moveTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {charts.moveTypeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No operation data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Quick Actions ─── */}
      <Card className="shadow-soft border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/products">
              <Plus className="size-4" />
              New Product
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/operations/receipts">
              <PackagePlus className="size-4" />
              New Receipt
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/operations/deliveries">
              <Truck className="size-4" />
              New Delivery
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/operations/transfers">
              <ArrowLeftRight className="size-4" />
              New Transfer
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/operations/adjustments">
              <ClipboardCheck className="size-4" />
              New Adjustment
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-border/60">
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
          ) : recentMoves.length > 0 ? (
            <div className="divide-y divide-border/60">
              {recentMoves.map((move) => (
                <div
                  key={move.id}
                  className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {MOVE_TYPE_LABELS[move.moveType]}
                      </Badge>
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
                        {move.sourceWarehouseName
                          ? ` (${move.sourceWarehouseName})`
                          : ""}
                        {" -> "}
                        {move.destLocationName}
                        {move.destWarehouseName
                          ? ` (${move.destWarehouseName})`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 lg:text-right">
                    <div>
                      <p className="font-mono text-lg font-semibold">
                        {move.quantity}
                      </p>
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
                  Try clearing filters or create a new operation to populate the
                  feed.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
