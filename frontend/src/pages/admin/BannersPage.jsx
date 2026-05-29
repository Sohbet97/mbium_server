import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, GripVertical, ToggleLeft, ToggleRight, Loader2, CalendarDays, ExternalLink } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { MediaPicker } from '@/components/media/MediaPicker'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const absUrl = (url) => (!url || url.startsWith('http') ? url : `${BASE}${url}`)

// ── Banner Form Modal ─────────────────────────────────────────────────────────

const EMPTY = {
  title: '', subtitle: '', button_text: '', button_url: '',
  link_url: '', banner_type_id: '', shop_id: '', sort_order: 0,
  is_active: true, starts_at: '', ends_at: '', media_id: '', image_url: '',
}

function BannerFormModal({ banner, types, shops, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(banner ? {
    title:          banner.title          ?? '',
    subtitle:       banner.subtitle       ?? '',
    button_text:    banner.button_text    ?? '',
    button_url:     banner.button_url     ?? '',
    link_url:       banner.link_url       ?? '',
    banner_type_id: banner.banner_type_id ?? '',
    is_active:      banner.is_active      ?? true,
    starts_at:      banner.starts_at ? banner.starts_at.slice(0, 16) : '',
    ends_at:        banner.ends_at   ? banner.ends_at.slice(0, 16)   : '',
    media_id:       banner.media_id  ?? '',
    image_url:      banner.image_url ?? '',
    shop_id:        banner.shop_id   ?? '',
    sort_order:     banner.sort_order ?? 0,
  } : { ...EMPTY })
  const [media, setMedia] = useState(banner?.media ?? null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  function handleMediaSelect(item) {
    setMedia(item)
    set('media_id', item.id)
  }

  function clearMedia() { setMedia(null); set('media_id', ''); set('image_url', '') }

  async function handleSave() {
    if (!form.title.trim()) { setError(t('banners.titleRequired')); return }
    setError(''); setSaving(true)
    try {
      const payload = {
        ...form,
        banner_type_id: form.banner_type_id || null,
        shop_id:        form.shop_id        || null,
        media_id:       form.media_id       || null,
        starts_at:      form.starts_at      || null,
        ends_at:        form.ends_at        || null,
        sort_order:     Number(form.sort_order) || 0,
      }
      if (banner) {
        await AdminApi.banners.update(banner.id, payload)
      } else {
        await AdminApi.banners.create(payload)
      }
      toast.success(banner ? t('toast.updated') : t('toast.created'))
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally { setSaving(false) }
  }

  const thumb = media ? absUrl(media.thumbnail_url || media.url) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08] shrink-0">
          <h2 className="text-base font-semibold dark:text-white text-slate-900">
            {banner ? t('banners.edit') : t('banners.create')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 dark:text-slate-400 text-slate-500 transition-colors text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded p-2">{error}</p>}

          {/* Media picker */}
          <div>
            <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('banners.image')}</label>
            {thumb ? (
              <div className="relative group rounded-lg overflow-hidden aspect-video bg-slate-100 dark:bg-[#242430] max-w-sm">
                <img src={thumb} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button type="button" onClick={() => setPickerOpen(true)} className="px-3 py-1.5 rounded-lg bg-white/90 text-sm font-medium text-slate-700 hover:bg-white">
                    {t('banners.changeImage')}
                  </button>
                  <button type="button" onClick={clearMedia} className="px-3 py-1.5 rounded-lg bg-white/90 text-sm font-medium text-red-600 hover:bg-white">
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setPickerOpen(true)}
                className="w-full max-w-sm aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 dark:border-white/[0.12] border-slate-200 dark:hover:border-white/[0.2] hover:border-slate-300 dark:text-slate-500 text-slate-400 transition-colors">
                <Plus className="h-6 w-6" />
                <span className="text-sm">{t('banners.pickImage')}</span>
              </button>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('banners.type')}</label>
            <select value={form.banner_type_id} onChange={(e) => set('banner_type_id', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
              <option value="">{t('banners.selectType')}</option>
              {types.map((tp) => (
                <option key={tp.id} value={tp.id}>{tp.name_eng || tp.name}</option>
              ))}
            </select>
          </div>

          {/* Shop (store-specific) */}
          <div>
            <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('banners.shop')}</label>
            <select value={form.shop_id} onChange={(e) => set('shop_id', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
              <option value="">{t('banners.globalBanner')}</option>
              {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Sort order */}
          <div>
            <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('banners.sortOrder')}</label>
            <input type="number" min={0} value={form.sort_order} onChange={(e) => set('sort_order', parseInt(e.target.value) || 0)}
              className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('banners.fieldTitle')} *</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder={t('banners.titlePlaceholder')} />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('banners.subtitle')}</label>
            <input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder={t('banners.subtitlePlaceholder')} />
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('banners.linkUrl')}</label>
            <input value={form.link_url} onChange={(e) => set('link_url', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="https://…" />
          </div>

          {/* Button */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('banners.buttonText')}</label>
              <input value={form.button_text} onChange={(e) => set('button_text', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder={t('banners.buttonTextPlaceholder')} />
            </div>
            <div>
              <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('banners.buttonUrl')}</label>
              <input value={form.button_url} onChange={(e) => set('button_url', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="https://…" />
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('banners.startsAt')}</label>
              <input type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
            <div>
              <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('banners.endsAt')}</label>
              <input type="datetime-local" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
          </div>

          {/* Active */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className={cn('relative h-5 w-9 rounded-full transition-colors', form.is_active ? 'bg-blue-600' : 'dark:bg-white/20 bg-slate-300')}>
              <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.is_active ? 'translate-x-4' : 'translate-x-0.5')} />
              <input type="checkbox" className="sr-only" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
            </div>
            <span className="text-sm dark:text-slate-300 text-slate-700">{t('banners.isActive')}</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t dark:border-white/[0.08] border-black/[0.08] shrink-0">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm dark:text-slate-400 text-slate-500 dark:hover:bg-white/[0.06] hover:bg-slate-100 transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('common.save')}
          </button>
        </div>
      </div>

      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleMediaSelect} filterType="image" />
    </div>
  )
}

// ── Banners Page ──────────────────────────────────────────────────────────────

export default function BannersPage() {
  const { t } = useTranslation()
  const [banners, setBanners] = useState([])
  const [types, setTypes] = useState([])
  const [shops, setShops] = useState([])
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // null | 'create' | banner-object
  const dragSrc = useRef(null)
  const bannersRef = useRef(banners)
  useEffect(() => { bannersRef.current = banners }, [banners])

  async function load(type = typeFilter) {
    setLoading(true)
    try {
      const params = { limit: 200 }
      if (type) params.banner_type_id = types.find((t) => t.slug === type)?.id
      const { data } = await AdminApi.banners.getAll(params)
      setBanners(data.data ?? [])
    } catch { toast.error(t('toast.error')) }
    finally { setLoading(false) }
  }

  async function loadTypes() {
    try {
      const { data } = await AdminApi.bannerTypes.getAll()
      setTypes(data.data ?? [])
    } catch {}
  }

  async function loadShops() {
    try {
      const { data } = await AdminApi.shops.getAll({ limit: 200, is_active: true })
      setShops(data.data ?? [])
    } catch {}
  }

  useEffect(() => { loadTypes(); loadShops() }, [])
  useEffect(() => { load() }, [typeFilter, types.length])

  async function handleToggle(banner) {
    try {
      await AdminApi.banners.toggleActive(banner.id, !banner.is_active)
      setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
    } catch { toast.error(t('toast.error')) }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.banners.delete(id)
      toast.success(t('toast.deleted'))
      setBanners((prev) => prev.filter((b) => b.id !== id))
    } catch { toast.error(t('toast.error')) }
  }

  // ── Drag-to-reorder ──────────────────────────────────────────────────────
  function onDragStart(e, index) { dragSrc.current = index; e.dataTransfer.effectAllowed = 'move' }

  function onDragEnter(index) {
    if (dragSrc.current === null || dragSrc.current === index) return
    setBanners((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragSrc.current, 1)
      next.splice(index, 0, moved)
      dragSrc.current = index
      return next
    })
  }

  async function onDragEnd() {
    dragSrc.current = null
    const current = bannersRef.current
    try {
      await AdminApi.banners.reorder(current.map((b, i) => ({ id: b.id, sort_order: i })))
    } catch { toast.error(t('toast.error')) }
  }

  const filteredTypes = [{ slug: '', name_eng: 'All', name: 'Hemmesi' }, ...types]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('banners.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('banners.subtitle_page', { count: banners.length })}</p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> {t('banners.create')}
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {filteredTypes.map((tp) => (
          <button key={tp.slug} onClick={() => setTypeFilter(tp.slug)}
            className={cn(
              'px-3 h-8 rounded-lg text-sm font-medium transition-colors',
              typeFilter === tp.slug
                ? 'bg-blue-600 text-white'
                : 'dark:bg-white/[0.06] bg-slate-100 dark:text-slate-300 text-slate-600 dark:hover:bg-white/[0.1] hover:bg-slate-200'
            )}>
            {tp.name_eng || tp.name}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 dark:text-slate-500 text-slate-400 gap-2">
          <CalendarDays className="h-12 w-12" />
          <p className="text-sm font-medium">{t('banners.empty')}</p>
          <button onClick={() => setModal('create')} className="text-sm text-blue-500 hover:underline">{t('banners.createFirst')}</button>
        </div>
      ) : (
        <div className="space-y-2">
          {banners.map((banner, index) => {
            const thumb = banner.media
              ? absUrl(banner.media.thumbnail_url || banner.media.url)
              : banner.image_url || null
            const typeName = banner.banner_type?.name_eng || banner.banner_type?.name || '—'

            return (
              <div
                key={banner.id}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragEnter={() => onDragEnter(index)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={onDragEnd}
                className="flex items-center gap-3 p-3 rounded-xl border dark:border-white/[0.08] border-slate-200 dark:bg-[#1a1a1f] bg-white select-none group"
              >
                {/* Drag handle */}
                <GripVertical className="h-4 w-4 dark:text-slate-600 text-slate-300 cursor-grab shrink-0" />

                {/* Thumbnail */}
                <div className="h-14 w-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#242430] shrink-0">
                  {thumb
                    ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center dark:text-slate-600 text-slate-300 text-xs">{t('banners.noImage')}</div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium dark:text-white text-slate-900 truncate">{banner.title}</p>
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/[0.08] dark:text-slate-400 text-slate-500">
                      {typeName}
                    </span>
                  </div>
                  {banner.subtitle && <p className="text-xs dark:text-slate-500 text-slate-400 truncate mt-0.5">{banner.subtitle}</p>}
                  {(banner.starts_at || banner.ends_at) && (
                    <p className="text-xs dark:text-slate-600 text-slate-400 mt-0.5">
                      <CalendarDays className="h-3 w-3 inline mr-1" />
                      {banner.starts_at ? new Date(banner.starts_at).toLocaleDateString() : '∞'}
                      {' → '}
                      {banner.ends_at ? new Date(banner.ends_at).toLocaleDateString() : '∞'}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {banner.link_url && (
                    <a href={banner.link_url} target="_blank" rel="noreferrer"
                      className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 dark:text-slate-400 text-slate-500 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button onClick={() => handleToggle(banner)} title={banner.is_active ? t('common.deactivate') : t('common.activate')}
                    className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 transition-colors">
                    {banner.is_active
                      ? <ToggleRight className="h-4 w-4 text-blue-500" />
                      : <ToggleLeft  className="h-4 w-4 dark:text-slate-500 text-slate-400" />}
                  </button>
                  <button onClick={() => setModal(banner)}
                    className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 dark:text-slate-400 text-slate-500 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(banner.id)}
                    className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <BannerFormModal
          banner={modal === 'create' ? null : modal}
          types={types}
          shops={shops}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
