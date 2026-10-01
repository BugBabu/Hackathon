import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { getAdminDashboardData } from '../services/adminService'
import { getAuditLogsForAdmin } from '../services/auditService'
import {
  ShieldAlert,
  Building2,
  FileCheck,
  Activity,
  Search,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Users,
} from 'lucide-react'

function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [stats, setStats] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const [recentCertificates, setRecentCertificates] = useState([])
  const [recentRevocations, setRecentRevocations] = useState([])
  const [auditLogs, setAuditLogs] = useState([])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)

      const { data, error: dataError } = await getAdminDashboardData()
      if (dataError) {
        setError(dataError)
        setLoading(false)
        return
      }

      setStats(data.stats)
      setInstitutions(data.institutions)
      setRecentCertificates(data.recentCertificates)
      setRecentRevocations(data.recentRevocations)

      // Fetch audit logs
      const { data: logsData, error: logsError } = await getAuditLogsForAdmin({ limit: 10 })
      if (!logsError && logsData) {
        setAuditLogs(logsData)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const filteredInstitutions = institutions.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#3157D5]" />
            <p className="text-sm font-medium text-gray-500">Loading admin dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout role="admin">
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-6 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-rose-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-rose-900">Error Loading Dashboard</h3>
            <p className="text-sm text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#3157D5]">
                System Administration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight mt-1">
              Platform Security & Registry Overview
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Institutional key management, trust anchor monitoring, and tamper intrusion metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/fraud-lab"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-xs"
            >
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span>Fraud Detection Lab</span>
            </Link>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Institutions"
            value={stats.totalInstitutions}
            change={stats.totalInstitutions > 0 ? 'Registered authorities' : 'No institutions yet'}
            changeType={stats.totalInstitutions > 0 ? 'positive' : 'neutral'}
            icon={Building2}
            description="Issuing universities"
          />
          <StatCard
            title="Total Certificates"
            value={stats.totalCertificates}
            change={stats.totalCertificates > 0 ? 'Issued credentials' : 'No certificates yet'}
            changeType={stats.totalCertificates > 0 ? 'positive' : 'neutral'}
            icon={FileCheck}
            description="Academic credentials"
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            change={stats.totalStudents > 0 ? 'Registered students' : 'No students yet'}
            changeType={stats.totalStudents > 0 ? 'positive' : 'neutral'}
            icon={Users}
            description="Student records"
          />
          <StatCard
            title="Total Issuers"
            value={stats.totalIssuers}
            change={stats.totalIssuers > 0 ? 'Active issuers' : 'No issuers yet'}
            changeType={stats.totalIssuers > 0 ? 'positive' : 'neutral'}
            icon={AlertTriangle}
            description="Registrar staff"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Revoked / Suspended"
            value={stats.revokedCertificates}
            change={stats.revokedCertificates > 0 ? 'Requires review' : 'Clean record'}
            changeType={stats.revokedCertificates > 0 ? 'negative' : 'positive'}
            icon={ShieldAlert}
            description="Administrative actions"
          />
          <StatCard
            title="Total Verifications"
            value={stats.totalVerifications}
            change={stats.totalVerifications > 0 ? 'Public lookups' : 'No activity yet'}
            changeType={stats.totalVerifications > 0 ? 'positive' : 'neutral'}
            icon={Activity}
            description="Verification attempts"
          />
        </div>

        {/* Institutions Table */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-950">
                Authorized Issuing Authorities (University PKI Registry)
              </h3>
              <p className="text-xs text-gray-500">
                Accredited institutions with authorized cryptographic signing keys
              </p>
            </div>

            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search institution..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-blue-100 w-60"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredInstitutions.length === 0 ? (
              <div className="py-14 text-center text-sm text-gray-500">
                <Building2 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="font-semibold text-gray-900">No institutions found</p>
                <p className="text-xs mt-1">
                  {searchTerm ? 'Try adjusting your search.' : 'No institutions have been registered yet.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Institution Code</th>
                    <th className="px-6 py-3.5">University</th>
                    <th className="px-6 py-3.5">Created</th>
                    <th className="px-6 py-3.5">Certificates</th>
                    <th className="px-6 py-3.5">Trust Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInstitutions.map((inst) => (
                    <tr key={inst.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-[#3157D5] font-semibold">
                        {inst.code}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {inst.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(inst.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {inst.certificateCount}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inst.is_verified ? 'VERIFIED' : 'PENDING'} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Certificates */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-950">Recent Certificates Issued</h3>
            <p className="text-xs text-gray-500">Latest credentials added to the platform</p>
          </div>

          <div className="overflow-x-auto">
            {recentCertificates.length === 0 ? (
              <div className="py-14 text-center text-sm text-gray-500">
                <FileCheck className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="font-semibold text-gray-900">No certificates found</p>
                <p className="text-xs mt-1">No certificates have been issued yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Certificate ID</th>
                    <th className="px-6 py-3.5">Title</th>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Institution</th>
                    <th className="px-6 py-3.5">Issue Date</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-[#3157D5] font-semibold">
                        {cert.certificate_number}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {cert.title}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-800 font-medium">{cert.students?.full_name || 'Unknown'}</p>
                        <p className="text-[11px] text-gray-500 font-mono">{cert.students?.student_id || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {cert.institutions?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(cert.issue_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={cert.status.toUpperCase()} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Security Activity & Audit Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-gray-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>Recent Revocations</span>
            </h3>

            {recentRevocations.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                No revocations recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentRevocations.map((rev) => (
                  <div key={rev.id} className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs flex items-start gap-3">
                    <div className="p-1 rounded-md bg-rose-100 text-rose-700 flex-shrink-0">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-rose-900">
                        {rev.certificates?.title || 'Unknown Certificate'}
                      </p>
                      <p className="text-rose-700 mt-0.5">
                        {rev.reason}
                      </p>
                      <p className="text-[11px] text-rose-600 mt-1 font-mono">
                        {new Date(rev.revoked_at).toLocaleString('en-US', { timeZoneName: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#3157D5]" />
              <span>System Audit Log</span>
            </h3>

            {auditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                No audit activity recorded yet.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{log.action}</p>
                        <p className="text-gray-500 mt-0.5">
                          {log.entity_type}: {log.entityId ? log.entityId.slice(0, 8) + '...' : 'N/A'}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono whitespace-nowrap">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
