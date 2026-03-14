import { ChevronRight, Search, Bell, ChevronDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useAlertStore from '../../store/alertStore'

export default function TopBar({ breadcrumbs = [] }) {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user) || { name: 'Admin' }
  const initials = user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
  const lowStock = useAlertStore((state) => state.lowStock)
  const hasAlerts = lowStock.length > 0

  return (
    <div className="h-14 bg-[#161B22] border-b border-slate-800 sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Left Menu / Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-medium">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          return (
            <div key={index} className="flex items-center gap-2">
              <Link to={crumb.href} className={`hover:text-primary transition-colors ${isLast ? 'text-primary' : ''}`}>
                {crumb.label}
              </Link>
              {!isLast && <ChevronRight size={12} />}
            </div>
          )
        })}
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 flex items-center justify-center bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-slate-300">
          <Search size={18} />
        </button>
        
        <button className="relative w-9 h-9 flex items-center justify-center bg-transparent rounded-lg hover:bg-slate-800 transition-colors text-slate-400">
          <Bell size={18} />
          {hasAlerts && <span className="absolute top-[6px] right-[8px] w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
        </button>
        
        <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-700 transition-colors">
          <span className="text-sm text-slate-300 font-medium select-none">Main Warehouse</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
        
        <div 
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary cursor-pointer ml-1"
        >
          {initials}
        </div>
      </div>
    </div>
  )
}
