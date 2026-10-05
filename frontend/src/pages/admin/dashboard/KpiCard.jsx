import { useTranslation } from 'react-i18next'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function Delta({ pct }) {
  const { t } = useTranslation()
  if (pct == null) return null
  const up = pct > 0
  const flat = pct === 0
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      title={t('dashboard.vsPrev')}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
        flat ? 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
          : up ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
            : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}%
    </span>
  )
}

export default function KpiCard({ label, value, icon: Icon, hex, pct, series, hint, loading, onClick }) {
  return (
    <Card
      onClick={onClick}
      className={cn('relative overflow-hidden p-4 transition-shadow', onClick && 'cursor-pointer hover:shadow-md')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-[#a0a0ab] truncate">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
          )}
        </div>
        <div className="rounded-lg p-2" style={{ backgroundColor: `${hex}22` }}>
          <Icon className="h-4 w-4" style={{ color: hex }} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
        {!loading && <Delta pct={pct} />}
        {hint && <span className="truncate">{hint}</span>}
      </div>
      {series?.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 h-10 opacity-70 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${hex.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hex} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={hex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={hex} strokeWidth={1.5} fill={`url(#spark-${hex.slice(1)})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
