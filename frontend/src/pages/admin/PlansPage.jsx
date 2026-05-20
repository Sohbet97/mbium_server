import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, RefreshCw, Check, X, Pencil, Trash2, CreditCard, Layers, Ban, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogBody,
} from '@/components/ui/dialog'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

const LIVE_STREAM_OPTS = [
  { value: 0, labelKey: 'plans.liveNone' },
  { value: 1, labelKey: 'plans.liveViewOnly' },
  { value: 2, labelKey: 'plans.liveLimited' },
  { value: 3, labelKey: 'plans.liveUnlimited' },
]

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru', { day: '2-digit', month: 'short', year: 'numeric' })
}
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

const SUB_STATUS = {
  1: { label: 'Işjeň',         cls: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' },
  2: { label: 'Ýatyryldy',     cls: 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400' },
  3: { label: 'Möhleti geçdi', cls: 'bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400' },
}

// ── Tab button ────────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
        active
          ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
      )}
    >
      {children}
    </button>
  )
}

// ── Plan form helpers ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', display_name_tm: '', display_name_ru: '', display_name_en: '',
  price_monthly: 0, commission_rate: 0.15,
  product_limit: '', hotspot_per_month: 0, hotspot_duration_hrs: 0,
  ai_credits_monthly: 5, auction_per_week: '',
  live_stream_mode: 0,
  ads_dashboard: false, coin_earn: false, coin_earn_priority: false,
  verified_badge: false, virtual_tour: false, oem_odm_support: false,
  revenue_share_user: 0, push_notif_monthly: 0,
  is_active: true, sort_order: 0,
}

function buildForm(plan) {
  if (!plan) return EMPTY_FORM
  return {
    name: plan.name ?? '',
    display_name_tm: plan.display_name_tm ?? '',
    display_name_ru: plan.display_name_ru ?? '',
    display_name_en: plan.display_name_en ?? '',
    price_monthly: plan.price_monthly ?? 0,
    commission_rate: plan.commission_rate ?? 0.15,
    product_limit: plan.product_limit ?? '',
    hotspot_per_month: plan.hotspot_per_month ?? 0,
    hotspot_duration_hrs: plan.hotspot_duration_hrs ?? 0,
    ai_credits_monthly: plan.ai_credits_monthly ?? 5,
    auction_per_week: plan.auction_per_week ?? '',
    live_stream_mode: plan.live_stream_mode ?? 0,
    ads_dashboard: plan.ads_dashboard ?? false,
    coin_earn: plan.coin_earn ?? false,
    coin_earn_priority: plan.coin_earn_priority ?? false,
    verified_badge: plan.verified_badge ?? false,
    virtual_tour: plan.virtual_tour ?? false,
    oem_odm_support: plan.oem_odm_support ?? false,
    revenue_share_user: plan.revenue_share_user ?? 0,
    push_notif_monthly: plan.push_notif_monthly ?? 0,
    is_active: plan.is_active ?? true,
    sort_order: plan.sort_order ?? 0,
  }
}

// ── Plan Modal ────────────────────────────────────────────────────────────────

function PlanModal({ open, plan, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => buildForm(plan))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, val) { setForm((f) => ({ ...f, [field]: val })) }

  const isValid = Boolean(form.name.trim())

  async function handleSave() {
    if (!isValid) return
    setError(''); setSaving(true)
    try {
      const payload = {
        ...form,
        price_monthly: Number(form.price_monthly),
        commission_rate: Number(form.commission_rate),
        product_limit: form.product_limit !== '' ? Number(form.product_limit) : null,
        hotspot_per_month: Number(form.hotspot_per_month),
        hotspot_duration_hrs: Number(form.hotspot_duration_hrs),
        ai_credits_monthly: Number(form.ai_credits_monthly),
        auction_per_week: form.auction_per_week !== '' ? Number(form.auction_per_week) : null,
        live_stream_mode: Number(form.live_stream_mode),
        revenue_share_user: Number(form.revenue_share_user),
        push_notif_monthly: Number(form.push_notif_monthly),
        sort_order: Number(form.sort_order),
      }
      if (plan) {
        await AdminApi.plans.update(plan.id, payload)
      } else {
        await AdminApi.plans.create(payload)
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? t('plans.editPlan') : t('plans.createPlan')}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('plans.name')} required>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="basic" />
            </FormField>
            <FormField label={t('plans.sortOrder')}>
              <Input type="number" min={0} value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label={t('plans.nameTm')}>
              <Input value={form.display_name_tm} onChange={(e) => set('display_name_tm', e.target.value)} />
            </FormField>
            <FormField label={t('plans.nameRu')}>
              <Input value={form.display_name_ru} onChange={(e) => set('display_name_ru', e.target.value)} />
            </FormField>
            <FormField label={t('plans.nameEn')}>
              <Input value={form.display_name_en} onChange={(e) => set('display_name_en', e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('plans.price')}>
              <Input type="number" min={0} step={0.01} value={form.price_monthly} onChange={(e) => set('price_monthly', e.target.value)} />
            </FormField>
            <FormField label={t('plans.commissionRate')}>
              <Input type="number" min={0} max={1} step={0.01} value={form.commission_rate} onChange={(e) => set('commission_rate', e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label={t('plans.productLimit')}>
              <Input type="number" min={1} value={form.product_limit} onChange={(e) => set('product_limit', e.target.value)} placeholder={t('plans.unlimited')} />
            </FormField>
            <FormField label={t('plans.hotspotPerMonth')}>
              <Input type="number" min={0} value={form.hotspot_per_month} onChange={(e) => set('hotspot_per_month', e.target.value)} />
            </FormField>
            <FormField label={t('plans.hotspotDuration')}>
              <Input type="number" min={0} value={form.hotspot_duration_hrs} onChange={(e) => set('hotspot_duration_hrs', e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label={t('plans.aiCredits')}>
              <Input type="number" min={0} value={form.ai_credits_monthly} onChange={(e) => set('ai_credits_monthly', e.target.value)} />
            </FormField>
            <FormField label={t('plans.auctionPerWeek')}>
              <Input type="number" min={0} value={form.auction_per_week} onChange={(e) => set('auction_per_week', e.target.value)} placeholder={t('plans.unlimited')} />
            </FormField>
            <FormField label={t('plans.liveStream')}>
              <Select value={form.live_stream_mode} onChange={(e) => set('live_stream_mode', Number(e.target.value))}>
                {LIVE_STREAM_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('plans.revenueShareUser')}>
              <Input type="number" min={0} max={100} value={form.revenue_share_user} onChange={(e) => set('revenue_share_user', e.target.value)} />
            </FormField>
            <FormField label={t('plans.pushNotifMonthly')}>
              <Input type="number" min={0} value={form.push_notif_monthly} onChange={(e) => set('push_notif_monthly', e.target.value)} />
            </FormField>
          </div>

          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">{t('plans.features')}</p>
            {[
              ['ads_dashboard',      'plans.adsDashboard'],
              ['coin_earn',          'plans.coinEarn'],
              ['coin_earn_priority', 'plans.coinEarnPriority'],
              ['verified_badge',     'plans.verifiedBadge'],
              ['virtual_tour',       'plans.virtualTour'],
              ['oem_odm_support',    'plans.oemOdm'],
              ['is_active',          'plans.isActive'],
            ].map(([field, labelKey]) => (
              <div key={field} className="flex items-center justify-between">
                <Label className="text-sm">{t(labelKey)}</Label>
                <Switch checked={!!form[field]} onCheckedChange={(v) => set(field, v)} />
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {saving ? '…' : plan ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Feature Row ───────────────────────────────────────────────────────────────

function Feat({ label, value, isBoolean }) {
  if (isBoolean) {
    return (
      <div className="flex items-center justify-between py-1 text-sm border-b last:border-0 dark:border-white/[0.06]">
        <span className="text-slate-500 dark:text-white/50">{label}</span>
        {value
          ? <Check className="h-4 w-4 text-green-500" />
          : <X className="h-4 w-4 text-slate-300 dark:text-white/20" />
        }
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between py-1 text-sm border-b last:border-0 dark:border-white/[0.06]">
      <span className="text-slate-500 dark:text-white/50">{label}</span>
      <span className="font-medium text-slate-800 dark:text-white">{value}</span>
    </div>
  )
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, onEdit, onDelete }) {
  const { t } = useTranslation()
  const limit = plan.product_limit ?? null
  const liveLabel = LIVE_STREAM_OPTS.find((o) => o.value === plan.live_stream_mode)?.labelKey ?? 'plans.liveNone'

  return (
    <Card className={cn('relative flex flex-col', !plan.is_active && 'opacity-60')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{plan.display_name_en || plan.name}</CardTitle>
            {plan.display_name_tm && (
              <p className="text-xs text-slate-400 mt-0.5">{plan.display_name_tm}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(plan)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => onDelete(plan)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {Number(plan.price_monthly) === 0 ? t('common.free', { defaultValue: 'Free' }) : `${plan.price_monthly} TMT`}
          </span>
          <span className="text-xs text-slate-400">/ aý</span>
          {!plan.is_active && <Badge variant="secondary">Işjeň däl</Badge>}
        </div>
        <p className="text-xs text-slate-400">
          Komissiýa: {(Number(plan.commission_rate) * 100).toFixed(0)}%
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <Feat label={t('plans.productLimit')} value={limit == null ? t('plans.unlimited') : limit} />
        <Feat label={t('plans.hotspotPerMonth')} value={`${plan.hotspot_per_month} × ${plan.hotspot_duration_hrs}h`} />
        <Feat label={t('plans.aiCredits')} value={plan.ai_credits_monthly} />
        <Feat label={t('plans.auctionPerWeek')} value={plan.auction_per_week == null ? t('plans.unlimited') : plan.auction_per_week} />
        <Feat label={t('plans.liveStream')} value={t(liveLabel)} />
        <Feat label={t('plans.revenueShareUser')} value={`${plan.revenue_share_user}%`} />
        <Feat label={t('plans.pushNotifMonthly')} value={plan.push_notif_monthly} />
        <Feat label={t('plans.adsDashboard')}     isBoolean value={plan.ads_dashboard} />
        <Feat label={t('plans.coinEarn')}          isBoolean value={plan.coin_earn} />
        <Feat label={t('plans.coinEarnPriority')}  isBoolean value={plan.coin_earn_priority} />
        <Feat label={t('plans.verifiedBadge')}     isBoolean value={plan.verified_badge} />
        <Feat label={t('plans.virtualTour')}       isBoolean value={plan.virtual_tour} />
        <Feat label={t('plans.oemOdm')}            isBoolean value={plan.oem_odm_support} />
      </CardContent>
    </Card>
  )
}

// ── Plans Tab ─────────────────────────────────────────────────────────────────

function PlansTab({ plans, loading, onEdit, onDelete, onAdd }) {
  const { t } = useTranslation()

  if (loading) return <p className="text-sm text-slate-400 py-10 text-center">{t('common.loading')}</p>

  if (plans.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
      <CreditCard className="h-10 w-10 opacity-30" />
      <p className="text-sm">{t('common.noResults')}</p>
      <Button size="sm" onClick={onAdd}>{t('plans.createPlan')}</Button>
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}

// ── Assign Subscription Modal ─────────────────────────────────────────────────

function AssignModal({ open, plans, onClose, onSaved }) {
  const [shops, setShops]   = useState([])
  const [form, setForm]     = useState({ shop_id: '', plan_id: '', starts_at: todayISO(), ends_at: '', note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ shop_id: '', plan_id: '', starts_at: todayISO(), ends_at: '', note: '' })
    AdminApi.shops.getAll({ limit: 500 })
      .then(({ data }) => setShops(data.data ?? []))
      .catch(() => {})
  }, [open])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const sel = 'w-full h-9 border rounded-md px-3 text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  async function handleSave() {
    if (!form.shop_id || !form.plan_id) { toast.error('Dükan we plan saýlaň'); return }
    setSaving(true)
    try {
      await AdminApi.shopSubscriptions.assign({
        shop_id:   Number(form.shop_id),
        plan_id:   Number(form.plan_id),
        starts_at: form.starts_at || null,
        ends_at:   form.ends_at   || null,
        note:      form.note      || null,
      })
      toast.success('Abunalyk goşuldy')
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Abunalyk goş</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Dükan <span className="text-red-500">*</span></Label>
            <select value={form.shop_id} onChange={(e) => set('shop_id', e.target.value)} className={sel}>
              <option value="">— Dükan saýlaň —</option>
              {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Plan <span className="text-red-500">*</span></Label>
            <select value={form.plan_id} onChange={(e) => set('plan_id', e.target.value)} className={sel}>
              <option value="">— Plan saýlaň —</option>
              {plans.filter((p) => p.is_active).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name_tm || p.name} — {Number(p.price_monthly) === 0 ? 'Mugt' : `${p.price_monthly} TMT/aý`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Başlanýan senesi</Label>
              <Input
                type="date"
                value={form.starts_at}
                onChange={(e) => set('starts_at', e.target.value)}
                className="dark:[color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Gutarýan senesi</Label>
              <Input
                type="date"
                value={form.ends_at}
                onChange={(e) => set('ends_at', e.target.value)}
                placeholder="Çäksiz"
                className="dark:[color-scheme:dark]"
              />
              <p className="text-[10px] text-slate-400">Boş = çäksiz</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Bellik</Label>
            <Input
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="Goşmaça maglumat…"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Ýatyr</Button>
          <Button onClick={handleSave} disabled={saving || !form.shop_id || !form.plan_id}>
            {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Goşulýar…</> : 'Goş'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Subscription Row ──────────────────────────────────────────────────────────

function SubRow({ sub, onCancel, onRemove }) {
  const st = SUB_STATUS[sub.status] ?? SUB_STATUS[3]
  const expired = sub.ends_at && new Date(sub.ends_at) < new Date() && sub.status === 1

  return (
    <tr className="border-b last:border-0 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium dark:text-white">{sub.shop?.name ?? `#${sub.shop_id}`}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-slate-700 dark:text-slate-200">
          {sub.plan?.display_name_tm || sub.plan?.name || `#${sub.plan_id}`}
        </p>
        {sub.plan?.price_monthly != null && (
          <p className="text-xs text-slate-400">
            {Number(sub.plan.price_monthly) === 0 ? 'Mugt' : `${sub.plan.price_monthly} TMT/aý`}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', expired ? SUB_STATUS[3].cls : st.cls)}>
          {expired ? 'Möhleti geçdi' : st.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {fmtDate(sub.starts_at)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {sub.ends_at
          ? <span className={expired ? 'text-red-500' : ''}>{fmtDate(sub.ends_at)}</span>
          : <span className="text-slate-300 dark:text-white/30">∞</span>
        }
      </td>
      <td className="px-4 py-3 text-sm text-slate-400 max-w-[140px] truncate">
        {sub.note || '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          {sub.status === 1 && !expired && (
            <button
              onClick={() => onCancel(sub)}
              className="p-1.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
              title="Ýatyr"
            >
              <Ban className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onRemove(sub)}
            className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Poz"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Subscriptions Tab ─────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: '', label: 'Hemmesi' },
  { value: '1', label: 'Işjeň' },
  { value: '2', label: 'Ýatyryldy' },
  { value: '3', label: 'Möhleti geçdi' },
]
const PAGE = 20

function SubscriptionsTab({ plans }) {
  const [subs, setSubs]           = useState([])
  const [count, setCount]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatus] = useState('')
  const [page, setPage]           = useState(0)
  const [assignOpen, setAssign]   = useState(false)

  const loadSubs = useCallback(() => {
    setLoading(true)
    const params = { limit: PAGE, skip: page * PAGE }
    if (statusFilter) params.status = statusFilter
    AdminApi.shopSubscriptions.getAll(params)
      .then(({ data }) => { setSubs(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter, page])

  useEffect(() => { loadSubs() }, [loadSubs])

  async function handleCancel(sub) {
    if (!confirm(`"${sub.shop?.name}" dükanynyň abunalygyny ýatyrmak?`)) return
    try {
      await AdminApi.shopSubscriptions.updateStatus(sub.id, { status: 2 })
      toast.success('Abunalyk ýatyryldy')
      loadSubs()
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    }
  }

  async function handleRemove(sub) {
    if (!confirm('Abunalyk ýazgysyny pozmak?')) return
    try {
      await AdminApi.shopSubscriptions.remove(sub.id)
      toast.success('Pozuldy')
      loadSubs()
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    }
  }

  const pages = Math.ceil(count / PAGE)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setStatus(value); setPage(0) }}
              className={cn(
                'text-sm px-3 py-1.5 rounded-full transition-colors',
                statusFilter === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.09]'
              )}
            >
              {label}
            </button>
          ))}
          <button onClick={loadSubs} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" title="Täzele">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAssign(true)}>
          <Plus className="h-4 w-4" />Abunalyk goş
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.03] border-b dark:border-white/[0.06]">
                {['Dükan', 'Plan', 'Ýagdaý', 'Başlandy', 'Gutarýar', 'Bellik', ''].map((h, i) => (
                  <th key={i} className={cn('px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide', i === 6 ? 'text-right' : 'text-left')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">Ýüklenýär…</td></tr>
              ) : subs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">Abunalyk ýok</td></tr>
              ) : (
                subs.map((sub) => (
                  <SubRow key={sub.id} sub={sub} onCancel={handleCancel} onRemove={handleRemove} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>{page * PAGE + 1}–{Math.min((page + 1) * PAGE, count)} / {count}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>←</Button>
            <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>→</Button>
          </div>
        </div>
      )}

      <AssignModal
        open={assignOpen}
        plans={plans}
        onClose={() => setAssign(false)}
        onSaved={loadSubs}
      />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const { t } = useTranslation()
  const [tab, setTab]       = useState('plans')
  const [plans, setPlans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState({ open: false, plan: null })

  function loadPlans() {
    setLoading(true)
    AdminApi.plans.getAll({ all: 'true' })
      .then(({ data }) => setPlans(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(loadPlans, [])

  async function handleDelete(plan) {
    if (!window.confirm(t('plans.confirmDelete'))) return
    try {
      await AdminApi.plans.delete(plan.id)
      toast.success(t('toast.deleted'))
      loadPlans()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Planlar we abunalyklar</h2>
          <p className="text-sm text-slate-500 mt-0.5 dark:text-white/60">
            {tab === 'plans' ? `${plans.length} plan` : 'Dükan abunalyklary'}
          </p>
        </div>
        {tab === 'plans' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadPlans}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setModal({ open: true, plan: null })}>
              <Plus className="h-4 w-4" />{t('plans.addPlan')}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b dark:border-white/[0.06] -mb-0">
        <TabBtn active={tab === 'plans'} onClick={() => setTab('plans')}>
          <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Planlar</span>
        </TabBtn>
        <TabBtn active={tab === 'subscriptions'} onClick={() => setTab('subscriptions')}>
          <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />Abunalyklar</span>
        </TabBtn>
      </div>

      {/* Tab content */}
      {tab === 'plans' ? (
        <PlansTab
          plans={plans}
          loading={loading}
          onEdit={(p) => setModal({ open: true, plan: p })}
          onDelete={handleDelete}
          onAdd={() => setModal({ open: true, plan: null })}
        />
      ) : (
        <SubscriptionsTab plans={plans} />
      )}

      <PlanModal
        key={`${modal.open}-${modal.plan?.id ?? 'new'}`}
        open={modal.open}
        plan={modal.plan}
        onClose={() => setModal({ open: false, plan: null })}
        onSaved={() => {
          setModal({ open: false, plan: null })
          toast.success(modal.plan ? t('toast.updated') : t('toast.created'))
          loadPlans()
        }}
      />
    </div>
  )
}
