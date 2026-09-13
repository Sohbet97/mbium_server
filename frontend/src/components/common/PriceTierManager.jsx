import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

const DEFAULT_LABELS = {
  qty:        'Sany',
  minQty:     'Min sany',
  maxQty:     'Max sany',
  unitPrice:  'Birlik bahasy',
  openEnded:  'we ýokary',
  add:        'Basgançak goş',
  save:       'Sakla',
  cancel:     'Ýatyr',
  empty:      'Basgançak ýok. Sanyna görä baha bellemek üçin goşuň.',
  confirmDelete: 'Basgançagy pozmak?',
  savedMsg:   'Basgançak ýatda saklandy',
  deletedMsg: 'Basgançak pozuldy',
  invalidMsg: 'Min we birlik bahasyny giriziň',
  errorMsg:   'Ýalňyşlyk',
}

const EMPTY_DRAFT = { min_qty: '', max_qty: '', unit_price: '' }

// Generic CRUD table for quantity-tiered pricing (min_qty / max_qty / unit_price rows).
// Decoupled from any specific API — callers pass onCreate/onUpdate/onDelete, so this
// works for both product-level and variant-level tiers, on admin or seller panels.
export function PriceTierManager({ tiers = [], onCreate, onUpdate, onDelete, labels = {} }) {
  const l = { ...DEFAULT_LABELS, ...labels }
  const [rows, setRows] = useState(tiers)
  const [editing, setEditing] = useState(null) // tierId | 'new' | null
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(EMPTY_DRAFT)

  useEffect(() => { setRows(tiers) }, [tiers])

  function startNew() { setDraft(EMPTY_DRAFT); setEditing('new') }
  function startEdit(row) {
    setDraft({
      min_qty: row.min_qty ?? '',
      max_qty: row.max_qty ?? '',
      unit_price: row.unit_price ?? '',
    })
    setEditing(row.id)
  }

  async function save() {
    if (draft.min_qty === '' || draft.unit_price === '') { toast.error(l.invalidMsg); return }
    const payload = {
      min_qty: parseInt(draft.min_qty),
      max_qty: draft.max_qty !== '' ? parseInt(draft.max_qty) : null,
      unit_price: parseFloat(draft.unit_price),
    }
    setSaving(true)
    try {
      if (editing === 'new') {
        const { data } = await onCreate(payload)
        setRows((prev) => [...prev, data.model])
      } else {
        await onUpdate(editing, payload)
        setRows((prev) => prev.map((r) => (r.id === editing ? { ...r, ...payload } : r)))
      }
      setEditing(null)
      toast.success(l.savedMsg)
    } catch (e) {
      toast.error(e.response?.data?.message ?? l.errorMsg)
    } finally { setSaving(false) }
  }

  async function remove(tierId) {
    if (!window.confirm(l.confirmDelete)) return
    try {
      await onDelete(tierId)
      setRows((prev) => prev.filter((r) => r.id !== tierId))
      toast.success(l.deletedMsg)
    } catch (e) {
      toast.error(e.response?.data?.message ?? l.errorMsg)
    }
  }

  const editorRow = (
    <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03]">
      <Input className="h-8 text-xs w-24" type="number" min="1" value={draft.min_qty}
        onChange={(e) => setDraft((d) => ({ ...d, min_qty: e.target.value }))} placeholder={l.minQty} />
      <Input className="h-8 text-xs w-28" type="number" min="1" value={draft.max_qty}
        onChange={(e) => setDraft((d) => ({ ...d, max_qty: e.target.value }))} placeholder={l.maxQty} />
      <Input className="h-8 text-xs w-24" type="number" min="0" step="0.01" value={draft.unit_price}
        onChange={(e) => setDraft((d) => ({ ...d, unit_price: e.target.value }))} placeholder={l.unitPrice} />
      <Button size="sm" className="h-8 text-xs px-2" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : l.save}
      </Button>
      <Button size="sm" variant="outline" className="h-8 text-xs px-2" onClick={() => setEditing(null)}>{l.cancel}</Button>
    </div>
  )

  const sorted = [...rows].sort((a, b) => (a.min_qty ?? 0) - (b.min_qty ?? 0))

  return (
    <div className="space-y-2">
      <div className="rounded-lg border dark:border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-x-3 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
          <div>{l.minQty}</div>
          <div>{l.maxQty}</div>
          <div>{l.unitPrice}</div>
          <div />
        </div>
        <div className="divide-y dark:divide-white/[0.04]">
          {sorted.length === 0 && editing !== 'new' && (
            <p className="text-sm text-slate-400 text-center py-6">{l.empty}</p>
          )}
          {sorted.map((row) => (
            editing === row.id ? (
              <div key={row.id} className="p-2">{editorRow}</div>
            ) : (
              <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-x-3 items-center px-3 py-2 text-sm">
                <span className="font-medium dark:text-white">{row.min_qty}</span>
                <span className="text-slate-500 dark:text-slate-300">{row.max_qty != null ? row.max_qty : l.openEnded}</span>
                <span className="text-slate-500 dark:text-slate-300">{parseFloat(row.unit_price).toFixed(2)}</span>
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
          <Plus className="h-4 w-4 mr-1.5" />{l.add}
        </Button>
      )}
    </div>
  )
}
