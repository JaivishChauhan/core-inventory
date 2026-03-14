import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export function useTableAnimation(deps = []) {
  const tbodyRef = useRef(null)
  
  useEffect(() => {
    if (!tbodyRef.current) return
    const rows = tbodyRef.current.querySelectorAll('tr')
    gsap.fromTo(rows,
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
    )
  }, deps)
  
  return tbodyRef
}
