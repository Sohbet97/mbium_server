import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Save, X, Search, Package, Layers, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MultiLangInput } from '@/components/common/MultiLangInput'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'
import { absUrl } from '@/lib/utils'
import { toast } from 'sonner'

const EMPTY_FORM = {
  name: '', name_ru: '', name_eng: '',
  description: '', image_url: '',
  handle: '', seo_title: '', seo_description: '',
  sort_order: '0', is_active: true,
}

function buildForm(col) {
  if (!col) return EMPTY_FORM
  return {
    name:            col.name            ?? '',
    name_ru:         col.name_ru         ?? '',
    name_eng:        col.name_eng        ?? '',
    description:     col.description     ?? '',
    image_url:       col.image_url       ?? '',
    handle:          col.handle          ?? '',
    seo_title:       col.seo_title       ?? '',
    seo_description: col.seo_description ?? '',
    sort_order:      col.sort_order      ?? 0,
    is_active:       col.is_active       ?? true,
  }
}

// ─── Product search + management (edit mode) ───────────────────────────────────

function ProductsSection({ collectionId, products, onRefresh }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await AdminApi.collections.searchProducts({ q: query, collection_id: collectionId })
        const currentIds = new Set(products.map((p) => p.id))
        setResults((data?.data ?? []).filter((p) => !currentIds.has(p.id)))
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query, products, collectionId])

  async function handleAdd(product) {
    try {
      await AdminApi.collections.addProduct(collectionId, { product_id: product.id })
      setQuery('')
      setResults([])
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  async function handleRemove(productId) {
    try {
      await AdminApi.collections.removeProduct(collectionId, productId)
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder={t('collections.searchProductsPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Search results dropdown */}
      {(results.length > 0 || searching) && (
        <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
          {searching ? (
            <div className="px-4 py-3 text-sm text-slate-400">{t('common.loading')}</div>
          ) : results.map((p) => (
            <button
              key={p.id}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 transition-colors text-left border-b last:border-0"
              onClick={() => handleAdd(p)}
            >
              {(() => { const pm = p.productMedia?.[0]; const src = absUrl(pm?.media?.thumbnail_url || pm?.media?.url); return src
                ? <img src={src} alt="" className="h-8 w-8 rounded object-cover border shrink-0" />
                : <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center shrink-0"><Package className="h-3.5 w-3.5 text-slate-300" /></div>
              })()}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                <p className="text-xs text-slate-400">{p.price} {p.currency} · {p.sku || '—'}</p>
              </div>
              <span className="text-xs text-blue-600 shrink-0">{t('common.add')}</span>
            </button>
          ))}
        </div>
      )}

      {/* Current products */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 gap-2">
          <Package className="h-8 w-8 text-slate-200" />
          <p className="text-sm">{t('collections.noProducts')}</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0 hover:bg-slate-50">
              {(() => { const pm = p.productMedia?.[0]; const src = absUrl(pm?.media?.thumbnail_url || pm?.media?.url); return src
                ? <img src={src} alt="" className="h-9 w-9 rounded object-cover border shrink-0" />
                : <div className="h-9 w-9 rounded bg-slate-100 flex items-center justify-center shrink-0"><Package className="h-3.5 w-3.5 text-slate-300" /></div>
              })()}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                <p className="text-xs text-slate-400">{p.price} {p.currency} · {t('products.stock')}: {p.stock}</p>
              </div>
              <button
                onClick={() => handleRemove(p.id)}
                className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                title={t('common.delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CollectionFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [collection, setCollection] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)

  function refresh() { setRefreshTick((k) => k + 1) }
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    setLoading(true)
    AdminApi.collections.getOne(id)
      .then(({ data }) => {
        if (cancelled) return
        const col = data.model ?? null
        setCollection(col)
        setForm(buildForm(col))
        setLoading(false)
      })
      .catch(() => { if (!cancelled) navigate('/admin/catalog/collections') })
    return () => { cancelled = true }
  }, [id, isEdit, navigate, refreshTick])

  async function handleSave() {
    setError(''); setSaving(true)
    try {
      const payload = {
        name:            form.name,
        name_ru:         form.name_ru         || null,
        name_eng:        form.name_eng        || null,
        description:     form.description     || null,
        image_url:       form.image_url       || null,
        handle:          form.handle          || null,
        seo_title:       form.seo_title       || null,
        seo_description: form.seo_description || null,
        sort_order:      Number(form.sort_order) || 0,
        is_active:       form.is_active,
      }
      if (isEdit) {
        await AdminApi.collections.update(id, payload)
        toast.success(t('toast.updated'))
        refresh()
      } else {
        const { data } = await AdminApi.collections.create(payload)
        const newId = data?.model?.id ?? data?.id
        toast.success(t('toast.created'))
        navigate(`/admin/catalog/collections/${newId}/edit`, { replace: true })
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

  const pageTitle = isEdit ? (collection?.name || t('collections.editCollection')) : t('collections.createCollection')

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/catalog/collections')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 truncate">{pageTitle}</h2>
            {isEdit && <p className="text-xs text-slate-400 mt-0.5">ID #{id}</p>}
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">

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
                  placeholder={t('collections.descriptionPlaceholder')}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{t('nav.products')}</CardTitle>
                {isEdit && collection?.products?.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{collection.products.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isEdit ? (
                <ProductsSection
                  collectionId={id}
                  products={collection?.products ?? []}
                  onRefresh={refresh}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 gap-2">
                  <Layers className="h-8 w-8 text-slate-200" />
                  <p className="text-sm">{t('collections.saveToAddProducts')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('products.tabSeo')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <FormField label={t('products.seoTitle')} hint={t('products.seoTitleHint')}>
                <Input value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} maxLength={70} />
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

        {/* ── Right Sidebar ────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('common.status')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('products.isActive')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{form.is_active ? t('common.active') : t('common.inactive')}</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
              </div>
              {isEdit && (
                <div className="mt-3 pt-3 border-t">
                  <Badge variant={collection?.is_active ? 'success' : 'secondary'} className="text-xs">
                    {collection?.is_active ? t('common.active') : t('common.inactive')}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('collections.image')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {form.image_url && (
                <div className="relative rounded-lg overflow-hidden border aspect-video bg-slate-50">
                  <img
                    src={absUrl(form.image_url)} alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
              )}
              <FormField label={t('collections.imageUrl')}>
                <Input
                  value={form.image_url}
                  onChange={(e) => set('image_url', e.target.value)}
                  placeholder="https://…"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Handle & Order */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              <FormField label={t('products.handle')} hint={t('products.handleHint')}>
                <Input
                  value={form.handle}
                  onChange={(e) => set('handle', e.target.value)}
                  placeholder="summer-collection"
                />
              </FormField>
              <FormField label={t('collections.sortOrder')}>
                <Input
                  type="number" min="0"
                  value={form.sort_order}
                  onChange={(e) => set('sort_order', e.target.value)}
                  className="max-w-[100px]"
                />
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
