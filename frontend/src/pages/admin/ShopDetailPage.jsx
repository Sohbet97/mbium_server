import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Store, ShieldCheck, ShieldX, Search,
  Pencil, Save, X, RefreshCw, Package, ShoppingCart,
  Clock, DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from '@/components/ui/dialog'
import { MultiLangInput } from '@/components/common/MultiLangInput'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'
import { cn } from '@/lib/utils'

// ─── Order helpers (shared with OrdersPage) ────────────────────────────────────

const ORDER_STATUSES = [
  { value: 0,  labelKey: 'orders.statusPending',    color: 'bg-yellow-100 text-yellow-800' },
  { value: 1,  labelKey: 'orders.statusConfirmed',  color: 'bg-blue-100 text-blue-800' },
  { value: 2,  labelKey: 'orders.statusProcessing', color: 'bg-purple-100 text-purple-800' },
  { value: 3,  labelKey: 'orders.statusShipped',    color: 'bg-indigo-100 text-indigo-800' },
  { value: 4,  labelKey: 'orders.statusDelivered',  color: 'bg-green-100 text-green-800' },
  { value: 10, labelKey: 'orders.statusCancelled',  color: 'bg-red-100 text-red-800' },
  { value: 11, labelKey: 'orders.statusRefunded',   color: 'bg-gray-100 text-gray-700' },
]

const PAYMENT_STATUSES = [
  { value: 0, labelKey: 'orders.paymentStatusPending',  color: 'bg-yellow-100 text-yellow-700' },
  { value: 1, labelKey: 'orders.paymentStatusSuccess',  color: 'bg-green-100 text-green-700' },
  { value: 2, labelKey: 'orders.paymentStatusFailed',   color: 'bg-red-100 text-red-700' },
  { value: 3, labelKey: 'orders.paymentStatusRefunded', color: 'bg-gray-100 text-gray-600' },
]

function OrderStatusBadge({ status, type = 'order' }) {
  const { t } = useTranslation()
  const list = type === 'order' ? ORDER_STATUSES : PAYMENT_STATUSES
  const meta = list.find((s) => s.value === status) ?? list[0]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', meta.color)}>
      {t(meta.labelKey)}
    </span>
  )
}

// ─── Update Status Modal ───────────────────────────────────────────────────────

function UpdateStatusModal({ open, orderId, onClose, onSaved }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState('')
  const [note,   setNote]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

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
    } finally { setSaving(false) }
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
          <Button onClick={handleSave} disabled={saving || status === ''}>
            {saving ? '…' : t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add Payment Modal ─────────────────────────────────────────────────────────

function AddPaymentModal({ open, orderId, onClose, onSaved }) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

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
    } finally { setSaving(false) }
  }

  const methodLabel = {
    CASH: t('orders.methodCash'), CARD: t('orders.methodCard'), BANK_TRANSFER: t('orders.methodBank'),
  }

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
              {['CASH', 'CARD', 'BANK_TRANSFER'].map((m) => (
                <option key={m} value={m}>{methodLabel[m]}</option>
              ))}
            </Select>
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !amount}>
            {saving ? '…' : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Order Detail Panel ────────────────────────────────────────────────────────

function OrderDetailPanel({ order, onClose, onRefresh }) {
  const { t } = useTranslation()
  const [statusModal,  setStatusModal]  = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)

  if (!order) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between p-4 border-b shrink-0">
        <div>
          <p className="font-semibold text-slate-800">#{order.id}</p>
          <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} type="order" />
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Customer */}
        {order.customer && (
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-500 mb-1">{t('orders.customer')}</p>
            <p className="text-sm font-medium">{order.customer.name} {order.customer.surname}</p>
            <p className="text-xs text-slate-500">{order.customer.phone_number}</p>
          </div>
        )}

        {order.delivery_address && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              {t('orders.deliveryAddress')}
            </p>
            <p className="text-sm text-slate-700">{order.delivery_address}</p>
          </div>
        )}
        {order.note && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              {t('orders.orderNote')}
            </p>
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
              <div className="flex justify-end pt-2 border-t">
                <p className="font-bold text-slate-800">{Number(order.total_price).toFixed(2)} {order.currency}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">{t('orders.noItems')}</p>
          )}
        </div>

        {/* Status history */}
        {order.status_history?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {t('orders.statusHistory')}
            </p>
            <div className="space-y-1.5">
              {order.status_history.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-xs flex-wrap">
                  <OrderStatusBadge status={h.status} type="order" />
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
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {t('orders.payments')}
            </p>
            <div className="space-y-1.5">
              {order.payments.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-xs flex-wrap">
                  <OrderStatusBadge status={p.status} type="payment" />
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
        onClose={() => setStatusModal(false)}
        onSaved={() => { setStatusModal(false); onRefresh() }}
      />
      <AddPaymentModal
        open={paymentModal}
        orderId={order.id}
        onClose={() => setPaymentModal(false)}
        onSaved={() => { setPaymentModal(false); onRefresh() }}
      />
    </div>
  )
}

// ─── Verification ──────────────────────────────────────────────────────────────

const VER = { NONE: 0, PENDING: 1, APPROVED: 2, REJECTED: 3 }

function VerificationBadge({ status }) {
  const { t } = useTranslation()
  if (status === VER.APPROVED)  return <Badge variant="success">{t('shops.verStatusApproved')}</Badge>
  if (status === VER.PENDING)   return <Badge variant="warning">{t('shops.verStatusPending')}</Badge>
  if (status === VER.REJECTED)  return <Badge variant="destructive">{t('shops.verStatusRejected')}</Badge>
  return <Badge variant="secondary">{t('shops.verStatusNone')}</Badge>
}

function VerificationSection({ shop, onRefresh }) {
  const { t } = useTranslation()
  const [rejectNote,     setRejectNote]     = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [saving,         setSaving]         = useState(false)

  const status = shop.verification_status ?? VER.NONE

  async function handleVerify() {
    setSaving(true)
    try {
      await AdminApi.shops.verify(shop.id)
      onRefresh()
    } catch (e) {
      window.alert(e.response?.data?.message ?? 'Error')
    } finally { setSaving(false) }
  }

  async function handleReject() {
    setSaving(true)
    try {
      await AdminApi.shops.reject(shop.id, { note: rejectNote })
      setShowRejectForm(false)
      setRejectNote('')
      onRefresh()
    } catch (e) {
      window.alert(e.response?.data?.message ?? 'Error')
    } finally { setSaving(false) }
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await AdminApi.shops.submitForReview(shop.id)
      onRefresh()
    } catch (e) {
      window.alert(e.response?.data?.message ?? 'Error')
    } finally { setSaving(false) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t('shops.verification')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{t('shops.verificationStatus')}</span>
          <VerificationBadge status={status} />
        </div>

        {shop.verified_at && status === VER.APPROVED && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{t('shops.verifiedAt')}</span>
            <span>{new Date(shop.verified_at).toLocaleDateString()}</span>
          </div>
        )}

        {shop.verification_note && status === VER.REJECTED && (
          <div className="text-sm">
            <p className="text-slate-500 mb-0.5">{t('shops.verificationNote')}</p>
            <p className="text-slate-700 bg-red-50 rounded p-2">{shop.verification_note}</p>
          </div>
        )}

        {status === VER.PENDING && !showRejectForm && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleVerify} disabled={saving} className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> {t('shops.verifyAction')}
            </Button>
            <Button
              size="sm" variant="outline" className="gap-1 text-red-600 border-red-200"
              onClick={() => setShowRejectForm(true)} disabled={saving}
            >
              <ShieldX className="h-3.5 w-3.5" /> {t('shops.rejectAction')}
            </Button>
          </div>
        )}

        {(status === VER.NONE || status === VER.REJECTED) && !showRejectForm && (
          <Button size="sm" variant="outline" onClick={handleSubmit} disabled={saving}>
            {t('shops.submitForReview')}
          </Button>
        )}

        {showRejectForm && (
          <div className="space-y-2 border-t pt-3">
            <FormField label={t('shops.rejectNote')}>
              <Textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder={t('shops.rejectNotePlaceholder')}
              />
            </FormField>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => { setShowRejectForm(false); setRejectNote('') }}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" variant="destructive" onClick={handleReject} disabled={saving}>
                {saving ? '…' : t('shops.rejectAction')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Info Tab ──────────────────────────────────────────────────────────────────

function InfoTab({ shop, shopTypes, onRefresh }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  function startEdit() {
    setError('')
    setForm({
      name:        shop.name        ?? '',
      name_ru:     shop.name_ru     ?? '',
      name_eng:    shop.name_eng    ?? '',
      type_id:     shop.type_id     ?? '',
      phone:       shop.phone       ?? '',
      email:       shop.email       ?? '',
      address:     shop.address     ?? '',
      logo:        shop.logo        ?? '',
      description: shop.description ?? '',
      is_active:   shop.is_active   ?? true,
      order:       shop.order       ?? '',
    })
    setEditing(true)
  }

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      await AdminApi.shops.update(shop.id, {
        name:        form.name.trim(),
        name_ru:     form.name_ru.trim()  || null,
        name_eng:    form.name_eng.trim() || null,
        type_id:     Number(form.type_id),
        phone:       form.phone       || null,
        email:       form.email       || null,
        address:     form.address     || null,
        logo:        form.logo        || null,
        description: form.description || null,
        is_active:   form.is_active,
        order:       form.order !== '' ? Number(form.order) : null,
      })
      setEditing(false)
      onRefresh()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="gap-2" onClick={startEdit}>
            <Pencil className="h-4 w-4" /> {t('common.edit')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('common.name')}</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-1">
              <p className="text-sm">🇹🇲 {shop.name}</p>
              {shop.name_ru  && <p className="text-sm">🇷🇺 {shop.name_ru}</p>}
              {shop.name_eng && <p className="text-sm">🇬🇧 {shop.name_eng}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('shops.type')}</span>
                <span>{shop.type?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('shops.phone')}</span>
                <span>{shop.phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('shops.email')}</span>
                <span>{shop.email || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('shops.address')}</span>
                <span className="text-right max-w-[200px] truncate">{shop.address || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('shops.order')}</span>
                <span>{shop.order ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('shops.isActive')}</span>
                <Badge variant={shop.is_active ? 'success' : 'secondary'}>
                  {shop.is_active ? t('common.active') : t('common.inactive')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {shop.description && (
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('common.description')}</CardTitle></CardHeader>
            <CardContent className="pt-0 text-sm text-slate-600 whitespace-pre-wrap">
              {shop.description}
            </CardContent>
          </Card>
        )}

        {shop.logo && (
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('shops.logo')}</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <img
                src={shop.logo} alt="logo"
                className="h-20 w-20 rounded object-cover border"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <p className="text-xs text-slate-400 mt-1 break-all">{shop.logo}</p>
            </CardContent>
          </Card>
        )}

        <VerificationSection shop={shop} onRefresh={onRefresh} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

      <MultiLangInput baseField="name" label={t('shops.name')} required values={form} onChange={set} />

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('shops.type')} required>
          <Select value={form.type_id} onChange={(e) => set('type_id', e.target.value)}>
            <option value="">{t('shops.noType')}</option>
            {shopTypes.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
          </Select>
        </FormField>
        <FormField label={t('shops.order')}>
          <Input
            type="number" min={0} max={1000}
            value={form.order}
            onChange={(e) => set('order', e.target.value)}
            placeholder="0"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('shops.phone')}>
          <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+993 61…" />
        </FormField>
        <FormField label={t('shops.email')}>
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </FormField>
      </div>

      <FormField label={t('shops.address')}>
        <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
      </FormField>

      <FormField label={t('shops.logo')}>
        <Input value={form.logo} onChange={(e) => set('logo', e.target.value)} placeholder="https://…" />
      </FormField>

      <FormField label={t('common.description')}>
        <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} />
      </FormField>

      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <Label>{t('shops.isActive')}</Label>
        <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
          <X className="h-4 w-4 mr-1" />{t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.type_id}>
          <Save className="h-4 w-4 mr-1" />{saving ? '…' : t('common.save')}
        </Button>
      </div>
    </div>
  )
}

// ─── Products Tab ──────────────────────────────────────────────────────────────

function ProductsTab({ shopId }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [products,     setProducts]     = useState([])
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [page,         setPage]         = useState(1)
  const [refreshTick,  setRefreshTick]  = useState(0)
  const limit = 20

  useEffect(() => {
    let cancelled = false
    const params = { shop_id: shopId, limit, skip: (page - 1) * limit }
    if (search) params.text = search

    AdminApi.products.getAll(params)
      .then(({ data }) => {
        if (cancelled) return
        setProducts(data.data  ?? [])
        setTotal(data.count    ?? 0)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setProducts([])
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [shopId, page, search, refreshTick])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('products.searchPlaceholder')}
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); setLoading(true) }}
          />
        </div>
        <p className="text-sm text-slate-500 ml-auto">{t('products.totalCount', { count: total })}</p>
        <Button
          variant="ghost" size="icon" className="h-9 w-9"
          onClick={() => { setLoading(true); setRefreshTick((k) => k + 1) }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">{t('products.colProduct')}</th>
                  <th className="px-4 py-3">{t('products.colCategory')}</th>
                  <th className="px-4 py-3">{t('products.colPrice')}</th>
                  <th className="px-4 py-3">{t('products.colStock')}</th>
                  <th className="px-4 py-3">{t('products.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {loading && products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <Package className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{t('common.noResults')}</p>
                    </td>
                  </tr>
                ) : products.map((p) => {
                  const primaryImg = p.images?.find((i) => i.is_primary) ?? p.images?.[0]
                  return (
                    <tr
                      key={p.id}
                      className="border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/catalog/products/${p.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {primaryImg?.url
                            ? <img src={primaryImg.url} alt="" className="h-8 w-8 rounded object-cover border" />
                            : (
                              <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center">
                                <Package className="h-4 w-4 text-slate-300" />
                              </div>
                            )
                          }
                          <div>
                            <p className="text-sm font-medium text-slate-900">{p.name}</p>
                            {p.sku && <p className="text-xs text-slate-400 font-mono">{p.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {p.price} {p.currency}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{p.stock}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.is_active ? 'success' : 'secondary'}>
                          {p.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-slate-500">
              <span>{t('common.page', { current: page, total: totalPages })}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={page <= 1}
                  onClick={() => { setPage((p) => p - 1); setLoading(true) }}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={page >= totalPages}
                  onClick={() => { setPage((p) => p + 1); setLoading(true) }}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ shop }) {
  const { t } = useTranslation()
  const owner = shop.owner

  if (!owner) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Store className="h-10 w-10 mb-2 text-slate-200" />
        <p className="text-sm">{t('common.noResults')}</p>
      </div>
    )
  }

  const statusVariant = owner.status === 1 ? 'success' : owner.status === 90 ? 'destructive' : 'secondary'
  const statusLabel   = owner.status === 1
    ? t('common.active')
    : owner.status === 90
      ? t('users.statusBlocked')
      : t('users.statusNotActivated')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('shops.colOwner')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
              {owner.name?.[0]?.toUpperCase()}{owner.surname?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {owner.name} {owner.surname}
              </p>
              <p className="text-xs text-slate-400">{owner.phone_number}</p>
              {owner.email && <p className="text-xs text-slate-400">{owner.email}</p>}
            </div>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ shopId }) {
  const { t } = useTranslation()

  const [orders,        setOrders]        = useState([])
  const [total,         setTotal]         = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [filterStatus,  setFilterStatus]  = useState('')
  const [page,          setPage]          = useState(1)
  const [refreshTick,   setRefreshTick]   = useState(0)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const limit = 20

  useEffect(() => {
    let cancelled = false
    const params = { shop_id: shopId, limit, skip: (page - 1) * limit }
    if (filterStatus !== '') params.status = filterStatus

    AdminApi.orders.getAll(params)
      .then(({ data }) => {
        if (cancelled) return
        setOrders(data.data  ?? [])
        setTotal(data.count  ?? 0)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setOrders([])
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [shopId, page, filterStatus, refreshTick])

  async function openDetail(order) {
    setSelectedOrder(null)
    setDetailLoading(true)
    try {
      const { data } = await AdminApi.orders.getOne(order.id)
      setSelectedOrder(data.model)
    } catch {
      window.alert('Failed to load order detail')
    } finally {
      setDetailLoading(false)
    }
  }

  async function refreshDetail() {
    if (!selectedOrder) return
    try {
      const { data } = await AdminApi.orders.getOne(selectedOrder.id)
      setSelectedOrder(data.model)
      setRefreshTick((k) => k + 1)
    } catch {}
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex gap-4 overflow-hidden">
      {/* List */}
      <div className={cn('flex flex-col min-w-0 flex-1 transition-all duration-300', selectedOrder ? 'flex-[0_0_55%]' : '')}>
        <div className="flex items-center gap-2 mb-4">
          <Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); setLoading(true) }}
            className="w-44"
          >
            <option value="">{t('orders.filterStatus')}</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
            ))}
          </Select>
          <p className="text-sm text-slate-500 ml-auto">{t('orders.totalCount', { count: total })}</p>
          <Button
            variant="ghost" size="icon" className="h-9 w-9"
            onClick={() => { setLoading(true); setRefreshTick((k) => k + 1) }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0 h-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('orders.colOrder')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('orders.colCustomer')}</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">{t('orders.colTotal')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('orders.colStatus')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('orders.colDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400">{t('common.loading')}</td></tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <ShoppingCart className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{t('common.noResults')}</p>
                    </td>
                  </tr>
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
                    <td className="px-4 py-3 text-right font-semibold">
                      {Number(order.total_price).toFixed(2)} {order.currency}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} type="order" />
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button
              variant="outline" size="sm"
              disabled={page === 1}
              onClick={() => { setPage((p) => p - 1); setLoading(true) }}
            >
              {t('common.previous')}
            </Button>
            <span className="text-sm text-slate-500">
              {t('common.page', { current: page, total: totalPages })}
            </span>
            <Button
              variant="outline" size="sm"
              disabled={page === totalPages}
              onClick={() => { setPage((p) => p + 1); setLoading(true) }}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {(selectedOrder || detailLoading) && (
        <Card className="flex-[0_0_45%] min-w-0 overflow-hidden" style={{ height: '600px' }}>
          <CardContent className="p-0 h-full">
            {detailLoading ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                {t('common.loading')}
              </div>
            ) : (
              <OrderDetailPanel
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ShopDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { t }    = useTranslation()

  const [shop,        setShop]        = useState(null)
  const [shopTypes,   setShopTypes]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [refreshTick, setRefreshTick] = useState(0)

  function refresh() { setLoading(true); setRefreshTick((k) => k + 1) }

  useEffect(() => {
    let cancelled = false

    AdminApi.shops.getOne(id)
      .then(({ data }) => {
        if (cancelled) return
        setShop(data.model ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) navigate('/admin/shops')
      })

    return () => { cancelled = true }
  }, [id, navigate, refreshTick])

  useEffect(() => {
    AdminApi.shopTypes.getAll({ limit: 200 })
      .then(({ data }) => setShopTypes(data.data ?? []))
      .catch(() => {})
  }, [])

  if (loading || !shop) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/shops')} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {shop.logo
            ? (
              <img
                src={shop.logo} alt=""
                className="h-14 w-14 rounded-lg object-cover border flex-shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Store className="h-6 w-6 text-slate-300" />
              </div>
            )
          }
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 truncate">{shop.name}</h2>
            <p className="text-sm text-slate-400">
              {shop.type?.name ?? '—'}
              {shop.owner && ` · ${shop.owner.name} ${shop.owner.surname}`}
            </p>
          </div>
          <div className="ml-auto flex gap-2 flex-shrink-0">
            <Badge variant={shop.is_active ? 'success' : 'secondary'}>
              {shop.is_active ? t('common.active') : t('common.inactive')}
            </Badge>
            {shop.is_verified && (
              <Badge variant="outline">{t('common.verified')}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">{t('shops.tabInfo')}</TabsTrigger>
          <TabsTrigger value="products">{t('shops.tabProducts')}</TabsTrigger>
          <TabsTrigger value="orders">{t('shops.tabOrders')}</TabsTrigger>
          <TabsTrigger value="users">{t('shops.tabUsers')}</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <InfoTab shop={shop} shopTypes={shopTypes} onRefresh={refresh} />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTab shopId={shop.id} />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab shopId={shop.id} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab shop={shop} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
