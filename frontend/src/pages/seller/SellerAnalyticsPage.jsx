import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, ShoppingCart, Package, Wallet, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SellerApi } from '@/lib/api'

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

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className={`mb-1 ${color}`}><Icon className="h-5 w-5" /></div>
        <div className="text-2xl font-bold dark:text-white">
          {value === null ? <span className="text-slate-300 animate-pulse">—</span> : value}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </CardContent>
    </Card>
  )
}

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
          size="sm" className="text-xs"
          onClick={() => onChangeDates(p.from, today())}
        >
          {p.label}
        </Button>
      ))}
      <input type="date" value={dateFrom}
        onChange={(e) => onChangeDates(e.target.value, dateTo)}
        className="text-xs border rounded-md px-2 py-1.5 dark:bg-[#1c1c1f] dark:border-white/10 dark:text-white"
      />
      <span className="text-xs text-slate-400">–</span>
      <input type="date" value={dateTo}
        onChange={(e) => onChangeDates(dateFrom, e.target.value)}
        className="text-xs border rounded-md px-2 py-1.5 dark:bg-[#1c1c1f] dark:border-white/10 dark:text-white"
      />
      <select value={period} onChange={(e) => onChangePeriod(e.target.value)}
        className="text-xs border rounded-md px-2 py-1.5 dark:bg-[#1c1c1f] dark:border-white/10 dark:text-white"
      >
        <option value="day">{t('analytics.periodDay', 'Day')}</option>
        <option value="week">{t('analytics.periodWeek', 'Week')}</option>
        <option value="month">{t('analytics.periodMonth', 'Month')}</option>
      </select>
    </div>
  )
}

function formatPeriod(val) {
  if (!val) return ''
  return new Date(val).toLocaleDateString()
}

export default function SellerAnalyticsPage() {
  const { t } = useTranslation()

  const [dateFrom, setDateFrom] = useState(daysAgo(30))
  const [dateTo,   setDateTo]   = useState(today())
  const [period,   setPeriod]   = useState('day')

  const [overview,  setOverview]  = useState(null)
  const [products,  setProducts]  = useState(null)
  const [payouts,   setPayouts]   = useState(null)
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const p = { date_from: dateFrom, date_to: dateTo, period }
    Promise.allSettled([
      SellerApi.analytics.getOverview(p),
      SellerApi.analytics.getProducts({ date_from: dateFrom, date_to: dateTo, limit: 10 }),
      SellerApi.analytics.getPayouts({ date_from: dateFrom, date_to: dateTo, period }),
    ]).then(([ov, pr, py]) => {
      if (ov.status === 'fulfilled') setOverview(ov.value.data)
      if (pr.status === 'fulfilled') setProducts(pr.value.data?.data ?? [])
      if (py.status === 'fulfilled') setPayouts(py.value.data)
    }).finally(() => setLoading(false))
  }, [dateFrom, dateTo, period]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const summary = overview?.summary ?? {}
  const revenueSeries = (overview?.revenue_series ?? []).map((r) => ({
    ...r, period: formatPeriod(r.period),
  }))
  const orderPie = (overview?.orders_by_status ?? []).map((r) => ({
    name: ORDER_STATUS_LABELS[r.status] ?? `Status ${r.status}`,
    value: r.count,
    status: r.status,
  }))
  const payoutSeries = (payouts?.series ?? []).map((r) => ({
    ...r, period: formatPeriod(r.period),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-semibold dark:text-white">
          {t('analytics.title', 'Analytics')}
        </h2>
        <DateFilter
          dateFrom={dateFrom} dateTo={dateTo} period={period}
          onChangeDates={(f, t2) => { setDateFrom(f); setDateTo(t2) }}
          onChangePeriod={setPeriod}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('analytics.totalRevenue', 'Total Revenue')}  value={loading ? null : `${parseFloat(summary.total_revenue ?? 0).toFixed(2)} TMT`}  icon={TrendingUp}   color="text-green-600" />
        <StatCard label={t('analytics.totalOrders',  'Total Orders')}   value={loading ? null : summary.total_orders ?? 0}   icon={ShoppingCart} color="text-indigo-600" />
        <StatCard label={t('analytics.avgOrder',     'Avg Order Value')} value={loading ? null : `${parseFloat(summary.avg_order ?? 0).toFixed(2)} TMT`} icon={TrendingUp} color="text-blue-600" />
        <StatCard label={t('analytics.balance',      'Balance')}         value={loading ? null : `${parseFloat(payouts?.current_balance ?? 0).toFixed(2)} ${payouts?.currency ?? 'TMT'}`} icon={Wallet} color="text-purple-600" />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <SectionHeader
            title={t('analytics.revenueOverTime', 'Revenue Over Time')}
            onExport={() => downloadCSV(overview?.revenue_series ?? [], 'revenue.csv')}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.loading')}</div>
          ) : !revenueSeries.length ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.noResults')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name={t('analytics.revenue', 'Revenue')} />
                <Line yAxisId="right" type="monotone" dataKey="orders"  stroke="#6366f1" strokeWidth={2} dot={false} name={t('analytics.orders', 'Orders')} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Products + Order status row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <Card>
          <CardHeader>
            <SectionHeader
              title={t('analytics.topProducts', 'Top Products by Revenue')}
              onExport={() => downloadCSV(products ?? [], 'top-products.csv')}
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.loading')}</div>
            ) : !products?.length ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.noResults')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={products} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v} TMT`} />
                  <Bar dataKey="revenue" fill="#6366f1" name={t('analytics.revenue', 'Revenue')} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders by status */}
        <Card>
          <CardHeader>
            <SectionHeader
              title={t('analytics.ordersByStatus', 'Orders by Status')}
              onExport={() => downloadCSV(overview?.orders_by_status ?? [], 'orders-by-status.csv')}
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

      {/* Payout history */}
      <Card>
        <CardHeader>
          <SectionHeader
            title={t('analytics.payoutHistory', 'Payout History')}
            onExport={() => downloadCSV(payouts?.series ?? [], 'payouts.csv')}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.loading')}</div>
          ) : !payoutSeries.length ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">{t('common.noResults')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={payoutSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v} TMT`} />
                <Bar dataKey="amount" fill="#8b5cf6" name={t('analytics.payoutAmount', 'Amount')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {!loading && (
            <div className="mt-4 flex gap-6 text-sm text-slate-600 dark:text-slate-300">
              <span>{t('analytics.totalPaid', 'Total Paid')}: <strong>{parseFloat(payouts?.total_paid ?? 0).toFixed(2)} {payouts?.currency ?? 'TMT'}</strong></span>
              <span>{t('analytics.balance', 'Balance')}: <strong>{parseFloat(payouts?.current_balance ?? 0).toFixed(2)} {payouts?.currency ?? 'TMT'}</strong></span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
