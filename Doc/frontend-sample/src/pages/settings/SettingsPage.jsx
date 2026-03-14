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
        <h1 className="text-2xl font-semibold text-slate-100">Settings</h1>
        <button className="btn-primary py-2 px-6 text-sm">
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Navigation Pills */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${isActive ? 'bg-white/5 border border-white/10 text-primary shadow-[0_12px_30px_-20px_rgba(76,201,240,0.6)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}
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
          {activeTab === 'users' && <UsersSettings />}
          {activeTab === 'integrations' && <IntegrationsSettings />}
          {activeTab === 'advanced' && <AdvancedSettings />}
        </div>
      </div>
    </AppShell>
  )
}

function GeneralSettings() {
  return (
    <div className="flex flex-col gap-6">
      <div className="panel p-6">
        <h2 className="text-sm font-bold text-slate-100 mb-6 uppercase tracking-wider">Company Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400">Company Name</label>
            <input type="text" defaultValue="CoreInventory Inc." className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400">Currency</label>
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors cursor-pointer">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs font-semibold text-slate-400">Company Address</label>
            <textarea rows="3" defaultValue="123 Logistics Way, Suite 400\nSan Francisco, CA 94105" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors resize-y" />
          </div>
        </div>
      </div>

      <div className="panel p-6">
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
      <div className="panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Configured Warehouses</h2>
          <button className="text-xs font-semibold text-primary hover:underline">Add Warehouse</button>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-white/5">
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

          <div className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-white/5">
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

function UsersSettings() {
  return (
    <div className="flex flex-col gap-6">
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Team Members</h2>
            <p className="text-xs text-slate-500 mt-1">Invite users and manage warehouse permissions.</p>
          </div>
          <button className="btn-primary py-2 px-4 text-xs">Invite User</button>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { name: 'Admin User', email: 'admin@coreinventory.com', role: 'Inventory Manager', status: 'Active' },
            { name: 'Warehouse Staff', email: 'staff@coreinventory.com', role: 'Warehouse Staff', status: 'Active' },
            { name: 'Priya Shah', email: 'priya@coreinventory.com', role: 'Viewer', status: 'Invited' },
          ].map((u) => (
            <div key={u.email} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border border-white/10 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
                  {u.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-full border ${u.status === 'Active' ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' : 'border-slate-700 text-slate-400 bg-slate-800/60'}`}>
                  {u.status}
                </span>
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200">
                  <option>Inventory Manager</option>
                  <option>Warehouse Staff</option>
                  <option>Viewer</option>
                </select>
                <button className="btn-ghost px-3 py-2 text-xs">Manage</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-6">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { role: 'Inventory Manager', desc: 'Full access to inventory, reports, and settings.' },
            { role: 'Warehouse Staff', desc: 'Create receipts, deliveries, and transfers.' },
            { role: 'Viewer', desc: 'Read-only access to dashboards and reports.' },
          ].map((r) => (
            <div key={r.role} className="border border-white/10 rounded-xl p-4 bg-white/5">
              <div className="text-sm font-semibold text-slate-200">{r.role}</div>
              <div className="text-xs text-slate-500 mt-1">{r.desc}</div>
              <button className="btn-ghost w-full mt-4 py-2 text-xs">Edit Permissions</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function IntegrationsSettings() {
  return (
    <div className="flex flex-col gap-6">
      <div className="panel p-6">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-6">Connected Apps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Gmail SMTP', desc: 'Send OTPs and alerts via email', status: 'Connected' },
            { name: 'Slack Alerts', desc: 'Low-stock notifications in Slack', status: 'Not Connected' },
            { name: 'Webhook Hub', desc: 'Push inventory events to your apps', status: 'Connected' },
            { name: 'AI Service', desc: 'Reorder insights and stock checks', status: 'Connected' },
          ].map((app) => (
            <div key={app.name} className="border border-white/10 rounded-xl p-4 bg-white/5 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-200">{app.name}</div>
                <div className="text-xs text-slate-500 mt-1">{app.desc}</div>
              </div>
              <button className={`${app.status === 'Connected' ? 'btn-ghost' : 'btn-primary'} px-4 py-2 text-xs`}>
                {app.status === 'Connected' ? 'Manage' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-6">API Endpoints</h2>
        <div className="flex flex-col gap-4">
          {[
            { label: 'Webhook URL', value: 'https://api.coreinventory.com/hooks/warehouse-events' },
            { label: 'AI Service URL', value: 'http://localhost:8000' },
            { label: 'Frontend URL', value: 'http://localhost:5173' },
          ].map((row) => (
            <div key={row.label} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border border-white/10 rounded-xl bg-white/5">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">{row.label}</div>
                <div className="text-sm text-slate-200 mt-1">{row.value}</div>
              </div>
              <button className="btn-ghost px-4 py-2 text-xs">Copy</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdvancedSettings() {
  return (
    <div className="flex flex-col gap-6">
      <div className="panel p-6">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-6">Security</h2>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-200">Enforce 2FA</div>
              <div className="text-xs text-slate-500">Require two-factor authentication for all admins.</div>
            </div>
            <Toggle defaultChecked />
          </div>
          <div className="w-full h-px bg-slate-800/50" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-200">Session Timeout</div>
              <div className="text-xs text-slate-500">Automatically sign out inactive users.</div>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200">
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>8 hours</option>
              <option>24 hours</option>
            </select>
          </div>
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-6">API Keys</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-white/5">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Primary Key</div>
              <div className="text-sm text-slate-200 mt-1 font-mono">sk_live_••••••••••••••••••</div>
            </div>
            <button className="btn-ghost px-4 py-2 text-xs">Regenerate</button>
          </div>
          <div className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-white/5">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Webhook Secret</div>
              <div className="text-sm text-slate-200 mt-1 font-mono">whsec_••••••••••••••••••</div>
            </div>
            <button className="btn-ghost px-4 py-2 text-xs">Rotate</button>
          </div>
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-6">Data & Maintenance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-ghost py-3 text-xs">Export Data</button>
          <button className="btn-ghost py-3 text-xs">Download Logs</button>
          <button className="bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-xl py-3 text-xs font-semibold">Clear Cache</button>
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
