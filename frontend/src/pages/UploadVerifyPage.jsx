import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { validateFile, verifyCertificateByDocument } from '../services/documentVerificationService'
import {
  FileText,
  FileCheck2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Lock,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react'

function UploadVerifyPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [certificateNumber, setCertificateNumber] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Pre-fill certificate number if provided in URL
  useState(() => {
    const certId = searchParams.get('certId')
    if (certId) {
      setCertificateNumber(certId)
    }
  })

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      setError(null)
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setError(null)
    }
  }

  const handleVerify = async () => {
    setError(null)

    // Validate certificate number
    if (!certificateNumber.trim()) {
      setError('Please enter a certificate number.')
      return
    }

    // Validate file
    if (!selectedFile) {
      setError('Please upload a certificate document.')
      return
    }

    const validation = validateFile(selectedFile)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setVerifying(true)

    try {
      const result = await verifyCertificateByDocument(selectedFile, certificateNumber.trim())

      // Navigate to result page with verification data
      navigate('/verification-result', {
        state: {
          verificationResult: result,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        }
      })
    } catch (err) {
      setError('Verification failed. Please try again.')
      console.error('Verification error:', err)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-[#3157D5] border border-blue-200">
            Document Verification
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
            Verify Certificate Authenticity
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Upload any academic certificate, diploma, or transcript to confirm document integrity and verify the issuing university.
          </p>
        </div>

        {/* Large White Drop Zone */}
        <div className="max-w-2xl mx-auto">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-all bg-white shadow-sm ${
              isDragging
                ? 'border-[#3157D5] bg-blue-50/40 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-500 bg-emerald-50/30'
                : 'border-gray-300 hover:border-[#3157D5] hover:bg-gray-50/50'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div
                className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-transform ${
                  selectedFile
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-50 text-[#3157D5]'
                }`}
              >
                {selectedFile ? (
                  <FileCheck2 className="h-8 w-8" />
                ) : (
                  <FileText className="h-8 w-8" />
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    Document ready for verification
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900">
                    Drop your certificate here
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    PDF, PNG or JPG • Maximum 25 MB
                  </p>
                </div>
              )}

              <div className="pt-2">
                {selectedFile ? (
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifying}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Verify Document</span>
                      </>
                    )}
                  </button>
                ) : (
                  <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] text-white text-sm font-semibold transition-all shadow-sm">
                    <span>Choose Document</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileSelect}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Certificate Number Input */}
          <div className="max-w-2xl mx-auto p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-3">
            <label className="block">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Certificate Number
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Enter the certificate number from the document (e.g., CV-2026-001)
              </p>
            </label>
            <div className="relative">
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="e.g., CV-2026-001"
                disabled={verifying}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3157D5] focus:ring-1 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-rose-800">{error}</p>
              </div>
            )}

            {/* Info Note */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs">
              <p className="text-blue-800">
                <strong>Note:</strong> Automatic certificate number extraction is not yet implemented. Please manually enter the certificate number from your document.
              </p>
            </div>
          </div>
        </div>

        {/* Security Pillars Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-gray-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-[#3157D5] flex-shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Client-Side Privacy</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Hashing takes place in your local browser sandbox before lookup.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-[#3157D5] flex-shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Registrar Key Match</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Authenticates issuer signature against authorized academic PKI.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-[#3157D5] flex-shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">FERPA Compliant</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Academic data is shielded and handled under strict confidentiality.
              </p>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}

export default UploadVerifyPage
