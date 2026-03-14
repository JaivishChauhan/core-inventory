import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export function useGsapEntrance(options = {}) {
  const containerRef = useRef(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: options.y ?? 20 },
        { opacity: 1, y: 0, duration: options.duration ?? 0.5,
          ease: options.ease ?? 'power2.out', delay: options.delay ?? 0 }
      )
    }, containerRef)
    return () => ctx.revert()
  }, [])
  
  return containerRef
}
