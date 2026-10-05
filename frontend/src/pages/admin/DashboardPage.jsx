import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, ShoppingCart, Store, TrendingUp, Users } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { usePendingCounts } from '@/store/pendingCounts'
import { cn } from '@/lib/utils'
import KpiCard from './dashboard/KpiCard'
import AttentionGrid from './dashboard/AttentionGrid'
import { RevenueChart, StatusDonut } from './dashboard/Charts'
import { CoinCard, RecentOrders, TopShops } from './dashboard/Lists'
import { fmtInt, fmtMoney } from './dashboard/constants'

const RANGES = [7, 30]

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const pending = usePendingCounts()

  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiOk, setApiOk] = useState(null)

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    return AdminApi.dashboard.get({ days })
      .then(({ data: res }) => { setData(res.data); setApiOk(true) })
      .catch(() => setApiOk(false))
      .finally(() => setLoading(false))
  }, [days])

  useEffect(() => { load() }, [load])

  const refresh = () => { load(true); pending?.refresh?.() }

  const name = user ? `${user.name ?? ''} ${user.surname ?? ''}`.trim() || user.phone_number : ''
  const dateLabel = new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })
  const totals = data?.totals ?? {}
  const show = (key) => loading || data?.[key] !== undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t('dashboard.greeting')}{name ? `, ${name}` : ''}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-[#a0a0ab]">
            <span className="capitalize">{dateLabel}</span>
            {user?.role?.name && (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                {user.role.name}
              </span>
            )}
            {apiOk !== null && (
              <span className={cn('inline-flex items-center gap-1.5 text-xs', apiOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                <span className={cn('h-1.5 w-1.5 rounded-full', apiOk ? 'bg-emerald-500' : 'bg-red-500')} />
                {apiOk ? t('dashboard.apiOnline') : t('dashboard.apiOffline')}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
            {RANGES.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  days === d ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                )}
              >
                {t('dashboard.rangeDays', { count: d })}
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            title={t('common.refresh')}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400 dark:hover:text-white"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Needs attention */}
      <AttentionGrid counts={pending?.counts} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {show('revenue') && (
          <KpiCard
            label={t('dashboard.kRevenue')} icon={TrendingUp} hex="#6366f1" loading={loading}
            value={`${fmtMoney(data?.revenue?.current)} TMT`} pct={data?.revenue?.change_pct}
            series={data?.revenue_series} hint={t('dashboard.ofTotal', { total: fmtMoney(totals.revenue) })}
            onClick={() => navigate('/admin/analytics')}
          />
        )}
        {show('orders') && (
          <KpiCard
            label={t('dashboard.kOrders')} icon={ShoppingCart} hex="#f59e0b" loading={loading}
            value={fmtInt(data?.orders?.current)} pct={data?.orders?.change_pct}
            series={data?.orders_series} hint={t('dashboard.ofTotal', { total: fmtInt(totals.orders) })}
            onClick={() => navigate('/admin/orders')}
          />
        )}
        {show('new_users') && (
          <KpiCard
            label={t('dashboard.kNewUsers')} icon={Users} hex="#3b82f6" loading={loading}
            value={fmtInt(data?.new_users?.current)} pct={data?.new_users?.change_pct}
            series={data?.users_series} hint={t('dashboard.ofTotal', { total: fmtInt(totals.users) })}
            onClick={() => navigate('/admin/users')}
          />
        )}
        {(loading || totals.shops !== undefined) && (
          <KpiCard
            label={t('dashboard.kActiveShops')} icon={Store} hex="#10b981" loading={loading}
            value={fmtInt(totals.active_shops)} hint={t('dashboard.ofTotal', { total: fmtInt(totals.shops) })}
            onClick={() => navigate('/admin/shops')}
          />
        )}
      </div>

      {/* Charts */}
      {show('revenue_series') && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart revenue={data?.revenue_series} orders={data?.orders_series} loading={loading} />
          </div>
          <StatusDonut data={data?.orders_by_status} loading={loading} />
        </div>
      )}

      {/* Lists */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {show('recent_orders') && (
          <div className="lg:col-span-2">
            <RecentOrders orders={data?.recent_orders ?? []} loading={loading} onViewAll={() => navigate('/admin/orders')} />
          </div>
        )}
        <div className="space-y-4">
          {show('top_shops') && <TopShops shops={data?.top_shops} loading={loading} onViewAll={() => navigate('/admin/shops')} />}
          {show('coins') && <CoinCard coins={data?.coins} loading={loading} />}
        </div>
      </div>
    </div>
  )
}
