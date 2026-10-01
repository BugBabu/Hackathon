import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

function PagePlaceholder({
  title,
  description = 'Module active on verification network.',
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-indigo-400">
            CERTI-VAULT
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {description}
          </p>
        </div>

        {children && <div className="pt-2">{children}</div>}

        <div className="pt-4 border-t border-slate-800/80">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PagePlaceholder
