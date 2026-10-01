/**
 * RequireAuth.jsx
 * ---------------
 * Route guard component for CERTI-VAULT.
 *
 * Renders a full-screen loading state while the auth session is being resolved.
 * Redirects unauthenticated users to /login (preserving the attempted URL).
 * Redirects authenticated users without the required role to a "not authorized" page.
 * Renders children for authenticated users with the correct role.
 *
 * Usage:
 *   <Route path="/issuer" element={<RequireAuth allowedRoles={['issuer']}><IssuerDashboard /></RequireAuth>} />
 *   <Route path="/student" element={<RequireAuth allowedRoles={['student']}><StudentDashboard /></RequireAuth>} />
 *   <Route path="/admin" element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>} />
 *   <Route path="/audit-logs" element={<RequireAuth allowedRoles={['admin', 'issuer']}><AuditLogsPage /></RequireAuth>} />
 */

import { Navigate, useLocation } from 'react-router-dom'
import { ShieldCheck, UserX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function RequireAuth({ children, allowedRoles }) {
  const { isAuthenticated, loading, profile } = useAuth()
  const location = useLocation()

  // ── Loading state ─────────────────────────────────────────────────────────
  // Show a branded spinner while the initial Supabase session check completes.
  // This prevents a flash-redirect to /login for users who ARE logged in.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex flex-col items-center justify-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3157D5] text-white shadow-md animate-pulse">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <p className="text-sm font-semibold text-gray-500 tracking-wide">
          Verifying session…
        </p>
      </div>
    )
  }

  // ── Not authenticated ─────────────────────────────────────────────────────
  // Redirect to /login and remember the page the user was trying to reach.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // ── Role-based authorization ───────────────────────────────────────────────
  // If allowedRoles is specified, check if the user's role is in the allowed list.
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = profile?.role
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Render an access denied page
      return (
        <div className="min-h-screen bg-[#F7F8FC] flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-white border border-gray-200 shadow-sm p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
              <UserX className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              You don't have permission to access this page. Your current role is "{userRole || 'unknown'}".
            </p>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] text-white font-semibold text-xs transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
  }

  // ── Authenticated and authorized ─────────────────────────────────────────
  return children
}

export default RequireAuth
