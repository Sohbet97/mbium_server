import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PackageCheck, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

// ── Form Modal ────────────────────────────────────────────────────────────────

function DeliveryTypeModal({ deliveryType, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(deliveryType ? {
    name:       deliveryType.name       ?? '',
    name_ru:    deliveryType.name_ru    ?? '',
    name_en:    deliveryType.name_en    ?? '',
    code:       deliveryType.code       ?? '',
    is_active:  deliveryType.is_active  ?? true,
    sort_order: deliveryType.sort_order ?? 0,
  } : { name: '', name_ru: '', name_en: '', code: '', is_active: true, sort_order: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) { setError(t('deliveryTypes.nameRequired')); return }
    if (!form.code.trim()) { setError(t('deliveryTypes.codeRequired')); return }
    setError(''); setSaving(true)
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) || 0 }
      if (deliveryType) {
        await AdminApi.deliveryTypes.update(deliveryType.id, payload)
      } else {
        await AdminApi.deliveryTypes.create(payload)
      }
      toast.success(deliveryType ? t('toast.updated') : t('toast.created'))
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
            {deliveryType ? t('deliveryTypes.edit') : t('deliveryTypes.add')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{t('deliveryTypes.name')} *</label>
              <input autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} className={inp} placeholder="mysal: Kurýer" />
            </div>
            <div>
              <label className={lbl}>{t('deliveryTypes.code')} *</label>
              <input value={form.code} onChange={(e) => set('code', e.target.value)} className={inp} placeholder={t('deliveryTypes.codeHint')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{t('deliveryTypes.nameRu')}</label>
              <input value={form.name_ru} onChange={(e) => set('name_ru', e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('deliveryTypes.nameEn')}</label>
              <input value={form.name_en} onChange={(e) => set('name_en', e.target.value)} className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{t('common.sortOrder', 'Sort order')}</label>
              <input type="number" min={0} value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} className={inp} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
                <span className="dark:text-slate-300 text-slate-700">{t('common.active')}</span>
              </label>
            </div>
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

export default function DeliveryTypesPage() {
  const { t } = useTranslation()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await AdminApi.deliveryTypes.getAll({ limit: 500 })
      setItems(res.data.data ?? [])
    } catch { toast.error(t('toast.error')) }
    finally { setLoading(false) }
  }, [t])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.deliveryTypes.delete(id)
      toast.success(t('toast.deleted'))
      load()
    } catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-600/10 flex items-center justify-center">
            <PackageCheck size={18} className="text-sky-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold dark:text-white">{t('deliveryTypes.title')}</h1>
            <p className="text-xs opacity-50">{t('deliveryTypes.totalCount', { count: items.length })}</p>
          </div>
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus size={14} />{t('deliveryTypes.add')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-16">{t('deliveryTypes.empty')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('deliveryTypes.name')}</th>
                <th className="text-left px-4 py-2">{t('deliveryTypes.code')}</th>
                <th className="text-center px-4 py-2">{t('common.active')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((dt) => (
                <tr key={dt.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className="font-medium dark:text-white">{dt.name}</span>
                    {dt.name_ru && <span className="text-xs opacity-40 ml-1">{dt.name_ru}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs opacity-50 font-mono">{dt.code}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dt.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-white/5'}`}>
                      {dt.is_active ? '✓' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setModal(dt)} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(dt.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-60 hover:opacity-100 text-red-500">
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
        <DeliveryTypeModal
          deliveryType={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
