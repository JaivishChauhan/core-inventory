import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Calendar, Columns, Download, List, PackageCheck, RefreshCcw, Search } from 'lucide-react'
import api from '../../api/axios'
import AppShell from '../../components/layout/AppShell'
import EmptyState from '../../components/ui/EmptyState'
import SkeletonRow from '../../components/ui/SkeletonRow'
import StatusBadge from '../../components/ui/StatusBadge'
import { useTableScrollReveal } from '../../hooks/useScrollReveal'
import KanbanBoard from '../../components/kanban/KanbanBoard'
import { formatDateOnly, getApiErrorMessage } from '../../utils/api'

function downloadCsv(rows) {
  const header = ['Reference', 'Vendor', 'Warehouse', 'Location', 'Schedule Date', 'Status', 'Lines']
  const csvRows = rows.map((row) => [
    row.reference,
    row.vendor_name || '',
    row.warehouse_name || '',
    row.location_name || '',
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
  link.setAttribute('download', 'receipts.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function ReceiptsPage() {
  const navigate = useNavigate()
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    date_from: '',
    date_to: '',
  })

  const tbodyRef = useTableScrollReveal([receipts, loading, viewMode])

  const loadReceipts = async () => {
    setLoading(true)
    setError('')

    try {
      const params = {
        limit: 100,
      }

      if (filters.search) params.search = filters.search
      if (filters.status) params.status = filters.status
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to

      const response = await api.get('/receipts', { params })
      setReceipts(response.data.data.receipts || [])
      setLastUpdated(new Date())
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load receipts'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReceipts()
  }, [filters.search, filters.status, filters.date_from, filters.date_to])


  const stats = useMemo(
    () => ({
      total: receipts.length,
      draft: receipts.filter((receipt) => receipt.status === 'draft').length,
      ready: receipts.filter((receipt) => receipt.status === 'ready').length,
      done: receipts.filter((receipt) => receipt.status === 'done').length,
      canceled: receipts.filter((receipt) => receipt.status === 'canceled').length,
      late: receipts.filter((receipt) => receipt.is_late).length,
    }),
    [receipts]
  )

  const handleMarkReady = async (receiptId) => {
    try {
      await api.post(`/receipts/${receiptId}/mark-ready`)
      await loadReceipts()
    } catch (requestError) {
      window.alert(getApiErrorMessage(requestError, 'Unable to mark receipt ready'))
    }
  }

  const handleValidate = async (receiptId) => {
    if (!window.confirm('Validate this receipt and add stock to inventory?')) {
      return
    }

    try {
      await api.post(`/receipts/${receiptId}/validate`)
      await loadReceipts()
    } catch (requestError) {
      window.alert(getApiErrorMessage(requestError, 'Unable to validate receipt'))
    }
  }

  const tabClass = ({ isActive }) =>
    `px-4 py-3 text-sm font-medium ${isActive ? 'text-primary border-b-2 border-primary -mb-px' : 'text-slate-500 hover:text-slate-300'}`

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Operations', href: '#' }, { label: 'Receipts', href: '/operations/receipts' }]}>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-semibold text-slate-100">Receipts</h1>
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-700">
          <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] border border-slate-700">N</kbd> New</span>
          <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] border border-slate-700">F</kbd> Filter</span>
          <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] border border-slate-700">⌘K</kbd> Search</span>
        </div>
      </div>

      <div className="flex border-b border-slate-800/70 mb-6">
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

      <div className="panel px-5 py-3 mb-4 flex items-center gap-6 overflow-x-auto">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-slate-600 font-bold tracking-wider">Total</span>
          <span className="text-lg font-bold font-mono text-slate-100">{stats.total}</span>
        </div>
        <div className="w-px h-8 bg-slate-800/70" />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-slate-600 font-bold tracking-wider">Draft</span>
          <span className="text-lg font-bold font-mono text-[#3083f8]">{stats.draft}</span>
        </div>
        <div className="w-px h-8 bg-slate-800/70" />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-slate-600 font-bold tracking-wider">Ready</span>
          <span className="text-lg font-bold font-mono text-purple-400">{stats.ready}</span>
        </div>
        <div className="w-px h-8 bg-slate-800/70" />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-slate-600 font-bold tracking-wider">Done</span>
          <span className="text-lg font-bold font-mono text-emerald-400">{stats.done}</span>
        </div>
        <div className="w-px h-8 bg-slate-800/70" />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-slate-600 font-bold tracking-wider">Canceled</span>
          <span className="text-lg font-bold font-mono text-rose-400">{stats.canceled}</span>
        </div>

        <div className="w-px h-8 bg-slate-800/70 ml-auto" />
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 px-2.5 py-1.5 rounded-full border border-rose-500/20">
            {stats.late} Late
          </div>
        </div>
      </div>

      <div className="panel p-4 flex flex-wrap items-center gap-3 mb-4 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Search reference or vendor..."
              className="bg-white/5 border border-white/10 rounded-xl py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 text-slate-100 placeholder:text-slate-600"
            />
          </div>

          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="bg-white/5 border border-white/10 rounded-xl py-1.5 px-3 text-sm focus:outline-none focus:border-primary/60 text-slate-300 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl py-1.5 px-3 text-sm text-slate-300">
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
          <span className="text-[11px] text-slate-600 mr-2">
            Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex bg-white/5 border border-white/10 rounded-full p-1 mr-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white/10 text-primary' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'kanban' ? 'bg-white/10 text-primary' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <Columns size={16} />
            </button>
          </div>

          <button
            onClick={loadReceipts}
            className="btn-ghost text-sm py-1.5 px-3 rounded-full"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          <button
            onClick={() => downloadCsv(receipts)}
            className="btn-ghost text-sm py-1.5 px-3 rounded-full"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => navigate('/operations/receipts/new')}
            className="btn-primary text-sm px-4 py-1.5 rounded-full"
          >
            New Receipt
          </button>
        </div>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-[#0f1426]">
          <table className="w-full">
            <tbody>
              <SkeletonRow cols={7} rows={5} />
            </tbody>
          </table>
        </div>
      ) : receipts.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="No receipts yet"
          description="Create a receipt when goods arrive from a vendor."
          actionLabel="+ New Receipt"
          onAction={() => navigate('/operations/receipts/new')}
        />
      ) : viewMode === 'list' ? (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-[#0f1426]">
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead className="bg-[#121a2c] text-slate-400 uppercase text-[11px] font-bold tracking-[0.2em]">
              <tr>
                <th className="px-5 py-4">Reference</th>
                <th className="px-4 py-4">Vendor</th>
                <th className="px-4 py-4">Warehouse / Location</th>
                <th className="px-4 py-4">Schedule Date</th>
                <th className="px-4 py-4">Lines</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Responsible</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef} className="divide-y divide-slate-800">
              {receipts.map((receipt) => (
                <tr
                  key={receipt.id}
                  onClick={(event) => {
                    if (event.target.closest('button')) return
                    navigate(`/operations/receipts/${receipt.id}`)
                  }}
                  className={`group cursor-pointer hover:bg-slate-800/50 transition-colors ${receipt.is_late ? 'border-l-2 border-rose-500 bg-rose-500/5' : 'border-l-2 border-transparent'}`}
                >
                  <td className="px-5 py-4 font-mono text-xs text-primary font-semibold group-hover:underline">{receipt.reference}</td>
                  <td className="px-4 py-4 text-slate-200">{receipt.vendor_name || '—'}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-200">{receipt.warehouse_name}</span>
                      <span className="text-xs text-slate-500">{receipt.location_name || 'No destination location'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-4 ${receipt.is_late ? 'text-rose-400' : 'text-slate-400'}`}>
                    {formatDateOnly(receipt.schedule_date)}
                  </td>
                  <td className="px-4 py-4 text-slate-500">{receipt.line_count} lines</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={receipt.status} />
                  </td>
                  <td className="px-4 py-4 text-slate-400">{receipt.responsible_name || '—'}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {receipt.status === 'draft' && (
                        <button
                          onClick={() => handleMarkReady(receipt.id)}
                          className="px-3 py-1 rounded-full text-xs font-semibold border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                        >
                          Mark Ready
                        </button>
                      )}
                      {receipt.status === 'ready' && (
                        <button
                          onClick={() => handleValidate(receipt.id)}
                          className="px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                        >
                          Validate
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/operations/receipts/${receipt.id}`)}
                        className="px-3 py-1 rounded-full text-xs font-semibold border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
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
        <KanbanBoard
          items={receipts}
          columns={['draft', 'ready', 'done', 'canceled']}
          onCardClick={(item) => navigate(`/operations/receipts/${item.id}`)}
          onStatusChange={async (id, newStatus) => {
            if (newStatus === 'ready') await api.post(`/receipts/${id}/mark-ready`)
            if (newStatus === 'canceled') await api.post(`/receipts/${id}/cancel`)
            await loadReceipts()
          }}
        />
      )}
    </AppShell>
  )
}
