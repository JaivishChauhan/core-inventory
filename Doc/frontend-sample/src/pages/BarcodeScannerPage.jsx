import { useState } from 'react'
import { ScanLine, Camera } from 'lucide-react'
import AppShell from '../components/layout/AppShell'

export default function BarcodeScannerPage() {
  const [value, setValue] = useState('')

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Barcode Scanner', href: '/barcode' }]}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <ScanLine size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Barcode Scanner</h1>
          <p className="text-sm text-slate-500">Scan items to search products and create receipts faster</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5">
        <div className="glass rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[320px]">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400 mb-4">
            <Camera size={26} />
          </div>
          <p className="text-sm text-slate-500 mb-4">Camera access is required to scan barcodes.</p>
          <button className="btn-primary px-5 py-2 text-sm">Enable Camera</button>
        </div>

        <div className="glass rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Manual Entry</h3>
          <p className="text-xs text-slate-500 mb-4">Paste or type a barcode to look up products.</p>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="e.g. 8901234567890"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary"
          />
          <button className="mt-4 btn-ghost px-4 py-2 text-xs">Search Inventory</button>
          {value && (
            <div className="mt-5 text-xs text-slate-500">
              Searching for barcode <span className="font-mono text-slate-300">{value}</span>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
