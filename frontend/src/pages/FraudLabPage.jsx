import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StatusBadge from '../components/StatusBadge'
import { MOCK_FRAUD_CASES } from '../data/mockData'
import {
  FlaskConical,
  ShieldCheck,
  Fingerprint,
  Lock,
  ArrowRight,
  FileSearch,
} from 'lucide-react'

function FraudLabPage() {
  const [activeCaseId, setActiveCaseId] = useState('genuine')

  const activeCase =
    MOCK_FRAUD_CASES.find((c) => c.id === activeCaseId) || MOCK_FRAUD_CASES[0]

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">

        {/* Simulation Disclaimer */}
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 sm:p-5 flex items-start gap-3">
          <FlaskConical className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-amber-900">
              Simulation Area Only
            </p>
            <p className="text-amber-800 mt-0.5">
              This page demonstrates verification scenarios using test data. These are not real certificates or institutions. For actual certificate verification, use the public resolver or document upload feature.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
            <FlaskConical className="h-4 w-4 text-amber-700" />
            <span>TESTING & SIMULATION AREA</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
            Verification Scenario Lab
          </h1>

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Explore simulated verification scenarios to understand how the system handles different certificate states. These are test scenarios only.
          </p>
        </div>

        {/* 4 Scenario Cards (Light Theme: Green / Amber / Red / Gray) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_FRAUD_CASES.map((item, idx) => {
            const isActive = item.id === activeCaseId

            const borderColor = {
              genuine: 'border-emerald-300',
              tampered: 'border-amber-300',
              revoked: 'border-rose-300',
              fake: 'border-gray-300',
            }[item.id]

            const activeBg = {
              genuine: 'bg-emerald-50/50 ring-2 ring-emerald-500',
              tampered: 'bg-amber-50/50 ring-2 ring-amber-500',
              revoked: 'bg-rose-50/50 ring-2 ring-rose-500',
              fake: 'bg-gray-50 ring-2 ring-gray-400',
            }[item.id]

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveCaseId(item.id)}
                className={`p-5 rounded-2xl border text-left transition-all bg-white shadow-xs flex flex-col justify-between ${
                  isActive ? activeBg : `border-gray-200 hover:${borderColor} hover:shadow-sm`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-gray-500">
                      CASE 0{idx + 1}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {item.notes}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#3157D5] font-semibold">
                  <span>View Analysis</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            )
          })}
        </div>

        {/* Visual Comparison Analysis Matrix (White Cards) */}
        <div className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <StatusBadge status={activeCase.status} size="lg" />
                <span className="text-xs text-gray-500 font-medium">
                  Test Scenario: {activeCase.id.toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-950 mt-2">
                {activeCase.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
                {activeCase.notes}
              </p>
            </div>

            <Link
              to={`/verify/CV-2026-${activeCase.id.toUpperCase()}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3157D5] hover:bg-[#2745B0] text-xs font-semibold text-white transition-colors self-start sm:self-auto shadow-xs"
            >
              <FileSearch className="h-4 w-4" />
              <span>Test Scenario</span>
            </Link>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Fingerprint className="h-4 w-4 text-[#3157D5]" />
                Document Hash Check
              </span>
              <p className="text-sm font-semibold text-gray-900 pt-1">
                {activeCase.hashMatch}
              </p>
              <p className="text-[11px] text-gray-500">
                Calculated on original PDF binary vs registry anchor
              </p>
            </div>

            <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-[#3157D5]" />
                Institutional Signature
              </span>
              <p className="text-sm font-semibold text-gray-900 pt-1">
                {activeCase.signatureStatus}
              </p>
              <p className="text-[11px] text-gray-500">
                Validated against university public key registry
              </p>
            </div>

            <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#3157D5]" />
                Revocation Registry
              </span>
              <p className="text-sm font-semibold text-gray-900 pt-1">
                {activeCase.ledgerStatus}
              </p>
              <p className="text-[11px] text-gray-500">
                Active dynamic check on official status
              </p>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs sm:text-sm text-gray-800 leading-relaxed">
            <p className="font-semibold text-gray-900 mb-1">
              Verification Outcome Summary:
            </p>
            {activeCase.id === 'genuine' && (
              <p>
                The document presented by the graduate matches the university registrar’s record with 100% cryptographic parity. The Provost’s Ed25519 signature is authentic, and no revocation records exist.
              </p>
            )}
            {activeCase.id === 'tampered' && (
              <p>
                The student attempted to modify their GPA or course grades before applying for employment. Changing even a single letter in the PDF broke the SHA-256 hash match, triggering an immediate alteration warning.
              </p>
            )}
            {activeCase.id === 'revoked' && (
              <p>
                The diploma was originally genuine, but was later revoked by the university for academic misconduct. Real-time revocation queries identify that this credential is no longer valid.
              </p>
            )}
            {activeCase.id === 'fake' && (
              <p>
                The issuing entity is an unaccredited diploma mill using an unrecognized self-signed certificate. CERTI-VAULT rejects any credential not originating from a validated institutional authority.
              </p>
            )}
          </div>

        </div>

      </main>

      <Footer />
    </div>
  )
}

export default FraudLabPage
