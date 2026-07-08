import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Loader2, Save, X, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SellerProductMediaManager } from '@/components/media/SellerProductMediaManager'
import { SellerProductSpinManager } from '@/components/media/SellerProductSpinManager'

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
    push(pairs.filter((_, i) => i !== idx))
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

// ── Per-variant size/stock rows ───────────────────────────────────────────────
function VariantSizeManager({ productId, variant, sizeOptions, onChange }) {
  const [sizes, setSizes] = useState(variant.sizes || [])
  const [editing, setEditing] = useState(null) // sizeRowId | 'new' | null
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({ size_id: '', stock: '0', sku: '', price: '' })

  useEffect(() => { setSizes(variant.sizes || []) }, [variant.sizes])
  useEffect(() => { onChange?.(sizes) }, [sizes]) // eslint-disable-line react-hooks/exhaustive-deps

  function startNew() { setDraft({ size_id: '', stock: '0', sku: '', price: '' }); setEditing('new') }
  function startEdit(row) {
    setDraft({
      size_id: row.size_id ?? row.size?.id ?? '',
      stock: row.stock ?? 0,
      sku: row.sku ?? '',
      price: row.price ?? '',
    })
    setEditing(row.id)
  }

  async function save() {
    if (!draft.size_id) { toast.error('Ölçegi saýlaň'); return }
    setSaving(true)
    try {
      const payload = {
        size_id: Number(draft.size_id),
        stock: parseInt(draft.stock) || 0,
        sku: draft.sku || null,
        price: draft.price ? parseFloat(draft.price) : null,
      }
      if (editing === 'new') {
        const { data } = await SellerApi.products.variants.sizes.create(productId, variant.id, payload)
        setSizes((prev) => [...prev, data.model])
      } else {
        await SellerApi.products.variants.sizes.update(productId, variant.id, editing, payload)
        setSizes((prev) => prev.map((s) => (s.id === editing ? { ...s, ...payload, size: sizeOptions.find((o) => o.id === payload.size_id) ?? s.size } : s)))
      }
      setEditing(null)
      toast.success('Ölçeg ýatda saklandy')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setSaving(false) }
  }

  async function remove(rowId) {
    if (!confirm('Ölçegi pozmak?')) return
    try {
      await SellerApi.products.variants.sizes.delete(productId, variant.id, rowId)
      setSizes((prev) => prev.filter((s) => s.id !== rowId))
      toast.success('Ölçeg pozuldy')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    }
  }

  const editorRow = (
    <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03]">
      <select
        value={draft.size_id}
        onChange={(e) => setDraft((d) => ({ ...d, size_id: e.target.value }))}
        className="h-8 text-xs border rounded px-1.5 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
      >
        <option value="">Ölçeg</option>
        {sizeOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <Input className="h-8 text-xs w-20" type="number" min="0" value={draft.stock}
        onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value }))} placeholder="Stok" />
      <Input className="h-8 text-xs w-24" value={draft.sku}
        onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))} placeholder="SKU" />
      <Input className="h-8 text-xs w-24" type="number" min="0" step="0.01" value={draft.price}
        onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} placeholder="Baha" />
      <Button size="sm" className="h-8 text-xs px-2" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sakla'}
      </Button>
      <Button size="sm" variant="outline" className="h-8 text-xs px-2" onClick={() => setEditing(null)}>Ýatyr</Button>
    </div>
  )

  return (
    <div className="space-y-2">
      <div className="rounded-lg border dark:border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
          <div>Ölçeg</div>
          <div>Stok</div>
          <div>SKU</div>
          <div>Baha</div>
          <div />
        </div>
        <div className="divide-y dark:divide-white/[0.04]">
          {sizes.length === 0 && editing !== 'new' && (
            <p className="text-sm text-slate-400 text-center py-6">Ölçeg ýok. Stok yzarlamak üçin ölçeg goşuň.</p>
          )}
          {sizes.map((row) => (
            editing === row.id ? (
              <div key={row.id} className="p-2">{editorRow}</div>
            ) : (
              <div key={row.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 items-center px-3 py-2 text-sm">
                <span className="font-medium dark:text-white">{row.size?.name ?? sizeOptions.find((s) => s.id === row.size_id)?.name ?? '—'}</span>
                <span className="text-slate-500 dark:text-slate-300">{row.stock}</span>
                <span className="text-slate-500 dark:text-slate-300">{row.sku || '—'}</span>
                <span className="text-slate-500 dark:text-slate-300">{row.price ? parseFloat(row.price).toFixed(2) : '—'}</span>
                <div className="flex gap-1 justify-end">
                  <button type="button" onClick={() => startEdit(row)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => remove(row.id)} className="p-1 text-slate-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
      {editing === 'new' ? editorRow : (
        <Button type="button" variant="outline" size="sm" onClick={startNew}>
          <Plus className="h-4 w-4 mr-1.5" />Ölçeg goş
        </Button>
      )}
    </div>
  )
}

// ── Flash sales tab ────────────────────────────────────────────────────────────
const EMPTY_SALE = { sale_price: '', original_price: '', quantity_limit: '', starts_at: '', ends_at: '', is_active: true }

function toDatetimeLocal(v) {
  if (!v) return ''
  const d = new Date(v)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function VariantSalesManager({ productId, variant }) {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // saleId | 'new' | null
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(EMPTY_SALE)

  function load() {
    setLoading(true)
    SellerApi.flashSales.getAll({ product_id: productId, variant_id: variant.id })
      .then(({ data }) => setSales(data.data ?? []))
      .catch(() => toast.error('Aksiýalar ýüklenip bolmady'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function startNew() {
    setDraft({ ...EMPTY_SALE, original_price: variant.price ?? '' })
    setEditing('new')
  }
  function startEdit(row) {
    setDraft({
      sale_price: row.sale_price ?? '',
      original_price: row.original_price ?? '',
      quantity_limit: row.quantity_limit ?? '',
      starts_at: toDatetimeLocal(row.starts_at),
      ends_at: toDatetimeLocal(row.ends_at),
      is_active: row.is_active ?? true,
    })
    setEditing(row.id)
  }

  async function save() {
    if (!draft.sale_price || !draft.original_price) { toast.error('Baha giriziň'); return }
    setSaving(true)
    try {
      const payload = {
        product_id: Number(productId),
        variant_id: variant.id,
        sale_price: parseFloat(draft.sale_price),
        original_price: parseFloat(draft.original_price),
        quantity_limit: draft.quantity_limit ? parseInt(draft.quantity_limit) : null,
        starts_at: draft.starts_at || null,
        ends_at: draft.ends_at || null,
        is_active: draft.is_active,
      }
      if (editing === 'new') {
        await SellerApi.flashSales.create(payload)
        toast.success('Aksiýa döredildi')
      } else {
        await SellerApi.flashSales.update(editing, payload)
        toast.success('Aksiýa üýtgedildi')
      }
      setEditing(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setSaving(false) }
  }

  async function remove(id) {
    if (!confirm('Aksiýany pozmak?')) return
    try {
      await SellerApi.flashSales.delete(id)
      setSales((prev) => prev.filter((s) => s.id !== id))
      toast.success('Aksiýa pozuldy')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    }
  }

  const editorForm = (
    <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] space-y-3 border dark:border-white/[0.06]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Arzanladylan baha <span className="text-red-500">*</span></Label>
          <Input type="number" min="0" step="0.01" className="h-8 text-sm" value={draft.sale_price}
            onChange={(e) => setDraft((d) => ({ ...d, sale_price: e.target.value }))} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Asyl baha <span className="text-red-500">*</span></Label>
          <Input type="number" min="0" step="0.01" className="h-8 text-sm" value={draft.original_price}
            onChange={(e) => setDraft((d) => ({ ...d, original_price: e.target.value }))} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Limit (sany)</Label>
          <Input type="number" min="0" className="h-8 text-sm" value={draft.quantity_limit}
            onChange={(e) => setDraft((d) => ({ ...d, quantity_limit: e.target.value }))} placeholder="Çäksiz" />
        </div>
        <div className="flex items-end pb-1.5">
          <Toggle checked={draft.is_active} onChange={(v) => setDraft((d) => ({ ...d, is_active: v }))} label="Işjeň" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Başlaýar</Label>
          <Input type="datetime-local" className="h-8 text-sm" value={draft.starts_at}
            onChange={(e) => setDraft((d) => ({ ...d, starts_at: e.target.value }))} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Gutarýar</Label>
          <Input type="datetime-local" className="h-8 text-sm" value={draft.ends_at}
            onChange={(e) => setDraft((d) => ({ ...d, ends_at: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Ýatyr</Button>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sakla'}
        </Button>
      </div>
    </div>
  )

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
    </div>
  )

  return (
    <div className="space-y-3">
      {sales.length === 0 && editing !== 'new' && (
        <p className="text-sm text-slate-400 text-center py-6">Bu görnüş üçin aksiýa ýok.</p>
      )}
      <div className="space-y-2">
        {sales.map((row) => (
          editing === row.id ? <div key={row.id}>{editorForm}</div> : (
            <div key={row.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold dark:text-white">{parseFloat(row.sale_price).toFixed(2)} TMT</span>
                  <span className="text-xs text-slate-400 line-through">{parseFloat(row.original_price).toFixed(2)}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
                    row.is_active ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-500')}>
                    {row.is_active ? 'Işjeň' : 'Öçürilen'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {row.quantity_limit ? `Limit: ${row.sold_count ?? 0}/${row.quantity_limit}` : 'Çäksiz'}
                  {row.starts_at && ` · ${new Date(row.starts_at).toLocaleString()}`}
                  {row.ends_at && ` – ${new Date(row.ends_at).toLocaleString()}`}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => startEdit(row)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => remove(row.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        ))}
      </div>
      {editing === 'new' ? editorForm : (
        <Button type="button" variant="outline" size="sm" onClick={startNew}>
          <Plus className="h-4 w-4 mr-1.5" />Aksiýa goş
        </Button>
      )}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-8 h-4 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/20'}`} />
        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </div>
      <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
    </label>
  )
}

const TABS = [
  { key: 'info',  label: 'Maglumat' },
  { key: 'sizes', label: 'Ölçegler we stok' },
  { key: 'media', label: 'Suratlar' },
  { key: 'spin',  label: '360° Aýlanma' },
  { key: 'sales', label: 'Aksiýalar' },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerProductVariantPage() {
  const { id, variantId } = useParams()
  const navigate = useNavigate()
  const isCreate = !variantId || variantId === 'new'

  const [productName, setProductName] = useState('')
  const [variant, setVariant]         = useState(null)
  const [sizeOptions, setSizeOptions] = useState([])
  const [form, setForm]               = useState(EMPTY_VARIANT)
  const [loading, setLoading]         = useState(!isCreate)
  const [saving, setSaving]           = useState(false)
  const [tab, setTab]                 = useState('info')

  useEffect(() => {
    SellerApi.sizes.getAll().then(({ data }) => setSizeOptions(data.data ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    SellerApi.products.getOne(id)
      .then(({ data }) => {
        const p = data.model
        setProductName(p.name)
        if (!isCreate) {
          const vr = (p.variants ?? []).find((v) => String(v.id) === String(variantId))
          if (!vr) { toast.error('Görnüş tapylmady'); navigate(`/seller/products/${id}/edit`); return }
          setVariant(vr)
          setForm({
            name:             vr.name             ?? '',
            price:            vr.price            ?? '',
            compare_at_price: vr.compare_at_price ?? '',
            stock:            vr.stock             ?? 0,
            sku:              vr.sku              ?? '',
            barcode:          vr.barcode           ?? '',
            is_active:        vr.is_active         ?? true,
            attributes:       (typeof vr.attributes === 'object' ? vr.attributes : {}) ?? {},
          })
        }
      })
      .catch(() => { toast.error('Haryt tapylmady'); navigate('/seller/products') })
      .finally(() => setLoading(false))
  }, [id, variantId, isCreate, navigate])

  const set = (k, val) => setForm((f) => ({ ...f, [k]: val }))

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Görnüşiň adyny giriziň'); return }
    setSaving(true)
    try {
      const payload = {
        name:             form.name.trim(),
        price:            form.price ? parseFloat(form.price) : null,
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        stock:            parseInt(form.stock) || 0,
        sku:              form.sku || null,
        barcode:          form.barcode || null,
        is_active:        form.is_active,
        attributes:       form.attributes || {},
      }
      if (isCreate) {
        const { data } = await SellerApi.products.variants.create(id, payload)
        toast.success('Görnüş döredildi — indi ölçeg, surat we beýleki maglumatlary goşup bilersiňiz')
        navigate(`/seller/products/${id}/variants/${data.model.id}`, { replace: true })
      } else {
        await SellerApi.products.variants.update(id, variantId, payload)
        setVariant((prev) => ({ ...prev, ...payload }))
        toast.success('Görnüş ýatda saklandy')
      }
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setSaving(false) }
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
        <button onClick={() => navigate(`/seller/products/${id}/edit`)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs text-slate-400">{productName}</p>
          <h1 className="text-xl font-semibold dark:text-white">
            {isCreate ? 'Täze görnüş' : (variant?.name || 'Görnüş')}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      {!isCreate && (
        <div className="flex gap-1 border-b dark:border-white/[0.06] overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 h-9 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
                tab === t.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {(isCreate || tab === 'info') && (
        <form onSubmit={handleSave} className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Görnüşiň maglumaty</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <Label className="mb-1 block">Ady <span className="text-red-500">*</span></Label>
                  <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="mysal: Gyzyl" required />
                </div>
                <div>
                  <Label className="mb-1 block">Esasy baha (TMT)</Label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="Esasy bahadan alynar" />
                </div>
                <div>
                  <Label className="mb-1 block">Asyl baha</Label>
                  <Input type="number" min="0" step="0.01" value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} placeholder="Öňki baha" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="mb-1 block">Stok (ätiýaçlyk)</Label>
                  <Input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
                  <p className="text-xs text-slate-400 mt-1">Diňe ölçeg goşulmadyk ýagdaýda ulanylýar</p>
                </div>
                <div>
                  <Label className="mb-1 block">SKU</Label>
                  <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="ABC-001" />
                </div>
                <div>
                  <Label className="mb-1 block">Barkod</Label>
                  <Input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="1234567890" />
                </div>
              </div>

              <div>
                <Label className="mb-1 block">Häsiýetler</Label>
                <AttributeEditor initial={form.attributes} onChange={(attrs) => set('attributes', attrs)} />
              </div>

              <Toggle label="Işjeň" checked={form.is_active} onChange={(v) => set('is_active', v)} />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pb-4">
            <Button type="submit" disabled={saving}>
              {saving
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saklanyp dur…</>
                : <><Save className="h-4 w-4 mr-2" />{isCreate ? 'Döret' : 'Ýatda sakla'}</>
              }
            </Button>
          </div>
        </form>
      )}

      {!isCreate && tab === 'sizes' && (
        <Card>
          <CardHeader><CardTitle>Ölçegler we stok</CardTitle></CardHeader>
          <CardContent>
            <VariantSizeManager productId={id} variant={variant} sizeOptions={sizeOptions} onChange={(sizes) => setVariant((v) => ({ ...v, sizes }))} />
          </CardContent>
        </Card>
      )}

      {!isCreate && tab === 'media' && (
        <Card>
          <CardHeader><CardTitle>Suratlar</CardTitle></CardHeader>
          <CardContent>
            <SellerProductMediaManager productId={id} variantId={variant.id} />
          </CardContent>
        </Card>
      )}

      {!isCreate && tab === 'spin' && (
        <Card>
          <CardHeader><CardTitle>360° Aýlanma görnüşi</CardTitle></CardHeader>
          <CardContent>
            <SellerProductSpinManager productId={id} variantId={variant.id} />
          </CardContent>
        </Card>
      )}

      {!isCreate && tab === 'sales' && (
        <Card>
          <CardHeader><CardTitle>Aksiýalar</CardTitle></CardHeader>
          <CardContent>
            <VariantSalesManager productId={id} variant={variant} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
