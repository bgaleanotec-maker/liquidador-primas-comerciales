import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

const COLORS = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-600 dark:text-blue-400',       ring: 'ring-blue-100 dark:ring-blue-900/30' },
  green:   { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-100 dark:ring-emerald-900/30' },
  yellow:  { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-600 dark:text-amber-400',     ring: 'ring-amber-100 dark:ring-amber-900/30' },
  red:     { bg: 'bg-rose-50 dark:bg-rose-900/20',       text: 'text-rose-600 dark:text-rose-400',       ring: 'ring-rose-100 dark:ring-rose-900/30' },
  purple:  { bg: 'bg-violet-50 dark:bg-violet-900/20',   text: 'text-violet-600 dark:text-violet-400',   ring: 'ring-violet-100 dark:ring-violet-900/30' },
  primary: { bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'text-primary-600 dark:text-primary-400', ring: 'ring-primary-100 dark:ring-primary-900/30' },
}

const MetricCard = ({ icon: Icon, label, value, change, hint, color = 'blue' }) => {
  const c = COLORS[color] || COLORS.blue
  const positive = change >= 0
  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-soft hover:shadow-card transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 truncate" title={String(value)}>{value}</p>
          {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{hint}</p>}
          {change !== undefined && (
            <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {positive ? '+' : ''}{change}% vs mes anterior
            </div>
          )}
        </div>
        {Icon && (
          <div className={`${c.bg} ${c.text} p-3 rounded-xl ring-4 ${c.ring} shrink-0`}>
            <Icon size={22} strokeWidth={2.2} />
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricCard
