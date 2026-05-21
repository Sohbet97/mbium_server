import { useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Eye, EyeOff, Percent, X, Loader2, RefreshCw, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const PAGE = 20

const EMPTY = {
  code: '', type: 'PERCENTAGE', value: '',
  min_order_amount: '', max_uses: '',
  starts_at: '', ends_at: '',
  is_active: true,
}

function DiscountFormModal({ discount, onClose, onSaved, t }) {
  const [form, setForm] = useState(discount ? {
    code:             discount.code             ?? '',
    type:             discount.type             ?? 'PERCENTAGE',
    value:            discount.value            ?? '',
    min_order_amount: discount.min_order_amount ?? '',
    max_uses:         discount.max_uses         ?? '',
    starts_at:        discount.starts_at ? discount.starts_at.slice(0, 10) : '',
    ends_at:          discount.ends_at   ? discount.ends_at.slice(0, 10)   : '',
    is_active:        discount.is_active ?? true,
  } : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.code.trim()) { toast.error(t('seller.codeRequired')); return }
    if (!form.value)        { toast.error(t('seller.valueRequired')); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        code:             form.code.trim().toUpperCase(),
        value:            parseFloat(form.value),
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        max_uses:         form.max_uses ? parseInt(form.max_uses) : null,
        starts_at:        form.starts_at || null,
        ends_at:          form.ends_at   || null,
      }
      const { data } = discount
        ? await SellerApi.discounts.update(discount.id, payload)
        : await SellerApi.discounts.create(payload)
      onSaved(data.model)
      toast.success(t('seller.discountSaved'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a1f] rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08]">
          <h2 className="font-semibold dark:text-white">{discount ? t('seller.editDiscountTitle') : t('seller.newDiscountTitle')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Code */}
          <div>
            <Label className="mb-1 block">Kod <span className="text-red-500">*</span></Label>
            <Input
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              className="font-mono"
            />
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">{t('seller.discountType')}</Label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full h-9 border rounded-md px-3 text-sm bg-white dark:bg-[#111114] dark:border-white/10 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PERCENTAGE">{t('seller.typePercentage')}</option>
                <option value="FIXED">{t('seller.typeFixed')}</option>
                <option value="FREE_SHIPPING">{t('seller.typeFreeShipping')}</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block">
                {form.type === 'PERCENTAGE' ? t('seller.valuePercent') : form.type === 'FIXED' ? t('seller.valueFixed') : t('seller.valueLabel')}
              </Label>
              <Input
                type="number"
                min="0"
                step={form.type === 'PERCENTAGE' ? '1' : '0.01'}
                max={form.type === 'PERCENTAGE' ? '100' : undefined}
                value={form.value}
                onChange={(e) => set('value', e.target.value)}
                placeholder={form.type === 'PERCENTAGE' ? '20' : '50.00'}
              />
            </div>
          </div>

          {/* Min order + max uses */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">{t('seller.minOrder')}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.min_order_amount}
                onChange={(e) => set('min_order_amount', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label className="mb-1 block">{t('seller.maxUses')}</Label>
              <Input
                type="number"
                min="1"
                value={form.max_uses}
                onChange={(e) => set('max_uses', e.target.value)}
                placeholder={t('seller.unlimited')}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">{t('seller.startsAt')}</Label>
              <Input
                type="date"
                value={form.starts_at}
                onChange={(e) => set('starts_at', e.target.value)}
                className="dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <Label className="mb-1 block">{t('seller.endsAt')}</Label>
              <Input
                type="date"
                value={form.ends_at}
                onChange={(e) => set('ends_at', e.target.value)}
                className="dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Active */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              <div className={cn('w-9 h-5 rounded-full transition-colors', form.is_active ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/20')} />
              <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.is_active ? 'translate-x-4' : '')} />
            </div>
            <span className="text-sm dark:text-white">{t('seller.statusActive')}</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t dark:border-white/[0.08]">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function TypeBadge({ type }) {
  if (type === 'PERCENTAGE') return <span className="text-xs font-medium text-blue-600 dark:text-blue-400">%</span>
  if (type === 'FIXED')      return <span className="text-xs font-medium text-green-600 dark:text-green-400">TMT</span>
  return <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Mugt</span>
}

export default function SellerDiscountsPage() {
  const { t } = useTranslation()
  const [discounts, setDiscounts] = useState([])
  const [count, setCount]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(0)
  const [editTarget, setEditTarget] = useState(undefined)
  const [deleting, setDeleting]   = useState(null)
  const [toggling, setToggling]   = useState(null)

  function load(p = 0) {
    setLoading(true)
    SellerApi.discounts.getAll({ limit: PAGE, skip: p * PAGE })
      .then(({ data }) => { setDiscounts(data.data ?? []); setCount(data.count ?? 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  function handleSaved(model) {
    setDiscounts((prev) => {
      const idx = prev.findIndex((d) => d.id === model.id)
      return idx >= 0 ? prev.map((d) => d.id === model.id ? model : d) : [model, ...prev]
    })
    if (!discounts.find((d) => d.id === model.id)) setCount((c) => c + 1)
    setEditTarget(undefined)
  }

  async function handleDelete(id) {
    if (!confirm(t('seller.confirmDeleteDiscount'))) return
    setDeleting(id)
    try {
      await SellerApi.discounts.delete(id)
      setDiscounts((prev) => prev.filter((d) => d.id !== id))
      setCount((c) => c - 1)
      toast.success(t('seller.discountDeleted'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setDeleting(null) }
  }

  async function handleToggle(d) {
    setToggling(d.id)
    try {
      const { data } = await SellerApi.discounts.update(d.id, { is_active: !d.is_active })
      setDiscounts((prev) => prev.map((x) => x.id === d.id ? data.model : x))
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setToggling(null) }
  }

  function fmtValue(d) {
    if (d.type === 'FREE_SHIPPING') return t('seller.freeShipping')
    const val = parseFloat(d.value)
    return d.type === 'PERCENTAGE' ? `${val}%` : `${val.toFixed(2)} TMT`
  }

  const totalPages = Math.ceil(count / PAGE)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold dark:text-white">
          {t('seller.discountsTitle')} <span className="text-slate-400 font-normal text-base">({count})</span>
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={() => load(page)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setEditTarget(null)}>
            <Plus className="h-4 w-4 mr-1.5" />{t('seller.newDiscount')}
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Tag className="h-12 w-12 text-slate-200 dark:text-white/10" />
          <p className="text-sm">{t('seller.noDiscounts')}</p>
          <Button size="sm" variant="outline" onClick={() => setEditTarget(null)}>
            <Plus className="h-4 w-4 mr-1.5" />{t('seller.addFirstDiscount')}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden bg-white dark:bg-[#111114]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-4 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
            <div>{t('seller.discountCode')}</div>
            <div className="text-right">{t('seller.discountValue')}</div>
            <div className="text-right">{t('seller.discountMin')}</div>
            <div className="text-center">{t('seller.discountUsage')}</div>
            <div>{t('common.status')}</div>
            <div />
          </div>

          <div className="divide-y dark:divide-white/[0.04]">
            {discounts.map((d) => {
              const expired = d.ends_at && new Date(d.ends_at) < new Date()
              return (
                <div
                  key={d.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-4 items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Code */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold dark:text-white">{d.code}</span>
                      <TypeBadge type={d.type} />
                    </div>
                    {(d.starts_at || d.ends_at) && (
                      <div className={cn('text-[10px] mt-0.5', expired ? 'text-red-400' : 'text-slate-400')}>
                        {d.starts_at ? new Date(d.starts_at).toLocaleDateString('ru-RU') : '…'}
                        {' → '}
                        {d.ends_at   ? new Date(d.ends_at).toLocaleDateString('ru-RU')   : '∞'}
                        {expired && ` · ${t('seller.statusExpired')}`}
                      </div>
                    )}
                  </div>

                  {/* Value */}
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold dark:text-white whitespace-nowrap">{fmtValue(d)}</span>
                  </div>

                  {/* Min order */}
                  <div className="text-right shrink-0 text-xs text-slate-400 whitespace-nowrap">
                    {d.min_order_amount ? `${parseFloat(d.min_order_amount).toFixed(0)} TMT` : '—'}
                  </div>

                  {/* Uses */}
                  <div className="text-center shrink-0 text-xs text-slate-500 whitespace-nowrap">
                    {d.used_count ?? 0}{d.max_uses ? `/${d.max_uses}` : ''}
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      d.is_active && !expired
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                    )}>
                      {expired ? t('seller.statusExpired') : d.is_active ? t('seller.statusActive') : t('seller.statusHidden')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(d)}
                      disabled={toggling === d.id}
                      title={d.is_active ? t('seller.hideProduct') : t('seller.activateProduct')}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors disabled:opacity-40"
                    >
                      {d.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setEditTarget(d)}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      disabled={deleting === d.id}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
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

      {/* Create / edit modal */}
      {editTarget !== undefined && (
        <DiscountFormModal
          discount={editTarget}
          onClose={() => setEditTarget(undefined)}
          onSaved={handleSaved}
          t={t}
        />
      )}
    </div>
  )
}
