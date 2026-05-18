import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Users, Store, ShoppingCart, Activity,
  TrendingUp, Clock, CheckCircle, XCircle, Package,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminApi } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'

// Permission IDs (matching RolesPage PERM_GROUPS)
const PERM = {
  READ_USERS:    5,
  READ_SHOPS:    null, // no explicit permission, attempt always
  READ_ORDERS:   33,
  READ_REVIEWS:  37,
  READ_DISCOUNTS: 41,
}

function hasPerm(user, perm) {
  if (!perm) return true
  const perms = user?.role?.permissions ?? []
  return perms.includes(perm)
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, onClick }) {
  return (
    <Card
      className={cn('transition-shadow', onClick && 'cursor-pointer hover:shadow-md')}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 dark:text-[#a0a0ab]">{label}</CardTitle>
        <div className={cn('p-2 rounded-md', color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          {value === null
            ? <span className="text-slate-300 animate-pulse">—</span>
            : value}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Order status badge ────────────────────────────────────────────────────────
const ORDER_STATUSES = [
  { value: 0,  color: 'bg-yellow-100 text-yellow-800', labelKey: 'orders.statusPending' },
  { value: 1,  color: 'bg-blue-100 text-blue-800',     labelKey: 'orders.statusConfirmed' },
  { value: 2,  color: 'bg-purple-100 text-purple-800', labelKey: 'orders.statusProcessing' },
  { value: 3,  color: 'bg-indigo-100 text-indigo-800', labelKey: 'orders.statusShipped' },
  { value: 4,  color: 'bg-green-100 text-green-800',   labelKey: 'orders.statusDelivered' },
  { value: 10, color: 'bg-red-100 text-red-800',       labelKey: 'orders.statusCancelled' },
  { value: 11, color: 'bg-gray-100 text-gray-700',     labelKey: 'orders.statusRefunded' },
]

function OrderStatusBadge({ status }) {
  const { t } = useTranslation()
  const meta = ORDER_STATUSES.find((s) => s.value === status)
    ?? { color: 'bg-gray-100 text-gray-600', labelKey: 'common.status' }
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', meta.color)}>
      {t(meta.labelKey)}
    </span>
  )
}

// ── Recent Orders Table ───────────────────────────────────────────────────────
function RecentOrdersCard({ orders, loading, onViewAll }) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{t('dashboard.recentOrders')}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs text-slate-500">
          {t('common.all')} →
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <p className="text-sm text-slate-400 px-6 pb-4">{t('common.loading')}</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate-400 px-6 pb-4">{t('common.noResults')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-2">{t('orders.colOrder')}</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-2">{t('orders.colCustomer')}</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-2">{t('orders.colShop')}</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-3 py-2">{t('orders.colTotal')}</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-2">{t('orders.colStatus')}</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-2 hidden sm:table-cell">{t('orders.colDate')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const customer = o.user
                    ? `${o.user.name ?? ''} ${o.user.surname ?? ''}`.trim()
                    : '—'
                  const shopName = o.shop?.name ?? '—'
                  const date = o.created_at
                    ? new Date(o.created_at).toLocaleDateString()
                    : '—'
                  return (
                    <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-6 py-3 font-mono text-xs text-slate-400">
                        #{o.id?.slice(0, 8) ?? '—'}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{customer}</td>
                      <td className="px-3 py-3 text-slate-600 max-w-[140px] truncate">{shopName}</td>
                      <td className="px-3 py-3 text-right font-medium text-slate-800">
                        {o.total_price != null ? `${Number(o.total_price).toFixed(2)} TMT` : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-3 py-3 text-slate-400 text-xs hidden sm:table-cell">{date}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── System Status Card ────────────────────────────────────────────────────────
function SystemStatusCard() {
  const { t } = useTranslation()
  const [ping, setPing] = useState(null) // null=checking, true=ok, false=err

  useEffect(() => {
    AdminApi.config.get()
      .then(() => setPing(true))
      .catch(() => setPing(false))
  }, [])

  const items = [
    { label: t('dashboard.apiServer'), ok: ping },
    { label: t('dashboard.database'),  ok: ping },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('dashboard.systemStatus')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map(({ label, ok }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{label}</span>
            {ok === null ? (
              <span className="text-xs text-slate-400 animate-pulse">{t('common.loading')}</span>
            ) : ok ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle className="h-3.5 w-3.5" />
                {t('common.operational')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-500 font-medium">
                <XCircle className="h-3.5 w-3.5" />
                Error
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Role chip ────────────────────────────────────────────────────────────────
function RoleChip({ roleName }) {
  if (!roleName) return null
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
      {roleName}
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [counts, setCounts]           = useState({ users: null, shops: null, orders: null, reviews: null })
  const [recentOrders, setRecentOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  const canReadUsers   = hasPerm(user, PERM.READ_USERS)
  const canReadOrders  = hasPerm(user, PERM.READ_ORDERS)
  const canReadReviews = hasPerm(user, PERM.READ_REVIEWS)

  useEffect(() => {
    const calls = []

    if (canReadUsers)  calls.push(AdminApi.users.getAll({ limit: 1 }))
    else               calls.push(Promise.resolve(null))

    calls.push(AdminApi.shops.getAll({ limit: 1 }))

    if (canReadOrders) calls.push(AdminApi.orders.getAll({ limit: 1 }))
    else               calls.push(Promise.resolve(null))

    if (canReadReviews) calls.push(AdminApi.reviews.getAll({ limit: 1 }))
    else                calls.push(Promise.resolve(null))

    Promise.allSettled(calls).then(([users, shops, orders, reviews]) => {
      setCounts({
        users:   users.value?.data?.count   ?? '—',
        shops:   shops.value?.data?.count   ?? '—',
        orders:  orders.value?.data?.count  ?? '—',
        reviews: reviews.value?.data?.count ?? '—',
      })
    })
  }, [canReadUsers, canReadOrders, canReadReviews])

  useEffect(() => {
    if (!canReadOrders) { setOrdersLoading(false); return }
    let cancelled = false
    AdminApi.orders.getAll({ limit: 8 })
      .then(({ data }) => {
        if (!cancelled) setRecentOrders(data?.data ?? [])
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setOrdersLoading(false) })
    return () => { cancelled = true }
  }, [canReadOrders])

  const greeting = user
    ? `${user.name ?? ''} ${user.surname ?? ''}`.trim() || user.phone_number
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t('dashboard.overview')}
            {greeting ? ` — ${greeting}` : ''}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-slate-500 dark:text-[#a0a0ab]">{t('dashboard.subtitle')}</p>
            {user?.role?.name && <RoleChip roleName={user.role.name} />}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {canReadUsers && (
          <StatCard
            label={t('dashboard.totalUsers')}
            value={counts.users}
            icon={Users}
            color="bg-blue-500"
            onClick={() => navigate('/admin/users')}
          />
        )}
        <StatCard
          label={t('dashboard.totalShops')}
          value={counts.shops}
          icon={Store}
          color="bg-emerald-500"
          onClick={() => navigate('/admin/shops')}
        />
        {canReadOrders && (
          <StatCard
            label={t('dashboard.totalOrders')}
            value={counts.orders}
            icon={ShoppingCart}
            color="bg-orange-500"
            onClick={() => navigate('/admin/orders')}
          />
        )}
        {canReadReviews && (
          <StatCard
            label={t('reviews.title')}
            value={counts.reviews}
            icon={Activity}
            color="bg-violet-500"
            onClick={() => navigate('/admin/reviews')}
          />
        )}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {canReadOrders ? (
          <div className="lg:col-span-2">
            <RecentOrdersCard
              orders={recentOrders}
              loading={ordersLoading}
              onViewAll={() => navigate('/admin/orders')}
            />
          </div>
        ) : (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('dashboard.recentActivity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">{t('dashboard.activityPlaceholder')}</p>
              </CardContent>
            </Card>
          </div>
        )}
        <SystemStatusCard />
      </div>
    </div>
  )
}
