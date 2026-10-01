function StatCard({ title, value, change, changeType = 'positive', icon: Icon, description }) {
  const isPositive = changeType === 'positive'
  const isNegative = changeType === 'negative'

  return (
    <div className="relative overflow-hidden rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </p>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#3157D5]">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-gray-900">{value}</span>
        {change && (
          <span
            className={`text-xs font-semibold ${
              isPositive
                ? 'text-emerald-700'
                : isNegative
                ? 'text-rose-600'
                : 'text-gray-500'
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>
  )
}

export default StatCard
