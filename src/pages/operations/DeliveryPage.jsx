import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Calendar, Columns, Download, List, PackageMinus, RefreshCcw, Search } from 'lucide-react'
import { gsap } from 'gsap'
import api from '../../api/axios'
import AppShell from '../../components/layout/AppShell'
import EmptyState from '../../components/ui/EmptyState'
import SkeletonRow from '../../components/ui/SkeletonRow'
import StatusBadge from '../../components/ui/StatusBadge'
import { useTableAnimation } from '../../hooks/useTableAnimation'
import { formatDateOnly, getApiErrorMessage } from '../../utils/api'

function downloadCsv(rows) {
  const header = ['Reference', 'Contact', 'Warehouse', 'Source Location', 'Schedule Date', 'Status', 'Lines']
  const csvRows = rows.map((row) => [
    row.reference,
    row.contact_name || '',
    row.warehouse_name || '',
    row.source_location_name || '',
    row.schedule_date || '',
    row.status,
    row.line_count,
  ])

  const csv = [header, ...csvRows]
    .map((columns) => columns.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'deliveries.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function DeliveryPage() {
  const navigate = useNavigate()
  const kanbanRef = useRef(null)
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    date_from: '',
    date_to: '',
  })

  const tbodyRef = useTableAnimation([deliveries, loading, viewMode])

  const loadDeliveries = async () => {
    setLoading(true)
    setError('')

    try {
      const params = { limit: 100 }
      if (filters.search) params.search = filters.search
      if (filters.status) params.status = filters.status
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to

      const response = await api.get('/deliveries', { params })
      setDeliveries(response.data.data.deliveries || [])
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load deliveries'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeliveries()
  }, [filters.search, filters.status, filters.date_from, filters.date_to])

  useEffect(() => {
    if (viewMode === 'kanban' && !loading && kanbanRef.current) {
      const cards = kanbanRef.current.querySelectorAll('.kanban-card')
      gsap.fromTo(
        cards,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.04, duration: 0.3, ease: 'power2.out' }
      )
    }
  }, [viewMode, loading, deliveries.length])

  const stats = useMemo(
    () => ({
      total: deliveries.length,
      draft: deliveries.filter((delivery) => delivery.status === 'draft').length,
      waiting: deliveries.filter((delivery) => delivery.status === 'waiting').length,
      ready: deliveries.filter((delivery) => delivery.status === 'ready').length,
      done: deliveries.filter((delivery) => delivery.status === 'done').length,
      late: deliveries.filter((delivery) => delivery.is_late).length,
    }),
    [deliveries]
  )

  const handleMarkReady = async (deliveryId) => {
    try {
      await api.post(`/deliveries/${deliveryId}/mark-ready`)
      await loadDeliveries()
    } catch (requestError) {
      window.alert(getApiErrorMessage(requestError, 'Unable to mark delivery ready'))
      await loadDeliveries()
    }
  }

  const handleValidate = async (deliveryId) => {
    if (!window.confirm('Validate this delivery and reduce stock from the source location?')) {
      return
    }

    try {
      await api.post(`/deliveries/${deliveryId}/validate`)
      await loadDeliveries()
    } catch (requestError) {
      window.alert(getApiErrorMessage(requestError, 'Unable to validate delivery'))
    }
  }

  const tabClass = ({ isActive }) =>
    `px-4 py-3 text-sm font-medium ${isActive ? 'text-primary border-b-2 border-primary -mb-px' : 'text-slate-500 hover:text-slate-300'}`

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Operations', href: '#' }, { label: 'Deliveries', href: '/operations/delivery' }]}>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-slate-100">Delivery Orders</h1>
      </div>

      <div className="flex border-b border-slate-800 mb-6">
        <NavLink to="/operations/receipts" className={tabClass}>
          Receipts
        </NavLink>
        <NavLink to="/operations/delivery" className={tabClass}>
          Delivery Orders
        </NavLink>
        <NavLink to="/operations/adjustment" className={tabClass}>
          Adjustments
        </NavLink>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="bg-[#161B22] border border-slate-800 rounded-xl px-5 py-3 mb-4 flex items-center gap-6 overflow-x-auto">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-slate-600 font-bold tracking-wider">Total</span>
          <span className="text-lg font-bold font-mono text-slate-100">{stats.total}</span>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-slate-600 font-bold tracking-wider">Draft</span>
          <span className="text-lg font-bold font-mono text-[#3083f8]">{stats.draft}</span>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-slate-600 font-bold tracking-wider">Waiting</span>
          <span className="text-lg font-bold font-mono text-orange-400">{stats.waiting}</span>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-slate-600 font-bold tracking-wider">Ready</span>
          <span className="text-lg font-bold font-mono text-purple-400">{stats.ready}</span>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-slate-600 font-bold tracking-wider">Done</span>
          <span className="text-lg font-bold font-mono text-emerald-400">{stats.done}</span>
        </div>
        <div className="w-px h-8 bg-slate-800 ml-auto" />
        <div className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/20">
          {stats.late} Late
        </div>
      </div>

      <div className="bg-[#161B22] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3 mb-4 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Search reference or customer..."
              className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-primary text-slate-100 placeholder:text-slate-600"
            />
          </div>

          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-primary text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-sm text-slate-300">
            <Calendar size={14} />
            <input
              type="date"
              value={filters.date_from}
              onChange={(event) => setFilters((prev) => ({ ...prev, date_from: event.target.value }))}
              className="bg-transparent focus:outline-none"
            />
            <span className="text-slate-600">to</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(event) => setFilters((prev) => ({ ...prev, date_to: event.target.value }))}
              className="bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-lg p-1 mr-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-primary' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'kanban' ? 'bg-slate-700 text-primary' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <Columns size={16} />
            </button>
          </div>

          <button
            onClick={loadDeliveries}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-1.5 px-3 text-sm text-slate-300 transition-colors"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          <button
            onClick={() => downloadCsv(deliveries)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-1.5 px-3 text-sm text-slate-300 transition-colors"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => navigate('/operations/delivery/new')}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            New Delivery
          </button>
        </div>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#161B22]">
          <table className="w-full">
            <tbody>
              <SkeletonRow cols={7} rows={5} />
            </tbody>
          </table>
        </div>
      ) : deliveries.length === 0 ? (
        <EmptyState
          icon={PackageMinus}
          title="No deliveries yet"
          description="Create a delivery when goods leave the warehouse."
          actionLabel="+ New Delivery"
          onAction={() => navigate('/operations/delivery/new')}
        />
      ) : viewMode === 'list' ? (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#161B22]">
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead className="bg-[#21262D] text-slate-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4">Reference</th>
                <th className="px-4 py-4">Customer / Contact</th>
                <th className="px-4 py-4">Warehouse / Source</th>
                <th className="px-4 py-4">Schedule Date</th>
                <th className="px-4 py-4">Lines</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef} className="divide-y divide-slate-800">
              {deliveries.map((delivery) => (
                <tr
                  key={delivery.id}
                  onClick={(event) => {
                    if (event.target.closest('button')) return
                    navigate(`/operations/delivery/${delivery.id}`)
                  }}
                  className={`group cursor-pointer hover:bg-slate-800/50 transition-colors ${delivery.status === 'waiting' ? 'border-l-2 border-orange-500 bg-orange-500/5' : delivery.is_late ? 'border-l-2 border-rose-500 bg-rose-500/5' : 'border-l-2 border-transparent'}`}
                >
                  <td className="px-5 py-4 font-mono text-xs text-purple-400 font-semibold group-hover:underline">{delivery.reference}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-200">{delivery.contact_name || '—'}</span>
                      <span className="text-xs text-slate-500">{delivery.delivery_address || 'No address'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-200">{delivery.warehouse_name}</span>
                      <span className="text-xs text-slate-500">{delivery.source_location_name || 'No source location'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-4 ${delivery.is_late ? 'text-rose-400' : 'text-slate-400'}`}>{formatDateOnly(delivery.schedule_date)}</td>
                  <td className="px-4 py-4 text-slate-500">{delivery.line_count} lines</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={delivery.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {['draft', 'waiting'].includes(delivery.status) && (
                        <button
                          onClick={() => handleMarkReady(delivery.id)}
                          className="px-3 py-1 rounded-lg text-xs font-bold border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                        >
                          Mark Ready
                        </button>
                      )}
                      {delivery.status === 'ready' && (
                        <button
                          onClick={() => handleValidate(delivery.id)}
                          className="px-3 py-1 rounded-lg text-xs font-bold border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        >
                          Validate
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/operations/delivery/${delivery.id}`)}
                        className="px-3 py-1 rounded-lg text-xs font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                      >
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={kanbanRef} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {['draft', 'waiting', 'ready', 'done'].map((status) => {
            const items = deliveries.filter((delivery) => delivery.status === status)
            let colorClass = 'bg-slate-800 border-slate-700 text-slate-400'
            if (status === 'draft') colorClass = 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            if (status === 'waiting') colorClass = 'bg-orange-500/10 border-orange-500/30 text-orange-400'
            if (status === 'ready') colorClass = 'bg-purple-500/10 border-purple-500/30 text-purple-400'
            if (status === 'done') colorClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'

            return (
              <div key={status} className="flex flex-col gap-3">
                <div className={`px-4 py-3 rounded-xl border flex items-center justify-between shadow-sm ${colorClass}`}>
                  <span className="font-bold uppercase tracking-wider text-xs">{status}</span>
                  <span className="bg-background-dark/50 px-2 py-0.5 rounded text-[10px] font-bold">{items.length}</span>
                </div>

                <div className="flex flex-col gap-3 min-h-[100px]">
                  {items.map((delivery) => (
                    <div
                      key={delivery.id}
                      onClick={() => navigate(`/operations/delivery/${delivery.id}`)}
                      className={`kanban-card bg-[#21262D] border rounded-lg p-3 cursor-pointer transition-colors shadow-lg ${delivery.status === 'waiting' ? 'border-orange-500/40' : 'border-slate-700 hover:border-primary/50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-purple-400 font-semibold">{delivery.reference}</span>
                        <StatusBadge status={delivery.status} />
                      </div>
                      <div className="text-sm font-medium text-slate-300">{delivery.contact_name || 'No contact'}</div>
                      <div className="mt-1 text-xs text-slate-500">{delivery.source_location_name || 'No source location'}</div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{formatDateOnly(delivery.schedule_date)}</span>
                        <span>{delivery.line_count} lines</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
