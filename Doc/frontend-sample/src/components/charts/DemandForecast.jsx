import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Brain } from 'lucide-react'
import api from '../../api/axios'

export default function DemandForecast({ productId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    api
      .get(`/ai/demand-forecast/${productId}`)
      .then((response) => {
        setData(response.data.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [productId])

  if (loading) {
    return <div className="h-40 bg-slate-900/50 rounded-xl animate-pulse" />
  }

  if (!data || data.forecast.length === 0) {
    return (
      <div className="glass rounded-xl border border-slate-800 p-4 text-center text-sm text-slate-600">
        Insufficient data for forecast (need 3+ days of delivery history)
      </div>
    )
  }

  const chartData = [
    ...(data.historical_daily?.slice(-14).map((item) => ({ ...item, type: 'actual' })) || []),
    ...data.forecast.map((item) => ({ date: item.date, predicted: item.predicted_demand, type: 'forecast' })),
  ]

  const TrendIcon = data.trend === 'increasing' ? TrendingUp : data.trend === 'decreasing' ? TrendingDown : Minus
  const trendColor = data.trend === 'increasing' ? '#3FB950' : data.trend === 'decreasing' ? '#F85149' : '#8B949E'

  return (
    <div className="glass rounded-xl border border-slate-800 p-5 mt-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={15} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-slate-100">7-Day Demand Forecast</h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
              data.confidence === 'high'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : data.confidence === 'medium'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {data.confidence} confidence
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: trendColor }}>
          <TrendIcon size={13} />
          <span className="capitalize">{data.trend} trend</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#484F58', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(label) => label?.slice(5)}
          />
          <YAxis tick={{ fill: '#484F58', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#8B949E' }}
            itemStyle={{ color: '#E6EDF3' }}
          />
          <ReferenceLine x={new Date().toISOString().split('T')[0]} stroke="#30363D" strokeDasharray="4 2" />
          <Line dataKey="consumed" name="Actual" stroke="#3083f8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
          <Line dataKey="predicted" name="Forecast" stroke="#BC8CFF" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: 'Avg Daily', value: data.avg_daily_demand, unit: '/day', color: '#3083f8' },
          { label: 'Next 7 Days', value: data.forecast.reduce((sum, item) => sum + item.predicted_demand, 0).toFixed(0), unit: 'units', color: '#BC8CFF' },
          { label: 'Data Points', value: data.data_points, unit: 'days', color: '#8B949E' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-lg font-bold font-mono mt-1" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-slate-600">{stat.unit}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
