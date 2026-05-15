import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw, MoreHorizontal, Star, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogBody,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MultiLangInput } from '@/components/common/MultiLangInput'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'

const EMPTY_FORM = {
  name: '', name_ru: '', name_eng: '',
  type_id: '', owner_id: '',
  phone: '', email: '', address: '', logo: '',
  is_active: true, is_verified: false, order: '',
}

function ShopModal({ open, shop, shopTypes, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setForm(shop
        ? {
          name: shop.name ?? '', name_ru: shop.name_ru ?? '', name_eng: shop.name_eng ?? '',
          type_id: shop.type_id ?? '', owner_id: shop.owner_id ?? '',
          phone: shop.phone ?? '', email: shop.email ?? '',
          address: shop.address ?? '', logo: shop.logo ?? '',
          is_active: shop.is_active ?? true, is_verified: shop.is_verified ?? false,
          order: shop.order ?? '',
        }
        : EMPTY_FORM
      )
    }
  }, [open, shop])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        type_id: Number(form.type_id) || undefined,
        order: form.order !== '' ? Number(form.order) : undefined,
      }
      if (shop?.id) {
        await AdminApi.shops.update(shop.id, payload)
      } else {
        await AdminApi.shops.create(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error saving shop')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{shop ? t('shops.editShop') : t('shops.createShop')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <MultiLangInput
            baseField="name" label={t('shops.name')} required
            values={form} onChange={set}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('shops.type')} required>
              <Select value={form.type_id} onChange={(e) => set('type_id', e.target.value)}>
                <option value="">{t('shops.noType')}</option>
                {shopTypes.map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label={t('shops.owner')}>
              <Input
                value={form.owner_id}
                onChange={(e) => set('owner_id', e.target.value)}
                placeholder="UUID"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('shops.phone')}>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+993…" />
            </FormField>
            <FormField label={t('shops.email')}>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </FormField>
          </div>

          <FormField label={t('shops.address')}>
            <Textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} />
          </FormField>

          <FormField label={t('shops.logo')}>
            <Input value={form.logo} onChange={(e) => set('logo', e.target.value)} placeholder="https://…" />
          </FormField>

          <div className="grid grid-cols-3 gap-4">
            <FormField label={t('shops.order')}>
              <Input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} min={0} max={1000} />
            </FormField>

            <div className="flex items-center justify-between rounded-md border px-3 py-2 col-span-1">
              <Label>{t('shops.isActive')}</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2 col-span-1">
              <Label>{t('shops.isVerified')}</Label>
              <Switch checked={form.is_verified} onCheckedChange={(v) => set('is_verified', v)} />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('common.loading') : shop ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ShopsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [shops, setShops] = useState([])
  const [shopTypes, setShopTypes] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const limit = 20

  const fetchShops = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit }
      if (search) params.search = search
      const { data } = await AdminApi.shops.getAll(params)
      setShops(data.data?.rows ?? data.data?.shops ?? [])
      setTotal(data.data?.count ?? data.data?.total ?? 0)
    } catch { setShops([]) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchShops() }, [fetchShops])

  useEffect(() => {
    AdminApi.shopTypes.getAll({ limit: 100 }).then(({ data }) => {
      setShopTypes(data.data?.rows ?? data.data?.shopTypes ?? [])
    }).catch(() => {})
  }, [])

  async function handleDelete(shop) {
    if (!window.confirm(t('shops.confirmDelete'))) return
    await AdminApi.shops.delete(shop.id).catch(() => {})
    fetchShops()
  }

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(shop) { setEditing(shop); setModalOpen(true) }
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('shops.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('shops.totalCount', { count: total })}</p>
        </div>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> {t('shops.addShop')}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('shops.searchPlaceholder')}
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Button variant="ghost" size="icon" onClick={fetchShops} className="h-9 w-9" title={t('common.refresh')}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">{t('shops.colShop')}</th>
                  <th className="px-4 py-3">{t('shops.colType')}</th>
                  <th className="px-4 py-3">{t('shops.colStatus')}</th>
                  <th className="px-4 py-3">{t('shops.colRating')}</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading && shops.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">{t('common.loading')}</td></tr>
                ) : shops.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">{t('common.noResults')}</td></tr>
                ) : shops.map((shop) => (
                  <tr key={shop.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {shop.logo
                          ? <img src={shop.logo} alt="" className="h-8 w-8 rounded object-cover border" />
                          : <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">{shop.name?.[0]}</div>
                        }
                        <div>
                          <p className="text-sm font-medium text-slate-900">{shop.name}</p>
                          <p className="text-xs text-slate-400">{shop.phone || shop.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{shop.type?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={shop.is_active ? 'success' : 'secondary'}>{shop.is_active ? t('common.active') : t('common.inactive')}</Badge>
                        {shop.is_verified && <Badge variant="outline" className="text-xs">{t('common.verified')}</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-slate-600">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        {shop.rating ?? '0.00'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/admin/catalog/products?shop_id=${shop.id}`)}>
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />{t('shops.viewProducts')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(shop)}>{t('common.edit')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(shop)}>
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-slate-500">
              <span>{t('common.page', { current: page, total: totalPages })}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common.previous')}</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('common.next')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ShopModal
        open={modalOpen}
        shop={editing}
        shopTypes={shopTypes}
        onClose={() => setModalOpen(false)}
        onSaved={fetchShops}
      />
    </div>
  )
}
