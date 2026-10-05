import { useTranslation } from 'react-i18next'
import { Coins, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fmtInt, fmtMoney, statusMeta } from './constants'

const Skeleton = ({ rows = 5 }) => (
  <div className="space-y-3 px-6 pb-4">
    {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-5 animate-pulse rounded bg-slate-100 dark:bg-white/5" />)}
  </div>
)

export function RecentOrders({ orders, loading, onViewAll }) {
  const { t } = useTranslation()
  const th = 'px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-[#a0a0ab]'
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{t('dashboard.recentOrders')}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs text-slate-500">{t('dashboard.viewAll')} →</Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <Skeleton /> : orders.length === 0 ? (
          <p className="px-6 pb-4 text-sm text-slate-400">{t('common.noResults')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                  <th className={cn(th, 'pl-6')}>{t('orders.colOrder')}</th>
                  <th className={th}>{t('orders.colCustomer')}</th>
                  <th className={cn(th, 'hidden md:table-cell')}>{t('orders.colShop')}</th>
                  <th className={cn(th, 'text-right')}>{t('orders.colTotal')}</th>
                  <th className={th}>{t('orders.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const customer = o.customer ? `${o.customer.name ?? ''} ${o.customer.surname ?? ''}`.trim() : '—'
                  const meta = statusMeta(o.status)
                  return (
                    <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-white/[0.04] dark:hover:bg-white/[0.03]">
                      <td className="py-2.5 pl-6 pr-3 font-mono text-xs text-slate-400">
                        #{o.id}
                        <div className="text-[11px] text-slate-400/80">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200 max-w-[140px] truncate">{customer || '—'}</td>
                      <td className="hidden md:table-cell px-3 py-2.5 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">{o.shop?.name ?? '—'}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-800 dark:text-white tabular-nums whitespace-nowrap">
                        {o.total_price != null ? `${fmtMoney(o.total_price)} ${o.currency ?? 'TMT'}` : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', meta.badge)}>{t(meta.labelKey)}</span>
                      </td>
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

export function TopShops({ shops = [], loading, onViewAll }) {
  const { t } = useTranslation()
  const max = Math.max(1, ...shops.map((s) => s.revenue || s.orders))
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4 text-amber-500" />{t('dashboard.topShops')}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs text-slate-500">{t('dashboard.viewAll')} →</Button>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton rows={4} /> : shops.length === 0 ? (
          <p className="text-sm text-slate-400">{t('dashboard.noData')}</p>
        ) : (
          <ol className="space-y-3">
            {shops.map((s, i) => (
              <li key={s.id}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-4 text-xs font-semibold text-slate-400">{i + 1}</span>
                    <span className="truncate text-slate-700 dark:text-slate-200">{s.name}</span>
                  </span>
                  <span className="shrink-0 tabular-nums font-medium text-slate-900 dark:text-white">
                    {fmtMoney(s.revenue)} <span className="text-xs font-normal text-slate-400">· {s.orders} {t('dashboard.orders').toLowerCase()}</span>
                  </span>
                </div>
                <div className="mt-1.5 ml-6 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${Math.max(4, ((s.revenue || s.orders) / max) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

export function CoinCard({ coins, loading }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Coins className="h-4 w-4 text-amber-500" />{t('dashboard.coinEconomy')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <Skeleton rows={3} /> : (
          <>
            <div>
              <p className="text-xs text-slate-500 dark:text-[#a0a0ab]">{t('dashboard.coinsInCirculation')}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{fmtInt(coins?.in_circulation)}</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-slate-500 dark:text-[#a0a0ab]">{t('dashboard.coinsSpent')}</p>
              {coins?.spent_by_source?.length ? (
                <ul className="space-y-1.5">
                  {coins.spent_by_source.map((r) => (
                    <li key={r.source} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{t(`dashboard.src${r.source}`, { defaultValue: r.source })}</span>
                      <span className="font-medium tabular-nums text-slate-900 dark:text-white">{fmtInt(r.spent)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-400">{t('dashboard.noData')}</p>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
