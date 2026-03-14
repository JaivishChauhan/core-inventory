import { Command } from 'cmdk'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import {
  LayoutDashboard,
  Box,
  PackageCheck,
  Truck,
  SlidersHorizontal,
  History,
  Settings,
  Plus,
  Search,
  ArrowRight,
  Zap,
  Brain,
  BarChart3,
  ScanLine,
} from 'lucide-react'

const COMMANDS = [
  { group: 'Navigate', icon: LayoutDashboard, label: 'Go to Dashboard', shortcut: 'G D', path: '/dashboard' },
  { group: 'Navigate', icon: Box, label: 'Go to Products', shortcut: 'G P', path: '/products' },
  { group: 'Navigate', icon: PackageCheck, label: 'Go to Receipts', shortcut: 'G R', path: '/operations/receipts' },
  { group: 'Navigate', icon: Truck, label: 'Go to Deliveries', shortcut: 'G L', path: '/operations/delivery' },
  { group: 'Navigate', icon: History, label: 'Go to Move History', shortcut: 'G H', path: '/history' },
  { group: 'Navigate', icon: BarChart3, label: 'Go to Analytics', shortcut: 'G A', path: '/analytics' },
  { group: 'Create', icon: Plus, label: 'New Receipt', shortcut: 'N R', path: '/operations/receipts/new' },
  { group: 'Create', icon: Plus, label: 'New Delivery Order', shortcut: 'N D', path: '/operations/delivery/new' },
  { group: 'Create', icon: Plus, label: 'New Product', shortcut: 'N P', path: '/products/new' },
  { group: 'Create', icon: SlidersHorizontal, label: 'New Stock Adjustment', shortcut: 'N A', path: '/operations/adjustment' },
  { group: 'Settings', icon: Settings, label: 'Settings', shortcut: '', path: '/settings' },
  { group: 'AI', icon: Brain, label: 'AI Insights', shortcut: 'G I', path: '/ai-insights' },
  { group: 'AI', icon: Zap, label: 'Inventory Health', shortcut: '', path: '/ai-insights' },
  { group: 'Navigate', icon: ScanLine, label: 'Open Barcode Scanner', shortcut: 'G B', path: '/barcode' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const overlayRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)

    const openHandler = () => setOpen(true)
    window.addEventListener('cmdk:open', openHandler)

    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('cmdk:open', openHandler)
    }
  }, [])

  useEffect(() => {
    if (open && overlayRef.current && panelRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.94, y: -20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(1.4)' }
      )
    }
  }, [open])

  const runCommand = (path) => {
    setOpen(false)
    navigate(path)
  }

  if (!open) return null

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div
        ref={panelRef}
        className="relative w-full max-w-[560px] glass-elevated rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-black/60"
      >
        <Command className="bg-transparent" loop>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
            <Search size={16} className="text-slate-500 flex-shrink-0" />
            <Command.Input
              placeholder="Search commands, pages, products..."
              className="bg-transparent text-slate-100 text-sm w-full outline-none placeholder:text-slate-600"
              autoFocus
            />
            <kbd className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ESC</kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-slate-600">
              No commands found.
            </Command.Empty>

            {['Navigate', 'Create', 'AI', 'Settings'].map((group) => {
              const items = COMMANDS.filter((command) => command.group === group)
              if (!items.length) return null
              return (
                <Command.Group
                  key={group}
                  heading={group}
                  className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-slate-600 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:tracking-wider"
                >
                  {items.map((command) => (
                    <Command.Item
                      key={command.path}
                      value={command.label}
                      onSelect={() => runCommand(command.path)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-slate-300 text-sm data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors"
                    >
                      <command.icon size={15} className="text-slate-500 flex-shrink-0" />
                      <span className="flex-1">{command.label}</span>
                      {command.shortcut && (
                        <span className="flex gap-1">
                          {command.shortcut.split(' ').map((key, index) => (
                            <kbd key={index} className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {key}
                            </kbd>
                          ))}
                        </span>
                      )}
                      <ArrowRight size={12} className="text-slate-700 opacity-0 data-[selected=true]:opacity-100" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )
            })}
          </Command.List>

          <div className="border-t border-slate-800 px-4 py-2 flex items-center gap-4 text-[11px] text-slate-700">
            <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1 rounded">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1 rounded">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1 rounded">⌘K</kbd> toggle</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
