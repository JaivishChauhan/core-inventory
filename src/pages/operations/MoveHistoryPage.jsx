import { useEffect, useMemo, useState } from 'react'
import { Calendar, Download, RefreshCcw, Search } from 'lucide-react'
import api from '../../api/axios'
import AppShell from '../../components/layout/AppShell'
import SkeletonRow from '../../components/ui/SkeletonRow'
import SkuPill from '../../components/ui/SkuPill'
import StatusBadge from '../../components/ui/StatusBadge'
import { useTableAnimation } from '../../hooks/useTableAnimation'
import { formatDateTime, getApiErrorMessage, toNumber } from '../../utils/api'

function downloadCsv(rows) {
  const header = ['Date', 'Reference', 'Type', 'Product', 'SKU', 'From', 'To', 'Quantity', 'Status']
  const csvRows = rows.map((row) => [
    row.created_at,
    row.reference,
    row.operation_type,
    row.product_name,
    row.sku,
    row.from_label,
    row.to_label,
    row.quantity,
    row.status,
  ])

  const csv = [header, ...csvRows]
    .map((columns) => columns.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'stock-ledger.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function MoveHistoryPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    date_from: '',
    date_to: '',
  })

  const flattenedRows = useMemo(
    () =>
      entries.flatMap((entry) =>
        entry.lines.map((line, index) => ({
          id: `${entry.reference}-${line.sku}-${index}`,
          reference: entry.reference,
          operation_type: entry.operation_type,
          created_at: entry.created_at,
          product_name: line.product_name,
          sku: line.sku,
          quantity: toNumber(line.quantity),
          quantity_before: toNumber(line.quantity_before),
          quantity_after: toNumber(line.quantity_after),
          status: entry.status,
          from_label: [entry.from_warehouse_name, entry.from_location_name].filter(Boolean).join(' / ') || '—',
          to_label: [entry.to_warehouse_name, entry.to_location_name].filter(Boolean).join(' / ') || '—',
        }))
      ),
    [entries]
  )

  const tbodyRef = useTableAnimation([flattenedRows, loading, filters.search, filters.type, filters.status])

  const loadHistory = async () => {
    setLoading(true)
    setError('')

    try {
      const params = { limit: 100 }
      if (filters.search) params.search = filters.search
      if (filters.type) params.type = filters.type
      if (filters.status) params.status = filters.status
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to

      const response = await api.get('/stock-ledger', { params })
      setEntries(response.data.data.ledger || [])
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load stock history'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [filters.search, filters.type, filters.status, filters.date_from, filters.date_to])

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Move History', href: '/history' }]}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Stock Move History</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-2 px-4 text-sm font-medium text-slate-300 transition-colors"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
          <button
            onClick={() => downloadCsv(flattenedRows)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-2 px-4 text-sm font-medium text-slate-300 transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="bg-[#161B22] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3 mb-4 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Search product, reference..."
              className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-primary text-slate-100 placeholder:text-slate-600 w-[240px]"
            />
          </div>

          <select
            value={filters.type}
            onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
            className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-primary text-slate-300"
          >
            <option value="">All Types</option>
            <option value="receipt">Receipt</option>
            <option value="delivery">Delivery</option>
            <option value="transfer">Transfer</option>
            <option value="adjustment">Adjustment</option>
          </select>

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

        <div className="text-xs text-slate-500">Showing {flattenedRows.length} line items</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#161B22]">
        <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
          <thead className="bg-[#21262D] text-slate-400 uppercase text-[11px] font-bold tracking-wider">
            <tr>
              <th className="px-5 py-4">Date</th>
              <th className="px-4 py-4">Reference</th>
              <th className="px-4 py-4">Type</th>
              <th className="px-4 py-4">Product</th>
              <th className="px-4 py-4">From</th>
              <th className="px-4 py-4">To</th>
              <th className="px-4 py-4 text-right">Qty</th>
              <th className="px-4 py-4">Status</th>
            </tr>
          </thead>
          <tbody ref={tbodyRef} className="divide-y divide-slate-800">
            {loading ? (
              <SkeletonRow cols={8} rows={6} />
            ) : flattenedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                  No stock moves found.
                </td>
              </tr>
            ) : (
              flattenedRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4 text-slate-400 text-xs">{formatDateTime(row.created_at)}</td>
                  <td className="px-4 py-4 font-mono text-xs font-semibold">
                    <span className={row.operation_type === 'receipt' ? 'text-primary' : row.operation_type === 'delivery' ? 'text-purple-400' : row.operation_type === 'adjustment' ? 'text-orange-400' : 'text-sky-400'}>
                      {row.reference}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-300 capitalize">{row.operation_type}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-200">{row.product_name}</span>
                      <SkuPill sku={row.sku} />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-slate-400">{row.from_label}</td>
                  <td className="px-4 py-4 text-xs font-mono text-slate-400">{row.to_label}</td>
                  <td className={`px-4 py-4 text-right font-mono font-bold ${row.operation_type === 'delivery' || row.operation_type === 'transfer_out' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {row.operation_type === 'delivery' || row.operation_type === 'transfer_out' ? '-' : '+'}
                    {Math.abs(row.quantity)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}
