import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Box, Loader2, Plus, RefreshCcw, Save, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import AppShell from '../../components/layout/AppShell'
import ConfirmModal from '../../components/ui/ConfirmModal'
import SkeletonRow from '../../components/ui/SkeletonRow'
import SkuPill from '../../components/ui/SkuPill'
import StatusBadge from '../../components/ui/StatusBadge'
import { formatCurrency, formatDateTime, getApiErrorMessage, toDateInputValue, toNumber } from '../../utils/api'

function createEmptyLine() {
  return {
    product_id: '',
    quantity: '1',
    unit_cost: '',
    is_out_of_stock: false,
  }
}

function buildLinePayload(lines) {
  return lines
    .map((line) => ({
      product_id: line.product_id,
      quantity: toNumber(line.quantity),
      unit_cost: line.unit_cost === '' ? null : toNumber(line.unit_cost),
    }))
    .filter((line) => line.product_id && line.quantity > 0)
}

export default function DeliveryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checkingStock, setCheckingStock] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')
  const [confirmAction, setConfirmAction] = useState('')
  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])
  const [products, setProducts] = useState([])
  const [delivery, setDelivery] = useState(null)
  const [availability, setAvailability] = useState({})
  const [form, setForm] = useState({
    warehouse_id: '',
    source_location_id: '',
    contact_name: '',
    delivery_address: '',
    schedule_date: '',
    operation_type: 'Regular Delivery',
    notes: '',
    lines: [createEmptyLine()],
  })

  const editable = isNew || (delivery && !['done', 'canceled'].includes(delivery.status))
  const currentStatus = delivery?.status || 'draft'
  const filteredLocations = useMemo(
    () => locations.filter((location) => location.warehouse_id === form.warehouse_id),
    [locations, form.warehouse_id]
  )
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  )
  const totalValue = useMemo(
    () =>
      form.lines.reduce(
        (sum, line) => sum + toNumber(line.quantity) * toNumber(line.unit_cost),
        0
      ),
    [form.lines]
  )
  const steps = ['draft', 'waiting', 'ready', 'done']
  const currentStepIndex = Math.max(steps.indexOf(currentStatus), 0)

  const stockCheckSignature = useMemo(
    () =>
      `${form.source_location_id}:${form.lines
        .map((line) => `${line.product_id}-${line.quantity}`)
        .join('|')}`,
    [form.source_location_id, form.lines]
  )

  const loadPage = async () => {
    setLoading(true)
    setError('')

    try {
      const requests = [
        api.get('/warehouses'),
        api.get('/locations'),
        api.get('/products', { params: { limit: 100 } }),
      ]

      if (!isNew) {
        requests.push(api.get(`/deliveries/${id}`))
      }

      const responses = await Promise.all(requests)
      const [warehousesRes, locationsRes, productsRes, deliveryRes] = responses
      const nextWarehouses = warehousesRes.data.data.warehouses || []
      const nextLocations = locationsRes.data.data.locations || []
      const nextProducts = productsRes.data.data.products || []

      setWarehouses(nextWarehouses)
      setLocations(nextLocations)
      setProducts(nextProducts)

      if (deliveryRes) {
        const nextDelivery = deliveryRes.data.data.delivery
        setDelivery(nextDelivery)
        setForm({
          warehouse_id: nextDelivery.warehouse_id,
          source_location_id: nextDelivery.source_location_id || '',
          contact_name: nextDelivery.contact_name || '',
          delivery_address: nextDelivery.delivery_address || '',
          schedule_date: toDateInputValue(nextDelivery.schedule_date),
          operation_type: nextDelivery.operation_type || 'Regular Delivery',
          notes: nextDelivery.notes || '',
          lines:
            nextDelivery.lines.length > 0
              ? nextDelivery.lines.map((line) => ({
                  product_id: line.product_id,
                  quantity: String(toNumber(line.quantity)),
                  unit_cost: line.unit_cost === null ? '' : String(toNumber(line.unit_cost)),
                  is_out_of_stock: Boolean(line.is_out_of_stock),
                }))
              : [createEmptyLine()],
        })
      } else {
        const defaultWarehouseId = nextWarehouses[0]?.id || ''
        const defaultLocationId =
          nextLocations.find((location) => location.warehouse_id === defaultWarehouseId)?.id || ''

        setForm((prev) => ({
          ...prev,
          warehouse_id: prev.warehouse_id || defaultWarehouseId,
          source_location_id: prev.source_location_id || defaultLocationId,
        }))
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load delivery'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [id])

  useEffect(() => {
    if (!form.warehouse_id) return
    if (filteredLocations.some((location) => location.id === form.source_location_id)) return

    setForm((prev) => ({
      ...prev,
      source_location_id: filteredLocations[0]?.id || '',
    }))
  }, [form.warehouse_id, filteredLocations, form.source_location_id])

  const runStockCheck = async (lines = form.lines, sourceLocationId = form.source_location_id) => {
    const validLines = lines
      .map((line, index) => ({ ...line, index, requested_quantity: toNumber(line.quantity) }))
      .filter((line) => line.product_id && line.requested_quantity > 0)

    if (!sourceLocationId || validLines.length === 0) {
      setAvailability({})
      setAvailabilityError('')
      return
    }

    setCheckingStock(true)
    setAvailabilityError('')

    try {
      const responses = await Promise.all(
        validLines.map((line) =>
          api.post('/ai/check-stock', {
            product_id: line.product_id,
            location_id: sourceLocationId,
            requested_quantity: line.requested_quantity,
          })
        )
      )

      const nextAvailability = {}
      responses.forEach((response, responseIndex) => {
        nextAvailability[validLines[responseIndex].index] = response.data.data
      })
      setAvailability(nextAvailability)
    } catch (requestError) {
      setAvailabilityError(getApiErrorMessage(requestError, 'AI stock check is currently unavailable'))
    } finally {
      setCheckingStock(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      runStockCheck()
    }, 350)

    return () => window.clearTimeout(timer)
  }, [stockCheckSignature])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateLine = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      ),
    }))
  }

  const addLine = () => {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, createEmptyLine()] }))
  }

  const removeLine = (index) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.length === 1 ? [createEmptyLine()] : prev.lines.filter((_, lineIndex) => lineIndex !== index),
    }))
  }

  const saveDelivery = async () => {
    if (!form.warehouse_id) {
      setError('Select a warehouse before saving the delivery.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const payload = {
      warehouse_id: form.warehouse_id,
      source_location_id: form.source_location_id || null,
      contact_name: form.contact_name.trim() || null,
      delivery_address: form.delivery_address.trim() || null,
      schedule_date: form.schedule_date || null,
      operation_type: form.operation_type.trim() || 'Regular Delivery',
      notes: form.notes.trim() || null,
      lines: buildLinePayload(form.lines),
    }

    try {
      if (isNew) {
        const response = await api.post('/deliveries', payload)
        const createdDelivery = response.data.data.delivery
        navigate(`/operations/delivery/${createdDelivery.id}`, { replace: true })
        return
      }

      const response = await api.put(`/deliveries/${id}`, payload)
      setDelivery(response.data.data.delivery)
      setMessage(response.data.message || 'Delivery updated')
      await loadPage()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save delivery'))
    } finally {
      setSaving(false)
    }
  }

  const handleMarkReady = async () => {
    try {
      const response = await api.post(`/deliveries/${id}/mark-ready`)
      setMessage(response.data.message || 'Delivery marked ready')
      await loadPage()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Delivery is still waiting for stock'))
      await loadPage()
    }
  }

  const handleValidate = async () => {
    try {
      const response = await api.post(`/deliveries/${id}/validate`)
      setMessage(response.data.message || 'Delivery validated')
      await loadPage()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to validate delivery'))
    }
  }

  const handleCancel = async () => {
    try {
      const response = await api.post(`/deliveries/${id}/cancel`)
      setMessage(response.data.message || 'Delivery canceled')
      await loadPage()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to cancel delivery'))
    }
  }

  const lineIssues = form.lines
    .map((line, index) => {
      const stock = availability[index]
      const requested = toNumber(line.quantity)
      const product = productMap.get(line.product_id)
      const hasIssue = stock ? !stock.available : Boolean(line.is_out_of_stock)
      return hasIssue
        ? {
            index,
            productName: product?.name || 'Product',
            requested,
            available: stock ? stock.free_to_use : 0,
          }
        : null
    })
    .filter(Boolean)

  const hasIssues = lineIssues.length > 0

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Deliveries', href: '/operations/delivery' },
        { label: isNew ? 'New Delivery' : delivery?.reference || 'Delivery', href: '#' },
      ]}
    >
      {currentStatus === 'waiting' && hasIssues && (
        <div className="w-full bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-400 text-sm font-medium">
            <AlertTriangle size={16} />
            This delivery is waiting for {lineIssues.length} products to be restocked.
          </div>
        </div>
      )}

      <div className="bg-[#161B22] border border-slate-800 rounded-xl mb-6 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 gap-4">
          <div className="flex items-center gap-5 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Reference</div>
              <div className="mt-1 font-mono text-xl text-slate-100">{isNew ? 'Draft delivery' : delivery?.reference}</div>
            </div>
            {!isNew && <StatusBadge status={delivery?.status} />}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {editable && (
              <button
                onClick={saveDelivery}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-70"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isNew ? 'Create Draft' : 'Save Changes'}
              </button>
            )}

            {editable && (
              <button
                onClick={() => runStockCheck()}
                disabled={checkingStock}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-70"
              >
                {checkingStock ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                Check Stock
              </button>
            )}

            {!isNew && ['draft', 'waiting'].includes(delivery?.status) && (
              <button
                onClick={handleMarkReady}
                className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                Mark Ready
              </button>
            )}

            {!isNew && delivery?.status === 'ready' && (
              <button
                onClick={() => setConfirmAction('validate')}
                className="rounded-lg border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10"
              >
                Validate
              </button>
            )}

            {!isNew && ['draft', 'waiting', 'ready'].includes(delivery?.status) && (
              <button
                onClick={() => setConfirmAction('cancel')}
                className="rounded-lg border border-rose-500/30 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4 flex items-center gap-4 overflow-x-auto">
          {steps.map((step, index) => {
            const complete = index <= currentStepIndex && currentStatus !== 'canceled'
            const activeWaiting = currentStatus === 'waiting' && step === 'waiting'
            return (
              <div key={step} className="flex items-center gap-4 min-w-fit">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full border text-xs font-bold flex items-center justify-center ${
                      activeWaiting
                        ? 'border-orange-400 bg-orange-500 text-white'
                        : complete
                          ? 'border-primary bg-primary text-white'
                          : 'border-slate-700 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`text-xs uppercase tracking-wider font-bold ${complete || activeWaiting ? 'text-slate-200' : 'text-slate-500'}`}>
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && <div className="h-px w-12 bg-slate-800" />}
              </div>
            )
          })}
          {currentStatus === 'canceled' && <StatusBadge status="canceled" />}
        </div>
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

      {availabilityError && (
        <div className="mb-4 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
          {availabilityError}
        </div>
      )}

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#161B22]">
          <table className="w-full">
            <tbody>
              <SkeletonRow cols={6} rows={6} />
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div className="flex flex-col gap-5">
            <div className="bg-[#161B22] border border-slate-800 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Warehouse</label>
                  <select
                    disabled={!isNew}
                    value={form.warehouse_id}
                    onChange={(event) => updateField('warehouse_id', event.target.value)}
                    className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary disabled:opacity-70"
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  {!isNew && <p className="mt-1 text-xs text-slate-500">Warehouse is locked after delivery creation.</p>}
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Source Location</label>
                  <select
                    disabled={!editable}
                    value={form.source_location_id}
                    onChange={(event) => updateField('source_location_id', event.target.value)}
                    className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary disabled:opacity-70"
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
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Contact Name</label>
                  <input
                    type="text"
                    disabled={!editable}
                    value={form.contact_name}
                    onChange={(event) => updateField('contact_name', event.target.value)}
                    className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70"
                    placeholder="Customer or receiver name"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Schedule Date</label>
                  <input
                    type="date"
                    disabled={!editable}
                    value={form.schedule_date}
                    onChange={(event) => updateField('schedule_date', event.target.value)}
                    className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Operation Type</label>
                  <input
                    type="text"
                    disabled={!editable}
                    value={form.operation_type}
                    onChange={(event) => updateField('operation_type', event.target.value)}
                    className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Delivery Address</label>
                  <input
                    type="text"
                    disabled={!editable}
                    value={form.delivery_address}
                    onChange={(event) => updateField('delivery_address', event.target.value)}
                    className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70"
                    placeholder="Delivery destination"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Notes</label>
                <textarea
                  disabled={!editable}
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-y bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70"
                  placeholder="Optional delivery notes"
                />
              </div>
            </div>

            <div className="bg-[#161B22] border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-100">Products to Deliver</h3>
                {editable && (
                  <button onClick={addLine} className="inline-flex items-center gap-1 text-primary text-xs font-semibold hover:underline">
                    <Plus size={14} /> Add Product
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-[#21262D] text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Availability</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3 text-right">Unit Cost</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      {editable && <th className="px-4 py-3 w-10" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {form.lines.map((line, index) => {
                      const product = productMap.get(line.product_id)
                      const requested = toNumber(line.quantity)
                      const unitCost = toNumber(line.unit_cost)
                      const stock = availability[index]
                      const isOutOfStock = stock ? !stock.available : Boolean(line.is_out_of_stock)

                      return (
                        <tr
                          key={`${line.product_id}-${index}`}
                          className={`transition-colors ${isOutOfStock ? 'border-l-2 border-rose-500 bg-rose-500/5' : 'hover:bg-slate-800/30'}`}
                        >
                          <td className="px-4 py-3">
                            {editable ? (
                              <select
                                value={line.product_id}
                                onChange={(event) => {
                                  const nextProduct = productMap.get(event.target.value)
                                  updateLine(index, 'product_id', event.target.value)
                                  if (line.unit_cost === '' && nextProduct) {
                                    updateLine(index, 'unit_cost', String(toNumber(nextProduct.per_unit_cost)))
                                  }
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-primary"
                              >
                                <option value="">Select product</option>
                                {products.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.name} ({option.sku})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                  <Box size={16} />
                                </div>
                                <div className="flex flex-col">
                                  <span className={`font-semibold ${isOutOfStock ? 'text-rose-400' : 'text-slate-200'}`}>{product?.name || 'Product'}</span>
                                  <SkuPill sku={product?.sku || '—'} />
                                </div>
                              </div>
                            )}
                            {editable && product && (
                              <div className="mt-2">
                                <SkuPill sku={product.sku} />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              disabled={!editable}
                              value={line.quantity}
                              onChange={(event) => updateLine(index, 'quantity', event.target.value)}
                              className={`w-24 bg-slate-900 border rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70 ${isOutOfStock ? 'border-rose-500/50' : 'border-slate-800'}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            {!line.product_id ? (
                              <span className="text-xs text-slate-500">Select a product</span>
                            ) : stock ? (
                              <div className="flex flex-col gap-1">
                                <span className={`text-xs font-semibold ${stock.available ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {stock.available ? 'Available' : 'Insufficient stock'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Free to use: {stock.free_to_use} / On hand: {stock.on_hand}
                                </span>
                              </div>
                            ) : (
                              <span className={`text-xs ${line.is_out_of_stock ? 'text-rose-400' : 'text-slate-500'}`}>
                                {checkingStock ? 'Checking...' : line.is_out_of_stock ? 'Waiting for stock' : 'No check yet'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{product?.unit_of_measure || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={!editable}
                              value={line.unit_cost}
                              onChange={(event) => updateLine(index, 'unit_cost', event.target.value)}
                              className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-right text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-slate-200">
                            {formatCurrency(requested * unitCost)}
                          </td>
                          {editable && (
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => removeLine(index)} className="text-slate-600 hover:text-rose-400 p-1.5 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div className="border-t border-slate-800 pt-4 mt-3 flex justify-end items-center">
                  <span className="text-sm font-semibold text-slate-500 mr-6">Total Value:</span>
                  <span className="text-xl font-bold font-mono text-slate-100">{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {hasIssues && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
                <h3 className="flex items-center gap-2 font-semibold text-rose-400 text-sm mb-3">
                  <AlertTriangle size={16} /> Stock Issues
                </h3>
                <div className="flex flex-col gap-2">
                  {lineIssues.map((issue) => (
                    <div key={issue.index} className="text-xs text-rose-400 pb-2 border-b border-rose-500/20 last:border-0 last:pb-0">
                      {issue.productName} - need {issue.requested}, free to use {issue.available}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-rose-500/20">
                  <Link to="/operations/receipts/new" className="text-xs text-rose-400 underline hover:text-rose-300">
                    Create a receipt to restock
                  </Link>
                </div>
              </div>
            )}

            <div className="bg-[#161B22] border border-slate-800 rounded-xl p-5">
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-4">Details</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-xs text-slate-500">Status</span>
                  <StatusBadge status={currentStatus} />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-xs text-slate-500">Responsible</span>
                  <span className="text-xs text-slate-300 font-medium">{delivery?.responsible_name || 'Current user'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-xs text-slate-500">Created</span>
                  <span className="text-xs text-slate-300 font-medium">{formatDateTime(delivery?.created_at)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-xs text-slate-500">Updated</span>
                  <span className="text-xs text-slate-300 font-medium">{formatDateTime(delivery?.updated_at)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-slate-500">Validated</span>
                  <span className="text-xs text-slate-300 font-medium">{formatDateTime(delivery?.validated_at)}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#161B22] border border-slate-800 rounded-xl p-5">
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-4">Activity Log</h3>

              {!delivery?.activity?.length ? (
                <div className="text-sm text-slate-500">No stock activity yet. Validate the delivery to create ledger entries.</div>
              ) : (
                <div className="flex flex-col gap-4 relative">
                  <div className="absolute left-[3px] top-2 bottom-2 w-px bg-slate-800 z-0" />
                  {delivery.activity.map((entry) => (
                    <div key={entry.id} className="flex gap-4 relative z-10">
                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0 shadow-[0_0_0_4px_#161B22]" />
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-300">
                          {entry.operation_type} {entry.quantity} units
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(entry.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmAction === 'validate'}
        onClose={() => setConfirmAction('')}
        onConfirm={handleValidate}
        title="Validate Delivery?"
        message="This will decrease stock at the source location and write immutable ledger entries."
        confirmLabel="Validate"
      />

      <ConfirmModal
        isOpen={confirmAction === 'cancel'}
        onClose={() => setConfirmAction('')}
        onConfirm={handleCancel}
        title="Cancel Delivery?"
        message="Canceled deliveries cannot be validated later unless you create a new one."
        confirmLabel="Cancel Delivery"
        variant="danger"
      />
    </AppShell>
  )
}
