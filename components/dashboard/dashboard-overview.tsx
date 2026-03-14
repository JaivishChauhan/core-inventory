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
} from "recharts"
import { MOVE_STATUS_CONFIG, MOVE_TYPE_LABELS } from "@/lib/constants"

function formatINR(valueInCents: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(valueInCents / 100)
}

function KpiCard({ title, value, description, icon, href }: { title: string; value: number | string; description: string; icon: ReactNode; href?: string; }) {
  const content = (
    <div className="glass panel border-gradient p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 cursor-pointer h-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-primary/10 text-primary rounded-lg">{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  )
  return href ? <Link href={href} className="block h-full">{content}</Link> : content
}

export function DashboardOverview() {
  const [filters, setFilters] = useState({
    moveType: "all",
    status: "all",
    warehouseId: "all",
    locationId: "all",
    category: "all",
  })

  const { data, isLoading } = useQuery<any>({
    queryKey: ["dashboard", filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "all") searchParams.set(key, value)
      })
      const res = await fetch(`/api/inventory/dashboard?${searchParams.toString()}`)
      if (!res.ok) throw new Error("Network error")
      return res.json()
    },
  })

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const { kpis, charts, recentMoves, filterOptions } = data

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full">
      <section className="glass panel border-gradient p-8 rounded-2xl bg-gradient-to-br from-background to-muted/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Command Center</h1>
            <p className="text-muted-foreground text-lg">Monitor inventory flow, track warehouse operations, and analyze stock metrics.</p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="gap-2">
              <Link href="/move-history?new=true">
                <ArrowLeftRight className="h-4 w-4" /> Move Stock
              </Link>
            </Button>
            <Button variant="secondary" asChild className="gap-2">
              <Link href="/operations/receipts?new=true">
                <Truck className="h-4 w-4" /> Receive
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="glass panel border-gradient p-4 rounded-xl flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-sm font-medium mr-2 text-muted-foreground">
          <Filter className="w-4 h-4" /> Filters
        </div>
        <Select value={filters.warehouseId} onValueChange={(v) => setFilters(f => ({ ...f, warehouseId: v }))}>
          <SelectTrigger className="w-[180px] bg-background/50"><SelectValue placeholder="Warehouse" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {filterOptions.warehouses.map((w: any) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.category} onValueChange={(v) => setFilters(f => ({ ...f, category: v }))}>
          <SelectTrigger className="w-[180px] bg-background/50"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {filterOptions.categories.map((c: string) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.moveType} onValueChange={(v: any) => setFilters(f => ({ ...f, moveType: v }))}>
          <SelectTrigger className="w-[180px] bg-background/50"><SelectValue placeholder="Move Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Moves</SelectItem>
            {Object.entries(MOVE_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v as string}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {kpis.lowStockCount > 0 && (
        <div className="glass panel border-gradient border-destructive/50 bg-destructive/5 text-destructive p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Attention Required</p>
              <p className="text-sm opacity-90">{kpis.lowStockCount} items are running low on stock. {kpis.outOfStockCount > 0 && `${kpis.outOfStockCount} items are out of stock.`}</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" asChild>
            <Link href="/products?filter=low_stock">View Items</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Value" value={formatINR(kpis.totalInventoryValue * 100)} description="Total inventory holding value" icon={<IndianRupee className="w-5 h-5"/>} />
        <KpiCard title="Products" value={kpis.totalProducts} description="Unique SKUs in catalog" icon={<Package className="w-5 h-5"/>} href="/products" />
        <KpiCard title="Pending Receipts" value={kpis.pendingReceipts} description="Inbound shipments arriving" icon={<Truck className="w-5 h-5"/>} href="/operations/receipts" />
        <KpiCard title="Pending Deliveries" value={kpis.pendingDeliveries} description="Outbound orders waiting" icon={<PackagePlus className="w-5 h-5"/>} href="/operations/deliveries" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass panel border-gradient p-6 rounded-2xl h-[400px]">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5"/> Activity Trend</h3>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={charts.recentFlow || []}>
                <defs>
                  <linearGradient id="colorReceipts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.8)" }} />
                <Legend />
                <Area type="monotone" dataKey="receipts" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReceipts)" />
                <Area type="monotone" dataKey="deliveries" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorDeliveries)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="glass panel border-gradient p-6 rounded-2xl h-[300px]">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><PieChartIcon className="w-5 h-5"/> Category Breakdown</h3>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie data={charts.stockByCategory || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="category">
                    {(charts.stockByCategory || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316"][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", background: "rgba(0,0,0,0.8)" }} />
                </PieChart>
              </ResponsiveContainer>
             </div>
             <div className="glass panel border-gradient p-6 rounded-2xl h-[300px]">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5"/> Top Products</h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={(charts.topProducts || []).slice(0, 5)} layout="vertical" margin={{ left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", background: "rgba(0,0,0,0.8)" }} />
                  <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
             </div>
          </div>
        </div>

        <div className="glass panel border-gradient p-6 rounded-2xl flex flex-col h-[calc(400px+300px+24px)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Activity className="w-5 h-5"/> Recent Intel</h3>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground"><Link href="/move-history">View All</Link></Button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentMoves.length > 0 ? (
              recentMoves.map((m: any) => (
                <div key={m.id} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{m.productName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{m.sku} &bull; Qty: {m.quantity}</div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] uppercase font-semibold tracking-wider ${
                      m.status === "done" ? "border-emerald-500/30 text-emerald-500" :
                      m.status === "ready" ? "border-blue-500/30 text-blue-500" :
                      "border-orange-500/30 text-orange-500"
                    }`}>
                      {MOVE_STATUS_CONFIG[m.status as keyof typeof MOVE_STATUS_CONFIG]?.label || m.status}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground/80 flex items-center gap-2 mt-1">
                    <span className="truncate max-w-[120px]">{m.sourceLocationName}</span>
                    <ArrowLeftRight className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{m.destLocationName}</span>
                  </div>
                </div>
              ))
            ) : (
               <div className="text-center text-sm text-muted-foreground mt-10">No recent activity detected.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
