import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tag, Plus, Pencil, Trash2, X, Loader2, Check } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

function TagModal({ tag, onClose, onSaved }) {
  const { t } = useTranslation()
  const [name, setName] = useState(tag?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!name.trim()) { setError(t('productTags.nameRequired')); return }
    setError(''); setSaving(true)
    try {
      if (tag) {
        await AdminApi.catalog.updateTag(tag.id, { name })
      } else {
        await AdminApi.catalog.createTag({ name })
      }
      toast.success(tag ? t('toast.updated') : t('toast.created'))
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08]">
          <h2 className="text-base font-semibold dark:text-white">
            {tag ? t('productTags.edit') : t('productTags.add')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('productTags.name')}</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200"
            />
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

export default function ProductTagsPage() {
  const { t } = useTranslation()
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.catalog.getTags()
      .then(({ data }) => setTags(data.data ?? []))
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.catalog.deleteTag(id)
      toast.success(t('toast.deleted'))
      setTags((prev) => prev.filter((tag) => tag.id !== id))
    } catch { toast.error(t('toast.error')) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 flex items-center justify-center">
            <Tag size={18} className="text-violet-500" />
          </div>
          <h1 className="text-xl font-semibold dark:text-white">{t('productTags.title')}</h1>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus size={14} />{t('productTags.add')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
      ) : tags.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-16">{t('productTags.empty')}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <div key={tag.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border dark:border-white/[0.1] border-black/[0.1] dark:bg-white/[0.03] bg-black/[0.02]">
              <Tag size={12} className="opacity-50" />
              <span className="dark:text-white font-medium">{tag.name}</span>
              <span className="text-xs opacity-40 font-mono">{tag.slug}</span>
              <button onClick={() => setModal(tag)} className="opacity-50 hover:opacity-100 p-0.5">
                <Pencil size={11} />
              </button>
              <button onClick={() => handleDelete(tag.id)} className="opacity-50 hover:opacity-100 hover:text-red-500 p-0.5">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <TagModal
          tag={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
