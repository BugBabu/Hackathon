import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldAlert } from 'lucide-react'

function StatusBadge({ status, size = 'md' }) {
  const normalized = (status || '').toUpperCase()

  const config = {
    VERIFIED: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-600',
      icon: CheckCircle2,
      label: 'Verified',
    },
    SUSPICIOUS: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-amber-600',
      icon: AlertTriangle,
      label: 'Suspicious',
    },
    REVOKED: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      dot: 'bg-rose-600',
      icon: XCircle,
      label: 'Revoked',
    },
    TAMPERED: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      dot: 'bg-rose-600',
      icon: ShieldAlert,
      label: 'Tamper Detected',
    },
    UNRECOGNIZED: {
      bg: 'bg-gray-100',
      border: 'border-gray-300',
      text: 'text-gray-700',
      dot: 'bg-gray-500',
      icon: XCircle,
      label: 'Unrecognized Issuer',
    },
    PENDING: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      dot: 'bg-blue-600',
      icon: Clock,
      label: 'Processing',
    },
  }

  const current = config[normalized] || config.VERIFIED
  const Icon = current.icon

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs gap-1.5',
    md: 'px-3 py-1 text-xs gap-1.5 font-medium',
    lg: 'px-3.5 py-1.5 text-sm gap-2 font-semibold',
  }[size] || 'px-3 py-1 text-xs gap-1.5 font-medium'

  return (
    <span
      className={`inline-flex items-center rounded-full border ${current.bg} ${current.border} ${current.text} ${sizeStyles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      <span>{current.label}</span>
    </span>
  )
}

export default StatusBadge
