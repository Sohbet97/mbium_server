import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Palette, Plus, Pencil, Trash2, X, Loader2, Search } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { normalizeHex } from '@/lib/colors'
import { toast } from 'sonner'

// ── Form Modal ────────────────────────────────────────────────────────────────

function ColorModal({ color, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(color ? {
    name:       color.name       ?? '',
    name_ru:    color.name_ru    ?? '',
    name_eng:   color.name_eng   ?? '',
    slug:       color.slug       ?? '',
    hex:        color.hex        ?? '#000000',
    is_active:  color.is_active  ?? true,
    sort_order: color.sort_order ?? 0,
  } : { name: '', name_ru: '', name_eng: '', slug: '', hex: '#000000', is_active: true, sort_order: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) { setError(t('colors.nameRequired')); return }
    const hex = normalizeHex(form.hex)
    if (!hex) { setError(t('colors.hexInvalid')); return }

    setError(''); setSaving(true)
    try {
      const payload = {
        ...form,
        hex,
        slug:       form.slug || undefined,
        sort_order: Number(form.sort_order) || 0,
      }
      if (color) {
        await AdminApi.colors.update(color.id, payload)
      } else {
        await AdminApi.colors.create(payload)
      }
      toast.success(color ? t('toast.updated') : t('toast.created'))
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally { setSaving(false) }
  }

  const inp = 'w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200'
  const lbl = 'block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600'

  // The text field accepts loose input (#abc, abc); it's normalised on save,
  // and only feeds the native picker once it parses.
  const previewHex = normalizeHex(form.hex)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08]">
          <h2 className="text-base font-semibold dark:text-white">
            {color ? t('colors.edit') : t('colors.add')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className={lbl}>{t('colors.hex')}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={previewHex ?? '#000000'}
                onChange={(e) => set('hex', e.target.value)}
                aria-label={t('colors.hex')}
                className="h-9 w-12 shrink-0 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5 dark:border-white/10"
              />
              <input
                className={`${inp} font-mono`}
                value={form.hex}
                onChange={(e) => set('hex', e.target.value)}
                placeholder="#ef4444"
              />
            </div>
            {color && (
              <p className="mt-1 text-[11px] opacity-50">{t('colors.hexChangeHint')}</p>
            )}
          </div>

          <div>
            <label className={lbl}>{t('colors.name')}</label>
            <input className={inp} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{t('colors.nameRu')}</label>
              <input className={inp} value={form.name_ru} onChange={(e) => set('name_ru', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>{t('colors.nameEn')}</label>
              <input className={inp} value={form.name_eng} onChange={(e) => set('name_eng', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{t('colors.slug')}</label>
              <input className={inp} value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={t('colors.slugAuto')} />
            </div>
            <div>
              <label className={lbl}>{t('colors.sortOrder')}</label>
              <input className={inp} type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
            <span className="dark:text-slate-300 text-slate-700">{t('common.active')}</span>
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t dark:border-white/[0.08] border-black/[0.08]">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg dark:hover:bg-white/5 hover:bg-black/5">{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}{t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ColorsPage() {
  const { t } = useTranslation()
  const [colors, setColors]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [search, setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await AdminApi.colors.getAll({ limit: 500 })
      setColors(data.data ?? [])
    } catch { toast.error(t('toast.error')) }
    finally { setLoading(false) }
  }, [t])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.colors.delete(id)
      toast.success(t('toast.deleted'))
      load()
    } catch (e) {
      // The backend refuses to delete a colour still used by products/variants
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  // Small list, so filtering client-side keeps the page snappy and offline-safe
  const q = search.trim().toLowerCase()
  const shown = q
    ? colors.filter((c) => [c.name, c.name_ru, c.name_eng, c.hex]
        .some((v) => String(v ?? '').toLowerCase().includes(q)))
    : colors

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-fuchsia-600/10 flex items-center justify-center">
            <Palette size={18} className="text-fuchsia-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold dark:text-white">{t('colors.title')}</h1>
            <p className="text-xs opacity-50">{t('colors.totalCount', { count: colors.length })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('colors.searchPlaceholder')}
              className="w-56 rounded-lg border pl-8 pr-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200"
            />
          </div>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus size={14} />{t('colors.add')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
      ) : shown.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-16">{t('colors.empty')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('colors.colColor')}</th>
                <th className="text-left px-4 py-2">{t('colors.hex')}</th>
                <th className="text-left px-4 py-2">{t('colors.slug')}</th>
                <th className="text-center px-4 py-2">{t('common.active')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-5 w-5 shrink-0 rounded-full ring-1 ring-inset ring-black/20 dark:ring-white/25"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="font-medium dark:text-white">{c.name}</span>
                      {c.name_ru && <span className="text-xs opacity-40">{c.name_ru}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs opacity-60 font-mono">{c.hex}</td>
                  <td className="px-4 py-3 text-xs opacity-50 font-mono">{c.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-white/5'}`}>
                      {c.is_active ? '✓' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setModal(c)} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-60 hover:opacity-100 text-red-500">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ColorModal
          color={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
