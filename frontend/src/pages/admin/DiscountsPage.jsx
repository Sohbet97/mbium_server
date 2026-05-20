import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from '@/components/ui/dialog'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING']

const EMPTY_FORM = {
  code: '',
  type: 'PERCENTAGE',
  value: '',
  min_order_amount: '',
  max_uses: '',
  shop_id: '',
  starts_at: '',
  ends_at: '',
  is_active: true,
}

function typeLabel(type, t) {
  if (type === 'PERCENTAGE') return t('discounts.typePercentage')
  if (type === 'FIXED') return t('discounts.typeFixed')
  if (type === 'FREE_SHIPPING') return t('discounts.typeFreeShipping')
  return type
}

function discountStatus(discount, t) {
  const now = new Date()
  if (discount.ends_at && new Date(discount.ends_at) < now) {
    return { label: t('discounts.expired'), color: 'bg-gray-100 text-gray-600' }
  }
  if (discount.starts_at && new Date(discount.starts_at) > now) {
    return { label: t('discounts.notStarted'), color: 'bg-yellow-100 text-yellow-700' }
  }
  if (!discount.is_active) {
    return { label: t('common.inactive'), color: 'bg-gray-100 text-gray-500' }
  }
  return { label: t('common.active'), color: 'bg-green-100 text-green-700' }
}

/* ── Discount Modal ── */
function DiscountModal({ open, discount, shops, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setForm(discount ? {
        code: discount.code ?? '',
        type: discount.type ?? 'PERCENTAGE',
        value: discount.value ?? '',
        min_order_amount: discount.min_order_amount ?? '',
        max_uses: discount.max_uses ?? '',
        shop_id: discount.shop_id ?? '',
        starts_at: discount.starts_at ? discount.starts_at.slice(0, 16) : '',
        ends_at: discount.ends_at ? discount.ends_at.slice(0, 16) : '',
        is_active: discount.is_active ?? true,
      } : EMPTY_FORM)
    }
  }, [open, discount])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave() {
    setError(''); setSaving(true)
    try {
      const payload = {
        ...form,
        value: form.value !== '' ? Number(form.value) : 0,
        min_order_amount: form.min_order_amount !== '' ? Number(form.min_order_amount) : null,
        max_uses: form.max_uses !== '' ? Number(form.max_uses) : null,
        shop_id: form.shop_id !== '' ? Number(form.shop_id) : null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      }
      if (!payload.code) delete payload.code
      if (discount) {
        await AdminApi.discounts.update(discount.id, payload)
      } else {
        await AdminApi.discounts.create(payload)
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{discount ? t('discounts.editDiscount') : t('discounts.createDiscount')}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

          <FormField label={t('discounts.code')} hint={t('discounts.codeHint')}>
            <Input
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="SUMMER20"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('discounts.type')}>
              <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                {DISCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>{typeLabel(type, t)}</option>
                ))}
              </Select>
            </FormField>

            <FormField label={t('discounts.value')} hint={t('discounts.valueHint')}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => set('value', e.target.value)}
                disabled={form.type === 'FREE_SHIPPING'}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('discounts.minOrderAmount')}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.min_order_amount}
                onChange={(e) => set('min_order_amount', e.target.value)}
                placeholder="0"
              />
            </FormField>

            <FormField label={t('discounts.maxUses')}>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.max_uses}
                onChange={(e) => set('max_uses', e.target.value)}
                placeholder="∞"
              />
            </FormField>
          </div>

          <FormField label={t('discounts.shop')}>
            <Select value={form.shop_id} onChange={(e) => set('shop_id', e.target.value)}>
              <option value="">{t('common.all')}</option>
              {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('discounts.startsAt')}>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => set('starts_at', e.target.value)}
              />
            </FormField>

            <FormField label={t('discounts.endsAt')}>
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => set('ends_at', e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => set('is_active', v)}
              id="discount-active"
            />
            <Label htmlFor="discount-active">{t('discounts.isActive')}</Label>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '…' : discount ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Main Page ── */
export default function DiscountsPage() {
  const { t } = useTranslation()
  const [discounts, setDiscounts] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [shops, setShops] = useState([])

  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25

  const [modal, setModal] = useState({ open: false, discount: null })

  const fetchDiscounts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await AdminApi.discounts.getAll({ limit: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE })
      setDiscounts(data.data ?? [])
      setCount(data.count ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page])

  const fetchShops = useCallback(async () => {
    try {
      const { data } = await AdminApi.shops.getAll({ limit: 200 })
      setShops(data.data ?? [])
    } catch {}
  }, [])

  useEffect(() => { fetchShops() }, [fetchShops])
  useEffect(() => { fetchDiscounts() }, [fetchDiscounts])

  async function handleDelete(discount) {
    if (!confirm(t('discounts.confirmDelete'))) return
    try {
      await AdminApi.discounts.delete(discount.id)
      toast.success(t('toast.deleted'))
      fetchDiscounts()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  const totalPages = Math.ceil(count / PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <Button size="sm" onClick={() => setModal({ open: true, discount: null })}>
          <Plus className="h-4 w-4 mr-1.5" />{t('discounts.addDiscount')}
        </Button>
        <Button variant="outline" size="sm" onClick={fetchDiscounts} className="ml-auto">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-sm text-slate-500 dark:text-white/[0.8] mb-3">{t('discounts.totalCount', { count })}</p>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-black dark:text-white border-b sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t('discounts.colCode')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('discounts.colType')}</th>
                <th className="text-right px-4 py-3 font-medium">{t('discounts.colValue')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('discounts.colUsage')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('discounts.colValid')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('discounts.colStatus')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">{t('common.loading')}</td></tr>
              ) : discounts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">{t('common.noResults')}</td></tr>
              ) : discounts.map((discount) => {
                const status = discountStatus(discount, t)
                return (
                  <tr key={discount.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-slate-800">{discount.code}</span>
                      {discount.shop && (
                        <p className="text-xs text-slate-400">{discount.shop.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{typeLabel(discount.type, t)}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {discount.type === 'PERCENTAGE' && `${discount.value}%`}
                      {discount.type === 'FIXED' && `${Number(discount.value).toFixed(2)} TMT`}
                      {discount.type === 'FREE_SHIPPING' && '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {discount.used_count}
                      {discount.max_uses ? ` / ${discount.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {discount.ends_at
                        ? new Date(discount.ends_at).toLocaleDateString()
                        : '∞'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', status.color)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setModal({ open: true, discount })}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                          title={t('common.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(discount)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

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

      <DiscountModal
        open={modal.open}
        discount={modal.discount}
        shops={shops}
        onClose={() => setModal({ open: false, discount: null })}
        onSaved={() => { toast.success(t(modal.discount ? 'toast.updated' : 'toast.created')); setModal({ open: false, discount: null }); fetchDiscounts() }}
      />
    </div>
  )
}
