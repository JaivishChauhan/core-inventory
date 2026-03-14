import { useRef } from 'react'
import { gsap } from 'gsap'

export default function MagneticButton({ children, className, onClick, strength = 0.3, ...props }) {
  const btnRef = useRef(null)

  const handleMouseMove = (event) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2
    gsap.to(btn, { x: x * strength, y: y * strength, duration: 0.3, ease: 'power2.out' })
  }

  const handleMouseLeave = () => {
    gsap.to(btnRef.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
  }

  return (
    <button
      ref={btnRef}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  )
}
