import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PackageCheck, PackageMinus, SlidersHorizontal, Box, History, Settings, ChevronRight, LogOut, Brain, BarChart3, ScanLine } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import useAuthStore from '../../store/authStore'

function SidebarParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width = 240
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 240,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.3 + 0.05,
    }))

    let animId
    const draw = () => {
      ctx.clearRect(0, 0, 240, canvas.height)
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(48,131,248,${p.opacity})`
        ctx.fill()
        p.y -= p.speed
        if (p.y < -5) p.y = canvas.height + 5
      })
      animId = window.requestAnimationFrame(draw)
    }

    draw()
    return () => window.cancelAnimationFrame(animId)
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-40" />
}

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
    const base = "group flex items-center gap-3 px-3 py-2.5 mx-3 rounded-xl transition-all "
    if (isActive) {
      return base + "active-link bg-primary/15 text-primary border border-primary/30 shadow-[0_10px_30px_-20px_rgba(76,201,240,0.9)]"
    }
    return base + "text-slate-400 hover:bg-white/5 hover:text-slate-100 border border-transparent"
  }

  const subLinkClass = ({ isActive }) => {
    const base = "flex items-center gap-3 px-3 py-2 mx-3 rounded-lg text-sm transition-colors "
    if (isActive) {
      return base + "bg-primary/10 text-primary border border-primary/20"
    }
    return base + "text-slate-400 hover:text-slate-100 hover:bg-white/5"
  }

  const initials = user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'

  return (
    <div className="relative w-64 flex-shrink-0 bg-[#0b1020]/95 border-r border-slate-800/70 flex flex-col h-full sticky top-0 overflow-hidden">
      <SidebarParticles />
      {/* Top Section */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/70 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-primary" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-slate-100">CoreInventory</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Control Center</span>
        </div>
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
            className="flex items-center justify-between px-3 py-2.5 mx-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-100 transition-colors border border-transparent"
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

        <NavLink to="/analytics" className={linkClass} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <BarChart3 size={20} />
          <span className="font-medium text-sm">Analytics</span>
        </NavLink>

        <NavLink to="/ai-insights" className={linkClass} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Brain size={20} />
          <span className="font-medium text-sm">AI Insights</span>
        </NavLink>

        <NavLink to="/barcode" className={linkClass} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <ScanLine size={20} />
          <span className="font-medium text-sm">Barcode</span>
        </NavLink>
        
        <NavLink to="/settings" className={linkClass} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Settings size={20} />
          <span className="font-medium text-sm">Settings</span>
        </NavLink>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto pt-4 border-t border-slate-800/70 px-4 pb-4">
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <div className="status-dot-live" />
          <span className="text-xs text-emerald-400">System Live</span>
          <span className="ml-auto text-[10px] text-emerald-600 font-mono">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="w-9 h-9 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-100">{user.name}</span>
              <span className="text-xs text-slate-500">{user.role}</span>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="p-2 text-slate-500 hover:text-rose-300 transition-colors rounded-xl hover:bg-rose-500/10">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
