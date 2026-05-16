import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ShoppingCart, RefreshCw, ChevronRight, X,
  CreditCard, Clock, CheckCircle, Truck, Package,
  XCircle, RotateCcw, DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from '@/components/ui/dialog'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const ORDER_STATUSES = [
  { value: 0, labelKey: 'orders.statusPending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 1, labelKey: 'orders.statusConfirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 2, labelKey: 'orders.statusProcessing', color: 'bg-purple-100 text-purple-800' },
  { value: 3, labelKey: 'orders.statusShipped', color: 'bg-indigo-100 text-indigo-800' },
  { value: 4, labelKey: 'orders.statusDelivered', color: 'bg-green-100 text-green-800' },
  { value: 10, labelKey: 'orders.statusCancelled', color: 'bg-red-100 text-red-800' },
  { value: 11, labelKey: 'orders.statusRefunded', color: 'bg-gray-100 text-gray-700' },
]

const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER']
const PAYMENT_STATUSES = [
  { value: 0, labelKey: 'orders.paymentStatusPending', color: 'bg-yellow-100 text-yellow-700' },
  { value: 1, labelKey: 'orders.paymentStatusSuccess', color: 'bg-green-100 text-green-700' },
  { value: 2, labelKey: 'orders.paymentStatusFailed', color: 'bg-red-100 text-red-700' },
  { value: 3, labelKey: 'orders.paymentStatusRefunded', color: 'bg-gray-100 text-gray-600' },
]

function orderStatusMeta(status, t) {
  return ORDER_STATUSES.find((s) => s.value === status) ?? { color: 'bg-gray-100 text-gray-600', labelKey: 'common.status' }
}

function paymentStatusMeta(status) {
  return PAYMENT_STATUSES.find((s) => s.value === status) ?? PAYMENT_STATUSES[0]
}

function StatusBadge({ status, type = 'order' }) {
  const { t } = useTranslation()
  const meta = type === 'order' ? orderStatusMeta(status, t) : paymentStatusMeta(status)
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', meta.color)}>
      {t(meta.labelKey)}
    </span>
  )
}

/* ── Update Status Modal ── */
function UpdateStatusModal({ open, orderId, currentStatus, onClose, onSaved }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setStatus(''); setNote(''); setError('') }
  }, [open])

  async function handleSave() {
    if (status === '') return
    setError(''); setSaving(true)
    try {
      await AdminApi.orders.updateStatus(orderId, { status: Number(status), note: note || undefined })
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('orders.updateStatus')}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          <FormField label={t('orders.newStatus')}>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{t('common.status')}…</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('orders.note')}>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || status === ''}>{saving ? '…' : t('common.confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Add Payment Modal ── */
function AddPaymentModal({ open, orderId, onClose, onSaved }) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setAmount(''); setMethod('CASH'); setError('') }
  }, [open])

  async function handleSave() {
    if (!amount) return
    setError(''); setSaving(true)
    try {
      await AdminApi.orders.addPayment(orderId, { amount: Number(amount), method, status: 1 })
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error')
    } finally {
      setSaving(false)
    }
  }

  const methodLabel = { CASH: t('orders.methodCash'), CARD: t('orders.methodCard'), BANK_TRANSFER: t('orders.methodBank') }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('orders.addPayment')}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          <FormField label={t('orders.paymentAmount')}>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FormField>
          <FormField label={t('orders.paymentMethod')}>
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{methodLabel[m]}</option>
              ))}
            </Select>
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !amount}>{saving ? '…' : t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Order Detail Panel ── */
function OrderDetail({ order, onClose, onRefresh }) {
  const { t } = useTranslation()
  const [statusModal, setStatusModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)

  if (!order) return null

  const customer = order.customer
  const shop = order.shop

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b shrink-0">
        <div>
          <p className="font-semibold text-slate-800">#{order.id}</p>
          <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} type="order" />
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Customer + Shop */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-500 mb-1">{t('orders.customer')}</p>
            <p className="text-sm font-medium">{customer?.name} {customer?.surname}</p>
            <p className="text-xs text-slate-500">{customer?.phone_number}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-500 mb-1">{t('nav.shops')}</p>
            <p className="text-sm font-medium">{shop?.name}</p>
            <p className="text-xs text-slate-500">{shop?.phone}</p>
          </div>
        </div>

        {/* Delivery + Note */}
        {order.delivery_address && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('orders.deliveryAddress')}</p>
            <p className="text-sm text-slate-700">{order.delivery_address}</p>
          </div>
        )}
        {order.note && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('orders.orderNote')}</p>
            <p className="text-sm text-slate-700">{order.note}</p>
          </div>
        )}

        {/* Items */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('orders.items')}</p>
          {order.items?.length ? (
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.product_name || item.product?.name}</p>
                    {item.variant?.name && <p className="text-xs text-slate-500">{item.variant.name}</p>}
                    <p className="text-xs text-slate-400">×{item.quantity} @ {Number(item.unit_price).toFixed(2)}</p>
                  </div>
                  <p className="font-semibold">{Number(item.total_price).toFixed(2)} {order.currency}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">{t('orders.noItems')}</p>
          )}
          <div className="flex justify-end mt-2 pt-2 border-t">
            <p className="font-bold text-slate-800">{Number(order.total_price).toFixed(2)} {order.currency}</p>
          </div>
        </div>

        {/* Status History */}
        {order.status_history?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('orders.statusHistory')}</p>
            <div className="space-y-1.5">
              {order.status_history.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-xs">
                  <StatusBadge status={h.status} type="order" />
                  {h.note && <span className="text-slate-500">— {h.note}</span>}
                  <span className="ml-auto text-slate-400">{new Date(h.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payments */}
        {order.payments?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('orders.payments')}</p>
            <div className="space-y-1.5">
              {order.payments.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-xs">
                  <StatusBadge status={p.status} type="payment" />
                  <span className="font-medium">{Number(p.amount).toFixed(2)} {p.currency}</span>
                  <span className="text-slate-500">{p.method}</span>
                  <span className="ml-auto text-slate-400">{new Date(p.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t flex gap-2 shrink-0">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => setStatusModal(true)}>
          <Clock className="h-3.5 w-3.5 mr-1.5" />{t('orders.updateStatus')}
        </Button>
        <Button size="sm" className="flex-1" onClick={() => setPaymentModal(true)}>
          <DollarSign className="h-3.5 w-3.5 mr-1.5" />{t('orders.addPayment')}
        </Button>
      </div>

      <UpdateStatusModal
        open={statusModal}
        orderId={order.id}
        currentStatus={order.status}
        onClose={() => setStatusModal(false)}
        onSaved={() => { toast.success(t('toast.updated')); setStatusModal(false); onRefresh() }}
      />
      <AddPaymentModal
        open={paymentModal}
        orderId={order.id}
        onClose={() => setPaymentModal(false)}
        onSaved={() => { toast.success(t('toast.created')); setPaymentModal(false); onRefresh() }}
      />
    </div>
  )
}

/* ── Main Page ── */
export default function OrdersPage() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [shops, setShops] = useState([])

  const [filterStatus, setFilterStatus] = useState('')
  const [filterShop, setFilterShop] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }
      if (filterStatus !== '') params.status = filterStatus
      if (filterShop) params.shop_id = filterShop
      const { data } = await AdminApi.orders.getAll(params)
      setOrders(data.data ?? [])
      setCount(data.count ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, filterShop])

  const fetchShops = useCallback(async () => {
    try {
      const { data } = await AdminApi.shops.getAll({ limit: 200 })
      setShops(data.data ?? [])
    } catch {}
  }, [])

  useEffect(() => { fetchShops() }, [fetchShops])
  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function openDetail(order) {
    setSelectedOrder(null)
    setDetailLoading(true)
    try {
      const { data } = await AdminApi.orders.getOne(order.id)
      setSelectedOrder(data.model)
    } finally {
      setDetailLoading(false)
    }
  }

  async function refreshDetail() {
    if (!selectedOrder) return
    try {
      const { data } = await AdminApi.orders.getOne(selectedOrder.id)
      setSelectedOrder(data.model)
      fetchOrders()
    } catch {}
  }

  const totalPages = Math.ceil(count / PAGE_SIZE)

  return (
    <div className="flex h-full overflow-hidden gap-4">
      {/* Left: list */}
      <div className={cn('flex flex-col min-w-0 transition-all duration-300', selectedOrder ? 'flex-[0_0_55%]' : 'flex-1')}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }} className="w-44">
            <option value="">{t('orders.filterStatus')}</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
            ))}
          </Select>
          <Select value={filterShop} onChange={(e) => { setFilterShop(e.target.value); setPage(1) }} className="w-44">
            <option value="">{t('orders.filterShop')}</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Button variant="outline" size="sm" onClick={fetchOrders} className="ml-auto">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Count */}
        <p className="text-sm text-slate-500 mb-3">
          {t('orders.totalCount', { count })}
        </p>

        {/* Table */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0 h-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('orders.colOrder')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('orders.colCustomer')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('orders.colShop')}</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">{t('orders.colTotal')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('orders.colStatus')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('orders.colDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t('common.loading')}</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t('common.noResults')}</td></tr>
                ) : orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openDetail(order)}
                    className={cn(
                      'cursor-pointer hover:bg-slate-50 transition-colors',
                      selectedOrder?.id === order.id && 'bg-blue-50'
                    )}
                  >
                    <td className="px-4 py-3 font-medium">#{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customer?.name} {order.customer?.surname}</p>
                      <p className="text-xs text-slate-400">{order.customer?.phone_number}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.shop?.name}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {Number(order.total_price).toFixed(2)} {order.currency}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} type="order" /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              {t('common.previous')}
            </Button>
            <span className="text-sm text-slate-500">
              {t('common.page', { current: page, total: totalPages })}
            </span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>

      {/* Right: detail panel */}
      {(selectedOrder || detailLoading) && (
        <Card className="flex-[0_0_45%] min-w-0 overflow-hidden">
          <CardContent className="p-0 h-full">
            {detailLoading ? (
              <div className="flex items-center justify-center h-full text-slate-400">{t('common.loading')}</div>
            ) : (
              <OrderDetail
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onRefresh={refreshDetail}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
