import { useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Package, ShoppingCart, Wallet, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'

export default function SellerDashboardPage() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const ORDER_STATUS_LABELS = {
    0: t('seller.orderPending'), 1: t('seller.orderConfirmed'), 2: t('seller.orderProcessing'),
    3: t('seller.orderShipped'), 4: t('seller.orderDelivered'), 5: t('seller.orderClosed'), 6: t('seller.orderCancelled'),
  }

  useEffect(() => {
    SellerApi.dashboard.get()
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  const { stats, recent_orders, shop } = data ?? {}

  const cards = [
    { label: t('seller.totalProducts'), value: stats?.total_products ?? 0,   icon: Package,      color: 'text-blue-600' },
    { label: t('seller.totalOrders'),   value: stats?.total_orders ?? 0,     icon: ShoppingCart, color: 'text-indigo-600' },
    { label: t('seller.pendingOrders'), value: stats?.pending_orders ?? 0,   icon: ShoppingCart, color: 'text-amber-600' },
    { label: t('seller.revenueMonth'),  value: `${stats?.revenue_this_month?.toFixed(2) ?? '0.00'} TMT`, icon: TrendingUp, color: 'text-green-600' },
    { label: t('seller.balance'),       value: `${stats?.balance?.toFixed(2) ?? '0.00'} TMT`, icon: Wallet, color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold dark:text-white">{shop?.name}</h1>
        {shop?.seller_tier === 2 && (
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">✓ Verified PRO</span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className={`mb-1 ${color}`}><Icon className="h-5 w-5" /></div>
              <div className="text-2xl font-bold dark:text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('seller.recentOrders')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!recent_orders?.length ? (
            <p className="text-sm text-slate-500">{t('seller.noOrders')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b dark:border-white/10">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">{t('seller.colCustomer')}</th>
                    <th className="pb-2 font-medium">{t('seller.colStatus')}</th>
                    <th className="pb-2 font-medium text-right">{t('seller.colPrice')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/[0.05]">
                  {recent_orders.map((o) => (
                    <tr key={o.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-2 pr-4 font-mono text-xs">{o.id}</td>
                      <td className="py-2 pr-4">{o.customer?.name} {o.customer?.surname}</td>
                      <td className="py-2 pr-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10">
                          {ORDER_STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="py-2 text-right">{parseFloat(o.total_price).toFixed(2)} {o.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
