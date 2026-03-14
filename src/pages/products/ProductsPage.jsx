import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Box, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import AppShell from '../../components/layout/AppShell'
import EmptyState from '../../components/ui/EmptyState'
import SkeletonRow from '../../components/ui/SkeletonRow'
import SkuPill from '../../components/ui/SkuPill'
import StockBar from '../../components/ui/StockBar'
import { useTableAnimation } from '../../hooks/useTableAnimation'
import { formatCurrency, getApiErrorMessage } from '../../utils/api'

function getStockStatus(product) {
  if (product.on_hand === 0) return 'critical'
  if (product.on_hand <= product.reorder_level) return 'low'
  return 'ok'
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category') || '',
    unit: searchParams.get('unit') || '',
    stockStatus: searchParams.get('filter') || '',
  })

  const tbodyRef = useTableAnimation([products, loading, filters.search, filters.category_id, filters.unit, filters.stockStatus])

  const queryParams = useMemo(() => {
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.category_id) params.category_id = filters.category_id
    if (filters.unit) params.unit = filters.unit
    if (filters.stockStatus) {
      const statusMap = { low: 'low', out: 'out', in: 'in' }
      params.stock_status = statusMap[filters.stockStatus] || filters.stockStatus
    }
    params.limit = 100
    return params
  }, [filters])

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (filters.search) nextParams.set('search', filters.search)
    if (filters.category_id) nextParams.set('category', filters.category_id)
    if (filters.unit) nextParams.set('unit', filters.unit)
    if (filters.stockStatus) nextParams.set('filter', filters.stockStatus)
    setSearchParams(nextParams, { replace: true })
  }, [filters, setSearchParams])

  const loadProducts = async () => {
    setLoading(true)
    setError('')

    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products', { params: queryParams }),
        api.get('/categories'),
      ])

      setProducts(productsRes.data.data.products || [])
      setCategories(categoriesRes.data.data.categories || [])
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load products'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [queryParams.search, queryParams.category_id, queryParams.unit, queryParams.stock_status])

  const handleDelete = async (productId) => {
    if (!window.confirm('Deactivate this product?')) {
      return
    }

    setDeletingId(productId)

    try {
      await api.delete(`/products/${productId}`)
      await loadProducts()
    } catch (requestError) {
      window.alert(getApiErrorMessage(requestError, 'Unable to deactivate product'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Products', href: '/products' }]}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Product Management</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProducts}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 h-10 px-4 rounded-lg text-sm text-slate-300 transition-colors"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
          <button
            onClick={() => navigate('/products/new')}
            className="flex items-center bg-primary hover:bg-primary/90 text-white h-10 px-4 rounded-lg font-semibold text-sm transition-colors"
          >
            <Plus size={20} className="mr-1 font-bold" /> New Product
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="bg-[#161B22] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4 mb-4">
        <div className="relative max-w-[300px] w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-slate-100 placeholder:text-slate-600 transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={filters.category_id}
            onChange={(event) => setFilters((prev) => ({ ...prev, category_id: event.target.value }))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 focus:outline-none hover:border-primary/30 cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={filters.unit}
            onChange={(event) => setFilters((prev) => ({ ...prev, unit: event.target.value }))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 focus:outline-none hover:border-primary/30 cursor-pointer"
          >
            <option value="">All Units</option>
            {['pcs', 'kg', 'box', 'litre', 'metre', 'pair', 'set'].map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>

          <select
            value={filters.stockStatus}
            onChange={(event) => setFilters((prev) => ({ ...prev, stockStatus: event.target.value }))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 focus:outline-none hover:border-primary/30 cursor-pointer"
          >
            <option value="">All Stock Statuses</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500">Showing {products.length} products</div>
      </div>

      {!loading && products.length === 0 ? (
        <EmptyState
          icon={filters.stockStatus ? AlertTriangle : Box}
          title="No products found"
          description="Try changing your filters or add a new product."
          actionLabel="Add Product"
          onAction={() => navigate('/products/new')}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#161B22] mb-6 relative">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead className="bg-[#21262D] text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-4">PRODUCT</th>
                  <th className="px-4 py-4">SKU</th>
                  <th className="px-4 py-4">CATEGORY</th>
                  <th className="px-4 py-4">UNIT</th>
                  <th className="px-4 py-4 text-right">COST</th>
                  <th className="px-4 py-4">ON HAND</th>
                  <th className="px-4 py-4">FREE TO USE</th>
                  <th className="px-4 py-4">REORDER LEVEL</th>
                  <th className="px-4 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody ref={tbodyRef} className="divide-y divide-slate-800">
                {loading ? (
                  <SkeletonRow cols={9} rows={5} />
                ) : (
                  products.map((product) => {
                    const status = getStockStatus(product)
                    return (
                      <tr
                        key={product.id}
                        className="transition-colors group hover:bg-slate-800/50 border-l-2 border-transparent"
                      >
                        <td className="px-4 py-4 cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${status === 'critical' ? 'bg-slate-800 text-slate-500 grayscale' : 'bg-primary/10 text-primary'}`}>
                              <Box size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`font-semibold ${status === 'critical' ? 'text-slate-400' : 'text-slate-100'}`}>{product.name}</span>
                              <span className="text-xs text-slate-500">{product.category_name || 'Uncategorized'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <SkuPill sku={product.sku} outOfStock={status === 'critical'} />
                        </td>
                        <td className={`px-4 py-4 ${status === 'critical' ? 'text-slate-500' : 'text-slate-400'}`}>
                          {product.category_name || '—'}
                        </td>
                        <td className={`px-4 py-4 ${status === 'critical' ? 'text-slate-500' : 'text-slate-400'}`}>
                          {product.unit_of_measure}
                        </td>
                        <td className={`px-4 py-4 text-right font-medium ${status === 'critical' ? 'text-slate-500' : 'text-slate-200'}`}>
                          {formatCurrency(product.per_unit_cost)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1.5 w-24">
                            <span className={`font-mono font-bold ${status === 'critical' ? 'text-rose-500' : status === 'low' ? 'text-orange-400' : 'text-slate-100'}`}>
                              {product.on_hand}
                            </span>
                            <StockBar value={product.on_hand} max={Math.max(product.reorder_level * 3, product.on_hand || 1)} status={status} />
                          </div>
                        </td>
                        <td className={`px-4 py-4 font-mono font-bold ${status === 'critical' ? 'text-rose-500' : status === 'low' ? 'text-orange-500' : 'text-emerald-500'}`}>
                          {product.free_to_use}
                        </td>
                        <td className="px-4 py-4 text-slate-400">{product.reorder_level}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/products/${product.id}`)}
                              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-primary/40 hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingId === product.id}
                              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20 disabled:opacity-60"
                            >
                              <span className="inline-flex items-center gap-1">
                                <Trash2 size={12} /> {deletingId === product.id ? 'Removing...' : 'Deactivate'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  )
}
