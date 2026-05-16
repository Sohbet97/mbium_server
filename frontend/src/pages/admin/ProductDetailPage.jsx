import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Trash2, Star, ImagePlus, PlusCircle, Package,
  CheckCircle, Pencil, Save, X,
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
import { toast } from 'sonner'

// ─── Images Tab ────────────────────────────────────────────────────────────────
// AddImageModal: no useEffect — parent passes key so it remounts fresh each open.

function AddImageModal({ open, productId, onClose, onSaved }) {
  const { t } = useTranslation()
  const [url,       setUrl]       = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [order,     setOrder]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  async function handleSave() {
    if (!url.trim()) return
    setError(''); setSaving(true)
    try {
      await AdminApi.products.images.create(productId, {
        url:        url.trim(),
        is_primary: isPrimary,
        order:      order !== '' ? Number(order) : undefined,
      })
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error adding image')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t('images.addImage')}</DialogTitle></DialogHeader>
        <DialogBody>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
          )}
          <FormField label={t('images.imageUrl')} required>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('images.order')}>
              <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} min={0} />
            </FormField>
            <div className="flex items-center justify-between rounded-md border px-3 py-2 self-end">
              <Label>{t('images.isPrimary')}</Label>
              <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !url.trim()}>
            {saving ? '…' : t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ImagesTab({ productId, images, onRefresh }) {
  const { t } = useTranslation()
  const [addOpen, setAddOpen] = useState(false)

  async function handleDelete(imageId) {
    if (!window.confirm(t('images.confirmDelete'))) return
    try {
      await AdminApi.products.images.delete(productId, imageId)
      toast.success(t('toast.deleted'))
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  async function handleSetPrimary(image) {
    // Create with is_primary:true first (backend clears all others), then remove old record
    try {
      await AdminApi.products.images.create(productId, {
        url: image.url, is_primary: true, order: image.order,
      })
      await AdminApi.products.images.delete(productId, image.id)
      toast.success(t('toast.updated'))
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
          <ImagePlus className="h-4 w-4" /> {t('images.addImage')}
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <ImagePlus className="h-10 w-10 mb-2 text-slate-200" />
          <p className="text-sm">{t('common.noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border bg-white">
              <img
                src={img.url}
                alt=""
                className="w-full aspect-square object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              {img.is_primary && (
                <div className="absolute top-2 left-2">
                  <Badge variant="default" className="text-xs gap-1">
                    <Star className="h-3 w-3 fill-current" /> {t('images.primary')}
                  </Badge>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(img)}
                    className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 transition-colors"
                    title={t('images.setPrimary')}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img.id)}
                  className="p-1.5 rounded-full bg-white/90 hover:bg-white text-red-600 transition-colors"
                  title={t('common.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-2 text-xs text-slate-400">#{img.order ?? '—'}</div>
            </div>
          ))}
        </div>
      )}

      {/* key remounts modal so state is always fresh */}
      <AddImageModal
        key={addOpen ? 'open' : 'closed'}
        open={addOpen}
        productId={productId}
        onClose={() => setAddOpen(false)}
        onSaved={() => { setAddOpen(false); onRefresh() }}
      />
    </div>
  )
}

// ─── Variants Tab ──────────────────────────────────────────────────────────────

const EMPTY_VARIANT = {
  name: '', sku: '', barcode: '', price: '',
  compare_at_price: '', stock: '0', attributes: '{}', is_active: true,
}

function buildVariantForm(variant) {
  if (!variant) return EMPTY_VARIANT
  return {
    name:             variant.name             ?? '',
    sku:              variant.sku              ?? '',
    barcode:          variant.barcode          ?? '',
    price:            variant.price            ?? '',
    compare_at_price: variant.compare_at_price ?? '',
    stock:            variant.stock            ?? 0,
    attributes:       JSON.stringify(variant.attributes ?? {}, null, 2),
    is_active:        variant.is_active        ?? true,
  }
}

function VariantModal({ open, productId, variant, onClose, onSaved }) {
  // No useEffect — parent uses key remount.
  const { t } = useTranslation()
  const [form,      setForm]      = useState(() => buildVariantForm(variant))
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [attrError, setAttrError] = useState('')

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave() {
    setError(''); setAttrError('')
    let attrs = {}
    try { attrs = JSON.parse(form.attributes || '{}') } catch {
      setAttrError('Invalid JSON'); return
    }
    setSaving(true)
    try {
      const payload = {
        name:             form.name,
        sku:              form.sku              || undefined,
        barcode:          form.barcode          || undefined,
        price:            form.price            !== '' ? Number(form.price)            : null,
        compare_at_price: form.compare_at_price !== '' ? Number(form.compare_at_price) : null,
        stock:            Number(form.stock),
        attributes:       attrs,
        is_active:        form.is_active,
      }
      if (variant?.id) {
        await AdminApi.products.variants.update(productId, variant.id, payload)
      } else {
        await AdminApi.products.variants.create(productId, payload)
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error saving variant')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{variant ? t('variants.editVariant') : t('variants.addVariant')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          <FormField label={t('variants.variantName')} required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Red / XL" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('variants.sku')}>
              <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} />
            </FormField>
            <FormField label={t('variants.barcode')}>
              <Input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('variants.price')}>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="Leave empty to inherit" />
            </FormField>
            <FormField label={t('variants.compareAtPrice')}>
              <Input type="number" min="0" step="0.01" value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('variants.stock')}>
            <Input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
          </FormField>
          <FormField label={t('variants.attributes')} error={attrError}>
            <Textarea
              value={form.attributes}
              onChange={(e) => set('attributes', e.target.value)}
              rows={4}
              className="font-mono text-xs"
              placeholder='{"color": "red", "size": "XL"}'
            />
          </FormField>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label>{t('variants.isActive')}</Label>
            <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? '…' : variant ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function VariantsTab({ productId, variants, onRefresh }) {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState(null)

  async function handleDelete(v) {
    if (!window.confirm(t('variants.confirmDelete'))) return
    try {
      await AdminApi.products.variants.delete(productId, v.id)
      toast.success(t('toast.deleted'))
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-2" onClick={() => { setEditing(null); setModalOpen(true) }}>
          <PlusCircle className="h-4 w-4" /> {t('variants.addVariant')}
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Package className="h-10 w-10 mb-2 text-slate-200" />
          <p className="text-sm">{t('common.noResults')}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">{t('variants.colName')}</th>
                  <th className="px-4 py-3">{t('variants.colSku')}</th>
                  <th className="px-4 py-3">{t('variants.colPrice')}</th>
                  <th className="px-4 py-3">{t('variants.colStock')}</th>
                  <th className="px-4 py-3">Attributes</th>
                  <th className="px-4 py-3">{t('variants.colActive')}</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{v.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">{v.sku || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {v.price != null
                        ? `${v.price} TMT`
                        : <span className="text-slate-400">Inherited</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{v.stock}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono max-w-[120px] truncate">
                      {Object.keys(v.attributes ?? {}).length > 0
                        ? Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(', ')
                        : '—'
                      }
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={v.is_active ? 'success' : 'secondary'}>
                        {v.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setEditing(v); setModalOpen(true) }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(v)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* key remounts modal so form is always fresh */}
      <VariantModal
        key={modalOpen ? (editing?.id ?? 'create') : 'closed'}
        open={modalOpen}
        productId={productId}
        variant={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); onRefresh() }}
      />
    </div>
  )
}

// ─── SEO Tab ───────────────────────────────────────────────────────────────────

function SeoTab({ product, onRefresh }) {
  const { t } = useTranslation()
  const [form,    setForm]    = useState({ seo_title: '', seo_description: '' })
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  function startEdit() {
    setForm({ seo_title: product.seo_title ?? '', seo_description: product.seo_description ?? '' })
    setEditing(true)
  }

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      // Include all validator-required fields from the product alongside SEO fields
      await AdminApi.products.update(product.id, {
        shop_id:         product.shop_id,
        category_id:     product.category_id,
        name:            product.name,
        price:           product.price,
        seo_title:       form.seo_title       || null,
        seo_description: form.seo_description || null,
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
      <div className="space-y-4 max-w-2xl">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={startEdit}>
            <Pencil className="h-4 w-4 mr-1.5" />{t('common.edit')}
          </Button>
        </div>
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-0.5">{t('products.seoTitle')}</p>
              <p className="text-sm">{product.seo_title || <span className="text-slate-300">—</span>}</p>
              {product.seo_title && <p className="text-xs text-slate-400">{product.seo_title.length}/70</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-0.5">{t('products.seoDescription')}</p>
              <p className="text-sm">{product.seo_description || <span className="text-slate-300">—</span>}</p>
              {product.seo_description && (
                <p className="text-xs text-slate-400">{product.seo_description.length}/160</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
      <FormField label={t('products.seoTitle')} hint={t('products.seoTitleHint')}>
        <Input value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} maxLength={70} />
        <p className="text-xs text-slate-400 mt-0.5">{form.seo_title.length}/70</p>
      </FormField>
      <FormField label={t('products.seoDescription')} hint={t('products.seoDescHint')}>
        <Textarea
          value={form.seo_description}
          onChange={(e) => set('seo_description', e.target.value)}
          rows={3}
          maxLength={160}
        />
        <p className="text-xs text-slate-400 mt-0.5">{form.seo_description.length}/160</p>
      </FormField>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
          <X className="h-4 w-4 mr-1" />{t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />{saving ? '…' : t('common.save')}
        </Button>
      </div>
    </div>
  )
}

// ─── Info Tab ──────────────────────────────────────────────────────────────────

function InfoTab({ product, shops, categories, onRefresh }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  function startEdit() {
    setError('')
    setForm({
      name:             product.name             ?? '',
      name_ru:          product.name_ru          ?? '',
      name_eng:         product.name_eng         ?? '',
      shop_id:          product.shop_id          ?? '',
      category_id:      product.category_id      ?? '',
      price:            product.price            ?? '',
      compare_at_price: product.compare_at_price ?? '',
      currency:         product.currency         ?? 'TMT',
      sku:              product.sku              ?? '',
      barcode:          product.barcode          ?? '',
      weight:           product.weight           ?? '',
      stock:            product.stock            ?? 0,
      tags:             (product.tags ?? []).join(', '),
      handle:           product.handle           ?? '',
      description:      product.description      ?? '',
      is_active:        product.is_active        ?? true,
    })
    setEditing(true)
  }

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      await AdminApi.products.update(product.id, {
        shop_id:          Number(form.shop_id),
        category_id:      Number(form.category_id),
        name:             form.name,
        name_ru:          form.name_ru      || null,
        name_eng:         form.name_eng     || null,
        description:      form.description  || null,
        price:            Number(form.price),
        compare_at_price: form.compare_at_price !== '' ? Number(form.compare_at_price) : null,
        currency:         form.currency,
        sku:              form.sku          || null,
        barcode:          form.barcode      || null,
        weight:           form.weight !== '' ? Number(form.weight) : null,
        stock:            Number(form.stock),
        tags:             form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
        handle:           form.handle       || null,
        is_active:        form.is_active,
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
              <p className="text-sm">🇹🇲 {product.name}</p>
              {product.name_ru  && <p className="text-sm">🇷🇺 {product.name_ru}</p>}
              {product.name_eng && <p className="text-sm">🇬🇧 {product.name_eng}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('products.shop')}</span>
                <span>{product.shop?.name ?? product.shop_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('products.category')}</span>
                <span>{product.category?.name ?? product.category_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('products.price')}</span>
                <span className="font-semibold">{product.price} {product.currency}</span>
              </div>
              {product.compare_at_price && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('products.compareAtPrice')}</span>
                  <span className="line-through text-slate-400">{product.compare_at_price} {product.currency}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{t('products.stock')}</span>
                <span>{product.stock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('products.sku')}</span>
                <span className="font-mono">{product.sku || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('products.isActive')}</span>
                <Badge variant={product.is_active ? 'success' : 'secondary'}>
                  {product.is_active ? t('common.active') : t('common.inactive')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {product.description && (
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('common.description')}</CardTitle></CardHeader>
            <CardContent className="pt-0 text-sm text-slate-600 whitespace-pre-wrap">
              {product.description}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            {product.rating}
          </span>
          <span>{product.review_count} reviews</span>
        </div>

        {(product.barcode || product.weight || product.handle || product.tags?.length > 0) && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Extended Info</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-1 text-sm">
              {product.barcode && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('products.barcode')}</span>
                  <span className="font-mono">{product.barcode}</span>
                </div>
              )}
              {product.weight && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('products.weight')}</span>
                  <span>{product.weight} g</span>
                </div>
              )}
              {product.handle && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('products.handle')}</span>
                  <span className="font-mono text-xs">{product.handle}</span>
                </div>
              )}
              {product.tags?.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('products.tags')}</span>
                  <span className="text-right">{product.tags.join(', ')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
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
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('products.price')} required>
          <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} />
        </FormField>
        <FormField label={t('products.compareAtPrice')} hint={t('products.compareAtPriceHint')}>
          <Input type="number" min="0" step="0.01" value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} />
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormField label={t('products.stock')}>
          <Input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
        </FormField>
        <FormField label={t('products.sku')}>
          <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} />
        </FormField>
        <FormField label={t('products.barcode')}>
          <Input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('products.weight')}>
          <Input type="number" min="0" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
        </FormField>
        <FormField label={t('products.handle')} hint={t('products.handleHint')}>
          <Input value={form.handle} onChange={(e) => set('handle', e.target.value)} placeholder="red-sneakers" />
        </FormField>
      </div>
      <FormField label={t('products.tags')} hint={t('products.tagsHint')}>
        <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="sale, new, featured" />
      </FormField>
      <FormField label={t('common.description')}>
        <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} />
      </FormField>
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <Label>{t('products.isActive')}</Label>
        <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
          <X className="h-4 w-4 mr-1" />{t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />{saving ? '…' : t('common.save')}
        </Button>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { t }      = useTranslation()

  const [product,     setProduct]     = useState(null)
  const [shops,       setShops]       = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [refreshTick, setRefreshTick] = useState(0)

  function refresh() { setLoading(true); setRefreshTick((k) => k + 1) }

  // Fetch product — re-runs on id change or manual refresh
  useEffect(() => {
    let cancelled = false

    AdminApi.products.getOne(id)
      .then(({ data }) => {
        if (cancelled) return
        // Backend returns { model } — not { data }
        setProduct(data.model ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) navigate('/admin/catalog/products')
      })

    return () => { cancelled = true }
  }, [id, navigate, refreshTick])

  // Fetch shops and categories once for the InfoTab edit form
  useEffect(() => {
    Promise.all([
      AdminApi.shops.getAll({ limit: 500 }),
      AdminApi.categories.getAll({ limit: 500 }),
    ]).then(([s, c]) => {
      // GET /admin/shops and /admin/categories both return { data: [...], count: N }
      setShops(s.data?.data       ?? [])
      setCategories(c.data?.data  ?? [])
    }).catch(() => {})
  }, [])

  if (loading || !product) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/catalog/products')} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          {primaryImage?.url
            ? <img src={primaryImage.url} alt="" className="h-14 w-14 rounded-lg object-cover border" />
            : (
              <div className="h-14 w-14 rounded-lg bg-slate-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-slate-300" />
              </div>
            )
          }
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{product.name}</h2>
            <p className="text-sm text-slate-400">ID #{product.id} · {product.shop?.name ?? '—'}</p>
          </div>
        </div>
        <Badge variant={product.is_active ? 'success' : 'secondary'} className="mt-2">
          {product.is_active ? t('common.active') : t('common.inactive')}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">{t('products.tabInfo')}</TabsTrigger>
          <TabsTrigger value="images">
            {t('products.tabImages')}
            {product.images?.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">{product.images.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="variants">
            {t('products.tabVariants')}
            {product.variants?.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">{product.variants.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="seo">{t('products.tabSeo')}</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <InfoTab product={product} shops={shops} categories={categories} onRefresh={refresh} />
        </TabsContent>
        <TabsContent value="images">
          <ImagesTab productId={product.id} images={product.images ?? []} onRefresh={refresh} />
        </TabsContent>
        <TabsContent value="variants">
          <VariantsTab productId={product.id} variants={product.variants ?? []} onRefresh={refresh} />
        </TabsContent>
        <TabsContent value="seo">
          <SeoTab product={product} onRefresh={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
