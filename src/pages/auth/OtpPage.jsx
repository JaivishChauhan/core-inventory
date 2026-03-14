import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Lock, Mail } from 'lucide-react'
import { gsap } from 'gsap'
import api from '../../api/axios'
import { getApiErrorMessage } from '../../utils/api'

const emptyCode = ['', '', '', '', '', '']

export default function OtpPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const boxesRef = useRef([])
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState(emptyCode)
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        boxesRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'back.out(1.5)', delay: 0.1 }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const otp = code.join('')
  const isResetMode = Boolean(resetToken)

  const handleChange = (index, value) => {
    const clean = value.replace(/\D/g, '')

    if (clean.length > 1) {
      const parts = clean.slice(0, 6).split('')
      const next = [...code]
      parts.forEach((part, offset) => {
        if (index + offset < 6) {
          next[index + offset] = part
        }
      })
      setCode(next)
      boxesRef.current[Math.min(index + parts.length, 5)]?.focus()
      return
    }

    const next = [...code]
    next[index] = clean
    setCode(next)

    if (clean && index < 5) {
      boxesRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      boxesRef.current[index - 1]?.focus()
    }
  }

  const handleVerifyOtp = async () => {
    if (!email.trim()) {
      setError('Email is required to verify the OTP.')
      return
    }

    if (otp.length !== 6) {
      setError('Enter the full 6-digit OTP.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp,
      })

      setResetToken(response.data.data.reset_token)
      setSuccess('OTP verified. Set your new password below.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to verify OTP'))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/auth/reset-password', {
        reset_token: resetToken,
        new_password: newPassword,
      })

      window.alert('Password reset successfully. Please sign in with your new password.')
      navigate('/login')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to reset password'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Enter your account email first.')
      return
    }

    setResending(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
      setCode(emptyCode)
      setResetToken('')
      setSuccess('A fresh OTP has been sent if the email exists.')
      boxesRef.current[0]?.focus()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to resend OTP'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background-dark items-start justify-center pt-[10vh] px-6">
      <div
        ref={containerRef}
        className="bg-[#161B22] border border-slate-800 rounded-xl p-8 max-w-[460px] w-full mx-auto relative overflow-hidden"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto shadow-[0_0_0_8px_rgba(48,131,248,0.06)]">
          {isResetMode ? <Lock className="text-primary" size={28} /> : <Mail className="text-primary" size={28} />}
        </div>

        <h2 className="text-xl font-bold text-slate-100 text-center mt-5">
          {isResetMode ? 'Create a new password' : 'Check your email'}
        </h2>
        <p className="text-sm text-slate-500 text-center mt-1">
          {isResetMode ? 'OTP verified. Finish the password reset below.' : 'We sent a 6-digit code to'}
        </p>

        {!isResetMode && (
          <>
            <div className="mt-5">
              <label className="text-xs font-medium text-slate-400">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex gap-2.5 justify-center mt-7">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    boxesRef.current[index] = element
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  className="w-12 h-14 text-center text-xl font-bold font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors"
                />
              ))}
            </div>
          </>
        )}

        {isResetMode && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              Resetting password for <span className="font-medium text-emerald-200">{email || 'your account'}</span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                placeholder="Re-enter your password"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <button
          type="button"
          onClick={isResetMode ? handleResetPassword : handleVerifyOtp}
          disabled={loading}
          className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm mt-8 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {isResetMode ? 'Saving...' : 'Verifying...'}
            </>
          ) : isResetMode ? (
            'Reset Password'
          ) : (
            'Verify Code'
          )}
        </button>

        {!isResetMode && (
          <div className="flex justify-center mt-4">
            <p className="text-sm text-slate-500">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-primary font-medium hover:underline disabled:opacity-60"
              >
                {resending ? 'Resending...' : 'Resend'}
              </button>
            </p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-800 text-center flex justify-center">
          <Link to="/login" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
