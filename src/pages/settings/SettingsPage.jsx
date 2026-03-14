import { useState } from 'react'
import { Settings as SettingsIcon, Building, Users, Link as LinkIcon, Sliders, Save } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'warehouses', label: 'Warehouses', icon: Building },
  { id: 'users', label: 'Users & Permissions', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: LinkIcon },
  { id: 'advanced', label: 'Advanced', icon: Sliders },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings', href: '/settings' }]}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg py-2 px-6 text-sm font-semibold transition-colors">
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Navigation Pills */}
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-[#161B22] border border-slate-800 text-primary shadow-sm shadow-[#161B22]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'}`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Main Panel */}
        <div className="flex-1">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'warehouses' && <WarehouseSettings />}
          {activeTab === 'users' && <div className="text-slate-400">Users settings panel...</div>}
          {activeTab === 'integrations' && <div className="text-slate-400">Integrations panel...</div>}
          {activeTab === 'advanced' && <div className="text-slate-400">Advanced settings panel...</div>}
        </div>
      </div>
    </AppShell>
  )
}

function GeneralSettings() {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#161B22] border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-bold text-slate-100 mb-6 uppercase tracking-wider">Company Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400">Company Name</label>
            <input type="text" defaultValue="CoreInventory Inc." className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400">Currency</label>
            <select className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors cursor-pointer">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs font-semibold text-slate-400">Company Address</label>
            <textarea rows="3" defaultValue="123 Logistics Way, Suite 400\nSan Francisco, CA 94105" className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors resize-y" />
          </div>
        </div>
      </div>

      <div className="bg-[#161B22] border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-bold text-slate-100 mb-6 uppercase tracking-wider">Preferences</h2>
        
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-200">Email Notifications</span>
              <span className="text-xs text-slate-500 mt-0.5">Receive daily summaries and low stock alerts</span>
            </div>
            <Toggle defaultChecked />
          </div>
          
          <div className="w-full h-px bg-slate-800/50" />
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-200">Auto-validate Receipts</span>
              <span className="text-xs text-slate-500 mt-0.5">Automatically mark receipts as done when scan matches</span>
            </div>
            <Toggle />
          </div>
        </div>
      </div>
    </div>
  )
}

function WarehouseSettings() {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#161B22] border border-slate-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Configured Warehouses</h2>
          <button className="text-xs font-semibold text-primary hover:underline">Add Warehouse</button>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Building size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200">Main Warehouse</span>
                <span className="text-xs text-slate-500">San Francisco, CA</span>
              </div>
            </div>
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-500/20">Active</span>
          </div>

          <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-500 flex items-center justify-center">
                <Building size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200">East Coast Hub</span>
                <span className="text-xs text-slate-500">New York, NY</span>
              </div>
            </div>
            <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded border border-slate-700">Inactive</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({ defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <button 
      onClick={() => setChecked(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-700'}`}
    >
      <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}
