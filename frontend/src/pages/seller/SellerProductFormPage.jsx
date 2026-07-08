import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Loader2, Save, Layers } from 'lucide-react'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
function imgUrl(p) { return p ? (p.startsWith('http') ? p : `${BASE}${p}`) : null }

const EMPTY_FORM = {
  name: '', name_ru: '', name_eng: '',
  category_id: '',
  description: '',
  brand_id: '',
  is_active: true,
}

// ── Variant summary row (read-only — editing happens on the variant's own page) ──
function VariantSummaryRow({ productId, vr }) {
  const thumb = vr.media?.[0]?.media?.thumbnail_url || vr.media?.[0]?.media?.url
  const sizes = vr.sizes ?? []
  const totalStock = sizes.length > 0
    ? sizes.reduce((sum, s) => sum + (s.stock ?? 0), 0)
    : (vr.stock ?? 0)

  const prices = sizes.length > 0
    ? sizes.map((s) => parseFloat(s.price ?? vr.price ?? 0)).filter((p) => !Number.isNaN(p))
    : (vr.price ? [parseFloat(vr.price)] : [])
  const minPrice = prices.length ? Math.min(...prices) : null
  const maxPrice = prices.length ? Math.max(...prices) : null

  const attrs = Object.entries(vr.attributes || {})

  return (
    <Link
      to={`/seller/products/${productId}/variants/${vr.id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
    >
      {thumb
        ? <img src={imgUrl(thumb)} alt={vr.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
        : <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-white/10 shrink-0" />
      }

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium dark:text-white truncate">{vr.name}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
            vr.is_active
              ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400'
              : 'bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-500'
          }`}>
            {vr.is_active ? 'Işjeň' : 'Öçürilen'}
          </span>
        </div>
        {attrs.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {attrs.map(([k, val]) => (
              <span key={k} className="text-[10px] bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5">
                {k}: {val}
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-0.5">
          {minPrice != null
            ? (minPrice === maxPrice ? `${minPrice.toFixed(2)} TMT` : `${minPrice.toFixed(2)}–${maxPrice.toFixed(2)} TMT`)
            : 'Baha ýok'}
          {' · '}Stok: {totalStock}
          {sizes.length > 0 && ` · ${sizes.length} ölçeg`}
        </p>
      </div>
    </Link>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm]             = useState(EMPTY_FORM)
  const [categories, setCategories] = useState([])
  const [brands, setBrands]         = useState([])
  const [variants, setVariants]     = useState([])
  const [loading, setLoading]       = useState(isEdit)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    SellerApi.categories.getAll().then(({ data }) => setCategories(data.data ?? [])).catch(() => {})
    SellerApi.brands.getAll().then(({ data }) => setBrands(data.data ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    SellerApi.products.getOne(id)
      .then(({ data }) => {
        const p = data.model
        setForm({
          name:        p.name        ?? '',
          name_ru:     p.name_ru     ?? '',
          name_eng:    p.name_eng    ?? '',
          category_id: p.category_id ?? '',
          description: p.description ?? '',
          brand_id:    p.brand_id    ?? '',
          is_active:   p.is_active   ?? true,
        })
        setVariants(p.variants ?? [])
      })
      .catch(() => { toast.error('Haryt tapylmady'); navigate('/seller/products') })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate])

  const set = (k, val) => setForm((f) => ({ ...f, [k]: val }))

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim())    { toast.error('Haryt adyny giriziň'); return }
    if (!form.category_id)    { toast.error('Kategoriýa saýlaň');    return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id),
        brand_id:    form.brand_id ? Number(form.brand_id) : null,
      }

      if (isEdit) {
        await SellerApi.products.update(id, payload)
        toast.success('Haryt ýatda saklandy')
      } else {
        const { data } = await SellerApi.products.create(payload)
        toast.success('Haryt döredildi — indi görnüş goşuň')
        navigate(`/seller/products/${data.model.id}/edit`, { replace: true })
      }
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/seller/products')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">
          {isEdit ? 'Harydy üýtget' : 'Täze haryt'}
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── Basic info ─────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Haryt maglumatlary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-1 block">Kategoriýa <span className="text-red-500">*</span></Label>
              <select
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
                className="w-full h-9 border rounded-md px-3 text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">— Saýlaň —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {brands.length > 0 && (
              <div>
                <Label className="mb-1 block">Brend</Label>
                <select
                  value={form.brand_id}
                  onChange={(e) => set('brand_id', e.target.value)}
                  className="w-full h-9 border rounded-md px-3 text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Brend ýok —</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="mb-1 block">Ady (TM) <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div>
                <Label className="mb-1 block">Ady (RU)</Label>
                <Input value={form.name_ru} onChange={(e) => set('name_ru', e.target.value)} />
              </div>
              <div>
                <Label className="mb-1 block">Ady (EN)</Label>
                <Input value={form.name_eng} onChange={(e) => set('name_eng', e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Beýany</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Haryt barada maglumat…" />
            </div>

            <Toggle
              label="Işjeň"
              desc="Müşderiler görüp bilýär"
              checked={form.is_active}
              onChange={(v) => set('is_active', v)}
            />
          </CardContent>
        </Card>

        {/* ── Variants (edit mode only) — media/spin/sizes/stock/sales all live on each variant's own page ── */}
        {isEdit && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-400" />
                Görnüşler ({variants.length})
              </CardTitle>
              <Button type="button" size="sm" onClick={() => navigate(`/seller/products/${id}/variants/new`)}>
                <Plus className="h-4 w-4 mr-1.5" />Görnüş goş
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {variants.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Bu haryt heniz görnüşsiz. Suraty, bahasy, stogy we ölçeglerini goşmak üçin bir görnüş dörediň (mysal: reňk).
                </p>
              ) : (
                variants.map((vr) => <VariantSummaryRow key={vr.id} productId={id} vr={vr} />)
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Footer actions ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => navigate('/seller/products')}>
            Yza
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saklanyp dur…</>
              : <><Save className="h-4 w-4 mr-2" />{isEdit ? 'Ýatda sakla' : 'Döret'}</>
            }
          </Button>
        </div>

      </form>
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-9 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/20'}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </div>
      <div>
        <p className="text-sm font-medium dark:text-white">{label}</p>
        {desc && <p className="text-xs text-slate-400">{desc}</p>}
      </div>
    </label>
  )
}
