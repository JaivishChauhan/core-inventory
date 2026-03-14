import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.1 }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="py-16 flex flex-col items-center gap-4 w-full">
      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
        {Icon && <Icon className="text-slate-500" size={28} />}
      </div>
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-lg font-semibold text-slate-400">{title}</h3>
        {description && <p className="text-sm text-slate-600 text-center max-w-xs">{description}</p>}
      </div>
      {actionLabel && (
        <button 
          onClick={onAction}
          className="mt-2 h-10 px-4 flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
