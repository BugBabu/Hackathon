import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

// Today's date in ISO format — computed once at module load, not per render
const TODAY_ISO = new Date().toISOString().split('T')[0]
import DashboardLayout from '../layouts/DashboardLayout'
import CertificatePreview from '../components/CertificatePreview'
import { getStudentsForIssuer, createCertificate, getIssuerContext } from '../services/certificateService'
import {
  User,
  GraduationCap,
  ShieldCheck,
  Lock,
  ArrowLeft,
  FileCheck2,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  UserX,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Field helper
// ---------------------------------------------------------------------------
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-blue-100 transition-colors'

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function CreateCertificatePage() {

  // ── Context loading ──────────────────────────────────────────────────────
  const [contextLoading, setContextLoading] = useState(true)
  const [contextError, setContextError] = useState(null)
  const [issuerCtx, setIssuerCtx] = useState(null)

  // ── Student list ─────────────────────────────────────────────────────────
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(true)

  // ── Form state ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    studentId: '',       // students.id (UUID)
    title: '',           // certificates.title
    program: '',         // certificates.program
    issueDate: TODAY_ISO, // certificates.issue_date (DATE)
  })
  const [validationError, setValidationError] = useState(null)

  // ── Submission ───────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // ── Success ──────────────────────────────────────────────────────────────
  const [successData, setSuccessData] = useState(null) // { certificate_number, studentName, institutionName }
  const [copied, setCopied] = useState(false)

  // ── Load issuer context ──────────────────────────────────────────────────
  useEffect(() => {
    async function loadContext() {
      setContextLoading(true)
      const ctx = await getIssuerContext()
      if (ctx.error) {
        setContextError(ctx.error)
      } else {
        setIssuerCtx(ctx)
      }
      setContextLoading(false)
    }
    loadContext()
  }, [])

  // ── Load students ────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadStudents() {
      setStudentsLoading(true)
      const { data, error } = await getStudentsForIssuer()
      if (!error && data) setStudents(data)
      setStudentsLoading(false)
    }
    loadStudents()
  }, [])

  // ── Derived: selected student object for preview ─────────────────────────
  const selectedStudent = students.find((s) => s.id === formData.studentId) ?? null

  // ── Preview data (maps form fields to CertificatePreview prop names) ─────
  const previewData = {
    id: '(will be generated)',
    studentName: selectedStudent?.full_name ?? '—',
    degree: formData.title || '—',
    department: formData.program || '—',
    institution: issuerCtx ? `Institution ${issuerCtx.institutionCode}` : '—',
    issueDate: formData.issueDate
      ? new Date(formData.issueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '—',
    signatoryName: '—',
    signatoryTitle: '—',
    status: 'VERIFIED',
  }

  // ── Handle change ────────────────────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setValidationError(null)
    setSubmitError(null)
  }, [])

  // ── Handle submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError(null)
    setSubmitError(null)

    // Client-side guard (service also validates)
    if (!formData.studentId) {
      setValidationError('Please select a student.')
      return
    }
    if (!formData.title.trim()) {
      setValidationError('Degree title is required.')
      return
    }
    if (!formData.program.trim()) {
      setValidationError('Program / specialization is required.')
      return
    }
    if (!formData.issueDate) {
      setValidationError('Issue date is required.')
      return
    }

    setSubmitting(true)
    const { data, error } = await createCertificate(formData)
    setSubmitting(false)

    if (error) {
      setSubmitError(error)
      return
    }

    setSuccessData({
      certificate_number: data.certificate_number,
      studentName: selectedStudent?.full_name ?? 'Student',
      institutionCode: issuerCtx?.institutionCode ?? '',
    })
  }

  // ── Reset for "Create Another" ────────────────────────────────────────────
  const resetForm = () => {
    setSuccessData(null)
    setSubmitError(null)
    setValidationError(null)
    setFormData({
      studentId: '',
      title: '',
      program: '',
      issueDate: TODAY_ISO,
    })
  }

  // ── Copy verification link ────────────────────────────────────────────────
  const handleCopyLink = () => {
    if (!successData) return
    navigator.clipboard.writeText(
      `${window.location.origin}/verify/${successData.certificate_number}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Loading / error guards
  // ─────────────────────────────────────────────────────────────────────────
  if (contextLoading) {
    return (
      <DashboardLayout role="issuer">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#3157D5]" />
            <p className="text-sm font-medium text-gray-500">Verifying issuer credentials...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (contextError) {
    return (
      <DashboardLayout role="issuer">
        <div className="space-y-4">
          <Link
            to="/issuer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#3157D5] transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Issuer Dashboard
          </Link>
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-6 flex items-start gap-4">
            <UserX className="h-6 w-6 text-rose-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-rose-900">Issuer Access Required</h3>
              <p className="text-sm text-rose-700 mt-1">{contextError}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Success screen
  // ─────────────────────────────────────────────────────────────────────────
  if (successData) {
    const verifyUrl = `${window.location.origin}/verify/${successData.certificate_number}`
    return (
      <DashboardLayout role="issuer">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-2xl bg-white border border-emerald-200 shadow-sm p-8 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-950">Certificate Conferred</h2>
              <p className="text-sm text-gray-500 mt-1">
                The academic credential has been published to the trust registry.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Certificate Number</span>
                <span className="font-mono font-bold text-[#3157D5]">{successData.certificate_number}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Graduate</span>
                <span className="font-semibold text-gray-900">{successData.studentName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Institution Code</span>
                <span className="font-semibold text-gray-900">{successData.institutionCode}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className="font-semibold text-emerald-700">Active</span>
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs font-mono text-[#3157D5] break-all text-left">
              {verifyUrl}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={`/verify/${successData.certificate_number}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] text-white font-semibold text-sm transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View Certificate
              </Link>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors"
              >
                {copied ? (
                  <><Check className="h-4 w-4 text-emerald-600" /><span className="text-emerald-700">Copied!</span></>
                ) : (
                  <><Copy className="h-4 w-4" /><span>Copy Link</span></>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
              >
                <FileCheck2 className="h-4 w-4" />
                Create Another
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/issuer"
              className="text-xs text-gray-500 hover:text-[#3157D5] font-medium transition-colors"
            >
              ← Back to Issuer Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main form
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout role="issuer">
      <div className="space-y-8">
        {/* Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              to="/issuer"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#3157D5] mb-2 transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Issuer Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              Issue Academic Credential
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Confer and publish an authentic academic certificate to the trust registry
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-[#3157D5] font-semibold">
              <Lock className="h-3.5 w-3.5" />
              {issuerCtx?.institutionCode ?? 'Institution'} — Registrar Portal
            </span>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* ── Form Column ── */}
          <div className="xl:col-span-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>

              {/* Section 1: Student Selection */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[#3157D5] font-bold text-sm border-b border-gray-200 pb-3">
                  <User className="h-4 w-4" />
                  <span>1. Student Selection</span>
                </div>

                {studentsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#3157D5]" />
                    Loading students...
                  </div>
                ) : students.length === 0 ? (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-800">
                      No students are available for certificate issuance. An administrator must
                      first add student records linked to the platform before certificates can be
                      issued.
                    </p>
                  </div>
                ) : (
                  <Field label="Select Student" required>
                    <select
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">— Choose a registered student —</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.student_id})
                        </option>
                      ))}
                    </select>

                    {selectedStudent && (
                      <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1">
                        <p className="font-semibold text-gray-900">{selectedStudent.full_name}</p>
                        <p className="text-gray-500">
                          Student ID: <span className="font-mono">{selectedStudent.student_id}</span>
                        </p>
                        <p className="text-gray-500">Email: {selectedStudent.email}</p>
                      </div>
                    )}
                  </Field>
                )}
              </div>

              {/* Section 2: Academic Qualification */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[#3157D5] font-bold text-sm border-b border-gray-200 pb-3">
                  <GraduationCap className="h-4 w-4" />
                  <span>2. Academic Qualification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Degree Title" required>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Master of Science in Computer Engineering"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Program / Specialization" required>
                      <input
                        type="text"
                        name="program"
                        value={formData.program}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Software Systems and Architecture"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Conferral / Issue Date" required>
                      <input
                        type="date"
                        name="issueDate"
                        value={formData.issueDate}
                        onChange={handleChange}
                        required
                        max={TODAY_ISO}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Section 3: Credential Authority */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-[#3157D5] font-bold text-sm border-b border-gray-200 pb-3">
                  <ShieldCheck className="h-4 w-4" />
                  <span>3. Credential Authority</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex justify-between">
                    <span className="text-gray-500">Issuing Institution</span>
                    <span className="font-semibold text-gray-900">{issuerCtx?.institutionCode ?? '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex justify-between">
                    <span className="text-gray-500">Certificate Number</span>
                    <span className="font-mono text-[#3157D5] font-semibold">Auto-generated on publish</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex justify-between">
                    <span className="text-gray-500">Initial Status</span>
                    <span className="font-semibold text-emerald-700">Active</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Institution and issuer IDs are resolved securely from your authenticated session.
                  They cannot be overridden from the form.
                </p>
              </div>

              {/* Validation error */}
              {validationError && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-800">{validationError}</p>
                </div>
              )}

              {/* Submit error */}
              {submitError && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-rose-800">Certificate creation failed</p>
                    <p className="text-xs text-rose-700 mt-0.5">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting || students.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm text-white bg-[#3157D5] hover:bg-[#2745B0] shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /><span>Publishing...</span></>
                  ) : (
                    <><FileCheck2 className="h-4 w-4" /><span>Publish to Trust Registry</span></>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Preview Column ── */}
          <div className="xl:col-span-6 space-y-4 sticky top-20">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#3157D5]" />
                Live Certificate Preview
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">Live Sync</span>
            </div>

            <CertificatePreview certificate={previewData} />

            <div className="p-4 rounded-xl bg-white border border-gray-200 text-xs text-gray-600 space-y-1 shadow-xs">
              <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#3157D5]" />
                Verification Guarantee
              </p>
              <p>
                Once published, this diploma will be permanently resolvable at{' '}
                <code className="text-[#3157D5] font-semibold">/verify/[certificate-number]</code> with
                instant confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CreateCertificatePage
