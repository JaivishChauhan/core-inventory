export default function SkuPill({ sku, outOfStock = false }) {
  return (
    <span className={`px-2 py-0.5 rounded font-mono text-[11px] bg-slate-800 border ${outOfStock ? 'border-transparent text-slate-500' : 'border-slate-700 text-slate-300'}`}>
      {sku}
    </span>
  )
}
