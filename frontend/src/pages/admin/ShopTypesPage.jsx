import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Store, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

// ── Form Modal ────────────────────────────────────────────────────────────────

function ShopTypeModal({ shopType, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(shopType ? {
    name:            shopType.name            ?? '',
    name_ru:         shopType.name_ru         ?? '',
    name_eng:        shopType.name_eng        ?? '',
    order:           shopType.order           ?? 0,
    is_active:       shopType.is_active       ?? true,
  } : { name: '', name_ru: '', name_eng: '', order: 0, is_active: true })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) { setError(t('shopTypes.nameRequired')); return }
    setError(''); setSaving(true)
    try {
      const payload = {
        ...form,
        order: Number(form.order) || 0,
      }
      if (shopType) {
        await AdminApi.shopTypes.update(shopType.id, payload)
      } else {
        await AdminApi.shopTypes.create(payload)
      }
      toast.success(shopType ? t('toast.updated') : t('toast.created'))
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally { setSaving(false) }
  }

  const inp = 'w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200'
  const lbl = 'block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08]">
          <h2 className="text-base font-semibold dark:text-white">
            {shopType ? t('shopTypes.edit') : t('shopTypes.add')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className={lbl}>{t('shopTypes.name')} *</label>
            <input autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{t('shopTypes.nameRu')}</label>
              <input value={form.name_ru} onChange={(e) => set('name_ru', e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('shopTypes.nameEn')}</label>
              <input value={form.name_eng} onChange={(e) => set('name_eng', e.target.value)} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>{t('shopTypes.order')}</label>
            <input type="number" min={0} value={form.order} onChange={(e) => set('order', e.target.value)} className={inp} />
          </div>
          <div className="flex items-center pb-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              <span className="dark:text-slate-300 text-slate-700">{t('common.active')}</span>
            </label>
          </div>
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

export default function ShopTypesPage() {
  const { t } = useTranslation()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await AdminApi.shopTypes.getAll({ limit: 500 })
      setItems(res.data.data ?? [])
    } catch { toast.error(t('toast.error')) }
    finally { setLoading(false) }
  }, [t])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.shopTypes.delete(id)
      toast.success(t('toast.deleted'))
      load()
    } catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-600/10 flex items-center justify-center">
            <Store size={18} className="text-sky-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold dark:text-white">{t('shopTypes.title')}</h1>
            <p className="text-xs opacity-50">{t('shopTypes.totalCount', { count: items.length })}</p>
          </div>
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus size={14} />{t('shopTypes.add')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-16">{t('shopTypes.empty')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('shopTypes.name')}</th>
                <th className="text-center px-4 py-2">{t('common.active')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((st) => (
                <tr key={st.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className="font-medium dark:text-white">{st.name}</span>
                    {st.name_ru && <span className="text-xs opacity-40 ml-1">{st.name_ru}</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-white/5'}`}>
                      {st.is_active ? '✓' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setModal(st)} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(st.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-60 hover:opacity-100 text-red-500">
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
        <ShopTypeModal
          shopType={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
