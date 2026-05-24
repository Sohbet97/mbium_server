import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, RefreshCw, Pencil, Trash2, Eye, EyeOff, Loader2,
  Tag, ShoppingCart, Package, Gift, Truck, ChevronRight, ArrowLeft, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { AdminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const PAGE = 25

const CATEGORY_META = {
  ORDER:         { icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/30' },
  PRODUCT:       { icon: Package,      color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  BUY_X_GET_Y:   { icon: Gift,         color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  FREE_SHIPPING: { icon: Truck,        color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-950/30' },
}

const EMPTY = {
  method: 'CODE', code: '', name: '', type: 'PERCENTAGE', value: '',
  applies_to_type: 'ALL', applies_to_ids: [],
  min_order_amount: '', min_quantity: '', max_uses: '',
  buy_quantity: '', get_quantity: '',
  starts_at: '', ends_at: '', is_active: true,
  shop_id: '',
}

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

// ── Type picker modal ─────────────────────────────────────────────────────────
function TypePickerModal({ onSelect, onClose }) {
  const { t } = useTranslation()
  const TYPES = [
    { value: 'ORDER',         titleKey: 'seller.catOrder',        descKey: 'seller.catOrderDesc' },
    { value: 'PRODUCT',       titleKey: 'seller.catProduct',      descKey: 'seller.catProductDesc' },
    { value: 'BUY_X_GET_Y',   titleKey: 'seller.catBuyXGetY',     descKey: 'seller.catBuyXGetYDesc' },
    { value: 'FREE_SHIPPING', titleKey: 'seller.catFreeShipping', descKey: 'seller.catFreeShippingDesc' },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#1a1a1f] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08]">
          <h2 className="font-semibold dark:text-white">{t('seller.selectDiscountType')}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="divide-y dark:divide-white/[0.06]">
          {TYPES.map(({ value, titleKey, descKey }) => {
            const meta = CATEGORY_META[value]
            const Icon = meta.icon
            return (
              <button key={value} type="button" onClick={() => onSelect(value)}
                className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left group"
              >
                <div className={cn('p-2 rounded-lg shrink-0', meta.bg)}>
                  <Icon className={cn('h-5 w-5', meta.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium dark:text-white">{t(titleKey)}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">{t(descKey)}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-white/20 shrink-0 group-hover:text-slate-400 transition-colors" />
              </button>
            )
          })}
        </div>
        <div className="px-5 py-3 border-t dark:border-white/[0.08]">
          <Button variant="outline" size="sm" className="w-full" onClick={onClose}>{t('common.cancel')}</Button>
        </div>
      </div>
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{children}</p>
}

// ── Applies-to (PRODUCT discounts) ────────────────────────────────────────────
function AppliesToSection({ form, set, shopId }) {
  const { t } = useTranslation()
  const [items, setItems]           = useState([])
  const [search, setSearch]         = useState('')
  const [debouncedSearch, setDebounced] = useState('')
  const [fetching, setFetching]     = useState(false)

  const applyType = form.applies_to_type
  const ids       = Array.isArray(form.applies_to_ids) ? form.applies_to_ids : []

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    if (applyType === 'ALL') { setItems([]); return }
    setFetching(true)
    const req = applyType === 'CATEGORIES'
      ? AdminApi.categories.getAll({ limit: 500 })
      : AdminApi.products.getAll({ limit: 50, ...(shopId ? { shop_id: shopId } : {}), ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}) })
    req
      .then(({ data }) => setItems(data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setFetching(false))
  }, [applyType, debouncedSearch, shopId])

  function toggle(id) {
    set('applies_to_ids', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }
  function changeType(newType) { set('applies_to_type', newType); set('applies_to_ids', []); setSearch('') }

  const OPTIONS = [
    { value: 'ALL',        label: t('seller.appliesToAll') },
    { value: 'CATEGORIES', label: t('seller.appliesToCategories') },
    { value: 'PRODUCTS',   label: t('seller.appliesToProducts') },
  ]

  return (
    <section>
      <SectionLabel>{t('seller.appliesToTitle')}</SectionLabel>
      <div className="space-y-1.5">
        {OPTIONS.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" name="applies_to_type" checked={applyType === value}
              onChange={() => changeType(value)} className="accent-blue-600" />
            <span className="text-sm dark:text-white">{label}</span>
          </label>
        ))}
      </div>
      {applyType !== 'ALL' && (
        <div className="mt-3 space-y-2">
          {applyType === 'PRODUCTS' && (
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('common.search')} className="h-8 text-sm" />
          )}
          <div className="max-h-44 overflow-y-auto rounded-lg border dark:border-white/[0.06] divide-y dark:divide-white/[0.04] bg-slate-50 dark:bg-white/[0.02]">
            {fetching ? (
              <div className="py-6 flex justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : items.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">{t('common.noResults')}</p>
            ) : items.map(item => (
              <label key={item.id}
                className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white dark:hover:bg-white/[0.04] cursor-pointer transition-colors">
                <input type="checkbox" checked={ids.includes(item.id)} onChange={() => toggle(item.id)}
                  className="accent-blue-600 shrink-0" />
                <span className="text-sm dark:text-white truncate">{item.name}</span>
              </label>
            ))}
          </div>
          {ids.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{t('seller.nSelected', { count: ids.length })}</p>
              <button type="button" onClick={() => set('applies_to_ids', [])}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{t('common.cancel')}</button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ── Discount form drawer ──────────────────────────────────────────────────────
function DiscountFormDrawer({ discount, category, shops, onClose, onSaved }) {
  const { t } = useTranslation()
  const cat = discount?.category ?? category

  const [form, setForm] = useState(discount ? {
    method:           discount.method           ?? 'CODE',
    code:             discount.code             ?? '',
    name:             discount.name             ?? '',
    type:             discount.type             ?? 'PERCENTAGE',
    value:            discount.value            ?? '',
    applies_to_type:  discount.applies_to_type  ?? 'ALL',
    applies_to_ids:   Array.isArray(discount.applies_to_ids) ? discount.applies_to_ids : [],
    min_order_amount: discount.min_order_amount ?? '',
    min_quantity:     discount.min_quantity     ?? '',
    max_uses:         discount.max_uses         ?? '',
    buy_quantity:     discount.buy_quantity     ?? '',
    get_quantity:     discount.get_quantity     ?? '',
    starts_at:        discount.starts_at ? discount.starts_at.slice(0, 10) : '',
    ends_at:          discount.ends_at   ? discount.ends_at.slice(0, 10)   : '',
    is_active:        discount.is_active ?? true,
    shop_id:          discount.shop_id   ?? '',
  } : { ...EMPTY })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const isCode     = form.method === 'CODE'
  const isFreeShip = cat === 'FREE_SHIPPING'
  const isBuyXGetY = cat === 'BUY_X_GET_Y'
  const hasValue   = !isFreeShip
  const hasMaxUses = isCode

  async function handleSave() {
    if (isCode && !form.code.trim())  { toast.error(t('seller.codeRequired')); return }
    if (!isCode && !form.name.trim()) { toast.error(t('seller.codeRequired')); return }
    if (hasValue && !form.value)       { toast.error(t('seller.valueRequired')); return }

    setSaving(true)
    try {
      const payload = {
        category: cat,
        method:   form.method,
        code:     isCode ? form.code.trim().toUpperCase() : null,
        name:     form.name.trim() || null,
        type:     isFreeShip ? 'PERCENTAGE' : form.type,
        value:    hasValue ? parseFloat(form.value) : 0,
        min_order_amount: !isBuyXGetY && form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        min_quantity:     form.min_quantity ? parseInt(form.min_quantity) : null,
        max_uses:         hasMaxUses && form.max_uses ? parseInt(form.max_uses) : null,
        applies_to_type:  cat === 'PRODUCT' ? form.applies_to_type : 'ALL',
        applies_to_ids:   cat === 'PRODUCT' && form.applies_to_type !== 'ALL' ? form.applies_to_ids : [],
        buy_quantity:     isBuyXGetY && form.buy_quantity ? parseInt(form.buy_quantity) : null,
        get_quantity:     isBuyXGetY && form.get_quantity ? parseInt(form.get_quantity) : null,
        starts_at:        form.starts_at || null,
        ends_at:          form.ends_at   || null,
        is_active:        form.is_active,
        shop_id:          form.shop_id   || null,
      }
      const { data } = discount
        ? await AdminApi.discounts.update(discount.id, payload)
        : await AdminApi.discounts.create(payload)
      onSaved(data.model)
      toast.success(t('seller.discountSaved'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setSaving(false) }
  }

  const CAT_TITLE_KEYS = {
    ORDER: 'seller.catOrder', PRODUCT: 'seller.catProduct',
    FREE_SHIPPING: 'seller.catFreeShipping', BUY_X_GET_Y: 'seller.catBuyXGetY',
  }
  const meta    = CATEGORY_META[cat] ?? CATEGORY_META.ORDER
  const CatIcon = meta.icon

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-[#111114] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b dark:border-white/[0.06]">
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className={cn('p-1.5 rounded-lg', meta.bg)}>
            <CatIcon className={cn('h-4 w-4', meta.color)} />
          </div>
          <h2 className="font-semibold dark:text-white flex-1 truncate">
            {discount ? t('seller.editDiscountTitle') : t(CAT_TITLE_KEYS[cat] ?? 'seller.catOrder')}
          </h2>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* Shop selector — admin only */}
          <section>
            <SectionLabel>{t('discounts.shop')}</SectionLabel>
            <Select value={form.shop_id} onChange={e => set('shop_id', e.target.value)}>
              <option value="">{t('discounts.platformWide')}</option>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <p className="text-xs text-slate-400 mt-1">{t('discounts.shopHint')}</p>
          </section>

          {/* Method */}
          <section>
            <SectionLabel>{t('seller.discountMethod')}</SectionLabel>
            <div className="flex gap-2">
              {['CODE', 'AUTOMATIC'].map(m => (
                <button key={m} type="button" onClick={() => set('method', m)}
                  className={cn(
                    'flex-1 py-2 text-sm rounded-lg border font-medium transition-colors',
                    form.method === m
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  )}
                >
                  {t(m === 'CODE' ? 'seller.methodCode' : 'seller.methodAutomatic')}
                </button>
              ))}
            </div>
          </section>

          {/* Code or name */}
          <section>
            <SectionLabel>{isCode ? t('seller.discountCode') : t('seller.discountName')}</SectionLabel>
            {isCode ? (
              <div className="flex gap-2">
                <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                  placeholder="SUMMER20" className="flex-1 font-mono" />
                <Button type="button" variant="outline" size="sm" className="shrink-0 h-9 px-3 text-xs"
                  onClick={() => set('code', randomCode())}>
                  {t('seller.generateCode')}
                </Button>
              </div>
            ) : (
              <>
                <Input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder={t('seller.discountName')} />
                <p className="text-xs text-slate-400 mt-1">{t('seller.discountNameHint')}</p>
              </>
            )}
          </section>

          {/* Discount value */}
          {hasValue && (
            <section>
              <SectionLabel>{t('seller.discountValue')}</SectionLabel>
              <div className="flex gap-2">
                <div className="flex rounded-lg border dark:border-white/10 overflow-hidden shrink-0">
                  {['PERCENTAGE', 'FIXED'].map(tp => (
                    <button key={tp} type="button" onClick={() => set('type', tp)}
                      className={cn(
                        'px-3 py-2 text-xs font-medium transition-colors',
                        form.type === tp ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                      )}
                    >
                      {tp === 'PERCENTAGE' ? '%' : 'TMT'}
                    </button>
                  ))}
                </div>
                <Input type="number" min="0"
                  step={form.type === 'PERCENTAGE' ? '1' : '0.01'}
                  max={form.type === 'PERCENTAGE' ? '100' : undefined}
                  value={form.value} onChange={e => set('value', e.target.value)}
                  placeholder={form.type === 'PERCENTAGE' ? '20' : '50.00'} className="flex-1" />
                <span className="shrink-0 self-center text-sm text-slate-400 pr-1">
                  {form.type === 'PERCENTAGE' ? '%' : 'TMT'}
                </span>
              </div>
            </section>
          )}

          {/* Applies to — PRODUCT only */}
          {cat === 'PRODUCT' && (
            <AppliesToSection form={form} set={set} shopId={form.shop_id || null} />
          )}

          {/* BUY X GET Y */}
          {isBuyXGetY && (
            <section>
              <SectionLabel>{t('seller.catBuyXGetY')}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block text-xs">{t('seller.buyQty')}</Label>
                  <Input type="number" min="1" value={form.buy_quantity}
                    onChange={e => set('buy_quantity', e.target.value)} placeholder="2" />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">{t('seller.getQty')}</Label>
                  <Input type="number" min="1" value={form.get_quantity}
                    onChange={e => set('get_quantity', e.target.value)} placeholder="1" />
                </div>
              </div>
            </section>
          )}

          {/* Min requirements */}
          <section>
            <SectionLabel>{t('seller.discountMin')}</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {!isBuyXGetY && (
                <div>
                  <Label className="mb-1 block text-xs">{t('seller.minOrder')}</Label>
                  <Input type="number" min="0" step="0.01" value={form.min_order_amount}
                    onChange={e => set('min_order_amount', e.target.value)} placeholder="0.00" />
                </div>
              )}
              <div>
                <Label className="mb-1 block text-xs">{t('seller.minQuantity')}</Label>
                <Input type="number" min="1" value={form.min_quantity}
                  onChange={e => set('min_quantity', e.target.value)} placeholder="—" />
              </div>
            </div>
          </section>

          {/* Max uses — code only */}
          {hasMaxUses && (
            <section>
              <SectionLabel>{t('seller.maxUses')}</SectionLabel>
              <Input type="number" min="1" value={form.max_uses}
                onChange={e => set('max_uses', e.target.value)} placeholder={t('seller.unlimited')} />
            </section>
          )}

          {/* Date range */}
          <section>
            <SectionLabel>{t('seller.startsAt')} / {t('seller.endsAt')}</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">{t('seller.startsAt')}</Label>
                <Input type="date" value={form.starts_at} onChange={e => set('starts_at', e.target.value)}
                  className="dark:[color-scheme:dark]" />
              </div>
              <div>
                <Label className="mb-1 block text-xs">{t('seller.endsAt')}</Label>
                <Input type="date" value={form.ends_at} onChange={e => set('ends_at', e.target.value)}
                  className="dark:[color-scheme:dark]" />
              </div>
            </div>
          </section>

          {/* Active toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={form.is_active}
                onChange={e => set('is_active', e.target.checked)} />
              <div className={cn('w-9 h-5 rounded-full transition-colors', form.is_active ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/20')} />
              <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.is_active ? 'translate-x-4' : '')} />
            </div>
            <span className="text-sm dark:text-white">{t('seller.statusActive')}</span>
          </label>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t dark:border-white/[0.06]">
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DiscountsPage() {
  const { t } = useTranslation()
  const [discounts, setDiscounts] = useState([])
  const [count, setCount]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [shops, setShops]         = useState([])
  const [page, setPage]           = useState(0)
  const [picking, setPicking]     = useState(false)
  const [drawer, setDrawer]       = useState(null)
  const [deleting, setDeleting]   = useState(null)
  const [toggling, setToggling]   = useState(null)

  const load = useCallback((p = 0) => {
    setLoading(true)
    AdminApi.discounts.getAll({ limit: PAGE, skip: p * PAGE })
      .then(({ data }) => { setDiscounts(data.data ?? []); setCount(data.count ?? 0) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(page) }, [page, load])

  useEffect(() => {
    AdminApi.shops.getAll({ limit: 200 })
      .then(({ data }) => setShops(data.data ?? []))
      .catch(() => {})
  }, [])

  function handleSaved(model) {
    setDiscounts(prev => {
      const idx = prev.findIndex(d => d.id === model.id)
      return idx >= 0 ? prev.map(d => d.id === model.id ? model : d) : [model, ...prev]
    })
    if (!discounts.find(d => d.id === model.id)) setCount(c => c + 1)
    setDrawer(null)
  }

  async function handleDelete(id) {
    if (!confirm(t('seller.confirmDeleteDiscount'))) return
    setDeleting(id)
    try {
      await AdminApi.discounts.delete(id)
      setDiscounts(prev => prev.filter(d => d.id !== id))
      setCount(c => c - 1)
      toast.success(t('toast.deleted'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setDeleting(null) }
  }

  async function handleToggle(d) {
    setToggling(d.id)
    try {
      const { data } = await AdminApi.discounts.update(d.id, { is_active: !d.is_active })
      setDiscounts(prev => prev.map(x => x.id === d.id ? data.model : x))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setToggling(null) }
  }

  function fmtValue(d) {
    if (d.category === 'FREE_SHIPPING') return t('seller.freeShipping')
    if (d.category === 'BUY_X_GET_Y')  return `${d.buy_quantity ?? '?'} → ${d.get_quantity ?? '?'}`
    const val = parseFloat(d.value)
    return d.type === 'PERCENTAGE' ? `${val}%` : `${val.toFixed(2)} TMT`
  }

  const totalPages = Math.ceil(count / PAGE)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold dark:text-white">
          {t('discounts.title')} <span className="text-slate-400 font-normal text-base">({count})</span>
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={() => load(page)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setPicking(true)}>
            <Plus className="h-4 w-4 mr-1.5" />{t('discounts.addDiscount')}
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
          <Button size="sm" variant="outline" onClick={() => setPicking(true)}>
            <Plus className="h-4 w-4 mr-1.5" />{t('discounts.addDiscount')}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden bg-white dark:bg-[#111114]">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-x-3 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
            <div />
            <div>{t('discounts.colCode')}</div>
            <div className="text-right">{t('seller.discountValue')}</div>
            <div className="text-right">{t('seller.discountMin')}</div>
            <div className="text-center">{t('seller.discountUsage')}</div>
            <div>{t('common.status')}</div>
            <div />
          </div>

          <div className="divide-y dark:divide-white/[0.04]">
            {discounts.map(d => {
              const expired = d.ends_at && new Date(d.ends_at) < new Date()
              const meta    = CATEGORY_META[d.category] ?? CATEGORY_META.ORDER
              const CatIcon = meta.icon
              return (
                <div key={d.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-x-3 items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Category icon */}
                  <div className={cn('p-1.5 rounded-lg', meta.bg)}>
                    <CatIcon className={cn('h-3.5 w-3.5', meta.color)} />
                  </div>

                  {/* Code / name + shop + dates */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {d.method === 'CODE' ? (
                        <span className="font-mono text-sm font-semibold dark:text-white">{d.code || '—'}</span>
                      ) : (
                        <span className="text-sm font-medium dark:text-white italic">{d.name || '—'}</span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                        {d.method === 'AUTOMATIC' ? t('seller.methodAutomatic') : t('seller.methodCode')}
                      </span>
                    </div>
                    {d.shop && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{d.shop.name}</p>
                    )}
                    {(d.starts_at || d.ends_at) && (
                      <div className={cn('text-[10px] mt-0.5', expired ? 'text-red-400' : 'text-slate-400')}>
                        {d.starts_at ? new Date(d.starts_at).toLocaleDateString('ru-RU') : '…'}
                        {' → '}
                        {d.ends_at ? new Date(d.ends_at).toLocaleDateString('ru-RU') : '∞'}
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
                    <button onClick={() => handleToggle(d)} disabled={toggling === d.id}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors disabled:opacity-40">
                      {d.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setDrawer({ discount: d, category: d.category })}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
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
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>←</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>→</Button>
          </div>
        </div>
      )}

      {picking && (
        <TypePickerModal
          onSelect={cat => { setPicking(false); setDrawer({ discount: null, category: cat }) }}
          onClose={() => setPicking(false)}
        />
      )}

      {drawer && (
        <DiscountFormDrawer
          discount={drawer.discount}
          category={drawer.category}
          shops={shops}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
