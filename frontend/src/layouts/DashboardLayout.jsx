import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  LayoutDashboard,
  FilePlus,
  Files,
  FileSearch,
  History,
  FlaskConical,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ExternalLink,
} from 'lucide-react'

function DashboardLayout({ children, role = 'issuer' }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const links = [
    { name: 'Overview', path: role === 'admin' ? '/admin' : role === 'student' ? '/student' : '/issuer', icon: LayoutDashboard },
    { name: 'Certificates', path: role === 'student' ? '/student' : '/issuer', icon: Files },
    { name: 'Issue Certificate', path: '/issuer/create', icon: FilePlus },
    { name: 'Verification', path: '/verify/CV-2026-STAN-8842', icon: FileSearch },
    { name: 'Audit Logs', path: '/audit-logs', icon: History },
    { name: 'Fraud Lab', path: '/fraud-lab', icon: FlaskConical },
  ]

  const roleMeta = {
    issuer: {
      badge: 'Registrar (Demo)',
      user: 'Example University Registrar',
      sub: 'Office of Academic Records (Demo)',
    },
    admin: {
      badge: 'Security Admin',
      user: 'Demo Administrator',
      sub: 'CERTI-VAULT Demo Environment',
    },
    student: {
      badge: 'Graduate (Demo)',
      user: 'Alex Taylor (Demo Student)',
      sub: 'M.S. Artificial Intelligence',
    },
  }[role]

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-gray-900 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3157D5] text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-bold text-gray-900 text-base">CERTI-VAULT</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* White Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col justify-between transition-transform transform md:translate-x-0 md:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Area */}
          <div className="p-6 border-b border-gray-200">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3157D5] text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-gray-900 text-lg">
                  CERTI<span className="text-[#3157D5]">-VAULT</span>
                </span>
                <p className="text-[10px] tracking-wider text-gray-500 font-medium">
                  CREDENTIAL PLATFORM
                </p>
              </div>
            </Link>

            <div className="mt-3">
              <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#3157D5] border border-blue-200">
                {roleMeta.badge}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Menu
            </p>
            {links.map((item) => {
              const active = location.pathname === item.path
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#E9EDFF] text-[#3157D5] font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-[#3157D5]' : 'text-gray-500'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Tools
              </p>
              <Link
                to="/verify-upload"
                className="flex items-center justify-between px-3.5 py-2 text-xs text-gray-600 hover:text-[#3157D5] hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span>Upload & Verify PDF</span>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </Link>
            </div>
          </nav>
        </div>

        {/* User Profile Card & Sign Out */}
        <div className="p-4 border-t border-gray-200">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-[#3157D5]">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {roleMeta.user}
              </p>
              <p className="text-[11px] text-gray-500 truncate">{roleMeta.sub}</p>
            </div>
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out Session</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="hidden md:flex h-16 items-center justify-between px-6 lg:px-8 border-b border-gray-200 bg-white sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span>System Status: Demo Verification Registry Active (Prototype)</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/verify-upload"
              className="text-xs font-medium text-gray-700 hover:text-[#3157D5] px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-blue-50 border border-gray-200 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#3157D5]" />
              <span>Public Verifier</span>
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 relative"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#3157D5]" />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
