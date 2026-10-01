/**
 * ResetPasswordPage.jsx
 * ---------------------
 * Dedicated password reset page for CERTI-VAULT.
 *
 * This page is accessed via the password reset email link.
 * It detects the Supabase password-recovery session and allows
 * the user to set a new password.
 *
 * Features:
 *  - Detects Supabase recovery session
 *  - New password and confirm password fields
 *  - Password validation (min 6 chars, must match)
 *  - Calls Supabase auth.updateUser() to update password
 *  - Success/error messages
 *  - Redirects to /login after successful update
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { updatePassword } from '../services/authService'

function ResetPasswordPage() {
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // -------------------------------------------------------------------------
  // Check for Supabase password-recovery session on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function checkRecoverySession() {
      // When a user clicks the password reset link, Supabase sets a session
      // We need to check if a session exists (indicates valid reset link)
      const { data: { session } } = await supabase.auth.getSession()

      if (session && session.user) {
        setHasRecoverySession(true)
      }

      setSessionLoading(false)
    }

    checkRecoverySession()
  }, [])

  // -------------------------------------------------------------------------
  // Handle password update
  // -------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error: updateError } = await updatePassword(password)

    setLoading(false)

    if (updateError) {
      setError(updateError)
      return
    }

    // Success
    setSuccess(true)
    // Clear form
    setPassword('')
    setConfirmPassword('')
  }

  // -------------------------------------------------------------------------
  // Session loading state
  // -------------------------------------------------------------------------
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col justify-between">
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3157D5] text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-gray-900 text-base">
              CERTI<span className="text-[#3157D5]">-VAULT</span>
            </span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#3157D5]" />
            <p className="text-sm font-medium text-gray-500">Verifying password reset session...</p>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
          © 2026 CERTI-VAULT. Academic Credential Platform.
        </footer>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // No recovery session
  // -------------------------------------------------------------------------
  if (!hasRecoverySession) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col justify-between">
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3157D5] text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-gray-900 text-base">
              CERTI<span className="text-[#3157D5]">-VAULT</span>
            </span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full space-y-4">
            <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-gray-950">
                Invalid or Expired Link
              </h1>
              <p className="text-sm text-gray-600">
                This password reset link is invalid or has expired. Please request a new password reset from the login page.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] text-white font-semibold text-xs transition-colors"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
          © 2026 CERTI-VAULT. Academic Credential Platform.
        </footer>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Success state
  // -------------------------------------------------------------------------
  if (success) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col justify-between">
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3157D5] text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-gray-900 text-base">
              CERTI<span className="text-[#3157D5]">-VAULT</span>
            </span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full space-y-4">
            <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-gray-950">
                Password Updated Successfully
              </h1>
              <p className="text-sm text-gray-600">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] text-white font-semibold text-xs transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
          © 2026 CERTI-VAULT. Academic Credential Platform.
        </footer>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Main reset form
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col justify-between">
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
          Back to Sign In
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full space-y-4">
          <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
            {/* Title */}
            <div className="text-center space-y-2 mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#3157D5] mb-3">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-950 tracking-tight">
                Reset Your Password
              </h1>
              <p className="text-xs text-gray-500">
                Enter your new password below.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  New Password
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
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
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
                  <span>{loading ? 'Updating password…' : 'Update Password'}</span>
                </button>
              </div>
            </form>

            {/* Footer links */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-600">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="text-[#3157D5] font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
        © 2026 CERTI-VAULT. Academic Credential Platform.
      </footer>
    </div>
  )
}

export default ResetPasswordPage
