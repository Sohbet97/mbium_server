import { useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { RefreshCw, ShoppingBag, X, ChevronRight, Truck, Search, SlidersHorizontal, Loader2, Pencil, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const STATUS_COLORS = {
  0:  'bg-amber-100  text-amber-700  dark:bg-amber-950/40  dark:text-amber-400',
  1:  'bg-blue-100   text-blue-700   dark:bg-blue-950/40   dark:text-blue-400',
  2:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  3:  'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  4:  'bg-green-100  text-green-700  dark:bg-green-950/40  dark:text-green-400',
  5:  'bg-slate-100  text-slate-600  dark:bg-white/10      dark:text-slate-400',
  10: 'bg-red-100    text-red-700    dark:bg-red-950/40    dark:text-red-400',
  11: 'bg-rose-100   text-rose-700   dark:bg-rose-950/40   dark:text-rose-400',
}

// Allowed status transitions the seller can make from each current status
const SELLER_TRANSITIONS = {
  0: [1, 10],  // pending   → confirm | cancel
  1: [2, 10],  // confirmed → processing | cancel
  2: [3],      // processing → ship
}

const PAGE = 20

function StatusBadge({ status, label }) {
  const cls = STATUS_COLORS[status]
  if (!cls) return null
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', cls)}>
      {label}
    </span>
  )
}

// ── Item row with inline quantity edit / delete ───────────────────────────────
function ItemRow({ item, orderId, canEdit, onRefresh }) {
  const { t } = useTranslation()
  const [editing, setEditing]       = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [qty, setQty]               = useState(item.quantity)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)

  async function save() {
    const n = Math.max(1, Math.round(qty))
    setSaving(true)
    try {
      await SellerApi.orders.updateItem(orderId, item.id, { quantity: n })
      toast.success(t('seller.itemUpdated'))
      setEditing(false)
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      await SellerApi.orders.deleteItem(orderId, item.id)
      toast.success(t('seller.itemDeleted'))
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (editing) {
    return (
      <div className="px-3 py-2.5 rounded-lg border dark:border-white/[0.08] space-y-2 bg-white dark:bg-white/[0.03]">
        <p className="text-sm font-medium dark:text-white">{item.product_name}</p>
        {item.variant?.name && <p className="text-xs text-slate-400">{item.variant.name}</p>}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            className="w-16 h-7 text-sm text-center rounded-md border border-slate-200 dark:border-white/[0.08] bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-400">
            × {parseFloat(item.unit_price).toFixed(2)} ={' '}
            <span className="font-semibold dark:text-white">
              {(qty * parseFloat(item.unit_price)).toFixed(2)}
            </span>
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="h-7 text-xs flex-1" disabled={saving || qty < 1} onClick={save}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : t('common.save')}
          </Button>
          <Button
            size="sm" variant="ghost" className="h-7 text-xs"
            onClick={() => { setQty(item.quantity); setEditing(false) }}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm dark:text-white leading-tight">{item.product_name}</p>
        {item.variant?.name && <p className="text-xs text-slate-400 mt-0.5">{item.variant.name}</p>}
        <p className="text-xs text-slate-400 mt-0.5">
          {item.quantity} × {parseFloat(item.unit_price).toFixed(2)}
        </p>
      </div>
      <p className="shrink-0 font-semibold text-sm dark:text-white whitespace-nowrap self-center">
        {parseFloat(item.total_price).toFixed(2)}
      </p>
      {canEdit && (
        confirming ? (
          <div className="flex items-center gap-2 shrink-0 self-center">
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">{t('seller.deleteConfirm')}</span>
            <button type="button" disabled={deleting} onClick={remove}
              className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold">{t('common.yes')}</button>
            <button type="button" onClick={() => setConfirming(false)}
              className="text-xs text-slate-400 hover:underline">{t('common.no')}</button>
          </div>
        ) : (
          <div className="flex gap-0.5 shrink-0 self-center">
            <button type="button" onClick={() => setEditing(true)}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setConfirming(true)}
              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      )}
    </div>
  )
}

// ── Shipment row with inline edit / delete ────────────────────────────────────
function ShipmentRow({ shipment, orderId, onRefresh }) {
  const { t } = useTranslation()
  const [editing, setEditing]       = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [carrier, setCarrier]       = useState(shipment.carrier ?? '')
  const [tracking, setTracking]     = useState(shipment.tracking_number ?? '')
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)

  async function save() {
    setSaving(true)
    try {
      await SellerApi.orders.updateShipment(orderId, shipment.id, {
        carrier:         carrier.trim()  || null,
        tracking_number: tracking.trim() || null,
      })
      toast.success(t('seller.shipmentUpdated'))
      setEditing(false)
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      await SellerApi.orders.deleteShipment(orderId, shipment.id)
      toast.success(t('seller.shipmentDeleted'))
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (editing) {
    return (
      <div className="px-3 py-2.5 rounded-lg border dark:border-white/[0.08] space-y-2 bg-white dark:bg-white/[0.03]">
        <Input
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          placeholder={t('seller.carrier')}
          className="h-7 text-xs"
        />
        <Input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder={t('seller.trackingNo')}
          className="h-7 text-xs font-mono"
        />
        <div className="flex gap-2">
          <Button size="sm" className="h-7 text-xs flex-1" disabled={saving} onClick={save}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : t('common.save')}
          </Button>
          <Button
            size="sm" variant="ghost" className="h-7 text-xs"
            onClick={() => { setCarrier(shipment.carrier ?? ''); setTracking(shipment.tracking_number ?? ''); setEditing(false) }}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2.5 text-xs px-3 py-2.5 rounded-lg border dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
      <Truck className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium dark:text-white">{shipment.carrier || t('seller.noCarrier')}</p>
        {shipment.tracking_number && (
          <p className="text-slate-400 font-mono mt-0.5 truncate">{shipment.tracking_number}</p>
        )}
        <p className="text-slate-400 mt-0.5">{new Date(shipment.createdAt).toLocaleDateString('ru-RU')}</p>
      </div>
      {confirming ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-red-600 dark:text-red-400 font-medium">{t('seller.deleteConfirm')}</span>
          <button
            type="button"
            disabled={deleting}
            onClick={remove}
            className="text-red-600 dark:text-red-400 hover:underline font-semibold"
          >
            {t('common.yes')}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-slate-400 hover:underline"
          >
            {t('common.no')}
          </button>
        </div>
      ) : (
        <div className="flex gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Order detail drawer ───────────────────────────────────────────────────────
function OrderDetail({ orderId, onClose, onStatusChange }) {
  const { t } = useTranslation()
  const [order, setOrder]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState('overview')
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [statusNote, setStatusNote]     = useState('')
  const [updating, setUpdating]         = useState(false)
  const [addOpen, setAddOpen]           = useState(false)
  const [carrier, setCarrier]           = useState('')
  const [tracking, setTracking]         = useState('')
  const [addingShip, setAddingShip]     = useState(false)

  const STATUS_LABELS = {
    0: t('seller.orderPending'),   1: t('seller.orderConfirmed'),
    2: t('seller.orderProcessing'),3: t('seller.orderShipped'),
    4: t('seller.orderDelivered'), 5: t('seller.orderClosed'),
    10: t('seller.orderCancelled'),11: t('seller.orderReturned'),
  }
  const ACTION_LABELS = {
    1: t('seller.actionConfirm'), 2: t('seller.actionProcess'),
    3: t('seller.actionShip'),   10: t('seller.actionCancel'),
  }

  function load() {
    return SellerApi.orders.getOne(orderId).then(({ data }) => setOrder(data.model))
  }

  useEffect(() => {
    setLoading(true)
    setSelectedStatus(null)
    setStatusNote('')
    setActiveTab('overview')
    load().finally(() => setLoading(false))
  }, [orderId])

  async function updateStatus() {
    if (selectedStatus === null) return
    setUpdating(true)
    try {
      const { data } = await SellerApi.orders.updateStatus(order.id, {
        status: selectedStatus,
        ...(statusNote.trim() ? { note: statusNote.trim() } : {}),
      })
      setOrder(data.model)
      onStatusChange(data.model)
      setSelectedStatus(null)
      setStatusNote('')
      toast.success(t('seller.statusUpdated'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setUpdating(false)
    }
  }

  async function addShipment() {
    if (!carrier.trim() && !tracking.trim()) return
    setAddingShip(true)
    try {
      await SellerApi.orders.addShipment(order.id, {
        carrier:         carrier.trim()  || undefined,
        tracking_number: tracking.trim() || undefined,
      })
      await load()
      setCarrier(''); setTracking(''); setAddOpen(false)
      toast.success(t('seller.shipmentAdded'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setAddingShip(false)
    }
  }

  const transitions = SELLER_TRANSITIONS[order?.status] ?? []
  const shipCount   = order?.shipments?.length ?? 0

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-[#111114] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold dark:text-white">{t('nav.orders')} #{orderId}</h2>
            {order && <StatusBadge status={order.status} label={STATUS_LABELS[order.status] ?? order.status} />}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
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
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="shrink-0 mx-4 mt-3 w-auto self-start">
                <TabsTrigger value="overview">{t('seller.tabOverview')}</TabsTrigger>
                <TabsTrigger value="shipments">
                  {t('seller.tabShipments')}{shipCount > 0 && ` (${shipCount})`}
                </TabsTrigger>
                <TabsTrigger value="history">{t('seller.tabHistory')}</TabsTrigger>
              </TabsList>

              {/* ── Overview tab ─────────────────────────────────────────────── */}
              <TabsContent value="overview" className="flex-1 overflow-y-auto px-5 py-4 space-y-5 mt-0">

                {/* Customer */}
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    {t('seller.customer')}
                  </p>
                  <p className="text-sm font-medium dark:text-white">
                    {order.customer?.name} {order.customer?.surname}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{order.customer?.phone_number}</p>
                  {order.address && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {[order.address.street, order.address.city, order.address.region].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {!order.address && order.delivery_address && (
                    <p className="text-xs text-slate-400 mt-0.5">{order.delivery_address}</p>
                  )}
                  {order.note && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400">
                      {t('seller.orderNote')}: {order.note}
                    </div>
                  )}
                </section>

                {/* Items */}
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    {t('seller.items')} ({order.items?.length ?? 0})
                  </p>
                  <div className="space-y-2">
                    {order.items?.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        orderId={order.id}
                        canEdit={[0, 1].includes(order.status)}
                        onRefresh={load}
                      />
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t dark:border-white/[0.06] flex justify-between">
                    <span className="text-sm text-slate-500">{t('seller.total')}</span>
                    <span className="font-bold dark:text-white">
                      {parseFloat(order.total_price).toFixed(2)} {order.currency}
                    </span>
                  </div>
                </section>
              </TabsContent>

              {/* ── Shipments tab ─────────────────────────────────────────────── */}
              <TabsContent value="shipments" className="flex-1 overflow-y-auto px-5 py-4 space-y-3 mt-0">
                {order.shipments?.length === 0 && (
                  <p className="text-sm text-slate-400 py-4 text-center">{t('seller.noShipments')}</p>
                )}
                {order.shipments?.map((s) => (
                  <ShipmentRow
                    key={s.id}
                    shipment={s}
                    orderId={order.id}
                    onRefresh={load}
                  />
                ))}

                {/* Add shipment — available when status is processing or shipped */}
                {[2, 3].includes(order.status) && (
                  <div className="pt-1">
                    {!addOpen ? (
                      <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('seller.addShipment')}
                      </button>
                    ) : (
                      <div className="space-y-2 px-3 py-3 rounded-lg border dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02]">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {t('seller.addShipment')}
                        </p>
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
                        <div className="flex gap-2">
                          <Button
                            size="sm" className="h-8 text-xs flex-1"
                            disabled={addingShip || (!carrier.trim() && !tracking.trim())}
                            onClick={addShipment}
                          >
                            {addingShip ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('seller.addShipment')}
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="h-8 text-xs"
                            onClick={() => { setAddOpen(false); setCarrier(''); setTracking('') }}
                          >
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ── History tab ──────────────────────────────────────────────── */}
              <TabsContent value="history" className="flex-1 overflow-y-auto px-5 py-4 mt-0">
                {order.status_history?.length === 0 && (
                  <p className="text-sm text-slate-400 py-4 text-center">{t('common.noResults')}</p>
                )}
                <div className="relative pl-5 space-y-3">
                  <div className="absolute left-[7px] top-1.5 bottom-0 w-px bg-slate-100 dark:bg-white/[0.06]" />
                  {[...order.status_history].reverse().map((h, i, arr) => (
                    <div key={h.id} className="relative flex items-start gap-2.5">
                      <div className={cn(
                        'absolute left-[-13px] top-[5px] w-3 h-3 rounded-full border-2 shrink-0',
                        i === arr.length - 1
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300 dark:border-white/20 bg-white dark:bg-[#111114]'
                      )} />
                      <div>
                        <p className="text-xs font-medium dark:text-white">
                          {STATUS_LABELS[h.status] ?? h.status}
                        </p>
                        {h.note && <p className="text-xs text-slate-400 mt-0.5 italic">"{h.note}"</p>}
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(h.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Status change footer */}
            {transitions.length > 0 && (
              <div className="shrink-0 border-t dark:border-white/[0.06] px-5 py-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t('seller.changeStatus')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {transitions.map((s) => {
                    const isCancel   = s === 10
                    const isSelected = selectedStatus === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedStatus(isSelected ? null : s)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                          isCancel
                            ? isSelected
                              ? 'bg-red-600 text-white border-red-600'
                              : 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
                            : isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                        )}
                      >
                        {ACTION_LABELS[s]}
                        {!isCancel && <ChevronRight className="h-3 w-3" />}
                      </button>
                    )
                  })}
                </div>

                {selectedStatus === 10 && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-400">
                    <span>⚠</span>
                    <span>{t('seller.cancelWarning')}</span>
                  </div>
                )}

                {selectedStatus !== null && (
                  <>
                    <textarea
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-transparent dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder={t('seller.statusNote')}
                      rows={2}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                    />
                    <Button
                      className={cn('w-full', selectedStatus === 10 && 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700')}
                      disabled={updating}
                      onClick={updateStatus}
                    >
                      {updating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {ACTION_LABELS[selectedStatus]}
                      {selectedStatus !== 10 && <ChevronRight className="h-4 w-4 ml-1.5" />}
                    </Button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerOrdersPage() {
  const { t } = useTranslation()
  const [orders, setOrders]       = useState([])
  const [count, setCount]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [detail, setDetail]       = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [refreshKey, setRefreshKey]   = useState(0)

  // All filter/pagination state in one object so we get exactly one load per change
  const [params, setParams] = useState({ status: '', search: '', dateFrom: '', dateTo: '', page: 0 })
  // Raw search input value — debounced into params.search
  const [rawSearch, setRawSearch] = useState('')

  const STATUS_LABELS = {
    0: t('seller.orderPending'),   1: t('seller.orderConfirmed'),
    2: t('seller.orderProcessing'),3: t('seller.orderShipped'),
    4: t('seller.orderDelivered'), 5: t('seller.orderClosed'),
    10: t('seller.orderCancelled'),11: t('seller.orderReturned'),
  }

  const TABS = [
    { value: '',   label: t('seller.allOrders') },
    { value: '0',  label: t('seller.orderPending') },
    { value: '1',  label: t('seller.orderConfirmed') },
    { value: '2',  label: t('seller.orderProcessing') },
    { value: '3',  label: t('seller.orderShipped') },
    { value: '4',  label: t('seller.orderDelivered') },
    { value: '5',  label: t('seller.orderClosed') },
    { value: '10', label: t('seller.orderCancelled') },
  ]

  // Debounce search input → params.search
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams((p) => ({ ...p, search: rawSearch, page: 0 }))
    }, 350)
    return () => clearTimeout(timer)
  }, [rawSearch])

  // Load whenever params or refreshKey change
  useEffect(() => {
    setLoading(true)
    const query = {
      limit: PAGE,
      skip:  params.page * PAGE,
      ...(params.status   ? { status:    params.status }   : {}),
      ...(params.search.trim() ? { search: params.search.trim() } : {}),
      ...(params.dateFrom ? { from_date: params.dateFrom } : {}),
      ...(params.dateTo   ? { to_date:   params.dateTo }   : {}),
    }
    SellerApi.orders.getAll(query)
      .then(({ data }) => { setOrders(data.data ?? []); setCount(data.count ?? 0) })
      .finally(() => setLoading(false))
  }, [params, refreshKey])

  function setTab(status) { setParams((p) => ({ ...p, status, page: 0 })) }
  function setPage(page)  { setParams((p) => ({ ...p, page })) }
  function setDateFrom(v) { setParams((p) => ({ ...p, dateFrom: v, page: 0 })) }
  function setDateTo(v)   { setParams((p) => ({ ...p, dateTo: v,   page: 0 })) }

  function clearFilters() {
    setRawSearch('')
    setParams({ status: '', search: '', dateFrom: '', dateTo: '', page: 0 })
    setFiltersOpen(false)
  }

  function handleStatusChange(updated) {
    setOrders((prev) => prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o))
  }

  const totalPages = Math.ceil(count / PAGE)
  const hasActiveFilters = params.search || params.dateFrom || params.dateTo

  return (
    <div className="space-y-4">

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-xl font-semibold dark:text-white mr-auto">
          {t('nav.orders')} <span className="text-slate-400 font-normal text-base">({count})</span>
        </h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder={t('seller.searchOrders')}
            className="h-8 pl-8 text-sm w-56"
          />
          {rawSearch && (
            <button
              onClick={() => setRawSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Date filter toggle */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            'h-8 px-2.5 flex items-center gap-1.5 text-xs rounded-md border transition-colors',
            filtersOpen || params.dateFrom || params.dateTo
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
              : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {(params.dateFrom || params.dateTo) && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
        </button>

        <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* ── Date filter panel ────────────────────────────────────────────────── */}
      {filtersOpen && (
        <div className="flex flex-wrap items-end gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02]">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">{t('seller.dateFrom')}</label>
            <Input type="date" value={params.dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-sm w-36" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">{t('seller.dateTo')}</label>
            <Input type="date" value={params.dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-sm w-36" />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={clearFilters}>
              <X className="h-3.5 w-3.5 mr-1" />
              {t('seller.clearFilters')}
            </Button>
          )}
        </div>
      )}

      {/* ── Status tabs ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTab(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0',
              params.status === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <ShoppingBag className="h-12 w-12 text-slate-200 dark:text-white/10" />
          <p className="text-sm">{t('seller.noOrdersFound')}</p>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={clearFilters}>
              {t('seller.clearFilters')}
            </Button>
          )}
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
                  <p className="text-sm font-medium dark:text-white truncate">
                    {order.customer?.name} {order.customer?.surname}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{order.customer?.phone_number}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold dark:text-white whitespace-nowrap">
                    {parseFloat(order.total_price).toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-400">{order.currency}</span>
                  </p>
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

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="text-xs">
            {params.page * PAGE + 1}–{Math.min((params.page + 1) * PAGE, count)} / {count}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={params.page === 0}
              onClick={() => setPage(params.page - 1)}>←</Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              // Show first, last, current, and neighbours — ellipsis for gaps
              const mid = params.page
              const show = i === 0 || i === totalPages - 1 || Math.abs(i - mid) <= 1
              if (!show) return null
              const prev = i > 0 && !( (i-1 === 0) || (i-1 === totalPages-1) || Math.abs((i-1) - mid) <= 1 )
              return (
                <span key={i}>
                  {prev && <span className="px-1 text-slate-300 dark:text-white/20">…</span>}
                  <Button
                    variant={i === params.page ? 'default' : 'outline'}
                    size="sm"
                    className="w-8"
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </Button>
                </span>
              )
            })}
            <Button variant="outline" size="sm" disabled={params.page >= totalPages - 1}
              onClick={() => setPage(params.page + 1)}>→</Button>
          </div>
        </div>
      )}

      {/* ── Detail drawer ────────────────────────────────────────────────────── */}
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
