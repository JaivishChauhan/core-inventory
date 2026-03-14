import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function useScrollReveal(options = {}) {
  const containerRef = useRef(null)

  useGSAP(
    () => {
      if (!containerRef.current) return

      const items = containerRef.current.querySelectorAll('.scroll-reveal-item')
      if (!items.length) return

      gsap.fromTo(
        items,
        { opacity: 0, y: options.y ?? 32, scale: options.scale ?? 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: options.duration ?? 0.55,
          stagger: options.stagger ?? 0.08,
          ease: options.ease ?? 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: options.start ?? 'top 85%',
            toggleActions: 'play none none none',
            once: true,
          },
        }
      )

      return () => ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    },
    { scope: containerRef }
  )

  return containerRef
}

export function useCounterOnScroll(targetValue, ref, duration = 1.5) {
  useGSAP(
    () => {
      if (!ref.current) return

      const obj = { val: 0 }

      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            val: targetValue,
            duration,
            ease: 'power2.out',
            onUpdate: () => {
              if (ref.current) {
                ref.current.textContent = Math.round(obj.val).toLocaleString('en-IN')
              }
            },
          })
          ref.current.classList.add('animating')
          window.setTimeout(() => ref.current?.classList.remove('animating'), duration * 1000)
        },
      })

      return () => ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    },
    { scope: ref }
  )
}

export function useTableScrollReveal(deps = []) {
  const tbodyRef = useRef(null)

  useGSAP(
    () => {
      if (!tbodyRef.current) return

      const rows = tbodyRef.current.querySelectorAll('tr')
      if (!rows.length) return

      gsap.fromTo(
        rows,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.04,
          ease: 'power2.out',
          clearProps: 'transform',
        }
      )
    },
    { dependencies: deps, scope: tbodyRef, revertOnUpdate: true }
  )

  return tbodyRef
}
