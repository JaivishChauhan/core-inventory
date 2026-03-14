import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Loader2, Plus, Save, Trash2 } from 'lucide-react'
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

export default function ReceiptDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState('')
  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])
  const [products, setProducts] = useState([])
  const [receipt, setReceipt] = useState(null)
  const [form, setForm] = useState({
    warehouse_id: '',
    destination_location_id: '',
    vendor_name: '',
    schedule_date: '',
    notes: '',
    lines: [createEmptyLine()],
  })

  const editable = isNew || (receipt && !['done', 'canceled'].includes(receipt.status))
  const currentStatus = receipt?.status || 'draft'
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

  const steps = ['draft', 'ready', 'done']
  const currentStepIndex = Math.max(steps.indexOf(currentStatus), 0)

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
        requests.push(api.get(`/receipts/${id}`))
      }

      const responses = await Promise.all(requests)
      const [warehousesRes, locationsRes, productsRes, receiptRes] = responses

      const nextWarehouses = warehousesRes.data.data.warehouses || []
      const nextLocations = locationsRes.data.data.locations || []
      const nextProducts = productsRes.data.data.products || []

      setWarehouses(nextWarehouses)
      setLocations(nextLocations)
      setProducts(nextProducts)

      if (receiptRes) {
        const nextReceipt = receiptRes.data.data.receipt
        setReceipt(nextReceipt)
        setForm({
          warehouse_id: nextReceipt.warehouse_id,
          destination_location_id: nextReceipt.destination_location_id || '',
          vendor_name: nextReceipt.vendor_name || '',
          schedule_date: toDateInputValue(nextReceipt.schedule_date),
          notes: nextReceipt.notes || '',
          lines:
            nextReceipt.lines.length > 0
              ? nextReceipt.lines.map((line) => ({
                  product_id: line.product_id,
                  quantity: String(toNumber(line.quantity)),
                  unit_cost: line.unit_cost === null ? '' : String(toNumber(line.unit_cost)),
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
          destination_location_id: prev.destination_location_id || defaultLocationId,
        }))
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load receipt'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [id])

  useEffect(() => {
    if (!form.warehouse_id) return
    if (filteredLocations.some((location) => location.id === form.destination_location_id)) return

    setForm((prev) => ({
      ...prev,
      destination_location_id: filteredLocations[0]?.id || '',
    }))
  }, [form.warehouse_id, filteredLocations, form.destination_location_id])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateLine = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [field]: value } : line)),
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

  const saveReceipt = async () => {
    if (!form.warehouse_id) {
      setError('Select a warehouse before saving the receipt.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const payload = {
      warehouse_id: form.warehouse_id,
      destination_location_id: form.destination_location_id || null,
      vendor_name: form.vendor_name.trim() || null,
      schedule_date: form.schedule_date || null,
      notes: form.notes.trim() || null,
      lines: buildLinePayload(form.lines),
    }

    try {
      if (isNew) {
        const response = await api.post('/receipts', payload)
        const createdReceipt = response.data.data.receipt
        navigate(`/operations/receipts/${createdReceipt.id}`, { replace: true })
        return
      }

      const response = await api.put(`/receipts/${id}`, payload)
      setReceipt(response.data.data.receipt)
      setMessage(response.data.message || 'Receipt updated')
      await loadPage()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save receipt'))
    } finally {
      setSaving(false)
    }
  }

  const handleMarkReady = async () => {
    try {
      const response = await api.post(`/receipts/${id}/mark-ready`)
      setMessage(response.data.message || 'Receipt marked ready')
      await loadPage()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to mark receipt ready'))
    }
  }

  const handleValidate = async () => {
    try {
      const response = await api.post(`/receipts/${id}/validate`)
      setMessage(response.data.message || 'Receipt validated')
      await loadPage()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to validate receipt'))
    }
  }

  const handleCancel = async () => {
    try {
      const response = await api.post(`/receipts/${id}/cancel`)
      setMessage(response.data.message || 'Receipt canceled')
      await loadPage()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to cancel receipt'))
    }
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Receipts', href: '/operations/receipts' },
        { label: isNew ? 'New Receipt' : receipt?.reference || 'Receipt', href: '#' },
      ]}
    >
      <div className="panel mb-6 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800/70 gap-4">
          <div className="flex items-center gap-5 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Reference</div>
              <div className="mt-1 font-mono text-xl text-slate-100">{isNew ? 'Draft receipt' : receipt?.reference}</div>
            </div>
            {!isNew && <StatusBadge status={receipt?.status} />}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {editable && (
              <button
                onClick={saveReceipt}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-[#071018] hover:bg-primary/90 disabled:opacity-70 shadow-[0_12px_30px_-18px_rgba(76,201,240,0.8)]"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isNew ? 'Create Draft' : 'Save Changes'}
              </button>
            )}

            {!isNew && receipt?.status === 'draft' && (
              <button
                onClick={handleMarkReady}
                className="rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                Mark Ready
              </button>
            )}

            {!isNew && receipt?.status === 'ready' && (
              <button
                onClick={() => setConfirmAction('validate')}
                className="rounded-full border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10"
              >
                Validate
              </button>
            )}

            {!isNew && ['draft', 'ready'].includes(receipt?.status) && (
              <button
                onClick={() => setConfirmAction('cancel')}
                className="rounded-full border border-rose-500/30 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4 flex items-center gap-4 overflow-x-auto">
          {steps.map((step, index) => {
            const complete = index <= currentStepIndex && currentStatus !== 'canceled'
            return (
              <div key={step} className="flex items-center gap-4 min-w-fit">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full border text-xs font-bold flex items-center justify-center ${
                      complete ? 'border-primary bg-primary text-white' : 'border-slate-700 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`text-xs uppercase tracking-wider font-bold ${complete ? 'text-slate-200' : 'text-slate-500'}`}>
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && <div className="h-px w-12 bg-slate-800/70" />}
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

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-[#0f1426]">
          <table className="w-full">
            <tbody>
              <SkeletonRow cols={6} rows={6} />
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div className="flex flex-col gap-5">
            <div className="panel p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Warehouse</label>
                  <select
                    disabled={!isNew}
                    value={form.warehouse_id}
                    onChange={(event) => updateField('warehouse_id', event.target.value)}
                    className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary disabled:opacity-70"
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  {!isNew && <p className="mt-1 text-xs text-slate-500">Warehouse is locked after receipt creation.</p>}
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Destination Location</label>
                  <select
                    disabled={!editable}
                    value={form.destination_location_id}
                    onChange={(event) => updateField('destination_location_id', event.target.value)}
                    className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary disabled:opacity-70"
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
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Vendor</label>
                  <input
                    type="text"
                    disabled={!editable}
                    value={form.vendor_name}
                    onChange={(event) => updateField('vendor_name', event.target.value)}
                    className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70"
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Schedule Date</label>
                  <input
                    type="date"
                    disabled={!editable}
                    value={form.schedule_date}
                    onChange={(event) => updateField('schedule_date', event.target.value)}
                    className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70"
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
                  className="mt-1.5 w-full resize-y bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70"
                  placeholder="Optional receipt notes"
                />
              </div>
            </div>

            <div className="panel p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-100">Products to Receive</h3>
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
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3 text-right">Unit Cost</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      {editable && <th className="px-4 py-3 w-10" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {form.lines.map((line, index) => {
                      const product = productMap.get(line.product_id)
                      const quantity = toNumber(line.quantity)
                      const unitCost = toNumber(line.unit_cost)

                      return (
                        <tr key={`${line.product_id}-${index}`} className="hover:bg-slate-800/30 transition-colors">
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
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-primary"
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
                                  <span className="font-semibold text-slate-200">{product?.name || 'Product'}</span>
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
                              className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70"
                            />
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
                              className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-right text-slate-100 focus:outline-none focus:border-primary disabled:opacity-70"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-slate-200">
                            {formatCurrency(quantity * unitCost)}
                          </td>
                          {editable && (
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => removeLine(index)}
                                className="text-slate-600 hover:text-rose-400 p-1.5 transition-colors"
                              >
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
            <div className="panel p-5">
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-4">Details</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-xs text-slate-500">Status</span>
                  <StatusBadge status={currentStatus} />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-xs text-slate-500">Responsible</span>
                  <span className="text-xs text-slate-300 font-medium">{receipt?.responsible_name || 'Current user'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-xs text-slate-500">Created</span>
                  <span className="text-xs text-slate-300 font-medium">{formatDateTime(receipt?.created_at)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-xs text-slate-500">Updated</span>
                  <span className="text-xs text-slate-300 font-medium">{formatDateTime(receipt?.updated_at)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-slate-500">Validated</span>
                  <span className="text-xs text-slate-300 font-medium">{formatDateTime(receipt?.validated_at)}</span>
                </div>
              </div>
            </div>

            <div className="panel p-5">
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-4">Activity Log</h3>

              {!receipt?.activity?.length ? (
                <div className="text-sm text-slate-500">No stock activity yet. Validate the receipt to create ledger entries.</div>
              ) : (
                <div className="flex flex-col gap-4 relative">
                  <div className="absolute left-[3px] top-2 bottom-2 w-px bg-slate-800 z-0" />
                  {receipt.activity.map((entry) => (
                    <div key={entry.id} className="flex gap-4 relative z-10">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-[0_0_0_4px_#0f1426]" />
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-300">
                          {entry.operation_type} {entry.quantity} units
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          {formatDateTime(entry.created_at)}
                        </span>
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
        title="Validate Receipt?"
        message="This will increase stock on hand and create immutable ledger entries."
        confirmLabel="Validate"
      />

      <ConfirmModal
        isOpen={confirmAction === 'cancel'}
        onClose={() => setConfirmAction('')}
        onConfirm={handleCancel}
        title="Cancel Receipt?"
        message="Canceled receipts cannot be validated later unless you create a new one."
        confirmLabel="Cancel Receipt"
        variant="danger"
      />
    </AppShell>
  )
}
