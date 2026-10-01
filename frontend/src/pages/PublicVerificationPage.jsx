import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StatusBadge from '../components/StatusBadge'
import CertificatePreview from '../components/CertificatePreview'
import { verifyCertificate } from '../services/verificationService'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  FileCheck2,
  Award,
  Loader2,
  Building2,
  Calendar,
  User,
  Hash,
  ArrowLeft,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({ label, value, mono = false }) {
  return (
    <div>
      <span className="text-gray-500 block mb-0.5 text-xs">{label}</span>
      <p className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status banner configuration
// ---------------------------------------------------------------------------
function getStatusConfig(status) {
  switch (status) {
    case 'active':
      return {
        border: 'border-emerald-300',
        icon: <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />,
        iconBg: 'bg-emerald-100 text-emerald-700',
        heading: 'Certificate Verified',
        description:
          'This academic certificate has been verified directly against the institutional trust registry. Document integrity confirmed.',
        integrityLabel: 'Confirmed (Record Matched)',
        integrityClass: 'text-emerald-700',
        revocationLabel: 'Active — No Revocations',
        revocationClass: 'text-emerald-700',
      }
    case 'not_found':
      return {
        border: 'border-gray-300',
        icon: <AlertTriangle className="h-8 w-8 stroke-[2.5]" />,
        iconBg: 'bg-gray-100 text-gray-500',
        heading: 'Certificate Not Found',
        description:
          'No certificate matching this identifier was found in the trust registry. The identifier may be incorrect, or the certificate may not have been issued through CERTI-VAULT.',
        integrityLabel: 'N/A',
        integrityClass: 'text-gray-500',
        revocationLabel: 'N/A',
        revocationClass: 'text-gray-500',
      }
    case 'revoked':
      return {
        border: 'border-rose-300',
        icon: <XCircle className="h-8 w-8 stroke-[2.5]" />,
        iconBg: 'bg-rose-100 text-rose-700',
        heading: 'Certificate Revoked',
        description:
          'This certificate has been officially revoked by the issuing institution. It should not be accepted as proof of qualification.',
        integrityLabel: 'Revoked',
        integrityClass: 'text-rose-700',
        revocationLabel: 'Revoked by Academic Board',
        revocationClass: 'text-rose-700',
      }
    case 'suspended':
      return {
        border: 'border-amber-300',
        icon: <AlertTriangle className="h-8 w-8 stroke-[2.5]" />,
        iconBg: 'bg-amber-100 text-amber-700',
        heading: 'Certificate Suspended',
        description:
          'This certificate has been temporarily suspended pending review by the issuing institution. Contact the institution for details.',
        integrityLabel: 'Under Review',
        integrityClass: 'text-amber-700',
        revocationLabel: 'Suspended — Pending Review',
        revocationClass: 'text-amber-700',
      }
    case 'error':
      return {
        border: 'border-rose-200',
        icon: <AlertTriangle className="h-8 w-8 stroke-[2.5]" />,
        iconBg: 'bg-rose-100 text-rose-700',
        heading: 'Verification Unavailable',
        description:
          'The verification service encountered an error. Please try again or contact support if the problem persists.',
        integrityLabel: 'N/A',
        integrityClass: 'text-gray-500',
        revocationLabel: 'N/A',
        revocationClass: 'text-gray-500',
      }
    default:
      return getStatusConfig('not_found')
  }
}

// ---------------------------------------------------------------------------
// Map DB status to the string CertificatePreview expects
// ---------------------------------------------------------------------------
function dbStatusToPreview(dbStatus) {
  switch (dbStatus) {
    case 'active': return 'VERIFIED'
    case 'revoked': return 'REVOKED'
    case 'suspended': return 'TAMPERED'
    default: return 'VERIFIED'
  }
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function PublicVerificationPage() {
  const { certificateId } = useParams()

  const [loading, setLoading] = useState(true)
  const [certData, setCertData] = useState(null)
  const [resolvedStatus, setResolvedStatus] = useState('not_found')
  const [dbError, setDbError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function runVerification() {
      setLoading(true)
      setCertData(null)
      setDbError(null)

      const { data, status, error } = await verifyCertificate(certificateId)

      if (cancelled) return

      setResolvedStatus(status ?? 'not_found')
      setCertData(data)
      if (error) setDbError(error)
      setLoading(false)
    }

    runVerification()

    return () => { cancelled = true }
  }, [certificateId])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cfg = getStatusConfig(resolvedStatus)

  // ── Preview data ──────────────────────────────────────────────────────────
  const previewData = certData
    ? {
        id: certData.certificateNumber,
        studentName: certData.studentName,
        degree: certData.title,
        department: certData.program,
        institution: certData.institutionName,
        issueDate: certData.issueDate,
        signatoryName: '—',
        signatoryTitle: '—',
        status: dbStatusToPreview(certData.status),
      }
    : {
        id: certificateId ?? '—',
        studentName: '—',
        degree: '—',
        department: '—',
        institution: '—',
        issueDate: '—',
        signatoryName: '—',
        signatoryTitle: '—',
        status: 'VERIFIED',
      }

  // ─────────────────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#3157D5]" />
            <p className="text-sm font-medium text-gray-500">
              Querying trust registry for{' '}
              <span className="font-mono font-bold text-gray-700">{certificateId}</span>…
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main result page
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">

        {/* Back link */}
        <Link
          to="/verify-upload"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#3157D5] font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Verify another document
        </Link>

        {/* ── Primary Status Banner ── */}
        <div className={`rounded-2xl border bg-white p-6 sm:p-8 shadow-sm ${cfg.border}`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl flex-shrink-0 ${cfg.iconBg}`}>
                {cfg.icon}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
                    {cfg.heading}
                  </h1>
                  {certData && (
                    <StatusBadge status={dbStatusToPreview(certData.status)} size="md" />
                  )}
                </div>
                <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                  {cfg.description}
                </p>
                {certData && (
                  <p className="font-mono text-xs text-gray-400 pt-1">
                    Certificate #{certData.certificateNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap md:flex-col gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-xs font-semibold text-gray-700 transition-colors"
              >
                {copied ? (
                  <><Check className="h-4 w-4 text-emerald-600" /><span>Link Copied</span></>
                ) : (
                  <><Copy className="h-4 w-4" /><span>Share Verification Link</span></>
                )}
              </button>

              <Link
                to="/verify-upload"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] text-xs font-semibold text-white transition-colors shadow-xs"
              >
                <FileCheck2 className="h-4 w-4" />
                <span>Verify Another</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Content: only shown when certificate was found ── */}
        {certData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left column: info cards */}
            <div className="lg:col-span-6 space-y-6">

              {/* Certificate details card */}
              <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm space-y-5">
                <div className="border-b border-gray-200 pb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#3157D5]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                    Certificate Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InfoRow
                    label="Graduate Name"
                    value={certData.studentName}
                  />
                  <InfoRow
                    label="Student ID"
                    value={certData.studentId}
                    mono
                  />
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 block mb-0.5 text-xs">Degree / Program</span>
                    <p className="text-sm font-semibold text-[#3157D5]">{certData.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{certData.program}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-500 block mb-0.5 text-xs">Issuing Institution</span>
                      <p className="text-sm font-semibold text-gray-900">{certData.institutionName}</p>
                      <p className="text-xs font-mono text-gray-500">{certData.institutionCode}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-500 block mb-0.5 text-xs">Issue Date</span>
                      <p className="text-sm font-semibold text-gray-900">{certData.issueDate}</p>
                      <p className="text-xs text-emerald-700 font-medium">Conferred</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <InfoRow
                      label="Certificate Status"
                      value={certData.status.charAt(0).toUpperCase() + certData.status.slice(1)}
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <Hash className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <InfoRow
                      label="Certificate Number"
                      value={certData.certificateNumber}
                      mono
                    />
                  </div>
                </div>
              </div>

              {/* Verification checklist */}
              <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
                  Verification Checklist
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="font-medium text-gray-700">Registry Record</span>
                    <span className={cfg.integrityClass + ' font-bold'}>{cfg.integrityLabel}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="font-medium text-gray-700">Issuer Verification</span>
                    <span className="text-emerald-700 font-bold truncate max-w-[200px]">
                      {certData.institutionName} ({certData.institutionCode})
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="font-medium text-gray-700">Revocation Status</span>
                    <span className={cfg.revocationClass + ' font-bold'}>{cfg.revocationLabel}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="font-medium text-gray-700">Verification Logged</span>
                    <span className="text-emerald-700 font-bold">Yes — Audit Trail Updated</span>
                  </div>
                </div>
              </div>

              {/* Certificate ID strip */}
              <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm space-y-1">
                <span className="font-bold text-gray-900 uppercase tracking-wider text-xs block">
                  Certificate Identifier
                </span>
                <p className="p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-[#3157D5] font-bold text-sm break-all">
                  {certData.certificateNumber}
                </p>
                <p className="text-[11px] text-gray-400">
                  Use this identifier to share or re-verify this credential.
                </p>
              </div>
            </div>

            {/* Right column: visual preview */}
            <div className="lg:col-span-6 space-y-3 sticky top-20">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Official Conferred Certificate
              </span>
              <CertificatePreview certificate={previewData} />
            </div>
          </div>
        )}

        {/* ── Not Found / Error state ── */}
        {!certData && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-10 text-center space-y-5 max-w-xl mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
              <Award className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {resolvedStatus === 'error' ? 'Verification Unavailable' : 'Certificate Not Found'}
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-sm mx-auto">
                {resolvedStatus === 'error'
                  ? (dbError ?? 'The verification service encountered an unexpected error. Please try again.')
                  : `No certificate was found for the identifier "${certificateId}". Please check the certificate number and try again.`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/verify-upload"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] text-white font-semibold text-sm transition-colors"
              >
                <FileCheck2 className="h-4 w-4" />
                Try Another Verification
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Return Home
              </Link>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  )
}

export default PublicVerificationPage
