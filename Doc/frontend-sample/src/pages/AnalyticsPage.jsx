import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import StockFlowChart from '../components/charts/StockFlowChart'
import CategoryDonut from '../components/charts/CategoryDonut'
import api from '../api/axios'

export default function AnalyticsPage() {
  const [flowData, setFlowData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/dashboard/stock-flow'), api.get('/dashboard/category-breakdown'), api.get('/dashboard/stats')])
      .then(([flowRes, categoryRes, statsRes]) => {
        setFlowData(flowRes.data.data.flow || [])
        setCategoryData(categoryRes.data.data.categories || [])
        setStats(statsRes.data.data || {})
      })
      .catch(() => {})
  }, [])

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics', href: '/analytics' }]}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <BarChart3 size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-500">Inventory performance and movement trends</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Stock Units', value: stats.total_stock_units },
            { label: 'Low Stock', value: stats.low_stock_count },
            { label: 'Pending Receipts', value: stats.pending_receipts },
            { label: 'Pending Deliveries', value: stats.pending_deliveries },
          ].map((item) => (
            <div key={item.label} className="glass rounded-xl border border-slate-800 p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">{item.label}</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-2">{Number(item.value || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <StockFlowChart data={flowData} />
        </div>
        <div>
          <CategoryDonut data={categoryData} />
        </div>
      </div>
    </AppShell>
  )
}
