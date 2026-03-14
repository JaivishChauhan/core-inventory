import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Info, Loader2, X } from 'lucide-react'
import { gsap } from 'gsap'
import api from '../../api/axios'
import AppShell from '../../components/layout/AppShell'
import StatusBadge from '../../components/ui/StatusBadge'
import DemandForecast from '../../components/charts/DemandForecast'
import { formatCurrency, getApiErrorMessage, toNumber } from '../../utils/api'

const emptyForm = {
  name: '',
  sku: '',
  category_id: '',
  unit_of_measure: 'pcs',
  per_unit_cost: '',
  reorder_level: '10',
  initial_stock: '',
  initial_location_id: '',
  description: '',
  tags: [],
}

export default function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const formRef = useRef(null)
  const barFillRef = useRef(null)
  const [form, setForm] = useState(emptyForm)
  const [tagInput, setTagInput] = useState('')
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const ctx = gsap.context(() => {
      const sections = formRef.current?.querySelectorAll('section') || []
      gsap.fromTo(sections, { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.45, ease: 'power2.out' })
    }, formRef)

    return () => ctx.revert()
  }, [loading])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const requests = [api.get('/categories'), api.get('/locations')]
        if (isEdit) {
          requests.push(api.get(`/products/${id}`))
        }

        const [categoriesRes, locationsRes, productRes] = await Promise.all(requests)
        if (!active) return

        const fetchedCategories = categoriesRes.data.data.categories || []
        const fetchedLocations = locationsRes.data.data.locations || []

        setCategories(fetchedCategories)
        setLocations(fetchedLocations)

        if (productRes) {
          const currentProduct = productRes.data.data.product
          setProduct(currentProduct)
          setForm({
            name: currentProduct.name || '',
            sku: currentProduct.sku || '',
            category_id: currentProduct.category_id || '',
            unit_of_measure: currentProduct.unit_of_measure || 'pcs',
            per_unit_cost: String(currentProduct.per_unit_cost ?? ''),
            reorder_level: String(currentProduct.reorder_level ?? 10),
            initial_stock: '',
            initial_location_id: '',
            description: currentProduct.description || '',
            tags: Array.isArray(currentProduct.tags) ? currentProduct.tags : [],
          })
        }
      } catch (requestError) {
        if (!active) return
        setError(getApiErrorMessage(requestError, 'Unable to load product form'))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [id, isEdit])

  const currentStock = useMemo(() => {
    if (isEdit) {
      return (product?.stock_by_location || []).reduce((sum, row) => sum + toNumber(row.quantity), 0)
    }

    return toNumber(form.initial_stock)
  }, [form.initial_stock, isEdit, product])

  const reorderLevel = toNumber(form.reorder_level)
  const maxStock = Math.max(currentStock * 2, reorderLevel * 3, 1)
  const fillPct = Math.min((currentStock / maxStock) * 100, 100)
  const reorderPct = Math.min((reorderLevel / maxStock) * 100, 100)
  const stockStatus = currentStock === 0 ? 'critical' : currentStock <= reorderLevel ? 'low' : 'ok'

  useEffect(() => {
    if (barFillRef.current) {
      gsap.to(barFillRef.current, { width: `${fillPct}%`, duration: 0.45, ease: 'power2.out' })
    }
  }, [fillPct])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddTag = (event) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      event.preventDefault()
      const nextTag = tagInput.trim()
      setForm((prev) => ({
        ...prev,
        tags: prev.tags.includes(nextTag) ? prev.tags : [...prev.tags, nextTag],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }))
  }

  const payload = {
    name: form.name.trim(),
    sku: form.sku.trim() || undefined,
    category_id: form.category_id || null,
    unit_of_measure: form.unit_of_measure,
    per_unit_cost: toNumber(form.per_unit_cost),
    reorder_level: Math.max(0, parseInt(form.reorder_level || '0', 10) || 0),
    description: form.description.trim() || undefined,
    tags: form.tags,
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload)
      } else {
        await api.post('/products', {
          ...payload,
          initial_stock: toNumber(form.initial_stock),
          initial_location_id: form.initial_location_id || undefined,
        })
      }

      navigate('/products')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save product'))
    } finally {
      setSaving(false)
    }
  }

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Products', href: '/products' },
    { label: isEdit ? 'Edit Product' : 'New Product', href: '#' },
  ]

  return (
    <AppShell breadcrumbs={breadcrumbs}>
      <div className="sticky top-0 z-10 bg-[#0f1426]/85 backdrop-blur-lg border-b border-slate-800/60 pb-4 mb-6 pt-2">
        <div className="flex items-center justify-between max-w-[860px] mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/products')} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors border border-white/10">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold text-slate-100">{isEdit ? 'Edit Product' : 'New Product'}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/products')} className="btn-ghost h-10 text-sm">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || loading}
              className="h-10 px-5 bg-primary hover:bg-primary/90 disabled:opacity-70 text-[#071018] rounded-full text-sm font-semibold transition-colors inline-flex items-center gap-2 shadow-[0_12px_30px_-18px_rgba(76,201,240,0.8)]"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEdit ? 'Save Changes' : 'Save Product'}
            </button>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="max-w-[860px] mx-auto pb-20">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="panel p-6 text-sm text-slate-400">Loading product form...</div>
        ) : (
          <>
            <section>
              <div className="border-b border-slate-800 pb-2 mb-4">
                <h2 className="text-[11px] uppercase tracking-[0.1em] font-bold text-slate-500">Basic Information</h2>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Product Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Ergonomic Office Desk"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">SKU / Code</label>
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="Leave empty to auto-generate"
                    className="w-full font-mono bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-slate-600 mt-0.5">Unique identifier generated automatically if empty.</p>
                </div>

                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Category</label>
                  <div className="relative">
                    <select
                      name="category_id"
                      value={form.category_id}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-100 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Unit of Measure</label>
                  <div className="flex flex-wrap gap-2">
                    {['pcs', 'kg', 'box', 'litre', 'metre', 'pair', 'set'].map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, unit_of_measure: unit }))}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${form.unit_of_measure === unit ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Per Unit Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    name="per_unit_cost"
                    value={form.per_unit_cost}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full text-right bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </section>

            <section className="mt-8">
              <div className="border-b border-slate-800 pb-2 mb-4">
                <h2 className="text-[11px] uppercase tracking-[0.1em] font-bold text-slate-500">Stock & Reordering</h2>
              </div>

              <div className="grid grid-cols-3 gap-5">
                {!isEdit && (
                  <>
                    <div className="col-span-1 flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-400">Initial Stock Quantity</label>
                      <input
                        type="number"
                        name="initial_stock"
                        value={form.initial_stock}
                        onChange={handleChange}
                        placeholder="0"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="col-span-1 flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-400">Initial Location</label>
                      <div className="relative">
                        <select
                          name="initial_location_id"
                          value={form.initial_location_id}
                          onChange={handleChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-100 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                        >
                          <option value="">Select location</option>
                          {locations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.warehouse_name} / {location.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                      </div>
                    </div>
                  </>
                )}

                <div className="col-span-1 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Reorder Level / Alert Threshold</label>
                  <input
                    type="number"
                    name="reorder_level"
                    value={form.reorder_level}
                    onChange={handleChange}
                    placeholder="10"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary"
                  />
                  <p className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                    <Info size={12} className="text-slate-500" /> Alerts trigger below this level
                  </p>
                </div>

                <div className="col-span-3 bg-white/5 border border-white/10 rounded-xl p-4 mt-2">
                  <h3 className="text-[11px] uppercase tracking-[0.1em] font-bold text-slate-500 mb-4">Stock Preview</h3>

                  <div className="flex items-center gap-12 mb-5 flex-wrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500">{isEdit ? 'Current Stock' : 'Initial Stock'}</span>
                      <span className={`text-2xl font-bold font-mono ${stockStatus === 'critical' ? 'text-rose-400' : stockStatus === 'low' ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {currentStock}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500">Reorder at</span>
                      <span className="text-2xl font-bold font-mono text-orange-400">{reorderLevel}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500">Status</span>
                      <StatusBadge status={stockStatus} />
                    </div>
                    {isEdit && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">Inventory Value</span>
                        <span className="text-sm font-semibold text-slate-200">{formatCurrency(toNumber(form.per_unit_cost) * currentStock)}</span>
                      </div>
                    )}
                  </div>

                  <div className="relative w-full h-2 bg-slate-800 rounded-full mt-3">
                    {reorderLevel > 0 && <div className="absolute top-0 bottom-0 w-px bg-slate-500 z-10" style={{ left: `${reorderPct}%` }} />}
                    <div
                      ref={barFillRef}
                      className={`h-full rounded-full absolute left-0 top-0 ${stockStatus === 'critical' ? 'bg-rose-500' : stockStatus === 'low' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {isEdit && product?.id && (
              <section className="mt-8">
                <DemandForecast productId={product.id} />
              </section>
            )}

            {isEdit && product?.stock_by_location?.length > 0 && (
              <section className="mt-8">
                <div className="border-b border-slate-800 pb-2 mb-4">
                  <h2 className="text-[11px] uppercase tracking-[0.1em] font-bold text-slate-500">Stock By Location</h2>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border/70 bg-[#0f1426]">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-[#21262D] text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Warehouse</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {product.stock_by_location.map((row) => (
                        <tr key={row.location_id}>
                          <td className="px-4 py-3 text-slate-300">{row.warehouse_name}</td>
                          <td className="px-4 py-3 text-slate-400">{row.location_name}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-100">{row.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="mt-8">
              <div className="border-b border-slate-800 pb-2 mb-4">
                <h2 className="text-[11px] uppercase tracking-[0.1em] font-bold text-slate-500">Additional Info</h2>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Optional product description"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary resize-y"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Tags</label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 min-h-[46px] flex flex-wrap items-center gap-2">
                    {form.tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-400 transition-colors">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Type a tag and press Enter"
                      className="flex-1 min-w-[150px] bg-transparent border-none text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none px-2"
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </form>
    </AppShell>
  )
}
