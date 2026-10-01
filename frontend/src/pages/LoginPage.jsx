/**
 * LoginPage.jsx
 * -------------
 * Real Supabase email/password login for CERTI-VAULT.
 *
 * Features:
 *  - Email + password sign-in via Supabase Auth
 *  - Friendly error messages for all common failure cases
 *  - Forgot password flow (sends reset email)
 *  - Resend verification email for unconfirmed accounts
 *  - Redirect to the originally requested page after login
 *  - Link to /register for new users
 */

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { resetPassword, resendVerificationEmail } from '../services/authService'

function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // After login, redirect to the page the user originally wanted, or /student
  const from = location.state?.from?.pathname ?? '/student'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [notice, setNotice]     = useState(null)

  // Tracks whether the error is specifically an unconfirmed-email error
  // so we can show the "Resend verification" option.
  const [showResend, setShowResend]       = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  // ── Sign in ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setShowResend(false)
    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError)
      // Offer resend if the specific error is unconfirmed email
      if (signInError.toLowerCase().includes('not been verified') ||
          signInError.toLowerCase().includes('not confirmed')) {
        setShowResend(true)
      }
      setLoading(false)
      return
    }

    // Success — navigate to the intended destination
    navigate(from, { replace: true })
  }

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address above, then click "Forgot password?".')
      return
    }
    setError(null)
    setNotice(null)
    setLoading(true)

    const { error: resetError } = await resetPassword(email)

    setLoading(false)
    if (resetError) {
      setError(resetError)
    } else {
      setNotice(`Password reset link sent to ${email}. Please check your inbox.`)
    }
  }

  // ── Resend verification email ─────────────────────────────────────────────
  const handleResend = async () => {
    if (!email) return
    setResendLoading(true)
    const { error: resendError } = await resendVerificationEmail(email)
    setResendLoading(false)
    if (resendError) {
      setError(resendError)
    } else {
      setNotice(`Verification email resent to ${email}. Please check your inbox.`)
      setShowResend(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col justify-between">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3157D5] text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-gray-900 text-base">
            CERTI<span className="text-[#3157D5]">-VAULT</span>
          </span>
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold text-gray-600 hover:text-[#3157D5] transition-colors"
        >
          Back to Public Site
        </Link>
      </header>

      {/* Auth card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full space-y-4">

          <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
            {/* Title */}
            <div className="text-center space-y-2 mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#3157D5] mb-3">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-950 tracking-tight">
                Sign In to CERTI-VAULT
              </h1>
              <p className="text-xs text-gray-500">
                Access your credential wallet or university administration portal
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="font-semibold">{error}</p>
                  {showResend && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="flex items-center gap-1.5 text-rose-700 font-semibold hover:underline"
                    >
                      {resendLoading
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <RefreshCw className="h-3 w-3" />}
                      Resend verification email
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Notice / success banner */}
            {notice && (
              <div className="mb-5 flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="font-semibold">{notice}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-[#3157D5] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-wide shadow-sm transition-all"
                >
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <ArrowRight className="h-4 w-4" />}
                  <span>{loading ? 'Signing in…' : 'Sign In'}</span>
                </button>
              </div>
            </form>

            {/* Footer links */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-3 text-center">
              <p className="text-xs text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="text-[#3157D5] font-semibold hover:underline"
                >
                  Create account
                </Link>
              </p>
              <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Session protected by Supabase Auth</span>
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
        © 2026 CERTI-VAULT. Academic Credential Platform.
      </footer>
    </div>
  )
}

export default LoginPage
