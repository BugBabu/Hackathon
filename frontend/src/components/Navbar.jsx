import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShieldCheck, Menu, X, FileCheck2 } from 'lucide-react'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Verify Certificate', path: '/verify/CV-2026-DEMO-001' },
    { name: 'How It Works', path: '/#how-it-works' },
    { name: 'Security', path: '/#security' },
    { name: 'Fraud Lab', path: '/fraud-lab' },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    if (path.startsWith('/#')) return false
    return location.pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3157D5] text-white shadow-sm transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-gray-900 text-lg">
                CERTI<span className="text-[#3157D5]">-VAULT</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-[#3157D5] bg-[#E9EDFF] font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Right CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>

            <Link
              to="/verify-upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#3157D5] hover:bg-[#2745B0] shadow-sm transition-all"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Verify Certificate</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                isActive(link.path)
                  ? 'text-[#3157D5] bg-[#E9EDFF] font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Sign In
            </Link>
            <Link
              to="/verify-upload"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#3157D5] hover:bg-[#2745B0]"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Verify Certificate</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
