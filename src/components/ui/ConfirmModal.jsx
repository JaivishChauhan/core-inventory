import { useEffect, useRef } from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { gsap } from 'gsap'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel, variant = 'success' }) {
  const backdropRef = useRef(null)
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      const ctx = gsap.context(() => {
        gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 })
        gsap.fromTo(modalRef.current, 
          { scale: 0.88, opacity: 0, y: 20 }, 
          { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.5)' }
        )
      })
      return () => ctx.revert()
    }
  }, [isOpen])

  const handleClose = () => {
    const ctx = gsap.context(() => {
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.2 })
      gsap.to(modalRef.current, { 
        scale: 0.92, opacity: 0, y: 10, duration: 0.2, ease: 'power2.in', 
        onComplete: onClose 
      })
    })
  }

  if (!isOpen) return null

  const isDanger = variant === 'danger'
  const Icon = isDanger ? AlertTriangle : CheckCircle
  const iconColor = isDanger ? 'text-rose-400' : 'text-emerald-400'
  const iconBg = isDanger ? 'bg-rose-500/20' : 'bg-emerald-500/20'
  const btnColor = isDanger ? 'bg-rose-600 hover:bg-rose-500 text-white border border-transparent' : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-transparent'

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start pt-[20vh] pointer-events-none">
      <div ref={backdropRef} className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={handleClose} />
      
      <div ref={modalRef} className="relative bg-[#161B22] border border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 pointer-events-auto">
        <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${iconBg}`}>
          <Icon className={iconColor} size={24} />
        </div>
        
        <h3 className="text-lg font-semibold text-slate-100 text-center mt-4">{title}</h3>
        <p className="text-sm text-slate-400 text-center mt-2">{message}</p>
        
        <div className="flex gap-3 justify-center mt-6">
          <button 
            onClick={handleClose}
            className="px-4 py-2 border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); handleClose(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${btnColor}`}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
