import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Loader2, Save, ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SellerProductMediaManager } from '@/components/media/SellerProductMediaManager'

const CURRENCIES = ['TMT', 'USD', 'RUB']

const EMPTY_FORM = {
  name: '', name_ru: '', name_eng: '',
  category_id: '',
  description: '',
  price: '', compare_at_price: '', cost_price: '',
  currency: 'TMT',
  stock: '0', sku: '', barcode: '', weight: '',
  track_inventory: true,
  sell_when_out_of_stock: false,
  is_active: true,
}

const EMPTY_VARIANT = {
  name: '', price: '', compare_at_price: '',
  stock: '0', sku: '', barcode: '',
  is_active: true, attributes: {},
}

// ── Attribute key-value editor ────────────────────────────────────────────────
function AttributeEditor({ initial = {}, onChange }) {
  const [pairs, setPairs] = useState(() => Object.entries(initial))

  function push(next) {
    setPairs(next)
    onChange(Object.fromEntries(next.filter(([k]) => k.trim())))
  }

  function updatePair(idx, field, v) {
    push(pairs.map((p, i) => i === idx ? (field === 'k' ? [v, p[1]] : [p[0], v]) : p))
  }

  function addPair() { setPairs([...pairs, ['', '']]) }

  function removePair(idx) {
    const next = pairs.filter((_, i) => i !== idx)
    push(next)
  }

  return (
    <div className="space-y-1.5">
      {pairs.map(([k, v], idx) => (
        <div key={idx} className="flex gap-1.5 items-center">
          <Input
            value={k}
            onChange={(e) => updatePair(idx, 'k', e.target.value)}
            placeholder="Häsiýet (mysal: Reňk)"
            className="h-7 text-xs flex-1"
          />
          <span className="text-slate-400 text-xs shrink-0">:</span>
          <Input
            value={v}
            onChange={(e) => updatePair(idx, 'v', e.target.value)}
            placeholder="Baha (mysal: Gyzyl)"
            className="h-7 text-xs flex-1"
          />
          <button
            type="button"
            onClick={() => removePair(idx)}
            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addPair}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
      >
        <Plus className="h-3 w-3" />Häsiýet goş
      </button>
    </div>
  )
}

// ── Variant row form ──────────────────────────────────────────────────────────
function VariantForm({ initial = EMPTY_VARIANT, onSave, onCancel, saving }) {
  const [v, setV] = useState(initial)
  const set = (k, val) => setV((f) => ({ ...f, [k]: val }))

  return (
    <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 space-y-3 border dark:border-white/[0.06]">
      {/* Name + prices */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Ady <span className="text-red-500">*</span></Label>
          <Input
            value={v.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="mysal: Gyzyl / L"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Baha (TMT)</Label>
          <Input
            type="number" min="0" step="0.01"
            value={v.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="Esasy bahadan alynar"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Asyl baha</Label>
          <Input
            type="number" min="0" step="0.01"
            value={v.compare_at_price}
            onChange={(e) => set('compare_at_price', e.target.value)}
            placeholder="Öňki baha"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Stock + SKU + Barcode */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Stok</Label>
          <Input
            type="number" min="0"
            value={v.stock}
            onChange={(e) => set('stock', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">SKU</Label>
          <Input
            value={v.sku}
            onChange={(e) => set('sku', e.target.value)}
            placeholder="ABC-001"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Barkod</Label>
          <Input
            value={v.barcode}
            onChange={(e) => set('barcode', e.target.value)}
            placeholder="1234567890"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Attributes */}
      <div className="space-y-1">
        <Label className="text-xs">Häsiýetler</Label>
        <AttributeEditor
          initial={v.attributes}
          onChange={(attrs) => set('attributes', attrs)}
        />
      </div>

      {/* Active toggle + actions */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={v.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
            />
            <div className={`w-8 h-4 rounded-full transition-colors ${v.is_active ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/20'}`} />
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${v.is_active ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300">Işjeň</span>
        </label>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>Ýatyr</Button>
          <Button size="sm" onClick={() => onSave(v)} disabled={saving || !v.name.trim()}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sakla'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Variant display row ───────────────────────────────────────────────────────
function VariantRow({ vr, onEdit, onDelete }) {
  const attrs = Object.entries(vr.attributes || {})

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg border dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium dark:text-white">{vr.name}</p>
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded font-medium',
            vr.is_active
              ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400'
              : 'bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-500'
          )}>
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
          {vr.price
            ? <>{parseFloat(vr.price).toFixed(2)} TMT{vr.compare_at_price && <span className="line-through ml-1.5 text-slate-300">{parseFloat(vr.compare_at_price).toFixed(2)}</span>}</>
            : 'Esasy baha'}
          {' · '}Stok: {vr.stock}
          {vr.sku ? ` · SKU: ${vr.sku}` : ''}
          {vr.barcode ? ` · ${vr.barcode}` : ''}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm]             = useState(EMPTY_FORM)
  const [categories, setCategories] = useState([])
  const [variants, setVariants]     = useState([])
  const [loading, setLoading]       = useState(isEdit)
  const [saving, setSaving]         = useState(false)
  const [variantSaving, setVSaving] = useState(null) // variantId | 'new'
  const [editingVariant, setEV]     = useState(null)  // variantId | 'new' | null
  const [showVariants, setShowVariants] = useState(true)

  useEffect(() => {
    SellerApi.categories.getAll().then(({ data }) => setCategories(data.data ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    SellerApi.products.getOne(id)
      .then(({ data }) => {
        const p = data.model
        setForm({
          name:                   p.name          ?? '',
          name_ru:                p.name_ru       ?? '',
          name_eng:               p.name_eng      ?? '',
          category_id:            p.category_id   ?? '',
          description:            p.description   ?? '',
          price:                  p.price         ?? '',
          compare_at_price:       p.compare_at_price ?? '',
          cost_price:             p.cost_price    ?? '',
          currency:               p.currency      ?? 'TMT',
          stock:                  p.stock ?? 0,
          sku:                    p.sku           ?? '',
          barcode:                p.barcode       ?? '',
          weight:                 p.weight        ?? '',
          track_inventory:        p.track_inventory        ?? true,
          sell_when_out_of_stock: p.sell_when_out_of_stock ?? false,
          is_active:              p.is_active     ?? true,
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
    if (!form.price)          { toast.error('Bahany giriziň');        return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        price:             parseFloat(form.price) || 0,
        compare_at_price:  form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        cost_price:        form.cost_price        ? parseFloat(form.cost_price)       : null,
        stock:             parseInt(form.stock)   || 0,
        weight:            form.weight            ? parseInt(form.weight)             : null,
        category_id:       Number(form.category_id),
      }

      if (isEdit) {
        await SellerApi.products.update(id, payload)
        toast.success('Haryt ýatda saklandy')
      } else {
        const { data } = await SellerApi.products.create(payload)
        toast.success('Haryt döredildi')
        navigate(`/seller/products/${data.model.id}/edit`, { replace: true })
      }
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally {
      setSaving(false)
    }
  }

  // ── Variant handlers ──────────────────────────────────────────────────────
  async function saveNewVariant(v) {
    setVSaving('new')
    try {
      const { data } = await SellerApi.products.variants.create(id, {
        name:             v.name.trim(),
        price:            v.price ? parseFloat(v.price) : null,
        compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
        stock:            parseInt(v.stock) || 0,
        sku:              v.sku || null,
        barcode:          v.barcode || null,
        is_active:        v.is_active,
        attributes:       v.attributes || {},
      })
      setVariants((prev) => [...prev, data.model])
      setEV(null)
      toast.success('Görnüş goşuldy')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setVSaving(null) }
  }

  async function saveEditVariant(variantId, v) {
    setVSaving(variantId)
    try {
      await SellerApi.products.variants.update(id, variantId, {
        name:             v.name.trim(),
        price:            v.price ? parseFloat(v.price) : null,
        compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
        stock:            parseInt(v.stock) || 0,
        sku:              v.sku || null,
        barcode:          v.barcode || null,
        is_active:        v.is_active,
        attributes:       v.attributes || {},
      })
      setVariants((prev) => prev.map((vr) => vr.id === variantId ? { ...vr, ...v } : vr))
      setEV(null)
      toast.success('Görnüş üýtgedildi')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setVSaving(null) }
  }

  async function deleteVariant(variantId) {
    if (!confirm('Görnüşi pozmak?')) return
    try {
      await SellerApi.products.variants.delete(id, variantId)
      setVariants((prev) => prev.filter((v) => v.id !== variantId))
      toast.success('Görnüş pozuldy')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
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
          </CardContent>
        </Card>

        {/* ── Pricing ────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Baha</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="mb-1 block">Baha <span className="text-red-500">*</span></Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" required />
              </div>
              <div>
                <Label className="mb-1 block">Asyl baha</Label>
                <Input type="number" min="0" step="0.01" value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} placeholder="0.00" />
                <p className="text-xs text-slate-400 mt-1">Düşürilen bahadan öňki</p>
              </div>
              <div>
                <Label className="mb-1 block">Özüne düşen baha</Label>
                <Input type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => set('cost_price', e.target.value)} placeholder="0.00" />
                <p className="text-xs text-slate-400 mt-1">Görünmez, hasaplama üçin</p>
              </div>
              <div>
                <Label className="mb-1 block">Pul birligi</Label>
                <select
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  className="w-full h-9 border rounded-md px-3 text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Inventory ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Ammar we logistika</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="mb-1 block">Stok</Label>
                <Input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
              </div>
              <div>
                <Label className="mb-1 block">SKU</Label>
                <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="ABC-001" />
              </div>
              <div>
                <Label className="mb-1 block">Barkod</Label>
                <Input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="1234567890" />
              </div>
              <div>
                <Label className="mb-1 block">Agramy (gram)</Label>
                <Input type="number" min="0" value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder="500" />
              </div>
            </div>

            <div className="flex flex-wrap gap-5 pt-1">
              <Toggle
                label="Stok yzarlamak"
                desc="Müşderilere galyk stok görkezilýär"
                checked={form.track_inventory}
                onChange={(v) => set('track_inventory', v)}
              />
              <Toggle
                label="Stok gutaranda-da sat"
                desc="0 stokda hem haryt görünýär"
                checked={form.sell_when_out_of_stock}
                onChange={(v) => set('sell_when_out_of_stock', v)}
              />
              <Toggle
                label="Işjeň"
                desc="Müşderiler görüp bilýär"
                checked={form.is_active}
                onChange={(v) => set('is_active', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Media (edit mode only) ─────────────────────────────────────── */}
        {isEdit && (
          <Card>
            <CardHeader><CardTitle>Suratlar</CardTitle></CardHeader>
            <CardContent>
              <SellerProductMediaManager productId={id} />
            </CardContent>
          </Card>
        )}

        {/* ── Variants (edit mode only) ───────────────────────────────────── */}
        {isEdit && (
          <Card>
            <CardHeader>
              <button
                type="button"
                className="flex items-center justify-between w-full"
                onClick={() => setShowVariants((v) => !v)}
              >
                <CardTitle>Görnüşler ({variants.length})</CardTitle>
                {showVariants ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
            </CardHeader>
            {showVariants && (
              <CardContent className="space-y-3">
                {variants.length === 0 && editingVariant !== 'new' && (
                  <p className="text-sm text-slate-400 text-center py-4">Görnüş ýok. Harydyň reňk, ölçeg ýaly görnüşleri bolsa goşuň.</p>
                )}

                {/* Existing variants */}
                {variants.map((vr) => (
                  editingVariant === vr.id ? (
                    <VariantForm
                      key={vr.id}
                      initial={{
                        name:             vr.name             ?? '',
                        price:            vr.price            ?? '',
                        compare_at_price: vr.compare_at_price ?? '',
                        stock:            vr.stock            ?? 0,
                        sku:              vr.sku              ?? '',
                        barcode:          vr.barcode          ?? '',
                        is_active:        vr.is_active        ?? true,
                        attributes:       (typeof vr.attributes === 'object' ? vr.attributes : {}) ?? {},
                      }}
                      saving={variantSaving === vr.id}
                      onSave={(v) => saveEditVariant(vr.id, v)}
                      onCancel={() => setEV(null)}
                    />
                  ) : (
                    <VariantRow
                      key={vr.id}
                      vr={vr}
                      onEdit={() => setEV(vr.id)}
                      onDelete={() => deleteVariant(vr.id)}
                    />
                  )
                ))}

                {/* New variant form */}
                {editingVariant === 'new' ? (
                  <VariantForm
                    saving={variantSaving === 'new'}
                    onSave={saveNewVariant}
                    onCancel={() => setEV(null)}
                  />
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setEV('new')}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />Görnüş goş
                  </Button>
                )}
              </CardContent>
            )}
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

function Pencil({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}
