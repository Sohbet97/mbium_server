import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Factory, Plus, Pencil, Trash2, X, Loader2, ExternalLink } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

const PAGE = 20

// ── Form Modal ────────────────────────────────────────────────────────────────

const EMPTY = { name: '', contact_name: '', email: '', phone: '', address: '', country_id: '', website: '', is_active: true, notes: '' }

function SupplierModal({ supplier, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(supplier ? {
    name:         supplier.name         ?? '',
    contact_name: supplier.contact_name ?? '',
    email:        supplier.email        ?? '',
    phone:        supplier.phone        ?? '',
    address:      supplier.address      ?? '',
    country_id:   supplier.country_id   ?? '',
    website:      supplier.website      ?? '',
    is_active:    supplier.is_active    ?? true,
    notes:        supplier.notes        ?? '',
  } : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) { setError(t('suppliers.nameRequired')); return }
    setError(''); setSaving(true)
    try {
      const payload = { ...form, country_id: form.country_id || null }
      if (supplier) {
        await AdminApi.suppliers.update(supplier.id, payload)
      } else {
        await AdminApi.suppliers.create(payload)
      }
      toast.success(supplier ? t('toast.updated') : t('toast.created'))
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
            {supplier ? t('suppliers.edit') : t('suppliers.add')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className={lbl}>{t('suppliers.name')} *</label>
            <input autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{t('suppliers.contactName')}</label>
              <input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('suppliers.phone')}</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>{t('suppliers.email')}</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>{t('suppliers.website')}</label>
            <input value={form.website} onChange={(e) => set('website', e.target.value)} className={inp} placeholder="https://…" />
          </div>
          <div>
            <label className={lbl}>{t('suppliers.address')}</label>
            <textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2}
              className={`${inp} resize-none`} />
          </div>
          <div>
            <label className={lbl}>{t('suppliers.notes')}</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2}
              className={`${inp} resize-none`} />
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

export default function SuppliersPage() {
  const { t } = useTranslation()
  const [rows, setRows]       = useState([])
  const [count, setCount]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(0)
  const [modal, setModal]     = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.suppliers.getAll({ limit: PAGE, skip: page * PAGE })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [page, t])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.suppliers.delete(id)
      toast.success(t('toast.deleted'))
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const pages = Math.ceil(count / PAGE)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-600/10 flex items-center justify-center">
            <Factory size={18} className="text-sky-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold dark:text-white">{t('suppliers.title')}</h1>
            <p className="text-xs opacity-50">{t('suppliers.totalCount', { count })}</p>
          </div>
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus size={14} />{t('suppliers.add')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-16">{t('suppliers.empty')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('suppliers.name')}</th>
                <th className="text-left px-4 py-2">{t('suppliers.contactName')}</th>
                <th className="text-left px-4 py-2">{t('suppliers.email')}</th>
                <th className="text-left px-4 py-2">{t('suppliers.phone')}</th>
                <th className="text-center px-4 py-2">{t('common.active')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium dark:text-white">{s.name}</p>
                    {s.website && (
                      <a href={s.website} target="_blank" rel="noreferrer"
                        className="text-xs text-indigo-400 hover:underline flex items-center gap-0.5 mt-0.5">
                        <ExternalLink size={10} />{s.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm opacity-70">{s.contact_name || '—'}</td>
                  <td className="px-4 py-3 text-sm opacity-70">{s.email || '—'}</td>
                  <td className="px-4 py-3 text-sm opacity-70">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-white/5'}`}>
                      {s.is_active ? '✓' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setModal(s)} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-60 hover:opacity-100 text-red-500">
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

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-8 h-8 rounded text-sm ${i === page ? 'bg-indigo-600 text-white' : 'dark:hover:bg-white/10 hover:bg-black/5'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {modal && (
        <SupplierModal
          supplier={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
