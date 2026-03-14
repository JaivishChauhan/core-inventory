import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PackageCheck, PackageMinus, SlidersHorizontal, Box, History, Settings, ChevronRight, LogOut } from 'lucide-react'
import { useRef, useState } from 'react'
import { gsap } from 'gsap'
import useAuthStore from '../../store/authStore'

export default function Sidebar() {
  const [opsOpen, setOpsOpen] = useState(false)
  const opsContentRef = useRef(null)
  const opsIconRef = useRef(null)
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)
  const user = useAuthStore(state => state.user) || { name: 'Admin User', role: 'Inventory Manager' }

  const handleOpsToggle = () => {
    const willOpen = !opsOpen
    setOpsOpen(willOpen)
    
    gsap.to(opsIconRef.current, { rotation: willOpen ? 90 : 0, duration: 0.2 })
    
    if (willOpen) {
      gsap.set(opsContentRef.current, { height: 'auto' })
      const targetHeight = opsContentRef.current.offsetHeight
      gsap.fromTo(opsContentRef.current, { height: 0, overflow: 'hidden' }, { height: targetHeight, duration: 0.3, ease: 'power2.inOut', clearProps: 'height,overflow' })
    } else {
      gsap.to(opsContentRef.current, { height: 0, overflow: 'hidden', duration: 0.3, ease: 'power2.inOut' })
    }
  }

  const handleMouseEnter = (e) => {
    gsap.to(e.currentTarget, { x: 4, duration: 0.2, ease: 'power2.out' })
  }
  const handleMouseLeave = (e) => {
    if (!e.currentTarget.classList.contains('active-link')) {
      gsap.to(e.currentTarget, { x: 0, duration: 0.2, ease: 'power2.out' })
    }
  }

  const linkClass = ({ isActive }) => {
    const base = "flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-colors "
    if (isActive) {
      return base + "active-link bg-primary/10 text-primary border-l-2 border-primary"
    }
    return base + "text-slate-400 hover:bg-slate-800 hover:text-slate-100 border-l-2 border-transparent"
  }

  const subLinkClass = ({ isActive }) => {
    const base = "flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors "
    if (isActive) {
      return base + "bg-primary/5 text-primary"
    }
    return base + "text-slate-400 hover:text-slate-100"
  }

  const initials = user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'

  return (
    <div className="w-60 flex-shrink-0 bg-[#161B22] border-r border-slate-800 flex flex-col h-full sticky top-0 overflow-hidden">
      {/* Top Section */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
        </svg>
        <span className="text-lg font-bold text-slate-100">CoreInventory</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-1">
        <NavLink to="/dashboard" className={linkClass} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <LayoutDashboard size={20} />
          <span className="font-medium text-sm">Dashboard</span>
        </NavLink>

        <div className="flex flex-col">
          <button 
            onClick={handleOpsToggle} 
            className="flex items-center justify-between px-3 py-2.5 mx-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors border-l-2 border-transparent"
          >
            <div className="flex items-center gap-3">
              <Box size={20} />
              <span className="font-medium text-sm">Operations</span>
            </div>
            <ChevronRight size={16} ref={opsIconRef} />
          </button>
          
          <div ref={opsContentRef} style={{ height: 0, overflow: 'hidden' }} className="flex flex-col gap-1 pl-4 mt-1">
            <NavLink to="/operations/receipts" className={subLinkClass}>
              <PackageCheck size={18} />
              <span>Receipts</span>
            </NavLink>
            <NavLink to="/operations/delivery" className={subLinkClass}>
              <PackageMinus size={18} />
              <span>Delivery</span>
            </NavLink>
            <NavLink to="/operations/adjustment" className={subLinkClass}>
              <SlidersHorizontal size={18} />
              <span>Adjustment</span>
            </NavLink>
          </div>
        </div>

        <NavLink to="/products" className={linkClass} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Box size={20} />
          <span className="font-medium text-sm">Products</span>
        </NavLink>
        
        <NavLink to="/history" className={linkClass} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <History size={20} />
          <span className="font-medium text-sm">Move History</span>
        </NavLink>
        
        <NavLink to="/settings" className={linkClass} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Settings size={20} />
          <span className="font-medium text-sm">Settings</span>
        </NavLink>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto pt-4 border-t border-slate-800 px-3 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/profile')}>
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-100">{user.name}</span>
            <span className="text-xs text-slate-500">{user.role}</span>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="p-2 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  )
}
