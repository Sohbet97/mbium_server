import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, RefreshCw, Check, X, Pencil, Trash2, CreditCard } from 'lucide-react'
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const LIVE_STREAM_OPTS = [
  { value: 0, labelKey: 'plans.liveNone' },
  { value: 1, labelKey: 'plans.liveViewOnly' },
  { value: 2, labelKey: 'plans.liveLimited' },
  { value: 3, labelKey: 'plans.liveUnlimited' },
]

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

  const row = (label, children) => (
    <div className="grid grid-cols-2 gap-4">{label}{children}</div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? t('plans.editPlan') : t('plans.createPlan')}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

          {/* Identity */}
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

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('plans.price')}>
              <Input type="number" min={0} step={0.01} value={form.price_monthly} onChange={(e) => set('price_monthly', e.target.value)} />
            </FormField>
            <FormField label={t('plans.commissionRate')}>
              <Input type="number" min={0} max={1} step={0.01} value={form.commission_rate} onChange={(e) => set('commission_rate', e.target.value)} />
            </FormField>
          </div>

          {/* Limits */}
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

          {/* Boolean flags */}
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
    <Card className={`relative flex flex-col ${!plan.is_active ? 'opacity-60' : ''}`}>
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
          <span className="text-xs text-slate-400">/ mo</span>
          {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
        </div>
        <p className="text-xs text-slate-400">
          Commission: {(Number(plan.commission_rate) * 100).toFixed(0)}%
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
        <Feat label={t('plans.adsDashboard')}    isBoolean value={plan.ads_dashboard} />
        <Feat label={t('plans.coinEarn')}         isBoolean value={plan.coin_earn} />
        <Feat label={t('plans.coinEarnPriority')} isBoolean value={plan.coin_earn_priority} />
        <Feat label={t('plans.verifiedBadge')}    isBoolean value={plan.verified_badge} />
        <Feat label={t('plans.virtualTour')}      isBoolean value={plan.virtual_tour} />
        <Feat label={t('plans.oemOdm')}           isBoolean value={plan.oem_odm_support} />
      </CardContent>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const { t } = useTranslation()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, plan: null })

  function load() {
    setLoading(true)
    AdminApi.plans.getAll({ all: 'true' })
      .then(({ data }) => { setPlans(data.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleDelete(plan) {
    if (!window.confirm(t('plans.confirmDelete'))) return
    try {
      await AdminApi.plans.delete(plan.id)
      toast.success(t('toast.deleted'))
      load()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('plans.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5 dark:text-white/[0.8]">
            {t('plans.totalCount', { count: plans.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setModal({ open: true, plan: null })}>
            <Plus className="h-4 w-4" /> {t('plans.addPlan')}
          </Button>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">{t('common.loading')}</p>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <CreditCard className="h-10 w-10 opacity-30" />
          <p className="text-sm">{t('common.noResults')}</p>
          <Button size="sm" onClick={() => setModal({ open: true, plan: null })}>
            {t('plans.createPlan')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={(p) => setModal({ open: true, plan: p })}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <PlanModal
        key={`${modal.open}-${modal.plan?.id ?? 'new'}`}
        open={modal.open}
        plan={modal.plan}
        onClose={() => setModal({ open: false, plan: null })}
        onSaved={() => {
          setModal({ open: false, plan: null })
          toast.success(modal.plan ? t('toast.updated') : t('toast.created'))
          load()
        }}
      />
    </div>
  )
}
