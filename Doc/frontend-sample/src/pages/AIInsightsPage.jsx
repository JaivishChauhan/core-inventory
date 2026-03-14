import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import api from '../api/axios'
import AppShell from '../components/layout/AppShell'
import {
  Brain,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  Target,
  PackageCheck,
  ChevronRight,
} from 'lucide-react'

export default function AIInsightsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    health: null,
    lowStock: [],
    reorder: [],
    anomalies: [],
    abc: {},
  })
  const pageRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.get('/ai/inventory-health'),
      api.get('/ai/low-stock-alerts'),
      api.get('/ai/reorder-suggestions'),
      api.get('/ai/anomalies'),
      api.get('/ai/abc-analysis'),
    ])
      .then(([healthRes, lowRes, reorderRes, anomaliesRes, abcRes]) => {
        setData({
          health: healthRes.data.data,
          lowStock: lowRes.data.data.alerts,
          reorder: reorderRes.data.data.suggestions,
          anomalies: anomaliesRes.data.data.anomalies,
          abc: abcRes.data.data,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  useGSAP(() => {
    if (loading) return
    gsap.fromTo(
      '.ai-section',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out', delay: 0.1 }
    )
  }, { scope: pageRef, dependencies: [loading] })

  const gradeColors = { A: '#3FB950', B: '#3083f8', C: '#D29922', D: '#F85149' }

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'AI Insights', href: '/ai-insights' }]}>
      <div ref={pageRef} className="max-w-[1280px] mx-auto">
        <div className="ai-section flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Brain size={16} className="text-purple-400" />
              </div>
              <span className="text-[11px] uppercase tracking-widest text-slate-500">AI Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">AI Insights</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time intelligence powered by your inventory data</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-400 transition-colors"
          >
            <RefreshCw size={14} /> Refresh Analysis
          </button>
        </div>

        {data.health && (
          <div className="ai-section glass-elevated border-gradient rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
              <div className="col-span-1 flex flex-col items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#21262D" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={gradeColors[data.health.grade]}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - data.health.score / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold font-mono" style={{ color: gradeColors[data.health.grade] }}>
                      {data.health.score}
                    </span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-2xl font-bold" style={{ color: gradeColors[data.health.grade] }}>
                    Grade {data.health.grade}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">Inventory Health</p>
                </div>
              </div>

              <div className="col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(data.health.breakdown).map(([key, val]) => (
                  <div key={key} className="bg-slate-900/50 rounded-xl p-4">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-2xl font-bold font-mono text-slate-100">{val}</span>
                      <span className="text-xs text-slate-600 mb-1">/ 100</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${val}%`,
                          backgroundColor: val >= 75 ? '#3FB950' : val >= 50 ? '#D29922' : '#F85149',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="ai-section glass rounded-xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-100">Anomaly Detection</h3>
              {data.anomalies.length > 0 && (
                <span className="ml-auto text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  {data.anomalies.length} detected
                </span>
              )}
            </div>
            {data.anomalies.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-600">
                ✓ No anomalies detected — inventory patterns look normal
              </div>
            ) : (
              <div className="space-y-3">
                {data.anomalies.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-amber-500/10 hover:border-amber-500/30 transition-colors"
                  >
                    <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-200 font-medium">{item.product_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      <p className="text-xs text-amber-400/70 mt-1">{item.type}</p>
                    </div>
                    <span
                      className={`ml-auto text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        item.severity === 'high'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ai-section glass rounded-xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-100">ABC Analysis</h3>
              <span className="ml-auto text-xs text-slate-500">By consumption value</span>
            </div>
            <div className="space-y-2">
              {[
                { grade: 'A', label: 'High Value', color: '#3FB950', desc: 'Top 20% products = 80% of value', count: data.abc.a_count || 0 },
                { grade: 'B', label: 'Medium Value', color: '#3083f8', desc: 'Next 30% products = 15% of value', count: data.abc.b_count || 0 },
                { grade: 'C', label: 'Low Value', color: '#8B949E', desc: 'Bottom 50% products = 5% of value', count: data.abc.c_count || 0 },
              ].map((tier) => (
                <div
                  key={tier.grade}
                  className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg group hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{ background: `${tier.color}20`, color: tier.color, border: `1px solid ${tier.color}30` }}
                  >
                    {tier.grade}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{tier.label}</p>
                    <p className="text-xs text-slate-600">{tier.desc}</p>
                  </div>
                  <span className="text-lg font-bold font-mono" style={{ color: tier.color }}>
                    {tier.count}
                  </span>
                  <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          <div className="ai-section lg:col-span-2 glass rounded-xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <PackageCheck size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-100">Smart Reorder Suggestions</h3>
              <span className="ml-auto text-xs text-slate-500">{data.reorder.length} products need restocking</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase text-slate-500 tracking-wider">
                  <th className="text-left pb-3">Product</th>
                  <th className="text-center pb-3">In Stock</th>
                  <th className="text-center pb-3">Daily Usage</th>
                  <th className="text-center pb-3">Days Left</th>
                  <th className="text-center pb-3">Suggested Order</th>
                  <th className="text-left pb-3">AI Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.reorder.slice(0, 8).map((item, index) => (
                  <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <p className="text-slate-200 font-medium">{item.product_name}</p>
                      <p className="text-xs text-slate-600 font-mono">{item.sku}</p>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-mono font-bold ${item.on_hand === 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                        {item.on_hand}
                      </span>
                    </td>
                    <td className="py-3 text-center text-slate-400 font-mono text-xs">
                      {Number(item.avg_daily_consumption).toFixed(1)}/day
                    </td>
                    <td className="py-3 text-center">
                      {item.days_of_stock_remaining < 999 ? (
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                            item.days_of_stock_remaining <= 3
                              ? 'bg-rose-500/10 text-rose-400'
                              : item.days_of_stock_remaining <= 7
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.days_of_stock_remaining}d
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-mono font-bold text-emerald-400">{item.suggested_reorder_qty}</span>
                    </td>
                    <td className="py-3 text-xs text-slate-600 max-w-[200px] truncate">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
