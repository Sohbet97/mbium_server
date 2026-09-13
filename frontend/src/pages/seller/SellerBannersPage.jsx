import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Eye, EyeOff, ImagePlus, X, Loader2 } from 'lucide-react'
import { cn, absUrl } from '@/lib/utils'
import { InlineMediaPicker } from '@/components/media/InlineMediaPicker'

const EMPTY = {
  title: '', subtitle: '', link_url: '', button_text: '', button_url: '',
  starts_at: '', ends_at: '', is_active: true, media_id: '', image_url: '',
}

// ── Banner form modal ─────────────────────────────────────────────────────────
function BannerFormModal({ banner, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(banner ? {
    title:       banner.title       ?? '',
    subtitle:    banner.subtitle    ?? '',
    link_url:    banner.link_url    ?? '',
    button_text: banner.button_text ?? '',
    button_url:  banner.button_url  ?? '',
    starts_at:   banner.starts_at   ? banner.starts_at.slice(0, 10) : '',
    ends_at:     banner.ends_at     ? banner.ends_at.slice(0, 10)   : '',
    is_active:   banner.is_active   ?? true,
    media_id:    banner.media_id    ?? '',
    image_url:   banner.image_url   ?? '',
  } : { ...EMPTY })
  const [media, setMedia]         = useState(banner?.media ?? null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving]       = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function handleMediaSelect(item) {
    setMedia(item)
    set('media_id', item.id)
    set('image_url', item.url)
  }

  function clearMedia() {
    setMedia(null)
    set('media_id', '')
    set('image_url', '')
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error(t('seller.titleRequired')); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        starts_at: form.starts_at || null,
        ends_at:   form.ends_at   || null,
        media_id:  form.media_id  || null,
      }
      const { data } = banner
        ? await SellerApi.banners.update(banner.id, payload)
        : await SellerApi.banners.create(payload)
      onSaved(data.model)
      toast.success(banner ? t('toast.updated') : t('toast.created'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setSaving(false) }
  }

  const thumb = media
    ? (media.thumbnail_url ? absUrl(media.thumbnail_url) : absUrl(media.url))
    : null

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{banner ? t('banners.edit') : t('seller.newBanner')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {/* Image */}
          <div>
            <Label className="mb-1.5 block">{t('banners.image')}</Label>
            {thumb ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-white/[0.04]" style={{ aspectRatio: '3/1' }}>
                <img src={thumb} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearMedia}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs hover:bg-black/80"
                >
                  {t('banners.changeImage')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 gap-1.5 transition-colors py-8"
              >
                <ImagePlus className="h-7 w-7" />
                <span className="text-sm">{t('seller.selectImage')}</span>
              </button>
            )}
          </div>

          {/* Title */}
          <div>
            <Label className="mb-1 block">{t('seller.bannerTitle')} <span className="text-red-500">*</span></Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('banners.titlePlaceholder')} />
          </div>

          {/* Subtitle */}
          <div>
            <Label className="mb-1 block">{t('seller.bannerSubtitle')}</Label>
            <Input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder={t('banners.subtitlePlaceholder')} />
          </div>

          {/* Link */}
          <div>
            <Label className="mb-1 block">{t('seller.bannerLink')}</Label>
            <Input value={form.link_url} onChange={(e) => set('link_url', e.target.value)} placeholder="https://..." />
          </div>

          {/* Button */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">{t('seller.bannerBtnText')}</Label>
              <Input value={form.button_text} onChange={(e) => set('button_text', e.target.value)} placeholder={t('banners.buttonTextPlaceholder')} />
            </div>
            <div>
              <Label className="mb-1 block">{t('seller.bannerBtnUrl')}</Label>
              <Input value={form.button_url} onChange={(e) => set('button_url', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">{t('banners.startsAt')}</Label>
              <Input type="date" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} className="dark:[color-scheme:dark]" />
            </div>
            <div>
              <Label className="mb-1 block">{t('banners.endsAt')}</Label>
              <Input type="date" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} className="dark:[color-scheme:dark]" />
            </div>
          </div>

          {/* Active */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              <div className={cn('w-9 h-5 rounded-full transition-colors', form.is_active ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/20')} />
              <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.is_active ? 'translate-x-4' : '')} />
            </div>
            <span className="text-sm dark:text-white">{t('common.active')}</span>
          </label>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {t('common.save')}
          </Button>
        </DialogFooter>

        <InlineMediaPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handleMediaSelect}
        />
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerBannersPage() {
  const { t } = useTranslation()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(undefined) // undefined=closed, null=new, obj=edit
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    SellerApi.banners.getAll()
      .then(({ data }) => setBanners(data.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(model) {
    setBanners((prev) => {
      const idx = prev.findIndex((b) => b.id === model.id)
      return idx >= 0 ? prev.map((b) => b.id === model.id ? model : b) : [model, ...prev]
    })
    setEditTarget(undefined)
  }

  async function handleDelete(id) {
    if (!confirm(t('seller.confirmDeleteBanner'))) return
    setDeleting(id)
    try {
      await SellerApi.banners.delete(id)
      setBanners((prev) => prev.filter((b) => b.id !== id))
      toast.success(t('toast.deleted'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setDeleting(null) }
  }

  async function handleToggle(banner) {
    try {
      const { data } = await SellerApi.banners.update(banner.id, { is_active: !banner.is_active })
      setBanners((prev) => prev.map((b) => b.id === banner.id ? data.model : b))
    } catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold dark:text-white">
          {t('seller.bannersTitle')} <span className="text-slate-400 font-normal text-base">({banners.length})</span>
        </h1>
        <Button size="sm" onClick={() => setEditTarget(null)}>
          <Plus className="h-4 w-4 mr-1.5" />{t('seller.newBanner')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <ImagePlus className="h-12 w-12 text-slate-200 dark:text-white/10" />
          <p className="text-sm">{t('seller.noBanners')}</p>
          <Button size="sm" variant="outline" onClick={() => setEditTarget(null)}>
            <Plus className="h-4 w-4 mr-1.5" />{t('seller.addFirstBanner')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => {
            const thumb = b.media?.thumbnail_url
              ? absUrl(b.media.thumbnail_url)
              : b.media?.url ? absUrl(b.media.url)
              : b.image_url ? absUrl(b.image_url) : null

            return (
              <div
                key={b.id}
                className="flex items-center gap-4 p-3 rounded-xl border dark:border-white/[0.06] bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-24 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/[0.04] shrink-0">
                  {thumb
                    ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <ImagePlus className="h-5 w-5 text-slate-300 dark:text-white/20" />
                      </div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm dark:text-white truncate">{b.title}</div>
                  {b.subtitle && (
                    <div className="text-xs text-slate-400 truncate mt-0.5">{b.subtitle}</div>
                  )}
                  {(b.starts_at || b.ends_at) && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      {b.starts_at ? new Date(b.starts_at).toLocaleDateString('ru-RU') : '…'}
                      {' → '}
                      {b.ends_at   ? new Date(b.ends_at).toLocaleDateString('ru-RU')   : '∞'}
                    </div>
                  )}
                </div>

                {/* Status */}
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                  b.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                )}>
                  {b.is_active ? t('common.active') : t('common.inactive')}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(b)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
                    title={b.is_active ? t('common.deactivate') : t('common.activate')}
                  >
                    {b.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setEditTarget(b)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={deleting === b.id}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / edit modal */}
      {editTarget !== undefined && (
        <BannerFormModal
          banner={editTarget}
          onClose={() => setEditTarget(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
