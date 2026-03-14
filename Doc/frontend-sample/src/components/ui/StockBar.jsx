import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function StockBar({ value, max, status = 'ok' }) {
  const barRef = useRef(null)
  
  let pct = (value / max) * 100
  if (isNaN(pct)) pct = 0
  if (pct > 100) pct = 100
  if (pct < 0) pct = 0

  let colorClass = 'from-emerald-400 to-emerald-600'
  if (status === 'low') colorClass = 'from-amber-400 to-orange-500'
  if (status === 'critical') colorClass = 'from-rose-400 to-rose-600'

  useLayoutEffect(() => {
    if (barRef.current) {
      gsap.fromTo(barRef.current,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.9, ease: 'power3.out', delay: 0.1 }
      )
    }
  }, [value, max])

  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-2">
      <div 
        ref={barRef}
        className={`h-full rounded-full bg-gradient-to-r ${colorClass}`} 
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
