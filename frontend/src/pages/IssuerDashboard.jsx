import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { getIssuerDashboardData } from '../services/issuerService'
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  FilePlus,
  Search,
  Eye,
  TrendingUp,
  Shield,
  ExternalLink,
  Loader2,
  AlertCircle,
  UserX,
} from 'lucide-react'

function IssuerDashboard() {
  const [filter, setFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [issuer, setIssuer] = useState(null)
  const [institution, setInstitution] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data, error } = await getIssuerDashboardData()
      if (error) {
        setError(error)
      } else if (data) {
        setIssuer(data.issuer)
        setInstitution(data.institution)
        setCertificates(data.certificates)
        setStats(data.stats)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const filteredCerts = certificates.filter((cert) => {
    const matchesFilter = filter === 'ALL' || cert.status === filter
    const matchesSearch =
      cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.degree.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout role="issuer">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#3157D5]" />
            <p className="text-sm font-medium text-gray-500">Loading issuer dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout role="issuer">
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

  // ── No issuer record linked ────────────────────────────────────────────────
  if (!issuer) {
    return (
      <DashboardLayout role="issuer">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="max-w-md w-full rounded-2xl bg-white border border-gray-200 shadow-sm p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
              <UserX className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No Issuer Profile Linked</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              This account is not linked to an institutional issuer record. An administrator must
              assign your profile to an institution before you can access the issuer portal.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ── Main dashboard ─────────────────────────────────────────────────────────
  return (
    <DashboardLayout role="issuer">
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#3157D5]">
                University Registrar Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight mt-1">
              Issuer Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {institution?.name ?? 'Your Institution'} — {issuer.designation}
              {!institution?.is_verified && (
                <span className="ml-2 text-amber-600 font-semibold">(Pending Verification)</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/issuer/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#3157D5] hover:bg-[#2745B0] shadow-sm transition-all"
            >
              <FilePlus className="h-4 w-4" />
              <span>Issue Certificate</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Certificates"
            value={stats.total}
            change="Issued credentials"
            changeType="positive"
            icon={Award}
            description="All conferred degrees"
          />
          <StatCard
            title="Verified & Active"
            value={stats.active}
            change="Live credentials"
            changeType="positive"
            icon={CheckCircle2}
            description="Currently active records"
          />
          <StatCard
            title="Suspended / Revoked"
            value={stats.revoked}
            change={stats.revoked > 0 ? 'Requires review' : 'None'}
            changeType={stats.revoked > 0 ? 'negative' : 'positive'}
            icon={AlertTriangle}
            description="Administrative actions"
          />
          <StatCard
            title="Verifications This Month"
            value={stats.verifications ?? 0}
            change={stats.verifications > 0 ? 'Active tracking' : 'No activity yet'}
            changeType={stats.verifications > 0 ? 'positive' : 'neutral'}
            icon={TrendingUp}
            description="Public validation lookups"
          />
        </div>

        {/* Activity Chart & Security Key Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart Placeholder */}
          <div className="lg:col-span-8 rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-950">
                  Verification Volume
                </h3>
                <p className="text-xs text-gray-500">
                  Monthly public degree resolution requests
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3157D5]" /> Verified
                </span>
                <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Flagged
                </span>
              </div>
            </div>

            {/* Clean Light Bar Chart Visualization */}
            <div className="h-48 flex items-end gap-2 sm:gap-4 pt-4 px-2 border-b border-gray-200">
              {[
                { day: 'Mon', val: 65, flags: 4 },
                { day: 'Tue', val: 82, flags: 2 },
                { day: 'Wed', val: 95, flags: 3 },
                { day: 'Thu', val: 78, flags: 1 },
                { day: 'Fri', val: 90, flags: 5 },
                { day: 'Sat', val: 40, flags: 0 },
                { day: 'Sun', val: 35, flags: 1 },
                { day: 'Mon', val: 88, flags: 3 },
                { day: 'Tue', val: 92, flags: 2 },
                { day: 'Wed', val: 100, flags: 4 },
                { day: 'Thu', val: 85, flags: 2 },
                { day: 'Fri', val: 94, flags: 1 },
              ].map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="w-full max-w-[28px] bg-gray-100 rounded-t-md relative flex flex-col justify-end overflow-hidden group-hover:bg-gray-200 transition-colors" style={{ height: `${bar.val}%` }}>
                    <div className="w-full bg-[#3157D5] rounded-t-md" style={{ height: `${bar.val - 8}%` }} />
                    {bar.flags > 0 && (
                      <div className="w-full bg-rose-500" style={{ height: `${bar.flags * 3}%` }} />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 hidden sm:block">
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 text-xs text-gray-500">
              <span>Chart — visualization placeholder</span>
              <span>Historical analytics coming soon</span>
            </div>
          </div>

          {/* HSM Signing Key Status */}
          <div className="lg:col-span-4 rounded-2xl bg-white border border-gray-200 p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-[#3157D5]" />
                <h3 className="text-base font-bold text-gray-950">Institutional Signing Key</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Hardware cryptographic signing module and registrar authority status.
              </p>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <span className="text-gray-500">Institution</span>
                  <span className="font-mono text-[#3157D5] font-semibold truncate max-w-[140px]">{institution?.code ?? '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-bold ${institution?.is_verified ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {institution?.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <span className="text-gray-500">Your Role</span>
                  <span className="text-gray-700 font-medium">{issuer.designation}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Link
                to="/audit-logs"
                className="text-xs text-[#3157D5] hover:underline font-semibold flex items-center justify-between group"
              >
                <span>View Full Audit Trail</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Certificates Table */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-950">Recent Certificates Issued</h3>
              <p className="text-xs text-gray-500">
                Browse recently conferred degrees, verification counts, and active status
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter name, ID, degree..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-blue-100 w-52"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs">
                {['ALL', 'ACTIVE', 'REVOKED', 'SUSPENDED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filter === st
                        ? 'bg-white text-[#3157D5] shadow-xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredCerts.length === 0 ? (
              <div className="py-14 text-center text-sm text-gray-500">
                <Award className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="font-semibold text-gray-900">No certificates found</p>
                <p className="text-xs mt-1">
                  {searchTerm || filter !== 'ALL'
                    ? 'Try adjusting your search or filter.'
                    : 'No certificates have been issued for this institution yet.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Certificate ID</th>
                    <th className="px-6 py-3.5">Graduate</th>
                    <th className="px-6 py-3.5">Degree / Program</th>
                    <th className="px-6 py-3.5">Issue Date</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCerts.map((cert) => (
                    <tr key={cert.uuid} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-[#3157D5] font-semibold">
                        {cert.id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{cert.studentName}</p>
                        <p className="text-[11px] text-gray-500 font-mono">{cert.studentId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-800 font-medium">{cert.degree}</p>
                        <p className="text-[11px] text-gray-500">{cert.department}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {cert.issueDate}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={cert.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/verify/${cert.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors font-medium text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default IssuerDashboard
