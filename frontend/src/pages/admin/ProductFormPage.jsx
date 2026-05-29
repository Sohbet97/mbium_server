import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Save, Package, X, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MultiLangInput } from '@/components/common/MultiLangInput'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'
import { ProductMediaManager } from '@/components/media/ProductMediaManager'
import { toast } from 'sonner'

const EMPTY_FORM = {
  name: '', name_ru: '', name_eng: '',
  description: '',
  shop_id: '', category_id: '',
  price: '', compare_at_price: '', cost_price: '',
  currency: 'TMT',
  sku: '', barcode: '', stock: '0',
  track_inventory: true, sell_when_out_of_stock: false,
  is_physical: true, weight: '',
  tags: '', handle: '',
  seo_title: '', seo_description: '',
  is_active: true,
  is_published: true,
  scheduled_at: '',
  brand_id: '',
  supplier_id: '',
}

function buildForm(product) {
  if (!product) return EMPTY_FORM
  return {
    name:                   product.name                   ?? '',
    name_ru:                product.name_ru                ?? '',
    name_eng:               product.name_eng               ?? '',
    description:            product.description            ?? '',
    shop_id:                product.shop_id                ?? '',
    category_id:            product.category_id            ?? '',
    price:                  product.price                  ?? '',
    compare_at_price:       product.compare_at_price       ?? '',
    cost_price:             product.cost_price             ?? '',
    currency:               product.currency               ?? 'TMT',
    sku:                    product.sku                    ?? '',
    barcode:                product.barcode                ?? '',
    stock:                  product.stock                  ?? 0,
    track_inventory:        product.track_inventory        ?? true,
    sell_when_out_of_stock: product.sell_when_out_of_stock ?? false,
    is_physical:            product.is_physical            ?? true,
    weight:                 product.weight                 ?? '',
    tags:                   (product.tags ?? []).join(', '),
    handle:                 product.handle                 ?? '',
    seo_title:              product.seo_title              ?? '',
    seo_description:        product.seo_description        ?? '',
    is_active:              product.is_active              ?? true,
    is_published:           product.is_published           ?? true,
    scheduled_at:           product.scheduled_at
      ? new Date(product.scheduled_at).toISOString().slice(0, 16)
      : '',
    brand_id:               product.brand_id    ?? '',
    supplier_id:            product.supplier_id ?? '',
  }
}

// ─── Toggle Row ────────────────────────────────────────────────────────────────

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0 mt-0.5" />
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [product, setProduct] = useState(null)
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)

  function refresh() { setRefreshTick((k) => k + 1) }
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  useEffect(() => {
    Promise.all([
      AdminApi.shops.getAll({ limit: 500 }),
      AdminApi.categories.getAll({ limit: 500 }),
      AdminApi.brands.getAll({ limit: 500, is_active: true }),
      AdminApi.suppliers.getAll({ limit: 500, is_active: true }),
    ]).then(([s, c, br, su]) => {
      setShops(s.data?.data ?? [])
      setCategories(c.data?.data ?? [])
      setBrands(br.data?.data ?? [])
      setSuppliers(su.data?.data ?? [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    setLoading(true)
    AdminApi.products.getOne(id)
      .then(({ data }) => {
        if (cancelled) return
        const p = data.model ?? null
        setProduct(p)
        setForm(buildForm(p))
        setLoading(false)
      })
      .catch(() => { if (!cancelled) navigate('/admin/catalog/products') })
    return () => { cancelled = true }
  }, [id, isEdit, navigate, refreshTick])

  async function handleSave() {
    setError(''); setSaving(true)
    try {
      const payload = {
        name:                   form.name,
        name_ru:                form.name_ru                || null,
        name_eng:               form.name_eng               || null,
        description:            form.description            || null,
        shop_id:                Number(form.shop_id),
        category_id:            Number(form.category_id),
        price:                  Number(form.price),
        compare_at_price:       form.compare_at_price !== '' ? Number(form.compare_at_price) : null,
        cost_price:             form.cost_price      !== '' ? Number(form.cost_price)      : null,
        currency:               form.currency,
        sku:                    form.sku             || null,
        barcode:                form.barcode         || null,
        stock:                  Number(form.stock),
        track_inventory:        form.track_inventory,
        sell_when_out_of_stock: form.sell_when_out_of_stock,
        is_physical:            form.is_physical,
        weight:                 form.weight !== ''   ? Number(form.weight) : null,
        tags:                   form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
        handle:                 form.handle          || null,
        seo_title:              form.seo_title        || null,
        seo_description:        form.seo_description  || null,
        is_active:              form.is_active,
        is_published:           form.is_published,
        scheduled_at:           form.scheduled_at || null,
        brand_id:               form.brand_id    ? Number(form.brand_id)    : null,
        supplier_id:            form.supplier_id ? Number(form.supplier_id) : null,
      }
      if (isEdit) {
        await AdminApi.products.update(id, payload)
        toast.success(t('toast.updated'))
        refresh()
      } else {
        const { data } = await AdminApi.products.create(payload)
        const newId = data?.data?.id ?? data?.model?.id ?? data?.id
        toast.success(t('toast.created'))
        navigate(`/admin/catalog/products/${newId}/edit`, { replace: true })
      }
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const pageTitle = isEdit ? (product?.name || t('products.editProduct')) : t('products.createProduct')
  const variantCount = product?.variants?.length ?? 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/catalog/products')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 truncate">{pageTitle}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? `ID #${id}` : t('products.newProductHint')}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="shrink-0 gap-2">
          <Save className="h-4 w-4" />
          {saving ? t('common.loading') : t('common.save')}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <X className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

        {/* ── Left Column ─────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Name & Description */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              <MultiLangInput baseField="name" label={t('common.name')} required values={form} onChange={set} />
              <FormField label={t('common.description')}>
                <Textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={5}
                  placeholder={t('products.descriptionPlaceholder')}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Media / Images */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('products.media')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isEdit ? (
                <ProductMediaManager productId={id} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 gap-2">
                  <Package className="h-8 w-8 text-slate-200" />
                  <p className="text-sm">{t('products.saveToAddImages')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('products.category')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">{t('products.selectCategory')}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('products.pricing')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('products.price')} required>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="0.00"
                  />
                </FormField>
                <FormField label={t('products.compareAtPrice')} hint={t('products.compareAtPriceHint')}>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.compare_at_price}
                    onChange={(e) => set('compare_at_price', e.target.value)}
                    placeholder="0.00"
                  />
                </FormField>
              </div>
              <FormField label={t('products.costPrice')} hint={t('products.costPriceHint')}>
                <Input
                  type="number" min="0" step="0.01"
                  value={form.cost_price}
                  onChange={(e) => set('cost_price', e.target.value)}
                  placeholder="0.00"
                  className="max-w-[200px]"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('products.inventory')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('products.sku')}>
                  <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="SKU-001" />
                </FormField>
                <FormField label={t('products.barcode')}>
                  <Input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
                </FormField>
              </div>

              <div className="border-t pt-4 space-y-1 divide-y divide-slate-100">
                <ToggleRow
                  label={t('products.trackInventory')}
                  hint={t('products.trackInventoryHint')}
                  checked={form.track_inventory}
                  onChange={(v) => set('track_inventory', v)}
                />
                {form.track_inventory && (
                  <div className="pt-3">
                    <FormField label={t('products.stock')}>
                      <Input
                        type="number" min="0"
                        value={form.stock}
                        onChange={(e) => set('stock', e.target.value)}
                        className="max-w-[160px]"
                      />
                    </FormField>
                  </div>
                )}
                <ToggleRow
                  label={t('products.sellWhenOutOfStock')}
                  hint={t('products.sellWhenOutOfStockHint')}
                  checked={form.sell_when_out_of_stock}
                  onChange={(v) => set('sell_when_out_of_stock', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('products.shipping')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <ToggleRow
                label={t('products.isPhysical')}
                hint={t('products.isPhysicalHint')}
                checked={form.is_physical}
                onChange={(v) => set('is_physical', v)}
              />
              {form.is_physical && (
                <FormField label={t('products.weight')}>
                  <Input
                    type="number" min="0"
                    value={form.weight}
                    onChange={(e) => set('weight', e.target.value)}
                    placeholder="0"
                    className="max-w-[160px]"
                  />
                </FormField>
              )}
            </CardContent>
          </Card>

          {/* Variants (edit mode — summary + link) */}
          {isEdit && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{t('products.tabVariants')}</CardTitle>
                  {variantCount > 0 && (
                    <Badge variant="secondary" className="text-xs">{variantCount}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {variantCount === 0 ? (
                  <p className="text-sm text-slate-400">{t('products.noVariantsHint')}</p>
                ) : (
                  <div className="space-y-1">
                    {product.variants.slice(0, 3).map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-sm py-1">
                        <span className="text-slate-700">{v.name}</span>
                        <span className="text-slate-400">{v.price != null ? `${v.price} TMT` : '—'} · {v.stock}</span>
                      </div>
                    ))}
                    {variantCount > 3 && (
                      <p className="text-xs text-slate-400">+{variantCount - 3} {t('products.moreVariants')}</p>
                    )}
                  </div>
                )}
                <Button
                  variant="outline" size="sm" className="mt-3 w-full gap-2"
                  onClick={() => navigate(`/admin/catalog/products/${id}`)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t('products.manageVariants')}
                </Button>
              </CardContent>
            </Card>
          )}

        </div>

        {/* ── Right Column / Sidebar ───────────────────────────── */}
        <div className="space-y-5">

          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('common.status')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ToggleRow
                label={t('products.isActive')}
                checked={form.is_active}
                onChange={(v) => set('is_active', v)}
              />
              {isEdit && (
                <div className="mt-2 pt-3 border-t">
                  <Badge variant={product?.is_active ? 'success' : 'secondary'} className="text-xs">
                    {product?.is_active ? t('common.active') : t('common.inactive')}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('products.scheduling')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <ToggleRow
                label={t('products.isPublished')}
                hint={t('products.isPublishedHint')}
                checked={form.is_published}
                onChange={(v) => set('is_published', v)}
              />
              <FormField label={t('products.scheduledAt')} hint={t('products.scheduledAtHint')}>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => set('scheduled_at', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Organization — shop, brand, supplier */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('products.organization')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <FormField label={t('products.shop')} required>
                <Select value={form.shop_id} onChange={(e) => set('shop_id', e.target.value)}>
                  <option value="">{t('products.selectShop')}</option>
                  {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </FormField>
              {brands.length > 0 && (
                <FormField label={t('products.brand')}>
                  <Select value={form.brand_id} onChange={(e) => set('brand_id', e.target.value)}>
                    <option value="">{t('products.noBrand')}</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Select>
                </FormField>
              )}
              {suppliers.length > 0 && (
                <FormField label={t('products.supplier')}>
                  <Select value={form.supplier_id} onChange={(e) => set('supplier_id', e.target.value)}>
                    <option value="">{t('products.noSupplier')}</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </FormField>
              )}
            </CardContent>
          </Card>

          {/* Tags & Handle */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              <FormField label={t('products.tags')} hint={t('products.tagsHint')}>
                <Input
                  value={form.tags}
                  onChange={(e) => set('tags', e.target.value)}
                  placeholder="sale, new, featured"
                />
              </FormField>
              <FormField label={t('products.handle')} hint={t('products.handleHint')}>
                <Input
                  value={form.handle}
                  onChange={(e) => set('handle', e.target.value)}
                  placeholder="red-sneakers"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('products.tabSeo')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <FormField label={t('products.seoTitle')} hint={t('products.seoTitleHint')}>
                <Input
                  value={form.seo_title}
                  onChange={(e) => set('seo_title', e.target.value)}
                  maxLength={70}
                />
                <p className="text-xs text-slate-400 mt-0.5">{(form.seo_title || '').length}/70</p>
              </FormField>
              <FormField label={t('products.seoDescription')} hint={t('products.seoDescHint')}>
                <Textarea
                  value={form.seo_description}
                  onChange={(e) => set('seo_description', e.target.value)}
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-slate-400 mt-0.5">{(form.seo_description || '').length}/160</p>
              </FormField>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Bottom Save */}
      <div className="flex justify-end pb-6">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </div>
  )
}
