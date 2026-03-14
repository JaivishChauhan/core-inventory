import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeftRight,
  Box,
  Calendar,
  ChevronDown,
  PackageCheck,
  Plus,
  Search,
  Sparkles,
  Truck,
} from 'lucide-react'
import { gsap } from 'gsap'
import api from '../api/axios'
import AppShell from '../components/layout/AppShell'
import SkeletonRow from '../components/ui/SkeletonRow'
import SkuPill from '../components/ui/SkuPill'
import StatusBadge from '../components/ui/StatusBadge'
import StockBar from '../components/ui/StockBar'
import MiniSparkline from '../components/ui/MiniSparkline'
import MagneticButton from '../components/ui/MagneticButton'
import StockFlowChart from '../components/charts/StockFlowChart'
import CategoryDonut from '../components/charts/CategoryDonut'
import { useScrollReveal, useCounterOnScroll, useTableScrollReveal } from '../hooks/useScrollReveal'
import useAuthStore from '../store/authStore'
import { formatDateTime, getApiErrorMessage } from '../utils/api'

const emptyStats = {
  total_stock_units: 0,
  low_stock_count: 0,
  pending_receipts: 0,
  pending_deliveries: 0,
  waiting_deliveries: 0,
  scheduled_transfers: 0,
  late_receipts: 0,
  late_deliveries: 0,
}

const operationMeta = {
  receipt: { label: 'Receipt', color: 'text-emerald-300' },
  delivery: { label: 'Delivery', color: 'text-indigo-300' },
  adjustment: { label: 'Adjustment', color: 'text-amber-300' },
  transfer: { label: 'Transfer', color: 'text-sky-300' },
}

const KPI_COLOR = {
  blue: {
    glow: 'glow-blue',
    iconBg: 'bg-blue-500/10',
    iconBorder: 'border-blue-500/20',
    iconText: 'text-blue-400',
    blobBg: 'bg-blue-500/10',
    gradient: 'from-transparent via-blue-400/40 to-transparent',
  },
  red: {
    glow: 'glow-red',
    iconBg: 'bg-rose-500/10',
    iconBorder: 'border-rose-500/20',
    iconText: 'text-rose-400',
    blobBg: 'bg-rose-500/10',
    gradient: 'from-transparent via-rose-400/40 to-transparent',
  },
  amber: {
    glow: 'glow-amber',
    iconBg: 'bg-amber-500/10',
    iconBorder: 'border-amber-500/20',
    iconText: 'text-amber-400',
    blobBg: 'bg-amber-500/10',
    gradient: 'from-transparent via-amber-400/40 to-transparent',
  },
  purple: {
    glow: 'glow-blue',
    iconBg: 'bg-purple-500/10',
    iconBorder: 'border-purple-500/20',
    iconText: 'text-purple-400',
    blobBg: 'bg-purple-500/10',
    gradient: 'from-transparent via-purple-400/40 to-transparent',
  },
  green: {
    glow: 'glow-green',
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-500/20',
    iconText: 'text-emerald-400',
    blobBg: 'bg-emerald-500/10',
    gradient: 'from-transparent via-emerald-400/40 to-transparent',
  },
}

function KpiCard({ stat, value }) {
  const numRef = useRef(null)
  useCounterOnScroll(Number(value || 0), numRef, 1.4)

  const palette = KPI_COLOR[stat.color] || KPI_COLOR.blue

  return (
    <div
      className={[
        'relative overflow-hidden glass-elevated card-hover rounded-xl p-5 border border-slate-800/50 kpi-card group cursor-default scroll-reveal-item',
        stat.critical ? 'critical-pulse glow-red border-rose-500/20' : palette.glow,
      ].join(' ')}
    >
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${palette.gradient}`} />
      <div
        className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${palette.blobBg} blur-xl group-hover:opacity-70 transition-all duration-500`}
      />

      <div
        className={`w-10 h-10 rounded-lg ${palette.iconBg} border ${palette.iconBorder} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
      >
        <stat.icon size={18} className={palette.iconText} />
      </div>

      <p ref={numRef} className="kpi-number text-3xl font-bold font-mono mt-4">
        {Number(value || 0).toLocaleString()}
      </p>
      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mt-1">{stat.label}</p>
      {stat.sub && <p className="text-xs text-slate-600 mt-1">{stat.sub}</p>}
      {stat.trend && <MiniSparkline data={stat.trend} color={stat.color} />}
    </div>
  )
}

const kpiCards = [
  {
    key: 'total_stock_units',
    label: 'Units On Hand',
    icon: Box,
    color: 'blue',
    trend: [12, 14, 13, 16, 18, 17, 19],
  },
  {
    key: 'low_stock_count',
    label: 'Low / Out',
    icon: AlertTriangle,
    color: 'red',
    trend: [8, 7, 9, 6, 5, 7, 6],
    critical: true,
  },
  {
    key: 'pending_receipts',
    label: 'Pending Receipts',
    icon: PackageCheck,
    color: 'amber',
    trend: [4, 6, 5, 7, 6, 8, 7],
  },
  {
    key: 'pending_deliveries',
    label: 'Pending Deliveries',
    icon: Truck,
    color: 'purple',
    trend: [5, 8, 6, 9, 8, 10, 9],
  },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const bannerRef = useRef(null)
  const kpiRef = useScrollReveal({ stagger: 0.1, y: 40 })
  const chartsRef = useScrollReveal({ stagger: 0.08, y: 24 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(emptyStats)
  const [recentOps, setRecentOps] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [flowData, setFlowData] = useState([])
  const [categoryData, setCategoryData] = useState([])

  const tbodyRef = useTableScrollReveal([recentOps, loading])

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [statsRes, recentRes, alertsRes, flowRes, categoryRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent'),
          api.get('/ai/low-stock-alerts'),
          api.get('/dashboard/stock-flow'),
          api.get('/dashboard/category-breakdown'),
        ])

        if (!active) return

        setStats({ ...emptyStats, ...(statsRes.data.data || {}) })
        setRecentOps(recentRes.data.data.recent || [])
        setLowStockItems(alertsRes.data.data.alerts || [])
        setFlowData(flowRes.data.data.flow || [])
        setCategoryData(categoryRes.data.data.categories || [])
      } catch (requestError) {
        if (!active) return
        setError(getApiErrorMessage(requestError, 'Unable to load dashboard'))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (loading) return

    const ctx = gsap.context(() => {
      if (bannerRef.current && lowStockItems.length > 0) {
        gsap.fromTo(
          bannerRef.current,
          { y: -40, opacity: 0, height: 0, marginBottom: 0 },
          { y: 0, opacity: 1, height: 'auto', marginBottom: 24, duration: 0.4, ease: 'power3.out' }
        )
      }

    })

    return () => ctx.revert()
  }, [loading, lowStockItems.length])

  const greetingName = user?.name?.split(' ')[0] || 'Inventory'
  const dateLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date())

  const mixSegments = useMemo(() => {
    const items = [
      { label: 'Receipts', value: stats.pending_receipts, color: '#60A5FA' },
      { label: 'Deliveries', value: stats.pending_deliveries, color: '#A78BFA' },
      { label: 'Transfers', value: stats.scheduled_transfers, color: '#34D399' },
      { label: 'Low Stock', value: stats.low_stock_count, color: '#F97316' },
    ]
    const total = items.reduce((sum, item) => sum + item.value, 0) || 1
    let cursor = 0
    const stops = items.map((item) => {
      const start = cursor
      const pct = (item.value / total) * 100
      cursor += pct
      return { ...item, start, end: cursor }
    })
    return { total, stops }
  }, [stats])

  const donutStyle = {
    background: `conic-gradient(${mixSegments.stops
      .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
      .join(', ')})`,
  }

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }]}>
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 mb-4 flex items-center gap-3 text-xs">
        <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">DEMO</span>
        <span className="text-slate-400">
          Showing seeded demo data · Login: <strong className="text-slate-300 font-mono">admin</strong> /{' '}
          <strong className="text-slate-300 font-mono">password123</strong>
        </span>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#0b0f1c] via-[#11162a] to-[#0a0d18] p-6 mb-6">
        <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[#3B82F6]/10 blur-3xl" />
        <div className="absolute bottom-[-30%] left-[-10%] h-56 w-56 rounded-full bg-[#A855F7]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 bg-[#0f1527]/80 border border-slate-800 rounded-full px-4 py-2 w-full lg:max-w-md">
              <Search size={16} className="text-slate-500" />
              <input
                className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
                placeholder="Search SKU, receipt, delivery..."
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <Calendar size={14} />
              <span>{dateLabel}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Inventory Command</p>
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-100 mt-2">
                Hello, {greetingName}
                <span className="inline-flex items-center gap-2 ml-3 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                  <Sparkles size={14} /> Live sync
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-2">Here’s the pulse of your warehouses today.</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="h-10 px-4 rounded-full bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                This month <ChevronDown size={14} />
              </button>
              <MagneticButton
                onClick={() => navigate('/operations/receipts/new')}
                className="h-10 px-4 rounded-full bg-primary text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/30"
              >
                <Plus size={14} /> New Receipt
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {!loading && lowStockItems.length > 0 && (
        <div ref={bannerRef} className="overflow-hidden">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="text-rose-400 animate-pulse" size={16} />
              <span className="text-sm text-rose-300 ml-2">
                {lowStockItems.length} products are at or below reorder level
              </span>
            </div>
            <Link to="/products?filter=low" className="text-xs text-rose-300 underline hover:text-rose-200">
              View Low Stock
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="xl:col-span-2 flex flex-col gap-5">
          <div ref={kpiRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {kpiCards.map((card) => {
              const value = stats[card.key] ?? 0
              const resolved = {
                ...card,
                critical: card.key === 'low_stock_count' ? value > 0 : Boolean(card.critical),
              }
              return <KpiCard key={card.key} stat={resolved} value={value} />
            })}
          </div>

          <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 scroll-reveal-item">
              <StockFlowChart data={flowData} />
            </div>
            <div className="scroll-reveal-item">
              <CategoryDonut data={categoryData} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-slate-800/80 bg-[#0f1426] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-rose-300">
                <AlertTriangle size={14} />
                <h3 className="text-sm font-semibold">Low Stock Alerts</h3>
              </div>
              <span className="text-xs bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-full">{lowStockItems.length}</span>
            </div>

            <div className="divide-y divide-slate-800">
              {loading ? (
                <div className="py-4 animate-pulse flex flex-col gap-4">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-800 rounded w-1/2" />
                </div>
              ) : lowStockItems.length === 0 ? (
                <div className="py-6 text-sm text-slate-500">No low-stock alerts right now.</div>
              ) : (
                lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.product_id} className="py-3 flex items-center justify-between group">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-slate-200 group-hover:text-primary transition-colors">{item.product_name}</span>
                      <SkuPill sku={item.sku} />
                    </div>
                    <div className="flex flex-col items-end gap-1 w-20">
                      <span className={`text-sm font-mono font-bold ${item.severity === 'critical' ? 'text-rose-300' : 'text-amber-300'}`}>
                        {item.on_hand}
                      </span>
                      <StockBar value={item.on_hand} max={Math.max(item.reorder_level * 2, 1)} status={item.severity} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 mt-1 border-t border-slate-800">
              <Link to="/products?filter=low" className="text-xs text-primary hover:underline">
                View All Products
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#0f1426] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-100">Operations Mix</h3>
              <span className="text-xs text-slate-500">This week</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 rounded-full p-[10px] bg-[#0b1020]" style={donutStyle}>
                <div className="absolute inset-[22px] rounded-full bg-[#0f1426] border border-slate-800 flex items-center justify-center">
                  <span className="text-sm font-semibold text-slate-200">{mixSegments.total}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-xs text-slate-400">
                {mixSegments.stops.map((segment) => (
                  <div key={segment.label} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                    <span className="text-slate-300">{segment.label}</span>
                    <span className="ml-auto text-slate-500">{segment.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#0f1426] p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <MagneticButton
                onClick={() => navigate('/operations/receipts/new')}
                className="h-11 flex items-center justify-center gap-2 bg-slate-800/70 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-all"
              >
                <Plus size={14} className="text-primary" /> New Receipt
              </MagneticButton>
              <MagneticButton
                onClick={() => navigate('/operations/delivery/new')}
                className="h-11 flex items-center justify-center gap-2 bg-slate-800/70 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-all"
              >
                <Plus size={14} className="text-primary" /> New Delivery
              </MagneticButton>
              <button
                onClick={() => navigate('/operations/adjustment')}
                className="h-11 flex items-center justify-center gap-2 bg-slate-800/70 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-all"
              >
                <ArrowLeftRight size={14} className="text-primary" /> Stock Adjust
              </button>
              <button
                onClick={() => navigate('/history')}
                className="h-11 flex items-center justify-center gap-2 bg-slate-800/70 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-all"
              >
                <Box size={14} className="text-primary" /> View History
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end mb-4">
        <h2 className="text-base font-semibold text-slate-100">Recent Operations</h2>
        <Link to="/history" className="text-xs text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0f1426]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#121a2c] text-slate-400 uppercase text-[11px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">REFERENCE</th>
              <th className="px-6 py-4">TYPE</th>
              <th className="px-6 py-4">CONTACT</th>
              <th className="px-6 py-4">DATE</th>
              <th className="px-6 py-4">STATUS</th>
            </tr>
          </thead>
          <tbody ref={tbodyRef} className="divide-y divide-slate-800">
            {loading ? (
              <SkeletonRow cols={5} rows={5} />
            ) : recentOps.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No recent operations yet
                </td>
              </tr>
            ) : (
              recentOps.map((row) => {
                const meta = operationMeta[row.operation_type] || { label: row.operation_type, color: 'text-slate-300' }

                return (
                  <tr key={row.reference} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-primary/10 border border-primary/20 text-primary">
                        {row.reference}
                      </span>
                    </td>
                    <td className={`px-6 py-4 ${meta.color}`}>{meta.label}</td>
                    <td className="px-6 py-4 text-slate-300">{row.contact_name || row.responsible_name || '—'}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDateTime(row.created_at)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}
