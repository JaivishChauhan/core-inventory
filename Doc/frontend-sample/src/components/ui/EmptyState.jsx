import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  const containerRef = useRef(null)

  useGSAP(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, scale: 0.9, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.3)' }
    )
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="py-20 flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
          {Icon && <Icon className="text-slate-600" size={32} />}
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-background-dark border-2 border-slate-700 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        </div>
      </div>
      <div className="text-center max-w-xs">
        <h3 className="text-base font-semibold text-slate-400">{title}</h3>
        {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
      </div>
      {actionLabel && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 h-9 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors mt-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
