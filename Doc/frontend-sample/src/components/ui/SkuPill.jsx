export default function SkuPill({ sku, outOfStock = false }) {
  return (
    <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.2em] border ${outOfStock ? 'border-transparent text-slate-500 bg-white/5' : 'border-white/10 text-slate-200 bg-white/5'}`}>
      {sku}
    </span>
  )
}
