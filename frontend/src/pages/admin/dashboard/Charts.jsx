import { useTranslation } from 'react-i18next'
import {
  Area, AreaChart, Bar, CartesianGrid, Cell, ComposedChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmtInt, fmtMoney, statusMeta } from './constants'

const shortDay = (d) => (d ? d.slice(5).replace('-', '/') : '')

function Empty() {
  const { t } = useTranslation()
  return <div className="flex h-full items-center justify-center text-sm text-slate-400">{t('dashboard.noData')}</div>
}

const tooltipStyle = {
  borderRadius: 8, border: '1px solid rgba(148,163,184,.25)', fontSize: 12,
  background: 'var(--card, #fff)', color: 'inherit',
}

export function RevenueChart({ revenue = [], orders = [], loading }) {
  const { t } = useTranslation()
  const data = revenue.map((r, i) => ({ day: r.day, revenue: r.value, orders: orders[i]?.value ?? 0 }))
  const empty = data.every((d) => d.revenue === 0 && d.orders === 0)

  return (
    <Card className="h-full">
      <CardHeader className="pb-2"><CardTitle className="text-base">{t('dashboard.chartTitle')}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64">
          {loading ? (
            <div className="h-full animate-pulse rounded bg-slate-100 dark:bg-white/5" />
          ) : empty ? <Empty /> : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="dash-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.2)" vertical={false} />
                <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
                <YAxis yAxisId="rev" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="ord" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={shortDay}
                  formatter={(v, name) => [name === 'revenue' ? `${fmtMoney(v)} TMT` : fmtInt(v), t(name === 'revenue' ? 'dashboard.revenue' : 'dashboard.orders')]}
                />
                <Bar yAxisId="ord" dataKey="orders" fill="#f59e0b" fillOpacity={0.5} radius={[3, 3, 0, 0]} maxBarSize={18} />
                <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#dash-rev)" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function StatusDonut({ data = [], loading }) {
  const { t } = useTranslation()
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <Card className="h-full">
      <CardHeader className="pb-2"><CardTitle className="text-base">{t('dashboard.byStatus')}</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
        ) : total === 0 ? (
          <div className="h-64"><Empty /></div>
        ) : (
          <>
            <div className="relative h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="count" nameKey="status" innerRadius={48} outerRadius={70} paddingAngle={2} stroke="none">
                    {data.map((d) => <Cell key={d.status} fill={statusMeta(d.status).hex} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, _n, p) => [v, t(statusMeta(p.payload.status).labelKey)]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{fmtInt(total)}</span>
                <span className="text-xs text-slate-400">{t('dashboard.orders')}</span>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {data.map((d) => (
                <li key={d.status} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusMeta(d.status).hex }} />
                    {t(statusMeta(d.status).labelKey)}
                  </span>
                  <span className="font-medium tabular-nums text-slate-800 dark:text-white">{d.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
