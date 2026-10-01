import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { getVerificationLogsForIssuer, getAuditLogsForAdmin } from '../services/auditService'
import { useAuth } from '../context/AuthContext'
import {
  Search,
  Download,
  Loader2,
  AlertCircle,
  ShieldOff,
  ClipboardList,
  ExternalLink,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Severity badge
// ---------------------------------------------------------------------------
function SeverityBadge({ severity }) {
  const classes =
    severity === 'CRITICAL'
      ? 'bg-rose-50 border-rose-200 text-rose-700'
      : severity === 'WARNING'
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-blue-50 border-blue-200 text-blue-700'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${classes}`}>
      {severity}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function AuditLogsPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [error, setError] = useState(null)
  const [isPermissionError, setIsPermissionError] = useState(false)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (isAdmin) {
      // Admins read the real audit_logs table
      const { data, error, isPermissionError: isPerm } = await getAuditLogsForAdmin({ limit: 200 })
      if (error) {
        setError(error)
        setIsPermissionError(isPerm ?? false)
      } else {
        setLogs(data ?? [])
      }
    } else {
      // Issuers (and students) see the verifications table — what RLS permits them to read
      const { data, error } = await getVerificationLogsForIssuer({ limit: 200 })
      if (error) {
        setError(error)
      } else {
        setLogs(data ?? [])
      }
    }

    setLoading(false)
  }, [isAdmin])

  useEffect(() => {
    // Wait until profile is loaded so isAdmin is correct
    if (profile !== null || profile === undefined) {
      loadLogs()
    }
  }, [loadLogs, profile])

  // Client-side filter
  const filteredLogs = logs.filter((log) => {
    const matchesSev = severityFilter === 'ALL' || log.severity === severityFilter
    const needle = searchTerm.toLowerCase()
    const matchesSearch =
      !needle ||
      (log.targetId ?? '').toLowerCase().includes(needle) ||
      (log.eventType ?? log.action ?? '').toLowerCase().includes(needle) ||
      (log.details ?? '').toLowerCase().includes(needle) ||
      (log.result ?? '').toLowerCase().includes(needle)
    return matchesSev && matchesSearch
  })

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout role={isAdmin ? 'admin' : 'issuer'}>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#3157D5]" />
            <p className="text-sm font-medium text-gray-500">Loading audit records…</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={isAdmin ? 'admin' : 'issuer'}>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3157D5]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#3157D5]">
                {isAdmin ? 'Full Platform Audit Stream' : 'Verification Audit Stream'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight mt-1">
              {isAdmin ? 'Platform Audit Logs' : 'Verification Activity Log'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {isAdmin
                ? 'Full administrative audit trail — certificate issuances, revocations, and system events'
                : 'Timestamped records of public degree verification queries for your institution\'s certificates'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const csv = [
                  'Timestamp,Event,Target,Result,Severity',
                  ...filteredLogs.map((l) =>
                    `"${l.timestamp}","${l.eventType ?? l.action ?? ''}","${l.targetId ?? l.entityId ?? ''}","${l.result ?? ''}","${l.severity}"`
                  ),
                ].join('\n')
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `certi-vault-audit-${new Date().toISOString().split('T')[0]}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-xs"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* RLS Access scope notice for non-admin */}
        {!isAdmin && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs">
            <AlertCircle className="h-4 w-4 text-[#3157D5] flex-shrink-0 mt-0.5" />
            <p className="text-blue-800">
              <span className="font-bold">Access Scope:</span> You are viewing verification records
              for your institution&apos;s certificates. Full platform audit logs are restricted to
              administrators. Contact your platform administrator to request an audit export.
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-3 p-5 rounded-xl bg-rose-50 border border-rose-200">
            {isPermissionError ? (
              <ShieldOff className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-bold text-rose-900">
                {isPermissionError ? 'Insufficient Permissions' : 'Error Loading Records'}
              </p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        {!error && (
          <>
            <div className="rounded-2xl bg-white border border-gray-200 p-5 space-y-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search certificate ID, event type, result…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-blue-100"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 font-medium">Severity:</span>
                  {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        severityFilter === sev
                          ? 'bg-[#3157D5] text-white shadow-xs font-semibold'
                          : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500 bg-gray-50">
                <span className="font-semibold text-gray-900">
                  {isAdmin ? 'Platform Event Log' : 'Verification Activity'}
                </span>
                <span className="font-mono text-emerald-700 font-semibold">
                  {filteredLogs.length} record{filteredLogs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ClipboardList className="h-10 w-10 mx-auto text-gray-300" />
                  <p className="text-sm font-semibold text-gray-900">No records found</p>
                  <p className="text-xs text-gray-500">
                    {searchTerm || severityFilter !== 'ALL'
                      ? 'Try adjusting your search or severity filter.'
                      : 'No verification activity has been logged yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-700 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Timestamp</th>
                        <th className="px-6 py-3.5">Event Type</th>
                        <th className="px-6 py-3.5">Certificate</th>
                        <th className="px-6 py-3.5">Result</th>
                        <th className="px-6 py-3.5">Severity</th>
                        <th className="px-6 py-3.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-[#3157D5] font-semibold font-mono text-[11px]">
                              {log.id?.slice(0, 8)}…
                            </span>
                            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                              {log.timestamp}
                            </p>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {log.eventType ?? log.action ?? '—'}
                          </td>
                          <td className="px-6 py-4">
                            {log.targetId && log.targetId !== '—' ? (
                              <Link
                                to={`/verify/${log.targetId}`}
                                className="text-[#3157D5] font-mono hover:underline font-semibold flex items-center gap-1"
                              >
                                {log.targetId}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <span className="text-gray-400 font-mono">
                                {log.entityId ?? '—'}
                              </span>
                            )}
                            {log.certificateTitle && (
                              <p className="text-[11px] text-gray-400 mt-0.5 max-w-[200px] truncate">
                                {log.certificateTitle}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {log.result ? (
                              <span className={`font-semibold ${
                                log.result === 'valid' ? 'text-emerald-700' :
                                log.result === 'not_found' || log.result === 'invalid' ? 'text-amber-700' :
                                'text-rose-700'
                              }`}>
                                {log.result}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <SeverityBadge severity={log.severity} />
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs max-w-xs truncate">
                            {log.details ?? (
                              log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AuditLogsPage
