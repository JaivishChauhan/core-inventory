import { useState } from 'react'
import { User, Mail, Shield, Key, Save } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Profile', href: '/profile' }]}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-100">My Profile</h1>
        <button className="btn-primary py-2 px-6 text-sm">
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        
        {/* Left Col - Card */}
        <div className="flex flex-col gap-6">
          <div className="panel p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center mb-4 text-3xl font-bold">
              JD
            </div>
            <h2 className="text-lg font-semibold text-slate-100">Jane Doe</h2>
            <p className="text-sm text-slate-500 mb-4">Warehouse Manager</p>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 text-[10px] font-semibold uppercase rounded-full border border-emerald-500/20">Active Account</span>
          </div>

          <div className="flex flex-col gap-1">
            <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-white/5 border border-white/10 text-primary' : 'text-slate-500 hover:text-slate-300'}`}>
              <User size={18} /> Personal Info
            </button>
            <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-white/5 border border-white/10 text-primary' : 'text-slate-500 hover:text-slate-300'}`}>
              <Shield size={18} /> Security & Password
            </button>
          </div>
        </div>

        {/* Right Col */}
        <div className="flex flex-col gap-6">
          {activeTab === 'profile' && (
            <div className="panel p-6">
              <h3 className="text-sm font-bold text-slate-100 mb-6 uppercase tracking-wider">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">First Name</label>
                  <input type="text" defaultValue="Jane" className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">Last Name</label>
                  <input type="text" defaultValue="Doe" className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input type="email" defaultValue="jane.doe@coreinventory.com" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-400">Role</label>
                  <input type="text" defaultValue="Warehouse Manager" disabled className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="panel p-6">
              <h3 className="text-sm font-bold text-slate-100 mb-6 uppercase tracking-wider">Change Password</h3>
              
              <div className="flex flex-col gap-6 max-w-md">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">Current Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">Confirm New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
                <button className="btn-ghost py-2.5 px-4 text-sm font-semibold mt-2 w-max">
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
