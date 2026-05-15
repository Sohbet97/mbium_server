import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw, MoreHorizontal, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
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
  shop_id: '', category_id: '',
  price: '', currency: 'TMT', sku: '', stock: '0',
  description: '', is_active: true,
}

function ProductModal({ open, product, shops, categories, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setForm(product
        ? {
          name: product.name ?? '', name_ru: product.name_ru ?? '', name_eng: product.name_eng ?? '',
          shop_id: product.shop_id ?? '', category_id: product.category_id ?? '',
          price: product.price ?? '', currency: product.currency ?? 'TMT',
          sku: product.sku ?? '', stock: product.stock ?? 0,
          description: product.description ?? '', is_active: product.is_active ?? true,
        }
        : EMPTY_FORM
      )
    }
  }, [open, product])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        shop_id: Number(form.shop_id),
        category_id: Number(form.category_id),
        price: Number(form.price),
        stock: Number(form.stock),
      }
      if (product?.id) {
        await AdminApi.products.update(product.id, payload)
      } else {
        await AdminApi.products.create(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error saving product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? t('products.editProduct') : t('products.createProduct')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <MultiLangInput baseField="name" label={t('common.name')} required values={form} onChange={set} />

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('products.shop')} required>
              <Select value={form.shop_id} onChange={(e) => set('shop_id', e.target.value)}>
                <option value="">{t('products.selectShop')}</option>
                {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormField>
            <FormField label={t('products.category')} required>
              <Select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">{t('products.selectCategory')}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label={t('products.price')} required>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} />
            </FormField>
            <FormField label={t('products.stock')}>
              <Input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            </FormField>
            <FormField label={t('products.sku')}>
              <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="SKU-001" />
            </FormField>
          </div>

          <FormField label={t('common.description')}>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
          </FormField>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label>{t('products.isActive')}</Label>
            <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('common.loading') : product ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ProductsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [shopFilter, setShopFilter] = useState(searchParams.get('shop_id') ?? '')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const limit = 20

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit }
      if (search) params.search = search
      if (shopFilter) params.shop_id = shopFilter
      if (categoryFilter) params.category_id = categoryFilter
      const { data } = await AdminApi.products.getAll(params)
      setProducts(data?.data ?? data.data?.products ?? [])
      setTotal(data?.count ?? data.data?.total ?? 0)
    } catch { setProducts([]) }
    finally { setLoading(false) }
  }, [page, search, shopFilter, categoryFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    Promise.all([
      AdminApi.shops.getAll({ limit: 500 }),
      AdminApi.categories.getAll({ limit: 500 }),
    ]).then(([shopsRes, catsRes]) => {
      setShops(shopsRes.data?.data?.rows ?? shopsRes.data?.data?.shops ?? [])
      setCategories(catsRes.data?.data?.rows ?? catsRes.data?.data?.categories ?? [])
    }).catch(() => {})
  }, [])

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return
    await AdminApi.products.delete(product.id).catch(() => {})
    fetchProducts()
  }

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(p) { setEditing(p); setModalOpen(true) }
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('products.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('products.totalCount', { count: total })}</p>
        </div>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> {t('products.addProduct')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('products.searchPlaceholder')}
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={shopFilter} onChange={(e) => { setShopFilter(e.target.value); setPage(1) }} className="w-44">
          <option value="">{t('products.filterShop')}</option>
          {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="w-44">
          <option value="">{t('products.filterCategory')}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Button variant="ghost" size="icon" onClick={fetchProducts} className="h-9 w-9" title={t('common.refresh')}>
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
                  <th className="px-4 py-3">{t('products.colShop')}</th>
                  <th className="px-4 py-3">{t('products.colCategory')}</th>
                  <th className="px-4 py-3">{t('products.colPrice')}</th>
                  <th className="px-4 py-3">{t('products.colStock')}</th>
                  <th className="px-4 py-3">{t('products.colStatus')}</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading && products.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">{t('common.loading')}</td></tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Package className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{t('common.noResults')}</p>
                    </td>
                  </tr>
                ) : products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/catalog/products/${p.id}`)}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        {p.images?.[0]?.url
                          ? <img src={p.images[0].url} alt="" className="h-10 w-10 rounded object-cover border" />
                          : <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center"><Package className="h-4 w-4 text-slate-300" /></div>
                        }
                        <div>
                          <p className="text-sm font-medium text-slate-900 max-w-[200px] truncate">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.sku || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.shop?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.price} {p.currency}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.stock}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.is_active ? 'success' : 'secondary'}>
                        {p.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/admin/catalog/products/${p.id}`)}>
                            {t('products.tabInfo')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(p)}>{t('common.edit')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(p)}>
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

      <ProductModal
        open={modalOpen}
        product={editing}
        shops={shops}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSaved={fetchProducts}
      />
    </div>
  )
}
