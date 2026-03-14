import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#3083f8', '#3FB950', '#BC8CFF', '#D29922', '#F85149', '#06B6D4']

export default function CategoryDonut({ data }) {
  return (
    <div className="glass rounded-xl border border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-100 mb-1">Stock by Category</h3>
      <p className="text-xs text-slate-500 mb-4">Distribution of inventory value</p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              dataKey="value"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 8 }}
              formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
              labelStyle={{ color: '#8B949E', fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 flex-1">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-xs text-slate-400 flex-1 truncate">{entry.name}</span>
              <span className="text-xs text-slate-200 font-mono">{entry.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
