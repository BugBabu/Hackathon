import { ShieldCheck, Lock, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white text-gray-600 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3157D5] text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="font-bold text-gray-900 tracking-tight text-base">
                CERTI<span className="text-[#3157D5]">-VAULT</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Academic certificate authenticity validator. Secure document integrity, trusted institutional validation, and public proof.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Demo Verification Resolver: Active</span>
            </div>
          </div>

          {/* Verification Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              Verification
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/verify/CV-2026-DEMO-001" className="text-gray-600 hover:text-[#3157D5] transition-colors">
                  Sample Public Resolver
                </Link>
              </li>
              <li>
                <Link to="/verify-upload" className="text-gray-600 hover:text-[#3157D5] transition-colors">
                  Upload & Verify PDF
                </Link>
              </li>
              <li>
                <Link to="/fraud-lab" className="text-gray-600 hover:text-[#3157D5] transition-colors">
                  Fraud Detection Lab
                </Link>
              </li>
              <li>
                <Link to="/audit-logs" className="text-gray-600 hover:text-[#3157D5] transition-colors">
                  Public Security Ledger
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/issuer" className="text-gray-600 hover:text-[#3157D5] transition-colors">
                  University Registrar Console
                </Link>
              </li>
              <li>
                <Link to="/issuer/create" className="text-gray-600 hover:text-[#3157D5] transition-colors">
                  Issue Digital Certificate
                </Link>
              </li>
              <li>
                <Link to="/student" className="text-gray-600 hover:text-[#3157D5] transition-colors">
                  Student Credential Wallet
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-gray-600 hover:text-[#3157D5] transition-colors">
                  Security Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              Compliance & Standards
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 flex items-center justify-between">
                <span>Ed25519 & SHA-256 (Planned)</span>
                <Lock className="h-3.5 w-3.5 text-[#3157D5]" />
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 flex items-center justify-between">
                <span>W3C Verifiable Credentials (Format)</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <p className="text-[11px] text-gray-500">
                Designed according to FERPA & GDPR academic privacy guidelines (Demonstration Prototype).
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 CERTI-VAULT Systems Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-900 cursor-pointer">Security Policy</span>
            <span className="hover:text-gray-900 cursor-pointer">API Documentation</span>
            <span className="hover:text-gray-900 cursor-pointer">Privacy Notice</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
