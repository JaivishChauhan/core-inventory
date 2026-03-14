export default function SkeletonRow({ cols = 5, rows = 3 }) {
  const widths = ['80%', '60%', '70%', '50%', '90%']
  
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-slate-800/40 hover:bg-transparent">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-6 py-4">
              <div 
                className="h-4 rounded bg-white/10 animate-pulse" 
                style={{ width: widths[(rIdx + cIdx) % widths.length] }} 
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
