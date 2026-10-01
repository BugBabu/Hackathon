/**
 * RegisterPage.jsx
 * ----------------
 * Public registration page for CERTI-VAULT.
 *
 * Features:
 *  - Full Name, Email, Password, Confirm Password, Role selection
 *  - Role limited to Student and Issuer (no admin)
 *  - Displays friendly error and success messages
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Briefcase,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function RegisterPage() {
  const { signUp } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole]         = useState('student')
  
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    const { error: signUpError } = await signUp(email, password, fullName, role)

    setLoading(false)

    if (signUpError) {
      setError(signUpError)
      return
    }

    // Success
    setSuccess(true)
    // Clear form
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
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
          to="/login"
          className="text-xs font-semibold text-gray-600 hover:text-[#3157D5] transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-10">
        <div className="max-w-md w-full space-y-4">
          <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
            {/* Title */}
            <div className="text-center space-y-2 mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#3157D5] mb-3">
                <User className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-950 tracking-tight">
                Create an Account
              </h1>
              <p className="text-xs text-gray-500">
                Join CERTI-VAULT as a student or institution registrar.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {/* Success banner */}
            {success && (
              <div className="mb-5 flex flex-col items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center text-sm text-emerald-900">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <div>
                  <p className="font-bold text-base mb-1">Registration Successful!</p>
                  <p className="text-emerald-700 leading-relaxed">
                    Please check your email inbox for a verification link before signing in.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-2 inline-flex items-center justify-center gap-2 py-2 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                >
                  Go to Sign In
                </Link>
              </div>
            )}

            {/* Form */}
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        role === 'student'
                          ? 'border-[#3157D5] bg-blue-50/50 text-[#3157D5]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-500'
                      }`}
                    >
                      <User className={`h-5 w-5 ${role === 'student' ? 'text-[#3157D5]' : 'text-gray-400'}`} />
                      <span className="text-[11px] font-bold">Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('issuer')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        role === 'issuer'
                          ? 'border-[#3157D5] bg-blue-50/50 text-[#3157D5]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-500'
                      }`}
                    >
                      <Briefcase className={`h-5 w-5 ${role === 'issuer' ? 'text-[#3157D5]' : 'text-gray-400'}`} />
                      <span className="text-[11px] font-bold">Registrar (Issuer)</span>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-blue-100 transition-colors"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-wide shadow-sm transition-all"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    <span>{loading ? 'Creating account…' : 'Create Account'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Footer links */}
            {!success && (
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-[#3157D5] font-semibold hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            )}
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

export default RegisterPage
