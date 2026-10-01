import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import StatusBadge from '../components/StatusBadge'
import { getStudentDashboardData } from '../services/studentService'
import {
  Award,
  ShieldCheck,
  Copy,
  Check,
  Eye,
  Calendar,
  Building2,
  Loader2,
  AlertCircle,
  UserX
} from 'lucide-react'

function StudentDashboard() {
  const [copiedId, setCopiedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [studentData, setStudentData] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [verifications, setVerifications] = useState([])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data, error } = await getStudentDashboardData()
      if (error) {
        setError(error)
      } else if (data) {
        setStudentData(data.student)
        setCertificates(data.certificates)
        setVerifications(data.verifications)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleCopy = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/verify/${id}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#3157D5]" />
            <p className="text-sm font-medium text-gray-500">Loading your credentials...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="student">
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

  if (!studentData) {
    return (
      <DashboardLayout role="student">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="max-w-md w-full rounded-2xl bg-white border border-gray-200 shadow-sm p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
              <UserX className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No Student Record Linked</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              No student profile is linked to this account yet. A university registrar must assign a student record to your email address before your certificates can appear.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Student Credential Wallet
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight mt-1">
              Welcome, {studentData.full_name.split(' ')[0]}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Manage, share, and track employer verification of your authentic academic certificates
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/verify-upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-xs"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Verify Any External PDF</span>
            </Link>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {certificates.length === 0 ? (
            <div className="col-span-1 lg:col-span-2 rounded-2xl bg-white border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
              <Award className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-900">No Certificates Found</p>
              <p className="text-xs mt-1">You do not have any issued certificates yet.</p>
            </div>
          ) : (
            certificates.map((cert) => (
              <div
                key={cert.uuid}
                className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm space-y-5 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#3157D5]">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-xs font-mono text-[#3157D5] font-semibold">
                          {cert.id}
                        </span>
                        <h3 className="text-lg font-bold text-gray-950 leading-snug">
                          {cert.title}
                        </h3>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{cert.program}</p>
                      </div>
                    </div>
                    <StatusBadge status={cert.status} size="sm" />
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 block">Institution</span>
                      <span className="text-gray-900 font-semibold flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        {cert.institution}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Conferred Date</span>
                      <span className="text-gray-900 font-semibold flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {cert.issueDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/verify/${cert.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3157D5] hover:bg-[#2745B0] text-white text-xs font-semibold transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Public View</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleCopy(cert.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
                    >
                      {copiedId === cert.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-gray-500" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <span className="text-[11px] text-gray-500 font-medium">
                    {cert.views} verified lookups
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Verification History Log */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-950">
                Employer & Agency Access History
              </h3>
              <p className="text-xs text-gray-500">
                Audited record of organizations that have resolved and verified your certificates
              </p>
            </div>
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live Access History
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {verifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                No external verifications recorded yet.
              </div>
            ) : (
              verifications.map((item, i) => (
                <div
                  key={i}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{item.verifier}</p>
                    <p className="text-gray-500">{item.certificate}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className={`inline-block font-semibold ${item.result === 'valid' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {item.result === 'valid' ? 'Verified Match' : 'Status: ' + item.result}
                    </span>
                    <p className="text-[11px] text-gray-400 font-mono">{item.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default StudentDashboard
