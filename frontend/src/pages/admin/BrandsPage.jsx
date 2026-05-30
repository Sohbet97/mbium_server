import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Award, Plus, Pencil, Trash2, X, Loader2, ChevronRight, ChevronDown } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

// ── Form Modal ────────────────────────────────────────────────────────────────

function BrandModal({ brand, brands, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(brand ? {
    name:        brand.name        ?? '',
    name_ru:     brand.name_ru     ?? '',
    name_en:     brand.name_en     ?? '',
    slug:        brand.slug        ?? '',
    parent_id:   brand.parent_id   ?? '',
    logo_url:    brand.logo_url    ?? '',
    description: brand.description ?? '',
    is_active:   brand.is_active   ?? true,
    sort_order:  brand.sort_order  ?? 0,
  } : { name: '', name_ru: '', name_en: '', slug: '', parent_id: '', logo_url: '', description: '', is_active: true, sort_order: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) { setError(t('brands.nameRequired')); return }
    setError(''); setSaving(true)
    try {
      const payload = {
        ...form,
        parent_id:  form.parent_id  || null,
        slug:       form.slug       || undefined,
        sort_order: Number(form.sort_order) || 0,
      }
      if (brand) {
        await AdminApi.brands.update(brand.id, payload)
      } else {
        await AdminApi.brands.create(payload)
      }
      toast.success(brand ? t('toast.updated') : t('toast.created'))
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
            {brand ? t('brands.edit') : t('brands.add')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{t('brands.name')} *</label>
              <input autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('brands.slug')}</label>
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)} className={inp} placeholder="auto-generated" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>{t('brands.nameRu')}</label>
              <input value={form.name_ru} onChange={(e) => set('name_ru', e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('brands.nameEn')}</label>
              <input value={form.name_en} onChange={(e) => set('name_en', e.target.value)} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>{t('brands.parent')}</label>
            <select value={form.parent_id} onChange={(e) => set('parent_id', e.target.value)} className={inp}>
              <option value="">{t('brands.noParent')}</option>
              {brands.filter((b) => b.id !== brand?.id).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>{t('brands.logoUrl')}</label>
            <input value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} className={inp} placeholder="https://…" />
          </div>
          <div>
            <label className={lbl}>{t('brands.description')}</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2}
              className={`${inp} resize-none`} />
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

// ── Tree row ──────────────────────────────────────────────────────────────────

function BrandRow({ brand, depth = 0, forceOpen, onEdit, onDelete }) {
  const [localOpen, setLocalOpen] = useState(false)
  const open = forceOpen != null ? forceOpen : localOpen
  const hasChildren = brand.children?.length > 0

  return (
    <>
      <tr className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
        <td className="px-4 py-3">
          <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button onClick={() => setLocalOpen((o) => !o)} className="opacity-40 hover:opacity-80 p-0.5">
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-[22px]" />
            )}
            {brand.logo_url && (
              <img src={brand.logo_url} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
            )}
            <span className="font-medium dark:text-white">{brand.name}</span>
            {brand.name_ru && <span className="text-xs opacity-40 ml-1">{brand.name_ru}</span>}
          </div>
        </td>
        <td className="px-4 py-3 text-xs opacity-50 font-mono">{brand.slug}</td>
        <td className="px-4 py-3 text-center">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${brand.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-white/5'}`}>
            {brand.is_active ? '✓' : '—'}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 justify-end">
            <button onClick={() => onEdit(brand)} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(brand.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-60 hover:opacity-100 text-red-500">
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>
      {open && hasChildren && brand.children.map((child) => (
        <BrandRow key={child.id} brand={child} depth={depth + 1} forceOpen={forceOpen} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BrandsPage() {
  const { t } = useTranslation()
  const [tree, setTree]         = useState([])
  const [flat, setFlat]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [forceOpen, setForceOpen] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [treeRes, flatRes] = await Promise.all([
        AdminApi.brands.getTree(),
        AdminApi.brands.getAll({ limit: 500 }),
      ])
      setTree(treeRes.data.data ?? [])
      setFlat(flatRes.data.data ?? [])
    } catch { toast.error(t('toast.error')) }
    finally { setLoading(false) }
  }, [t])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.brands.delete(id)
      toast.success(t('toast.deleted'))
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const hasNested = tree.some((b) => b.children?.length > 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600/10 flex items-center justify-center">
            <Award size={18} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold dark:text-white">{t('brands.title')}</h1>
            <p className="text-xs opacity-50">{t('brands.totalCount', { count: flat.length })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasNested && (
            <>
              <button onClick={() => setForceOpen(true)}
                className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg dark:hover:bg-white/5 hover:bg-black/5 opacity-60 hover:opacity-100">
                <ChevronDown size={13} />{t('common.expandAll', 'Expand all')}
              </button>
              <button onClick={() => setForceOpen(false)}
                className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg dark:hover:bg-white/5 hover:bg-black/5 opacity-60 hover:opacity-100">
                <ChevronRight size={13} />{t('common.collapseAll', 'Collapse all')}
              </button>
            </>
          )}
          <button onClick={() => setModal('add')}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus size={14} />{t('brands.add')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
      ) : tree.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-16">{t('brands.empty')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('brands.name')}</th>
                <th className="text-left px-4 py-2">{t('brands.slug')}</th>
                <th className="text-center px-4 py-2">{t('common.active')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {tree.map((brand) => (
                <BrandRow
                  key={brand.id}
                  brand={brand}
                  depth={0}
                  forceOpen={forceOpen}
                  onEdit={(b) => setModal(b)}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <BrandModal
          brand={modal === 'add' ? null : modal}
          brands={flat}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
