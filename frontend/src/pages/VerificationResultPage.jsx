import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StatusBadge from '../components/StatusBadge'
import {
  CheckCircle2,
  ShieldCheck,
  Fingerprint,
  Download,
  ArrowLeft,
  Clock,
  ExternalLink,
  AlertCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

function VerificationResultPage() {
  const location = useLocation()
  const [downloading, setDownloading] = useState(false)

  // Get verification result from location state
  const verificationResult = location.state?.verificationResult
  const fileName = location.state?.fileName
  const _fileSize = location.state?.fileSize

  // If no verification result, redirect to upload page
  if (!verificationResult) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900">No Verification Result</h2>
            <p className="text-sm text-gray-600">
              Please upload a document to verify a certificate.
            </p>
            <Link
              to="/verify-upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] text-white text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Upload</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const certData = verificationResult.data
  const status = verificationResult.status

  const handleDownloadReport = () => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      alert('Verification report download feature coming soon.')
    }, 1000)
  }

  // Determine status badge and colors
  const getStatusConfig = () => {
    switch (status) {
      case 'valid':
        return {
          badge: 'VERIFIED',
          borderColor: 'border-emerald-300',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-700',
          title: 'Verification Confirmed: Authentic Certificate',
          description: certData
            ? `This academic credential has passed all automated integrity checks. Conferred by ${certData.institutionName}.`
            : 'Certificate verified successfully.',
        }
      case 'revoked':
        return {
          badge: 'REVOKED',
          borderColor: 'border-rose-300',
          iconBg: 'bg-rose-100',
          iconColor: 'text-rose-700',
          title: 'Certificate Revoked',
          description: 'This certificate has been revoked by the issuing institution and is no longer valid.',
        }
      case 'suspended':
        return {
          badge: 'SUSPENDED',
          borderColor: 'border-amber-300',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-700',
          title: 'Certificate Suspended',
          description: 'This certificate is currently under review and its status is suspended.',
        }
      case 'not_found':
        return {
          badge: 'NOT FOUND',
          borderColor: 'border-gray-300',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-700',
          title: 'Certificate Not Found',
          description: 'No certificate matching this number was found in the verification registry.',
        }
      default:
        return {
          badge: 'ERROR',
          borderColor: 'border-gray-300',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-700',
          title: 'Verification Error',
          description: verificationResult.error || 'An unexpected error occurred during verification.',
        }
    }
  }

  const statusConfig = getStatusConfig()
  const isSuccess = status === 'valid'
  const isError = status === 'error' || status === 'not_found'
  const isWarning = status === 'revoked' || status === 'suspended'

  const StatusIcon = isSuccess ? CheckCircle2 : isError ? XCircle : AlertTriangle

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            to="/verify-upload"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#3157D5] transition-colors font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Upload Another Document</span>
          </Link>
        </div>

        {/* Primary Verdict Banner */}
        <div className={`rounded-2xl bg-white ${statusConfig.borderColor} p-6 sm:p-8 shadow-sm`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${statusConfig.iconBg} ${statusConfig.iconColor} flex-shrink-0`}>
                <StatusIcon className="h-8 w-8 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
                    {statusConfig.title}
                  </h1>
                  <StatusBadge status={statusConfig.badge} size="md" />
                </div>

                <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                  {statusConfig.description}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap md:flex-col gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                <span>{downloading ? 'Compiling PDF...' : 'Download Attestation Report'}</span>
              </button>

              {certData && (
                <Link
                  to={`/verify/${certData.certificateNumber}`}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Public Resolver</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Checkpoint Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-1.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Document Status
            </span>
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${isSuccess ? 'text-emerald-600' : isError ? 'text-gray-600' : 'text-amber-600'}`} />
              <span className="text-xl font-bold text-gray-950">{statusConfig.badge}</span>
            </div>
            <p className="text-[11px] text-gray-500">{isSuccess ? 'Verified successfully' : status === 'not_found' ? 'Not in registry' : 'Requires attention'}</p>
          </div>

          {certData && (
            <>
              <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-1.5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Issuer Authority
                </span>
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`h-5 w-5 ${isSuccess ? 'text-emerald-600' : 'text-gray-600'}`} />
                  <span className="text-xl font-bold text-gray-950">{isSuccess ? 'Accredited' : 'Registered'}</span>
                </div>
                <p className="text-[11px] text-gray-500">{certData.institutionName || 'Unknown Institution'}</p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-1.5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Certificate Status
                </span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-5 w-5 ${isSuccess ? 'text-emerald-600' : isWarning ? 'text-amber-600' : 'text-gray-600'}`} />
                  <span className="text-xl font-bold text-gray-950">{certData.status?.toUpperCase() || 'UNKNOWN'}</span>
                </div>
                <p className="text-[11px] text-gray-500">{certData.status === 'active' ? 'Currently valid' : 'Check details'}</p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-1.5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Issue Date
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#3157D5]" />
                  <span className="text-xl font-bold text-gray-950">{certData.issueDate || 'N/A'}</span>
                </div>
                <p className="text-[11px] text-gray-500">Certificate conferred</p>
              </div>
            </>
          )}
        </div>

        {/* Two-Column Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Timeline */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#3157D5]" />
                <span>Verification Process</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3 text-xs">
                  <span className="font-mono text-gray-400 w-12 pt-0.5">Step 1</span>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Document Uploaded</p>
                    <p className="font-mono text-gray-500 mt-0.5">{fileName || 'Unknown file'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <span className="font-mono text-gray-400 w-12 pt-0.5">Step 2</span>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Certificate Number Entered</p>
                    <p className="font-mono text-gray-500 mt-0.5">{certData?.certificateNumber || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <span className="font-mono text-gray-400 w-12 pt-0.5">Step 3</span>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Database Lookup</p>
                    <p className="font-mono text-gray-500 mt-0.5">{status === 'not_found' ? 'No match found' : 'Certificate located'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <span className="font-mono text-gray-400 w-12 pt-0.5">Step 4</span>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Verification Complete</p>
                    <p className="font-mono text-gray-500 mt-0.5">{statusConfig.badge}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Hash Card */}
            {certData?.documentHash && (
              <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm space-y-3 text-xs">
                <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-[#3157D5]" />
                  <span>Document Hash</span>
                </h3>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span className="text-gray-500 text-[10px] uppercase font-mono">
                    SHA-256 Digest
                  </span>
                  <p className="font-mono text-gray-700 text-[11px] break-all">
                    {certData.documentHash}
                  </p>
                </div>

                <p className="text-[11px] text-gray-500">
                  Hash generated for future tamper detection capability.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Certificate Details */}
          {certData && (
            <div className="lg:col-span-6 space-y-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Certificate Details
              </span>
              <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm space-y-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">
                      Certificate Number
                    </span>
                    <p className="text-sm font-mono text-[#3157D5] font-semibold mt-0.5">
                      {certData.certificateNumber}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">
                      Title
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {certData.title}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">
                      Program
                    </span>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {certData.program}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">
                      Student
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {certData.studentName}
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {certData.studentId}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">
                      Institution
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {certData.institutionName}
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {certData.institutionCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  )
}

export default VerificationResultPage
