import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function StockBar({ value, max, status = 'ok' }) {
  const barRef = useRef(null)
  
  let pct = (value / max) * 100
  if (isNaN(pct)) pct = 0
  if (pct > 100) pct = 100
  if (pct < 0) pct = 0

  let colorClass = 'bg-emerald-500'
  if (status === 'low') colorClass = 'bg-orange-500'
  if (status === 'critical') colorClass = 'bg-rose-500'

  useLayoutEffect(() => {
    if (barRef.current) {
      gsap.fromTo(barRef.current,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.9, ease: 'power3.out', delay: 0.1 }
      )
    }
  }, [value, max])

  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
      <div 
        ref={barRef}
        className={`h-full rounded-full ${colorClass}`} 
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
