import { Shield, Award, QrCode, CheckCircle2 } from 'lucide-react'

function CertificatePreview({ certificate }) {
  const cert = certificate || {
    id: 'CV-2026-DEMO-001',
    studentName: 'Alex Taylor',
    degree: 'Master of Science in Artificial Intelligence',
    department: 'School of Engineering',
    institution: 'Example University',
    issueDate: 'May 28, 2025',
    signatoryName: 'Dr. Eleanor Vance',
    signatoryTitle: 'Provost & Dean of Academic Affairs',
    status: 'VERIFIED',
  }

  const isVerified = (cert.status || '').toUpperCase() === 'VERIFIED'
  const isRevoked = (cert.status || '').toUpperCase() === 'REVOKED'
  const isTampered = (cert.status || '').toUpperCase() === 'TAMPERED'

  return (
    <div className="relative rounded-2xl bg-white p-2 sm:p-3 shadow-xl border border-gray-200">
      {/* Real Ivory Academic Paper Surface */}
      <div className="relative rounded-xl bg-[#FCFBF8] p-6 sm:p-10 border-2 border-[#3157D5]/30 overflow-hidden text-gray-900 shadow-inner">
        
        {/* Elegant double-line decorative academic border */}
        <div className="absolute inset-2 border border-[#3157D5]/20 pointer-events-none rounded-lg" />
        <div className="absolute inset-3 border border-[#3157D5]/10 pointer-events-none rounded-md" />

        {/* Subtle Watermark Seal */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
          <Shield className="w-80 h-80 text-[#3157D5]" />
        </div>

        {/* Certificate Header */}
        <div className="relative z-10 text-center pb-6 border-b border-gray-200/80">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-[#3157D5] mb-2 border border-blue-100">
            <Award className="h-6 w-6" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#3157D5]">
            Official Academic Credential
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-950 tracking-wide mt-1">
            {cert.institution}
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">{cert.department}</p>
        </div>

        {/* Certificate Body */}
        <div className="relative z-10 py-6 text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">
            This is to certify that
          </p>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-normal">
            {cert.studentName}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            has fulfilled all curriculum requirements prescribed by the academic board and is awarded the degree of
          </p>
          <div className="inline-block px-5 py-2 rounded-lg bg-blue-50/80 border border-blue-200 text-[#3157D5] font-serif font-bold text-base sm:text-lg">
            {cert.degree}
          </div>
        </div>

        {/* Signatures & QR Section */}
        <div className="relative z-10 pt-6 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Signatory */}
          <div className="text-center sm:text-left">
            <div className="font-serif italic text-lg text-gray-800 border-b border-gray-300 pb-1 px-2">
              {cert.signatoryName}
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-1">{cert.signatoryTitle}</p>
            <p className="text-[11px] text-gray-500">Conferred: {cert.issueDate}</p>
          </div>

          {/* QR Code and Status Stamp */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-900">
                <QrCode className="h-12 w-12" />
              </div>
              <span className="text-[9px] font-mono font-bold tracking-wider text-gray-500 mt-1">
                SCAN TO VERIFY
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              {isVerified && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 flex flex-col items-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mb-0.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    VERIFIED
                  </span>
                </div>
              )}
              {isRevoked && (
                <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    REVOKED
                  </span>
                </div>
              )}
              {isTampered && (
                <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    TAMPERED
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Certificate Bottom ID Strip */}
        <div className="relative z-10 mt-6 pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] font-mono text-gray-500">
          <span>Certificate ID: {cert.id}</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Cryptographic Integrity Confirmed
          </span>
        </div>
      </div>
    </div>
  )
}

export default CertificatePreview
