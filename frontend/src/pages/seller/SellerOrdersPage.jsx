import { useCallback, useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { RefreshCw, ShoppingBag, X, ChevronRight, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUSES = {
  0:  { label: 'Garaşylýar',       color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  1:  { label: 'Tassyklanan',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  2:  { label: 'Taýýarlanylýar',   color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' },
  3:  { label: 'Ugradyldy',        color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' },
  4:  { label: 'Gowşuryldy',       color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' },
  5:  { label: 'Ýapyldy',          color: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400' },
  10: { label: 'Ýatyryldy',        color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  11: { label: 'Yzyna gaýtaryldy', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' },
}

const NEXT_STATUS = { 0: 1, 1: 2, 2: 3 }
const NEXT_LABEL  = { 0: 'Tassykla', 1: 'Taýýarlamaga başla', 2: 'Ugrat' }

const PAGE = 20

const TABS = [
  { value: '',    label: 'Ählisi' },
  { value: '0',   label: 'Garaşylýar' },
  { value: '1',   label: 'Tassyklanan' },
  { value: '2',   label: 'Taýýarlanylýar' },
  { value: '3',   label: 'Ugradyldy' },
  { value: '4',   label: 'Gowşuryldy' },
  { value: '5',   label: 'Ýapyldy' },
  { value: '10',  label: 'Ýatyryldy' },
]

function StatusBadge({ status }) {
  const s = STATUSES[status]
  if (!s) return null
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', s.color)}>
      {s.label}
    </span>
  )
}

function OrderDetail({ orderId, onClose, onStatusChange }) {
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
      toast.success('Status üýtgedildi')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
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
      toast.success('Ugratma goşuldy')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setAddingShip(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-[#111114] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold dark:text-white">Sargyt #{orderId}</h2>
            {order && <StatusBadge status={order.status} />}
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
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Tapylmady</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Customer */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Müşderi</h3>
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
                  Bellik: {order.note}
                </div>
              )}
            </section>

            {/* Items */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Harytlar ({order.items?.length ?? 0})
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
                <span className="text-sm text-slate-500">Jemi</span>
                <span className="font-bold dark:text-white">
                  {parseFloat(order.total_price).toFixed(2)} {order.currency}
                </span>
              </div>
            </section>

            {/* Existing shipments */}
            {order.shipments?.length > 0 && (
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Ugratmalar</h3>
                <div className="space-y-2">
                  {order.shipments.map((s) => (
                    <div key={s.id} className="flex items-start gap-2.5 text-xs px-3 py-2.5 rounded-lg border dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                      <Truck className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium dark:text-white">{s.carrier || 'Daşaýjy görkezilmedi'}</div>
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
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Ugratma goş</h3>
                <div className="space-y-2">
                  <Input
                    placeholder="Daşaýjy (mysal: THEX)"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="Yzarlaýyş belgisi"
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
                    {addingShip ? 'Goşulýar...' : 'Ugratma goş'}
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
              {advancing ? 'Ýüklenýär...' : NEXT_LABEL[order.status]}
              <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SellerOrdersPage() {
  const [orders, setOrders]   = useState([])
  const [count, setCount]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('')
  const [page, setPage]       = useState(0)
  const [detail, setDetail]   = useState(null)

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
          Sargytlar <span className="text-slate-400 font-normal text-base">({count})</span>
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
          <p className="text-sm">Sargyt tapylmady</p>
        </div>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden bg-white dark:bg-[#111114]">
          {/* Header */}
          <div className="grid grid-cols-[4.5rem_1fr_auto_auto_auto] gap-x-4 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
            <div>№</div>
            <div>Müşderi</div>
            <div className="text-right">Jemi</div>
            <div>Sene</div>
            <div>Ýagdaý</div>
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
                  <StatusBadge status={order.status} />
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
        />
      )}
    </div>
  )
}
