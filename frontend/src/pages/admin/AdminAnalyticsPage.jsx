import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, Store, Users, ShoppingCart, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminApi } from '@/lib/api'

// ── CSV export helper ────────────────────────────────────────────────────────
function downloadCSV(rows, filename) {
  if (!rows?.length) return
  const header = Object.keys(rows[0]).join(',')
  const body = rows.map((r) => Object.values(r).map((v) => `"${v ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename })
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function today() { return new Date().toISOString().slice(0, 10) }

const ORDER_STATUS_LABELS = {
  0: 'Pending', 1: 'Confirmed', 2: 'Processing',
  3: 'Shipped', 4: 'Delivered', 5: 'Closed', 6: 'Cancelled',
}
const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#6366f1', '#10b981', '#22c55e', '#ef4444']

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 dark:text-[#a0a0ab]">{label}</CardTitle>
        <div className={`p-2 rounded-md ${color}`}><Icon className="h-4 w-4 text-white" /></div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          {value === null ? <span className="text-slate-300 animate-pulse">—</span> : value}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Section header with export ────────────────────────────────────────────────
function SectionHeader({ title, onExport }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between">
      <CardTitle className="text-base">{title}</CardTitle>
      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          {t('analytics.exportCsv', 'CSV')}
        </Button>
      )}
    </div>
  )
}

// ── Date range filter ────────────────────────────────────────────────────────
function DateFilter({ dateFrom, dateTo, period, onChangeDates, onChangePeriod }) {
  const { t } = useTranslation()
  const presets = [
    { label: '7d',  from: daysAgo(7) },
    { label: '30d', from: daysAgo(30) },
    { label: '90d', from: daysAgo(90) },
  ]
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <Button
          key={p.label}
          variant={dateFrom === p.from && dateTo === today() ? 'default' : 'outline'}
          size="sm"
          className="text-xs"
          onClick={() => onChangeDates(p.from, today())}
        >
          {p.label}
        </Button>
      ))}
      <input
        type="date" value={dateFrom}
        onChange={(e) => onChangeDates(e.target.value, dateTo)}
        className="text-xs border rounded-md px-2 py-1.5 dark:bg-[#1c1c1f] dark:border-white/10 dark:text-white"
      />
      <span className="text-xs text-slate-400">–</span>
      <input
        type="date" value={dateTo}
        onChange={(e) => onChangeDates(dateFrom, e.target.value)}
        className="text-xs border rounded-md px-2 py-1.5 dark:bg-[#1c1c1f] dark:border-white/10 dark:text-white"
      />
      <select
        value={period}
        onChange={(e) => onChangePeriod(e.target.value)}
        className="text-xs border rounded-md px-2 py-1.5 dark:bg-[#1c1c1f] dark:border-white/10 dark:text-white"
      >
        <option value="day">{t('analytics.periodDay', 'Day')}</option>
        <option value="week">{t('analytics.periodWeek', 'Week')}</option>
        <option value="month">{t('analytics.periodMonth', 'Month')}</option>
      </select>
    </div>
  )
}

// ── Tooltip formatter ─────────────────────────────────────────────────────────
function formatPeriod(val) {
  if (!val) return ''
  return new Date(val).toLocaleDateString()
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const { t } = useTranslation()

  const [dateFrom, setDateFrom] = useState(daysAgo(30))
  const [dateTo,   setDateTo]   = useState(today())
  const [period,   setPeriod]   = useState('day')

  const [overview, setOverview] = useState(null)
  const [shops,    setShops]    = useState(null)
  const [users,    setUsers]    = useState(null)
  const [orders,   setOrders]   = useState(null)
  const [loading,  setLoading]  = useState(true)

  const params = { date_from: dateFrom, date_to: dateTo, period }

  const load = useCallback(() => {
    setLoading(true)
    Promise.allSettled([
      AdminApi.analytics.getOverview(params),
      AdminApi.analytics.getShops({ date_from: dateFrom, date_to: dateTo, limit: 10 }),
      AdminApi.analytics.getUsers(params),
      AdminApi.analytics.getOrders({ date_from: dateFrom, date_to: dateTo }),
    ]).then(([ov, sh, us, or]) => {
      if (ov.status === 'fulfilled') setOverview(ov.value.data)
      if (sh.status === 'fulfilled') setShops(sh.value.data?.data ?? [])
      if (us.status === 'fulfilled') setUsers(us.value.data?.series ?? [])
      if (or.status === 'fulfilled') setOrders(or.value.data?.by_status ?? [])
    }).finally(() => setLoading(false))
  }, [dateFrom, dateTo, period]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const summary = overview?.summary ?? {}
  const revenueSeries = (overview?.revenue_series ?? []).map((r) => ({
    ...r,
    period: formatPeriod(r.period),
  }))
  const userSeries = (users ?? []).map((r) => ({ ...r, period: formatPeriod(r.period) }))
  const orderPie = (orders ?? []).map((r) => ({
    name: ORDER_STATUS_LABELS[r.status] ?? `Status ${r.status}`,
    value: r.count,
    status: r.status,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          {t('analytics.title', 'Analytics')}
        </h2>
        <DateFilter
          dateFrom={dateFrom} dateTo={dateTo} period={period}
          onChangeDates={(f, t2) => { setDateFrom(f); setDateTo(t2) }}
          onChangePeriod={setPeriod}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label={t('analytics.totalRevenue', 'Total Revenue')} value={loading ? null : `${summary.total_revenue?.toFixed(2) ?? '0.00'} TMT`} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard label={t('analytics.totalOrders',  'Total Orders')}  value={loading ? null : summary.total_orders  ?? 0} icon={ShoppingCart} color="bg-orange-500" />
        <StatCard label={t('analytics.totalUsers',   'Total Users')}   value={loading ? null : summary.total_users   ?? 0} icon={Users}        color="bg-blue-500" />
        <StatCard label={t('analytics.totalShops',   'Total Shops')}   value={loading ? null : summary.total_shops   ?? 0} icon={Store}        color="bg-violet-500" />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <SectionHeader
            title={t('analytics.revenueOverTime', 'Revenue & Orders Over Time')}
            onExport={() => downloadCSV(overview?.revenue_series ?? [], 'revenue.csv')}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.loading')}</div>
          ) : revenueSeries.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.noResults')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name={t('analytics.revenue', 'Revenue')} />
                <Line yAxisId="right" type="monotone" dataKey="orders"  stroke="#3b82f6" strokeWidth={2} dot={false} name={t('analytics.orders', 'Orders')} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Shops + Orders row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top shops */}
        <Card>
          <CardHeader>
            <SectionHeader
              title={t('analytics.topShops', 'Top Shops by Revenue')}
              onExport={() => downloadCSV(shops ?? [], 'top-shops.csv')}
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.loading')}</div>
            ) : !shops?.length ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.noResults')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={shops} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v} TMT`} />
                  <Bar dataKey="revenue" fill="#10b981" name={t('analytics.revenue', 'Revenue')} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Order funnel */}
        <Card>
          <CardHeader>
            <SectionHeader
              title={t('analytics.ordersByStatus', 'Orders by Status')}
              onExport={() => downloadCSV(orders ?? [], 'orders-by-status.csv')}
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.loading')}</div>
            ) : !orderPie.length ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.noResults')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={orderPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {orderPie.map((entry, i) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User growth */}
      <Card>
        <CardHeader>
          <SectionHeader
            title={t('analytics.userGrowth', 'User Registrations Over Time')}
            onExport={() => downloadCSV(users ?? [], 'user-growth.csv')}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.loading')}</div>
          ) : !userSeries.length ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.noResults')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userSeries}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="new_users" stroke="#3b82f6" fill="url(#userGrad)" strokeWidth={2} name={t('analytics.newUsers', 'New Users')} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
