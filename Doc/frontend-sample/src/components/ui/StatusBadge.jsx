import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function StatusBadge({ status }) {
  const ref = useRef(null)
  let styleClasses = ""
  let hasPulse = false
  
  switch(status?.toLowerCase()) {
    case 'draft': styleClasses = "bg-sky-500/10 text-sky-300 border-sky-500/30"; break;
    case 'waiting': styleClasses = "bg-amber-500/10 text-amber-300 border-amber-500/30"; break;
    case 'ready': styleClasses = "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"; break;
    case 'done': styleClasses = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"; break;
    case 'canceled': styleClasses = "bg-rose-500/10 text-rose-300 border-rose-500/30"; break;
    case 'late': styleClasses = "bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse"; hasPulse = true; break;
    case 'low': styleClasses = "bg-amber-500/10 text-amber-300 border-amber-500/20"; break;
    case 'critical': styleClasses = "bg-rose-500/10 text-rose-300 border-rose-500/20"; break;
    default: styleClasses = "bg-white/5 text-slate-400 border-white/10";
  }

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' })
  }, [status])

  return (
    <span ref={ref} className={`inline-flex items-center gap-1 px-2.5 py-1 border rounded-full text-[10px] font-semibold uppercase tracking-[0.2em] ${styleClasses}`}>
      {hasPulse && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
      {status}
    </span>
  )
}
