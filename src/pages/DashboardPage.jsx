import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeftRight,
  Box,
  PackageCheck,
  Plus,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { gsap } from 'gsap'
import api from '../api/axios'
import AppShell from '../components/layout/AppShell'
import SkeletonRow from '../components/ui/SkeletonRow'
import SkuPill from '../components/ui/SkuPill'
import StatusBadge from '../components/ui/StatusBadge'
import StockBar from '../components/ui/StockBar'
import { useTableAnimation } from '../hooks/useTableAnimation'
import { formatDateTime, getApiErrorMessage } from '../utils/api'

const emptyStats = {
  total_stock_units: 0,
  low_stock_count: 0,
  pending_receipts: 0,
  pending_deliveries: 0,
  waiting_deliveries: 0,
  scheduled_transfers: 0,
}

const operationMeta = {
  receipt: { label: 'Receipt', color: 'text-emerald-400' },
  delivery: { label: 'Delivery', color: 'text-purple-400' },
  adjustment: { label: 'Adjustment', color: 'text-orange-400' },
  transfer: { label: 'Transfer', color: 'text-sky-400' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const bannerRef = useRef(null)
  const cardsContainerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(emptyStats)
  const [recentOps, setRecentOps] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])

  const tbodyRef = useTableAnimation([recentOps, loading])

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [statsRes, recentRes, alertsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent'),
          api.get('/ai/low-stock-alerts'),
        ])

        if (!active) return

        setStats(statsRes.data.data || emptyStats)
        setRecentOps(recentRes.data.data.recent || [])
        setLowStockItems(alertsRes.data.data.alerts || [])
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

      const cards = cardsContainerRef.current?.querySelectorAll('.kpi-card') || []
      gsap.fromTo(cards, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' })
    })

    return () => ctx.revert()
  }, [loading, lowStockItems.length])

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }]}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {!loading && lowStockItems.length > 0 && (
        <div ref={bannerRef} className="overflow-hidden">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="text-rose-400 animate-pulse" size={16} />
              <span className="text-sm text-rose-400 ml-2">
                {lowStockItems.length} products are at or below reorder level
              </span>
            </div>
            <Link to="/products?filter=low" className="text-xs text-rose-400 underline hover:text-rose-300">
              View Low Stock
            </Link>
          </div>
        </div>
      )}

      <div ref={cardsContainerRef} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="kpi-card bg-[#161B22] border border-slate-800 rounded-xl p-5 hover:border-primary/30 transition-colors">
          <div className="flex justify-between items-start">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Box size={20} />
            </div>
            <div className="text-xs flex items-center gap-0.5 text-emerald-400">
              <TrendingUp size={14} /> live
            </div>
          </div>
          <p className="text-3xl font-bold font-mono text-slate-100 mt-3">{Number(stats.total_stock_units || 0).toLocaleString()}</p>
          <p className="text-[11px] uppercase tracking-wider font-medium text-slate-500 mt-1">Units On Hand</p>
        </div>

        <div className="kpi-card bg-[#161B22] border border-slate-800 rounded-xl p-5 hover:border-primary/30 transition-colors relative">
          {stats.low_stock_count > 0 && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-400 animate-pulse" />}
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <p className="text-3xl font-bold font-mono mt-3 text-rose-400">{Number(stats.low_stock_count || 0).toLocaleString()}</p>
          <p className="text-[11px] uppercase tracking-wider font-medium text-slate-500 mt-1">Low / Out of Stock</p>
        </div>

        <div className="kpi-card bg-[#161B22] border border-slate-800 rounded-xl p-5 hover:border-primary/30 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <PackageCheck size={20} />
          </div>
          <p className="text-3xl font-bold font-mono text-slate-100 mt-3">{Number(stats.pending_receipts || 0).toLocaleString()}</p>
          <p className="text-[11px] uppercase tracking-wider font-medium text-slate-500 mt-1">Pending Receipts</p>
        </div>

        <div className="kpi-card bg-[#161B22] border border-slate-800 rounded-xl p-5 hover:border-primary/30 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Truck size={20} />
          </div>
          <p className="text-3xl font-bold font-mono text-slate-100 mt-3">{Number(stats.pending_deliveries || 0).toLocaleString()}</p>
          <p className="text-[11px] uppercase tracking-wider font-medium text-slate-500 mt-1">Pending Deliveries</p>
          <p className={`text-xs mt-1 ${stats.waiting_deliveries > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
            {stats.waiting_deliveries || 0} waiting for stock
          </p>
        </div>

        <div className="kpi-card bg-[#161B22] border border-slate-800 rounded-xl p-5 hover:border-primary/30 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ArrowLeftRight size={20} />
          </div>
          <p className="text-3xl font-bold font-mono text-slate-100 mt-3">{Number(stats.scheduled_transfers || 0).toLocaleString()}</p>
          <p className="text-[11px] uppercase tracking-wider font-medium text-slate-500 mt-1">Scheduled Transfers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-base font-semibold text-slate-100">Recent Operations</h2>
            <Link to="/history" className="text-xs text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#161B22]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#21262D] text-slate-400 uppercase text-[11px] font-bold tracking-wider">
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
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-[#161B22] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle size={14} />
                <h3 className="text-sm font-semibold">Low Stock Alerts</h3>
              </div>
              <span className="text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full">{lowStockItems.length}</span>
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
                lowStockItems.map((item) => (
                  <div key={item.product_id} className="py-2.5 flex items-center justify-between group">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-slate-200 group-hover:text-primary transition-colors">{item.product_name}</span>
                      <SkuPill sku={item.sku} />
                    </div>
                    <div className="flex flex-col items-end gap-1 w-20">
                      <span className={`text-sm font-mono font-bold ${item.severity === 'critical' ? 'text-rose-400' : 'text-orange-400'}`}>
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

          <div className="bg-[#161B22] border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/operations/receipts/new')}
                className="h-11 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-primary/40 rounded-lg text-sm text-slate-300 transition-all group"
              >
                <Plus size={16} className="text-primary group-hover:scale-110 transition-transform" /> New Receipt
              </button>
              <button
                onClick={() => navigate('/operations/delivery/new')}
                className="h-11 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-primary/40 rounded-lg text-sm text-slate-300 transition-all group"
              >
                <Plus size={16} className="text-primary group-hover:scale-110 transition-transform" /> New Delivery
              </button>
              <button
                onClick={() => navigate('/operations/adjustment')}
                className="h-11 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-primary/40 rounded-lg text-sm text-slate-300 transition-all group"
              >
                <ArrowLeftRight size={16} className="text-primary group-hover:scale-110 transition-transform" /> Stock Adjust
              </button>
              <button
                onClick={() => navigate('/history')}
                className="h-11 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-primary/40 rounded-lg text-sm text-slate-300 transition-all group"
              >
                <Box size={16} className="text-primary group-hover:scale-110 transition-transform" /> View History
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
