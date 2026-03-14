import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import CommandPalette from '../ui/CommandPalette'
import useAuthStore from '../../store/authStore'
import useAlertStore from '../../store/alertStore'
import Toast from '../ui/Toast'

export default function AppShell({ children, breadcrumbs = [] }) {
  const mainRef = useRef(null)
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const { toasts, removeToast, setLowStock, addToast } = useAlertStore()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(mainRef.current,
        { opacity: 0, y: 16, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' }
      )
    })
    return () => ctx.revert()
  }, [location.pathname])

  useEffect(() => {
    if (!token) return

    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/dashboard/alerts/stream?token=${token}`
    const eventSource = new EventSource(url)

    eventSource.addEventListener('connected', () => {
      // connection established
    })

    eventSource.addEventListener('low_stock_alert', (event) => {
      const data = JSON.parse(event.data)
      setLowStock(data.products || [])
      addToast({
        type: 'warning',
        title: 'Low Stock Alert',
        message: data.message,
      })
    })

    eventSource.addEventListener('receipt_validated', (event) => {
      const data = JSON.parse(event.data)
      addToast({
        type: 'success',
        title: 'Receipt Validated',
        message: data.message,
      })
    })

    eventSource.addEventListener('delivery_validated', (event) => {
      const data = JSON.parse(event.data)
      addToast({
        type: 'success',
        title: 'Delivery Complete',
        message: data.message,
      })
    })

    eventSource.onerror = () => {
      // Browser will retry automatically.
    }

    return () => eventSource.close()
  }, [token, setLowStock, addToast])

  return (
    <div className="relative flex h-screen overflow-hidden bg-background-dark text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-96 w-96 rounded-full bg-indigo-500/10 blur-[140px]" />
      </div>
      <Sidebar />
      <div className="relative flex-1 flex flex-col overflow-hidden">
        <TopBar breadcrumbs={breadcrumbs} />
        <main ref={mainRef} className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1400px] w-full">
            {children}
          </div>
        </main>
      </div>

      {toasts.length > 0 && (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onRemove={removeToast} />
          ))}
        </div>
      )}

      <CommandPalette />
    </div>
  )
}
