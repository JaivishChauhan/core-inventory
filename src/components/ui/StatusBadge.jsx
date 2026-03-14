export default function StatusBadge({ status }) {
  let styleClasses = ""
  let hasPulse = false
  
  switch(status?.toLowerCase()) {
    case 'draft': styleClasses = "bg-blue-500/10 text-blue-400 border-blue-500/30"; break;
    case 'waiting': styleClasses = "bg-orange-500/10 text-orange-400 border-orange-500/30"; break;
    case 'ready': styleClasses = "bg-purple-500/10 text-purple-400 border-purple-500/30"; break;
    case 'done': styleClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"; break;
    case 'canceled': styleClasses = "bg-rose-500/10 text-rose-400 border-rose-500/30"; break;
    case 'late': styleClasses = "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse"; hasPulse = true; break;
    case 'low': styleClasses = "bg-orange-500/10 text-orange-400 border-transparent"; break;
    case 'critical': styleClasses = "bg-rose-500/10 text-rose-500 border-transparent"; break;
    default: styleClasses = "bg-slate-800 text-slate-400 border-slate-700";
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-[11px] font-bold uppercase tracking-wider ${styleClasses}`}>
      {hasPulse && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
      {status}
    </span>
  )
}
