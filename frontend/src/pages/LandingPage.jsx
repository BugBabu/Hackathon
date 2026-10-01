import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CertificatePreview from '../components/CertificatePreview'
import {
  Check,
  Search,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Award,
  Building2,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

function LandingPage() {
  const [searchId, setSearchId] = useState('')
  const navigate = useNavigate()

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchId.trim()) {
      navigate(`/verify/${encodeURIComponent(searchId.trim())}`)
    } else {
      navigate('/verify/CV-2026-DEMO-001')
    }
  }

  const trustIndicators = [
    { label: 'Document Integrity', desc: 'Guaranteed byte-level accuracy' },
    { label: 'Issuer Verification', desc: 'Accredited university validation' },
    { label: 'Tamper Detection', desc: 'Instant modification alerts' },
    { label: 'Verification History', desc: 'Transparent audit records' },
  ]

  const howItWorks = [
    {
      num: '01',
      title: 'Issue',
      subtitle: 'Institutional Sign-off',
      desc: 'The university registrar seals the academic diploma using accredited institutional cryptographic keys.',
    },
    {
      num: '02',
      title: 'Secure',
      subtitle: 'Cryptographic Hashing',
      desc: 'A unique deterministic digital fingerprint is anchored into the decentralized verification registry.',
    },
    {
      num: '03',
      title: 'Verify',
      subtitle: 'Instant Resolution',
      desc: 'Employers, agencies, and graduate schools verify the diploma in seconds by scanning a QR code or uploading a PDF.',
    },
    {
      num: '04',
      title: 'Trust',
      subtitle: 'Transparent Proof',
      desc: 'Full transparency confirms the credential is unmodified, currently active, and authentic.',
    },
  ]

  const builtForTrust = [
    {
      icon: ShieldCheck,
      title: 'Document Integrity',
      desc: 'Eliminate altered transcripts and manipulated GPAs with mathematical cryptographic verification.',
    },
    {
      icon: Building2,
      title: 'Trusted University Issuers',
      desc: 'Verify that credentials originate exclusively from accredited collegiate institutions with active credentials.',
    },
    {
      icon: FileCheck2,
      title: 'Public Verification Endpoint',
      desc: 'Zero-knowledge verification allows instant public validation without requiring software downloads or fees.',
    },
    {
      icon: Clock,
      title: 'Real-Time Revocation Tracking',
      desc: 'Dynamic registry lookups confirm that certificates have not been revoked or administratively suspended.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col">
      <Navbar />

      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-[#F7F8FC] to-[#F7F8FC] border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#3157D5] text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-[#3157D5]" />
                <span>DIGITAL CREDENTIAL VERIFICATION</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-950 tracking-tight leading-[1.15]">
                Your Certificate.{' '}
                <span className="text-[#3157D5]">Your Proof.</span>{' '}
                Your Trust.
              </h1>

              <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Verify academic credentials with secure document integrity, trusted issuer validation, and transparent verification.
              </p>

              {/* Fast Lookup Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="max-w-md mx-auto lg:mx-0 flex items-center p-1.5 rounded-xl bg-white border border-gray-300 shadow-sm focus-within:border-[#3157D5] focus-within:ring-2 focus-within:ring-blue-100 transition-all"
              >
                <div className="pl-3 pr-2 text-gray-400">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Enter Certificate ID (e.g. CV-2026-DEMO-001)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="bg-transparent flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#3157D5] hover:bg-[#2745B0] text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>Verify</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Primary / Secondary CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1">
                <Link
                  to="/verify-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#3157D5] hover:bg-[#2745B0] shadow-sm transition-all"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>Verify a Certificate</span>
                </Link>

                <Link
                  to="/issuer/create"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 transition-all shadow-xs"
                >
                  <Award className="h-4 w-4 text-[#3157D5]" />
                  <span>Issue a Certificate</span>
                </Link>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-emerald-600 font-bold" />
                  Public Key Validation (Demo)
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-emerald-600 font-bold" />
                  Instant Public Lookup
                </span>
              </div>
            </div>

            {/* Right Mockup: Elevated Ivory Academic Certificate Preview */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg">
                <CertificatePreview />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Trust Indicators Section */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustIndicators.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 flex-shrink-0">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{item.label}</h4>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How CERTI-VAULT Works (4 Clean Steps) */}
      <section id="how-it-works" className="py-16 md:py-24 bg-[#F7F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase font-bold tracking-wider text-[#3157D5]">
              VERIFICATION PROCESS
            </span>
            <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
              How CERTI-VAULT Works
            </h2>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">
              A transparent four-step workflow ensuring genuine certificates are instantly proven.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {howItWorks.map((step, idx) => (
              <div
                key={step.num}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-bold text-[#3157D5]">
                      {step.num}
                    </span>
                    <span className="text-xs font-semibold text-gray-400 uppercase">
                      Step {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                  <p className="text-xs font-semibold text-[#3157D5] mt-0.5 mb-2">
                    {step.subtitle}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {idx < 3 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 border border-gray-200 text-gray-400">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Built for Trust Section */}
      <section id="security" className="py-16 md:py-24 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs uppercase font-bold tracking-wider text-[#3157D5]">
                BUILT FOR ACADEMIC TRUST
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight leading-tight">
                Academic Credential Verification Concept
              </h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Traditional paper and standard PDF certificates can be forged in minutes. CERTI-VAULT eliminates fraudulent diplomas by connecting universities, graduates, and employers through cryptographically verifiable credentials.
              </p>

              <div className="pt-2">
                <Link
                  to="/fraud-lab"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#3157D5] hover:underline"
                >
                  <span>Explore the Fraud Detection Showcase</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {builtForTrust.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="p-6 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-200 hover:bg-blue-50/20 transition-all"
                  >
                    <div className="h-10 w-10 rounded-lg bg-blue-100 text-[#3157D5] flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      </section>

      {/* 5. Final CTA Section */}
      <section className="py-16 md:py-20 bg-[#F7F8FC] border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="p-8 sm:p-12 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5">
            <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-[#3157D5] border border-blue-200">
              Instant Verification
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
              Ready to verify or issue authentic credentials?
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Verify diplomas in seconds or connect your university registrar office with CERTI-VAULT’s secure verification platform.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/verify-upload"
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#3157D5] hover:bg-[#2745B0] shadow-sm transition-all"
              >
                Upload & Verify Certificate
              </Link>
              <Link
                to="/verify/CV-2026-DEMO-001"
                className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                View Sample Verification
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage
