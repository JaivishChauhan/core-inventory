import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function AppLoader({ onComplete }) {
  const loaderRef = useRef(null)
  const logoRef = useRef(null)
  const progressRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline()

    tl.fromTo(logoRef.current, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' })
      .fromTo(textRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2')
      .fromTo(progressRef.current, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0.4)
      .to(loaderRef.current, { opacity: 0, duration: 0.4, delay: 0.2, onComplete })

    return () => tl.kill()
  }, [onComplete])

  return (
    <div ref={loaderRef} className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background-dark">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(48,131,248,0.08) 0%, transparent 70%)' }}
      />

      <div ref={logoRef} className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-blue">
          <svg viewBox="0 0 48 48" className="w-8 h-8 text-primary fill-current">
            <path
              clipRule="evenodd"
              d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z"
              fillRule="evenodd"
            />
          </svg>
        </div>
      </div>

      <div ref={textRef} className="text-center mb-8">
        <h1 className="text-xl font-bold text-slate-100">CoreInventory</h1>
        <p className="text-sm text-slate-500 mt-1">Loading your workspace...</p>
      </div>

      <div className="w-48 h-0.5 bg-slate-800 rounded-full overflow-hidden">
        <div ref={progressRef} className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full" />
      </div>
    </div>
  )
}
