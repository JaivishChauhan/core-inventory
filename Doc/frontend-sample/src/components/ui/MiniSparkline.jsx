import { useEffect, useRef } from 'react'

export default function MiniSparkline({ data = [], color = 'blue', height = 32, width = 80 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return
    const ctx = canvas.getContext('2d')
    canvas.width = width
    canvas.height = height

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const step = width / (data.length - 1)

    const colorMap = {
      blue: '#3083f8',
      green: '#3FB950',
      red: '#F85149',
      amber: '#D29922',
      purple: '#BC8CFF',
    }
    const lineColor = colorMap[color] || colorMap.blue

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `${lineColor}40`)
    gradient.addColorStop(1, `${lineColor}00`)

    ctx.beginPath()
    data.forEach((val, i) => {
      const x = i * step
      const y = height - ((val - min) / range) * (height - 4) - 2
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })

    ctx.lineTo((data.length - 1) * step, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    data.forEach((val, i) => {
      const x = i * step
      const y = height - ((val - min) / range) * (height - 4) - 2
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [data, color, height, width])

  return <canvas ref={canvasRef} className="mt-3 opacity-70" style={{ width, height }} />
}
