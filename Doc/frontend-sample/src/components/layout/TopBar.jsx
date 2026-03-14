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
  const openCommandPalette = () => window.dispatchEvent(new Event('cmdk:open'))

  return (
    <div className="h-16 bg-[#0f1426]/80 border-b border-slate-800/70 sticky top-0 z-20 px-6 flex items-center justify-between backdrop-blur-xl">
      {/* Left Menu / Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
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
        <button
          onClick={openCommandPalette}
          className="hidden lg:flex items-center gap-2 px-3 h-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-500 transition-colors"
        >
          <Search size={12} />
          <span>Search</span>
          <kbd className="ml-2 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">⌘K</kbd>
        </button>

        <button onClick={openCommandPalette} className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-slate-300 border border-white/5 lg:hidden">
          <Search size={18} />
        </button>
        
        <button className="relative w-9 h-9 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-slate-300 border border-white/5">
          <Bell size={18} />
          {hasAlerts && <span className="absolute top-[6px] right-[8px] w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
        </button>
        
        <button className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors">
          <span className="text-xs text-slate-200 font-medium select-none">Main Warehouse</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
        
        <div 
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary cursor-pointer ml-1"
        >
          {initials}
        </div>
      </div>
    </div>
  )
}
