import { ShieldCheck, Fingerprint, Lock, FileCheck } from 'lucide-react'

function SecurityBadge({ type = 'hash', label }) {
  const types = {
    hash: {
      icon: Fingerprint,
      defaultLabel: 'SHA-256 Validated',
      style: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    signature: {
      icon: Lock,
      defaultLabel: 'Ed25519 Signed',
      style: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    },
    integrity: {
      icon: ShieldCheck,
      defaultLabel: 'Tamper Evident',
      style: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
    ledger: {
      icon: FileCheck,
      defaultLabel: 'Ledger Anchored',
      style: 'bg-slate-100 border-slate-200 text-slate-800',
    },
  }

  const current = types[type] || types.hash
  const Icon = current.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${current.style}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label || current.defaultLabel}</span>
    </span>
  )
}

export default SecurityBadge
