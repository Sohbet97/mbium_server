import { useCallback, useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { RefreshCw, ShoppingBag, X, ChevronRight, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const STATUS_COLORS = {
  0:  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  1:  'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  2:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  3:  'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  4:  'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  5:  'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400',
  10: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  11: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
}

const NEXT_STATUS = { 0: 1, 1: 2, 2: 3 }

const PAGE = 20

function StatusBadge({ status, label }) {
  const color = STATUS_COLORS[status]
  if (!color) return null
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', color)}>
      {label}
    </span>
  )
}

function OrderDetail({ orderId, onClose, onStatusChange, t, statusLabels, nextLabel }) {
  const [order, setOrder]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [advancing, setAdvancing]   = useState(false)
  const [carrier, setCarrier]       = useState('')
  const [tracking, setTracking]     = useState('')
  const [addingShip, setAddingShip] = useState(false)

  useEffect(() => {
    setLoading(true)
    SellerApi.orders.getOne(orderId)
      .then(({ data }) => setOrder(data.model))
      .finally(() => setLoading(false))
  }, [orderId])

  async function advance() {
    const next = NEXT_STATUS[order.status]
    if (next == null) return
    setAdvancing(true)
    try {
      const { data } = await SellerApi.orders.updateStatus(order.id, { status: next })
      setOrder(data.model)
      onStatusChange(data.model)
      toast.success(t('seller.statusUpdated'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setAdvancing(false) }
  }

  async function addShipment() {
    if (!carrier.trim() && !tracking.trim()) return
    setAddingShip(true)
    try {
      await SellerApi.orders.addShipment(order.id, {
        carrier:          carrier.trim() || undefined,
        tracking_number:  tracking.trim() || undefined,
      })
      const { data } = await SellerApi.orders.getOne(order.id)
      setOrder(data.model)
      setCarrier(''); setTracking('')
      toast.success(t('seller.shipmentAdded'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setAddingShip(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-[#111114] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold dark:text-white">{t('nav.orders')} #{orderId}</h2>
            {order && <StatusBadge status={order.status} label={statusLabels[order.status] ?? order.status} />}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : !order ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">{t('seller.notFound')}</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Customer */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{t('seller.customer')}</h3>
              <div className="text-sm font-medium dark:text-white">
                {order.customer?.name} {order.customer?.surname}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{order.customer?.phone_number}</div>
              {order.address && (
                <div className="text-xs text-slate-400 mt-0.5">
                  {[order.address.street, order.address.city, order.address.region].filter(Boolean).join(', ')}
                </div>
              )}
              {!order.address && order.delivery_address && (
                <div className="text-xs text-slate-400 mt-0.5">{order.delivery_address}</div>
              )}
              {order.note && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400">
                  {t('seller.orderNote')}: {order.note}
                </div>
              )}
            </section>

            {/* Items */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {t('seller.items')} ({order.items?.length ?? 0})
              </h3>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm dark:text-white leading-tight">{item.product_name}</div>
                      {item.variant?.name && (
                        <div className="text-xs text-slate-400 mt-0.5">{item.variant.name}</div>
                      )}
                      <div className="text-xs text-slate-400 mt-0.5">
                        {item.quantity} × {parseFloat(item.unit_price).toFixed(2)}
                      </div>
                    </div>
                    <div className="shrink-0 font-semibold text-sm dark:text-white whitespace-nowrap">
                      {parseFloat(item.total_price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t dark:border-white/[0.06] flex justify-between">
                <span className="text-sm text-slate-500">{t('seller.total')}</span>
                <span className="font-bold dark:text-white">
                  {parseFloat(order.total_price).toFixed(2)} {order.currency}
                </span>
              </div>
            </section>

            {/* Existing shipments */}
            {order.shipments?.length > 0 && (
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{t('seller.shipments')}</h3>
                <div className="space-y-2">
                  {order.shipments.map((s) => (
                    <div key={s.id} className="flex items-start gap-2.5 text-xs px-3 py-2.5 rounded-lg border dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                      <Truck className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium dark:text-white">{s.carrier || t('seller.noCarrier')}</div>
                        {s.tracking_number && (
                          <div className="text-slate-400 font-mono mt-0.5">{s.tracking_number}</div>
                        )}
                        <div className="text-slate-400 mt-0.5">
                          {s.status} · {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Add shipment (processing or shipped) */}
            {[2, 3].includes(order.status) && (
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{t('seller.addShipment')}</h3>
                <div className="space-y-2">
                  <Input
                    placeholder={t('seller.carrier')}
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder={t('seller.trackingNo')}
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    className="h-8 text-sm font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={addingShip || (!carrier.trim() && !tracking.trim())}
                    onClick={addShipment}
                  >
                    {addingShip ? t('seller.adding') : t('seller.addShipment')}
                  </Button>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Status advance footer */}
        {order && NEXT_STATUS[order.status] != null && (
          <div className="shrink-0 border-t dark:border-white/[0.06] px-5 py-4">
            <Button className="w-full" disabled={advancing} onClick={advance}>
              {advancing ? t('common.loading') : nextLabel[order.status]}
              <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SellerOrdersPage() {
  const { t } = useTranslation()
  const [orders, setOrders]   = useState([])
  const [count, setCount]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('')
  const [page, setPage]       = useState(0)
  const [detail, setDetail]   = useState(null)

  const STATUS_LABELS = {
    0: t('seller.orderPending'), 1: t('seller.orderConfirmed'), 2: t('seller.orderProcessing'),
    3: t('seller.orderShipped'), 4: t('seller.orderDelivered'), 5: t('seller.orderClosed'),
    10: t('seller.orderCancelled'), 11: t('seller.orderReturned'),
  }

  const NEXT_LABEL = {
    0: t('seller.actionConfirm'),
    1: t('seller.actionProcess'),
    2: t('seller.actionShip'),
  }

  const TABS = [
    { value: '',    label: t('seller.allOrders') },
    { value: '0',   label: t('seller.orderPending') },
    { value: '1',   label: t('seller.orderConfirmed') },
    { value: '2',   label: t('seller.orderProcessing') },
    { value: '3',   label: t('seller.orderShipped') },
    { value: '4',   label: t('seller.orderDelivered') },
    { value: '5',   label: t('seller.orderClosed') },
    { value: '10',  label: t('seller.orderCancelled') },
  ]

  const load = useCallback((p = 0) => {
    setLoading(true)
    const params = {
      limit: PAGE,
      skip: p * PAGE,
      ...(tab !== '' ? { status: tab } : {}),
    }
    SellerApi.orders.getAll(params)
      .then(({ data }) => { setOrders(data.data ?? []); setCount(data.count ?? 0) })
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => { setPage(0); load(0) }, [tab])
  useEffect(() => { load(page) }, [page])

  function handleStatusChange(updated) {
    setOrders((prev) => prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o))
  }

  const totalPages = Math.ceil(count / PAGE)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold dark:text-white">
          {t('nav.orders')} <span className="text-slate-400 font-normal text-base">({count})</span>
        </h1>
        <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={() => load(page)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              tab === t.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <ShoppingBag className="h-12 w-12 text-slate-200 dark:text-white/10" />
          <p className="text-sm">{t('seller.noOrdersFound')}</p>
        </div>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden bg-white dark:bg-[#111114]">
          {/* Header */}
          <div className="grid grid-cols-[4.5rem_1fr_auto_auto_auto] gap-x-4 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
            <div>№</div>
            <div>{t('seller.customer')}</div>
            <div className="text-right">{t('seller.total')}</div>
            <div>{t('seller.date')}</div>
            <div>{t('common.status')}</div>
          </div>

          {/* Rows */}
          <div className="divide-y dark:divide-white/[0.04]">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setDetail(order.id)}
                className="grid grid-cols-[4.5rem_1fr_auto_auto_auto] gap-x-4 items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
              >
                <div className="font-mono text-xs text-slate-400">#{order.id}</div>
                <div className="min-w-0">
                  <div className="text-sm font-medium dark:text-white truncate">
                    {order.customer?.name} {order.customer?.surname}
                  </div>
                  <div className="text-xs text-slate-400 truncate">{order.customer?.phone_number}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold dark:text-white whitespace-nowrap">
                    {parseFloat(order.total_price).toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-400">{order.currency}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                  {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                </div>
                <div className="shrink-0">
                  <StatusBadge status={order.status} label={STATUS_LABELS[order.status] ?? order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{page * PAGE + 1}–{Math.min((page + 1) * PAGE, count)} / {count}</span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>←</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>→</Button>
          </div>
        </div>
      )}

      {/* Order detail drawer */}
      {detail && (
        <OrderDetail
          orderId={detail}
          onClose={() => setDetail(null)}
          onStatusChange={handleStatusChange}
          t={t}
          statusLabels={STATUS_LABELS}
          nextLabel={NEXT_LABEL}
        />
      )}
    </div>
  )
}
