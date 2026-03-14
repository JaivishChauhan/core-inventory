import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-elevated rounded-lg px-4 py-3 border border-slate-700/50 shadow-xl">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-slate-400 capitalize">{item.name}:</span>
          <span className="text-slate-100 font-mono font-medium">{Number(item.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function StockFlowChart({ data }) {
  return (
    <div className="glass rounded-xl border border-slate-800 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Stock Flow</h3>
          <p className="text-xs text-slate-500 mt-0.5">Inbound vs Outbound — Last 30 Days</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 rounded inline-block" /> Inbound
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-400 rounded inline-block" /> Outbound
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3FB950" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3FB950" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F85149" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F85149" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#484F58', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#484F58', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#30363D' }} />
          <Area type="monotone" dataKey="inbound" stroke="#3FB950" strokeWidth={2} fill="url(#inGrad)" dot={false} activeDot={{ r: 4, fill: '#3FB950', strokeWidth: 0 }} />
          <Area type="monotone" dataKey="outbound" stroke="#F85149" strokeWidth={2} fill="url(#outGrad)" dot={false} activeDot={{ r: 4, fill: '#F85149', strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
