import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Film, Play, ShieldCheck, ShieldX } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { MediaPicker } from '@/components/media/MediaPicker'
import { VideoPreviewModal } from '@/components/media/VideoPreviewModal'
import { ModerationBadge } from '@/components/common/ModerationBadge'
import { MOD } from '@/lib/moderation'
import { toast } from 'sonner'
import { cn, absUrl } from '@/lib/utils'

const EMPTY = { shop_id: '', video_id: '', thumbnail_id: '', caption: '', product_id: '', is_active: true }

// ── Reel form modal ─────────────────────────────────────────────────────────────

function ReelFormModal({ reel, shops, onClose, onSaved }) {
  const { t } = useTranslation()
  const isEdit = !!reel
  const [form, setForm] = useState(reel ? {
    shop_id:      reel.shop_id      ?? '',
    video_id:     reel.video?.id    ?? '',
    thumbnail_id: reel.thumbnail?.id ?? '',
    caption:      reel.caption      ?? '',
    product_id:   reel.product_id   ?? '',
    is_active:    reel.is_active    ?? true,
  } : { ...EMPTY })
  const [video, setVideo] = useState(reel?.video ?? null)
  const [thumb, setThumb] = useState(reel?.thumbnail ?? null)
  const [products, setProducts] = useState([])
  const [videoPickerOpen, setVideoPickerOpen] = useState(false)
  const [thumbPickerOpen, setThumbPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [modSaving, setModSaving] = useState(false)
  const [current, setCurrent] = useState(reel)

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  useEffect(() => {
    if (!form.shop_id) { setProducts([]); return }
    AdminApi.products.getAll({ shop_id: form.shop_id, limit: 200 })
      .then(({ data }) => setProducts(data.data ?? []))
      .catch(() => setProducts([]))
  }, [form.shop_id])

  async function handleSave() {
    if (!isEdit && !form.shop_id) { setError(t('reels.shopRequired', 'Shop is required')); return }
    if (!form.video_id) { setError(t('reels.videoRequired', 'Video is required')); return }
    setError(''); setSaving(true)
    try {
      if (isEdit) {
        await AdminApi.reels.update(reel.id, {
          thumbnail_id: form.thumbnail_id || null,
          caption:      form.caption      || null,
          product_id:   form.product_id   || null,
          is_active:    form.is_active,
        })
      } else {
        await AdminApi.reels.create({
          shop_id:      Number(form.shop_id),
          video_id:     form.video_id,
          thumbnail_id: form.thumbnail_id || null,
          caption:      form.caption      || null,
          product_id:   form.product_id   || null,
        })
      }
      toast.success(isEdit ? t('toast.updated') : t('toast.created'))
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally { setSaving(false) }
  }

  async function handleApprove() {
    setModSaving(true)
    try {
      const { data } = await AdminApi.reels.approve(reel.id)
      setCurrent(data.model)
      toast.success(t('toast.updated'))
      onSaved()
    } catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
    finally { setModSaving(false) }
  }

  async function handleReject() {
    setModSaving(true)
    try {
      const { data } = await AdminApi.reels.reject(reel.id, { note: rejectNote })
      setCurrent(data.model)
      setShowRejectForm(false); setRejectNote('')
      toast.success(t('toast.updated'))
      onSaved()
    } catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
    finally { setModSaving(false) }
  }

  const status = current?.moderation_status ?? MOD.PENDING

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08] shrink-0">
          <h2 className="text-base font-semibold dark:text-white text-slate-900">
            {isEdit ? t('reels.edit', 'Edit reel') : t('reels.create', 'Create reel')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 dark:text-slate-400 text-slate-500 transition-colors text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded p-2">{error}</p>}

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border dark:border-white/[0.08] border-slate-200 p-3">
              <div>
                <p className="text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">{t('reels.moderationStatus', 'Moderation status')}</p>
                <ModerationBadge status={status} tPrefix="reels" />
              </div>
              {status !== MOD.APPROVED && !showRejectForm && (
                <div className="flex gap-2">
                  <button onClick={handleApprove} disabled={modSaving}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                    <ShieldCheck className="h-3.5 w-3.5" /> {t('reels.approveAction', 'Approve')}
                  </button>
                  <button onClick={() => setShowRejectForm(true)} disabled={modSaving}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50">
                    <ShieldX className="h-3.5 w-3.5" /> {t('reels.rejectAction', 'Reject')}
                  </button>
                </div>
              )}
              {status === MOD.APPROVED && !showRejectForm && (
                <button onClick={() => setShowRejectForm(true)} disabled={modSaving}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50">
                  <ShieldX className="h-3.5 w-3.5" /> {t('reels.rejectAction', 'Reject')}
                </button>
              )}
            </div>
          )}
          {isEdit && showRejectForm && (
            <div className="space-y-2 rounded-lg border dark:border-white/[0.08] border-slate-200 p-3">
              <label className="block text-xs font-medium dark:text-slate-400 text-slate-500">{t('reels.rejectNote', 'Rejection note')}</label>
              <textarea rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                placeholder={t('reels.rejectNotePlaceholder', 'Explain why this reel is rejected')}
                className="w-full px-3 py-2 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowRejectForm(false); setRejectNote('') }} className="px-3 py-1.5 rounded-lg text-sm dark:text-slate-400 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                  {t('common.cancel')}
                </button>
                <button onClick={handleReject} disabled={modSaving} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                  {modSaving ? '…' : t('reels.rejectAction', 'Reject')}
                </button>
              </div>
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('reels.shop', 'Shop')} *</label>
              <select value={form.shop_id} onChange={(e) => set('shop_id', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                <option value="">{t('reels.selectShop', 'Select a shop')}</option>
                {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('reels.video', 'Video')} *</label>
            {video ? (
              <div className="space-y-2 max-w-sm">
                <video
                  key={video.id}
                  src={absUrl(video.url)}
                  poster={thumb ? absUrl(thumb.thumbnail_url || thumb.url) : undefined}
                  controls
                  className="w-full aspect-video rounded-lg bg-slate-900"
                />
                <button type="button" onClick={() => setVideoPickerOpen(true)}
                  className="text-xs font-medium text-blue-600 hover:underline">
                  {t('reels.changeVideo', 'Change video')}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setVideoPickerOpen(true)}
                className="w-full max-w-sm aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 dark:border-white/[0.12] border-slate-200 dark:hover:border-white/[0.2] hover:border-slate-300 dark:text-slate-500 text-slate-400 transition-colors">
                <Plus className="h-6 w-6" />
                <span className="text-sm">{t('reels.pickVideo', 'Pick a video')}</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('reels.thumbnail', 'Thumbnail (optional)')}</label>
            {thumb ? (
              <div className="relative group rounded-lg overflow-hidden aspect-video bg-slate-100 dark:bg-[#242430] max-w-sm">
                <img src={absUrl(thumb.thumbnail_url || thumb.url)} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button type="button" onClick={() => setThumbPickerOpen(true)} className="px-3 py-1.5 rounded-lg bg-white/90 text-sm font-medium text-slate-700 hover:bg-white">
                    {t('reels.changeThumbnail', 'Change')}
                  </button>
                  <button type="button" onClick={() => { setThumb(null); set('thumbnail_id', '') }} className="px-3 py-1.5 rounded-lg bg-white/90 text-sm font-medium text-red-600 hover:bg-white">
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setThumbPickerOpen(true)}
                className="w-full max-w-sm aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 dark:border-white/[0.12] border-slate-200 dark:hover:border-white/[0.2] hover:border-slate-300 dark:text-slate-500 text-slate-400 transition-colors">
                <Plus className="h-6 w-6" />
                <span className="text-sm">{t('reels.pickThumbnail', 'Pick a thumbnail')}</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('reels.linkedProduct', 'Linked product (optional)')}</label>
            <select value={form.product_id} onChange={(e) => set('product_id', e.target.value)} disabled={!form.shop_id}
              className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50">
              <option value="">{t('reels.noProduct', 'No product')}</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">{t('reels.caption', 'Caption')}</label>
            <textarea rows={3} value={form.caption} onChange={(e) => set('caption', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className={cn('relative h-5 w-9 rounded-full transition-colors', form.is_active ? 'bg-blue-600' : 'dark:bg-white/20 bg-slate-300')}>
              <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.is_active ? 'translate-x-4' : 'translate-x-0.5')} />
              <input type="checkbox" className="sr-only" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
            </div>
            <span className="text-sm dark:text-slate-300 text-slate-700">{t('reels.isActive', 'Active')}</span>
          </label>
        </div>

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

      <MediaPicker open={videoPickerOpen} onClose={() => setVideoPickerOpen(false)} filterType="video"
        onSelect={(item) => { setVideo(item); set('video_id', item.id) }} />
      <MediaPicker open={thumbPickerOpen} onClose={() => setThumbPickerOpen(false)} filterType="image"
        onSelect={(item) => { setThumb(item); set('thumbnail_id', item.id) }} />
    </div>
  )
}

// ── Reels page ────────────────────────────────────────────────────────────────

export default function ReelsPage() {
  const { t } = useTranslation()
  const [reels, setReels] = useState([])
  const [shops, setShops] = useState([])
  const [shopFilter, setShopFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // null | 'create' | reel object
  const [previewReel, setPreviewReel] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const params = { limit: 200 }
      if (shopFilter) params.shop_id = shopFilter
      if (statusFilter !== '') params.moderation_status = statusFilter
      const { data } = await AdminApi.reels.getAll(params)
      setReels(data.data ?? [])
    } catch { toast.error(t('toast.error')) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    AdminApi.shops.getAll({ limit: 500, is_active: true }).then(({ data }) => setShops(data.data ?? [])).catch(() => {})
  }, [])
  useEffect(() => { load() }, [shopFilter, statusFilter])

  async function handleToggle(reel) {
    try {
      await AdminApi.reels.update(reel.id, { is_active: !reel.is_active })
      setReels((prev) => prev.map((r) => r.id === reel.id ? { ...r, is_active: !r.is_active } : r))
    } catch { toast.error(t('toast.error')) }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.reels.delete(id)
      toast.success(t('toast.deleted'))
      setReels((prev) => prev.filter((r) => r.id !== id))
    } catch { toast.error(t('toast.error')) }
  }

  const statusTabs = [
    { value: '', label: t('reels.statusAll', 'All') },
    { value: MOD.PENDING,  label: t('reels.modStatusPending', 'Pending') },
    { value: MOD.APPROVED, label: t('reels.modStatusApproved', 'Approved') },
    { value: MOD.REJECTED, label: t('reels.modStatusRejected', 'Rejected') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('reels.title', 'Reels')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('reels.subtitle_page', '{{count}} reels', { count: reels.length })}</p>
        </div>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> {t('reels.create', 'Create reel')}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {statusTabs.map((tab) => (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
              className={cn('px-3 h-8 rounded-lg text-sm font-medium transition-colors',
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'dark:bg-white/[0.06] bg-slate-100 dark:text-slate-300 text-slate-600 dark:hover:bg-white/[0.1] hover:bg-slate-200')}>
              {tab.label}
            </button>
          ))}
        </div>
        <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}
          className="h-8 px-3 rounded-lg text-sm border dark:bg-[#1a1a1f] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
          <option value="">{t('reels.allShops', 'All shops')}</option>
          {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : reels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 dark:text-slate-500 text-slate-400 gap-2">
          <Film className="h-12 w-12" />
          <p className="text-sm font-medium">{t('reels.empty', 'No reels yet')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reels.map((reel) => {
            const thumb = reel.thumbnail ? absUrl(reel.thumbnail.thumbnail_url || reel.thumbnail.url) : null
            return (
              <div key={reel.id} className="flex items-center gap-3 p-3 rounded-xl border dark:border-white/[0.08] border-slate-200 dark:bg-[#1a1a1f] bg-white">
                <button type="button" onClick={() => setPreviewReel(reel)} disabled={!reel.video}
                  className="relative group h-14 w-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#242430] shrink-0 flex items-center justify-center">
                  {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <Film className="h-5 w-5 text-slate-300 dark:text-white/20" />}
                  {reel.video && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="h-5 w-5 text-white fill-white" />
                    </div>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium dark:text-white text-slate-900 truncate">{reel.caption || t('reels.noCaption', '(no caption)')}</p>
                    <ModerationBadge status={reel.moderation_status} tPrefix="reels" />
                  </div>
                  <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
                    {reel.shop?.name} {reel.product ? `· ${reel.product.name}` : ''} · {t('reels.views', '{{count}} views', { count: reel.view_count ?? 0 })} · {t('reels.likes', '{{count}} likes', { count: reel.like_count ?? 0 })}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggle(reel)} title={reel.is_active ? t('common.deactivate') : t('common.activate')}
                    className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 transition-colors">
                    {reel.is_active ? <ToggleRight className="h-4 w-4 text-blue-500" /> : <ToggleLeft className="h-4 w-4 dark:text-slate-500 text-slate-400" />}
                  </button>
                  <button onClick={() => setModal(reel)} className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 dark:text-slate-400 text-slate-500 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(reel.id)} className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <ReelFormModal
          reel={modal === 'create' ? null : modal}
          shops={shops}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}

      {previewReel && (
        <VideoPreviewModal video={previewReel.video} onClose={() => setPreviewReel(null)} />
      )}
    </div>
  )
}
