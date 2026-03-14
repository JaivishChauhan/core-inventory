import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { gsap } from 'gsap'
import api from '../../api/axios'
import { getApiErrorMessage } from '../../utils/api'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    login_id: '',
    email: '',
    password: '',
  })
  const leftPanelRef = useRef(null)
  const rightPanelRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(leftPanelRef.current, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
      const elements = rightPanelRef.current?.querySelectorAll('.animate-me') || []
      gsap.fromTo(
        elements,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out', delay: 0.1 }
      )
    })

    return () => ctx.revert()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  let strength = 0
  if (form.password.length > 0) strength += 1
  if (form.password.length > 7) strength += 1
  if (/[A-Z]/.test(form.password)) strength += 1
  if (/[0-9!@#$&*]/.test(form.password)) strength += 1

  const strengthLabels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-rose-500', 'bg-rose-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
  const strengthTextColors = ['text-rose-500', 'text-rose-500', 'text-orange-500', 'text-yellow-500', 'text-emerald-500']

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.post('/auth/signup', {
        name: form.name.trim(),
        login_id: form.login_id.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })

      navigate('/login')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to create account'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full bg-background-dark">
      <div ref={leftPanelRef} className="hidden md:flex flex-col items-center justify-center w-[45%] h-full bg-[#161B22] border-r border-slate-800 px-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative flex flex-col items-center gap-8 z-10 w-full max-w-sm">
          <div className="flex flex-col items-center gap-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-primary" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
            </svg>
            <h1 className="text-3xl font-bold font-display text-slate-100">CoreInventory</h1>
            <p className="text-slate-500 text-sm text-center">Create your account and start tracking inventory live.</p>
          </div>
        </div>
      </div>

      <div ref={rightPanelRef} className="flex-1 flex items-center justify-center p-8 bg-background-dark">
        <div className="w-full max-w-[420px]">
          <p className="animate-me text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-2">CREATE NEW ACCOUNT</p>
          <h2 className="animate-me text-2xl font-bold text-slate-100">Sign Up</h2>
          <p className="animate-me text-sm text-slate-500 mt-1 mb-8">Join CoreInventory to manage your stock</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="animate-me flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <div className="animate-me flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Login ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type="text"
                  name="login_id"
                  value={form.login_id}
                  onChange={handleChange}
                  placeholder="lowercase_letters_only"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <div className="animate-me flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <div className="animate-me flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-10 text-sm text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors placeholder:text-slate-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {form.password && (
                <div className="mt-1 flex flex-col gap-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((index) => (
                      <div key={index} className={`flex-1 rounded-sm ${index <= strength ? strengthColors[strength] : 'bg-slate-800'}`} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-medium ${strengthTextColors[strength]}`}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="animate-me bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 flex items-center gap-2 text-rose-400 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || strength < 2}
              className="animate-me mt-4 w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="animate-me text-center text-sm text-slate-500 mt-2">
              Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
