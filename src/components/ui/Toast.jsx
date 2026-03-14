import { useEffect, useRef } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { gsap } from 'gsap'

export default function Toast({ id, type, title, message, onRemove }) {
  const toastRef = useRef(null)
  const progressRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Enter
      gsap.fromTo(toastRef.current, 
        { x: 100, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.2)' }
      )
      
      // Progress bar depletion
      gsap.fromTo(progressRef.current,
        { scaleX: 1, transformOrigin: 'left center' },
        { scaleX: 0, duration: 4, ease: 'none' }
      )
      
      // Exit and remove
      gsap.delayedCall(3.7, () => {
        gsap.to(toastRef.current, { 
          x: 100, opacity: 0, duration: 0.25, ease: 'power2.in', 
          onComplete: () => onRemove(id) 
        })
      })
    })

    return () => ctx.revert()
  }, [id, onRemove])

  let borderColor = 'border-blue-500'
  let Icon = Info
  let iconColor = 'text-blue-500'

  if (type === 'success') { borderColor = 'border-[#3FB950]'; Icon = CheckCircle; iconColor = 'text-[#3FB950]'; }
  if (type === 'error') { borderColor = 'border-[#F85149]'; Icon = XCircle; iconColor = 'text-[#F85149]'; }
  if (type === 'warning') { borderColor = 'border-[#D29922]'; Icon = AlertTriangle; iconColor = 'text-[#D29922]'; }

  return (
    <div 
      ref={toastRef}
      className={`relative bg-[#161B22] border-l-4 ${borderColor} border border-slate-800 shadow-2xl rounded-lg overflow-hidden min-w-[300px] max-w-[380px] pointer-events-auto`}
    >
      <div className="px-4 py-3 flex gap-3">
        <Icon className={`mt-0.5 shrink-0 ${iconColor}`} size={18} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-100">{title}</span>
          {message && <span className="text-xs text-slate-400 mt-1">{message}</span>}
        </div>
      </div>
      {/* Progress Bar */}
      <div 
        ref={progressRef}
        className={`absolute bottom-0 left-0 h-[3px] w-full bg-current ${iconColor} opacity-50`}
      />
    </div>
  )
}
