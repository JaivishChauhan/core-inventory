import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Loader2, Plus, RefreshCcw, Search } from 'lucide-react'
import api from '../../api/axios'
import AppShell from '../../components/layout/AppShell'
import SkeletonRow from '../../components/ui/SkeletonRow'
import StatusBadge from '../../components/ui/StatusBadge'
import { useTableAnimation } from '../../hooks/useTableAnimation'
import { formatDateTime, getApiErrorMessage, toNumber } from '../../utils/api'

const reasonOptions = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'lost', label: 'Lost' },
  { value: 'counting_error', label: 'Counting Error' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' },
]

export default function AdjustmentPage() {
  const [adjustments, setAdjustments] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [currentQuantity, setCurrentQuantity] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [form, setForm] = useState({
    warehouse_id: '',
    location_id: '',
    product_id: '',
    counted_quantity: '',
    reason: 'counting_error',
    notes: '',
  })

  const tbodyRef = useTableAnimation([adjustments, loading, search])

  const filteredLocations = useMemo(
    () => locations.filter((location) => location.warehouse_id === form.warehouse_id),
    [locations, form.warehouse_id]
  )

  const filteredAdjustments = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return adjustments

    return adjustments.filter((adjustment) =>
      [adjustment.reference, adjustment.product_name, adjustment.sku, adjustment.location_name, adjustment.reason]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [adjustments, search])

  const loadPage = async () => {
    setLoading(true)
    setError('')

    try {
      const [adjustmentsRes, warehousesRes, locationsRes, productsRes] = await Promise.all([
        api.get('/adjustments'),
        api.get('/warehouses'),
        api.get('/locations'),
        api.get('/products', { params: { limit: 100 } }),
      ])

      const nextWarehouses = warehousesRes.data.data.warehouses || []
      const nextLocations = locationsRes.data.data.locations || []

      setAdjustments(adjustmentsRes.data.data.adjustments || [])
      setWarehouses(nextWarehouses)
      setLocations(nextLocations)
      setProducts(productsRes.data.data.products || [])
      setLastUpdated(new Date())

      setForm((prev) => ({
        ...prev,
        warehouse_id: prev.warehouse_id || nextWarehouses[0]?.id || '',
      }))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load adjustments'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [])

  useEffect(() => {
    if (!form.warehouse_id) return
    if (filteredLocations.some((location) => location.id === form.location_id)) return

    setForm((prev) => ({
      ...prev,
      location_id: filteredLocations[0]?.id || '',
    }))
  }, [form.warehouse_id, filteredLocations, form.location_id])

  useEffect(() => {
    const loadCurrentQuantity = async () => {
      if (!form.product_id || !form.location_id) {
        setCurrentQuantity(0)
        return
      }

      try {
        const response = await api.get(`/products/${form.product_id}`)
        const selectedLocation = response.data.data.product.stock_by_location.find(
          (location) => location.location_id === form.location_id
        )
        setCurrentQuantity(toNumber(selectedLocation?.quantity))
      } catch {
        setCurrentQuantity(0)
      }
    }

    loadCurrentQuantity()
  }, [form.product_id, form.location_id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/adjustments', {
        warehouse_id: form.warehouse_id,
        location_id: form.location_id,
        product_id: form.product_id,
        counted_quantity: toNumber(form.counted_quantity),
        reason: form.reason,
        notes: form.notes.trim() || null,
      })

      setMessage(response.data.message || 'Adjustment created')
      setForm((prev) => ({
        ...prev,
        product_id: '',
        counted_quantity: '',
        notes: '',
      }))
      await loadPage()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to create adjustment'))
    } finally {
      setSaving(false)
    }
  }

  const tabClass = ({ isActive }) =>
    `px-4 py-3 text-sm font-medium ${isActive ? 'text-primary border-b-2 border-primary -mb-px' : 'text-slate-500 hover:text-slate-300'}`

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Operations', href: '#' }, { label: 'Adjustments', href: '/operations/adjustment' }]}>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-semibold text-slate-100">Inventory Adjustments</h1>
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

      {message && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
        <form onSubmit={handleSubmit} className="panel p-5 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-100">New Adjustment</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">Immediate</span>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Warehouse</label>
              <select
                value={form.warehouse_id}
                onChange={(event) => setForm((prev) => ({ ...prev, warehouse_id: event.target.value }))}
                className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary"
                required
              >
                <option value="">Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Location</label>
              <select
                value={form.location_id}
                onChange={(event) => setForm((prev) => ({ ...prev, location_id: event.target.value }))}
                className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary"
                required
              >
                <option value="">Select location</option>
                {filteredLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Product</label>
              <select
                value={form.product_id}
                onChange={(event) => setForm((prev) => ({ ...prev, product_id: event.target.value }))}
                className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary"
                required
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Recorded Qty</div>
                <div className="mt-1 font-mono text-lg text-slate-100">{currentQuantity}</div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Counted Qty</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.counted_quantity}
                  onChange={(event) => setForm((prev) => ({ ...prev, counted_quantity: event.target.value }))}
                  className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Reason</label>
              <select
                value={form.reason}
                onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary"
              >
                {reasonOptions.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="mt-1.5 w-full resize-y bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary"
                placeholder="Explain why this adjustment is needed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-[#071018] hover:bg-primary/90 disabled:opacity-70 shadow-[0_12px_30px_-18px_rgba(76,201,240,0.8)]"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Create Adjustment
            </button>
          </div>
        </form>

        <div>
          <div className="panel p-4 flex flex-wrap items-center gap-3 mb-4 justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reference, product, SKU..."
                className="bg-white/5 border border-white/10 rounded-xl py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 text-slate-100 placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600">
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={loadPage}
                className="btn-ghost text-sm py-1.5 px-3 rounded-full"
              >
                <RefreshCcw size={14} /> Refresh
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/70 bg-[#0f1426]">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead className="bg-[#121a2c] text-slate-400 uppercase text-[11px] font-bold tracking-[0.2em]">
                <tr>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Difference</th>
                  <th className="px-4 py-4">Reason</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Created</th>
                </tr>
              </thead>
              <tbody ref={tbodyRef} className="divide-y divide-slate-800">
                {loading ? (
                  <SkeletonRow cols={7} rows={6} />
                ) : filteredAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No adjustments found.
                    </td>
                  </tr>
                ) : (
                  filteredAdjustments.map((adjustment) => (
                    <tr key={adjustment.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-primary font-semibold">{adjustment.reference}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200">{adjustment.product_name}</span>
                          <span className="text-xs text-slate-500">{adjustment.sku}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200">{adjustment.location_name}</span>
                          <span className="text-xs text-slate-500">{adjustment.warehouse_name}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-4 font-mono font-bold ${toNumber(adjustment.difference) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {toNumber(adjustment.difference) >= 0 ? '+' : ''}
                        {toNumber(adjustment.difference)}
                      </td>
                      <td className="px-4 py-4 text-slate-400">{adjustment.reason || '—'}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={adjustment.status} />
                      </td>
                      <td className="px-4 py-4 text-slate-500">{formatDateTime(adjustment.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
