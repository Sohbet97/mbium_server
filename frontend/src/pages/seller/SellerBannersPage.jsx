import { useEffect, useRef, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Eye, EyeOff, ImagePlus, X, Upload, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const absUrl = (url) => (!url || url.startsWith('http') ? url : `${BASE}${url}`)

const EMPTY = {
  title: '', subtitle: '', link_url: '', button_text: '', button_url: '',
  starts_at: '', ends_at: '', is_active: true, media_id: '', image_url: '',
}

// ── Inline media picker (uses seller's own media library) ────────────────────
function InlineMediaPicker({ open, onClose, onSelect }) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    SellerApi.media.list({ limit: 80, type: 'image' })
      .then(({ data }) => setItems(data.data ?? []))
      .finally(() => setLoading(false))
  }, [open])

  async function handleUpload(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      await Promise.all(files.map((f) => {
        const fd = new FormData()
        fd.append('file', f)
        return SellerApi.media.upload(fd)
      }))
      setLoading(true)
      const { data } = await SellerApi.media.list({ limit: 80, type: 'image' })
      setItems(data.data ?? [])
    } catch { toast.error('Ýükleme ýalňyşlygy') }
    finally {
      setUploading(false); setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1a1a1f] rounded-xl shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] shrink-0">
          <h3 className="font-semibold dark:text-white">Surat saýla</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-3 border-b dark:border-white/[0.08] flex items-center gap-2 shrink-0">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Ýükle
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400 text-sm">
              <ImagePlus className="h-8 w-8" />
              <p>Surat ýok — ilki ýükläň</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {items.map((item) => {
                const thumb = item.thumbnail_url ? absUrl(item.thumbnail_url) : absUrl(item.url)
                return (
                  <div
                    key={item.id}
                    onClick={() => { onSelect(item); onClose() }}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
                  >
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Banner form modal ─────────────────────────────────────────────────────────
function BannerFormModal({ banner, onClose, onSaved }) {
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
    if (!form.title.trim()) { toast.error('Başlyk hökmany'); return }
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
      toast.success(banner ? 'Üýtgedildi' : 'Döredildi')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setSaving(false) }
  }

  const thumb = media
    ? (media.thumbnail_url ? absUrl(media.thumbnail_url) : absUrl(media.url))
    : null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1a1a1f] rounded-xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] shrink-0">
          <h2 className="font-semibold dark:text-white">{banner ? 'Banneri üýtget' : 'Täze banner'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Image */}
          <div>
            <Label className="mb-1.5 block">Surat</Label>
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
                  Üýtget
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 gap-1.5 transition-colors py-8"
              >
                <ImagePlus className="h-7 w-7" />
                <span className="text-sm">Surat saýla</span>
              </button>
            )}
          </div>

          {/* Title */}
          <div>
            <Label className="mb-1 block">Başlyk <span className="text-red-500">*</span></Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Banner başlygy" />
          </div>

          {/* Subtitle */}
          <div>
            <Label className="mb-1 block">Goşmaça tekst</Label>
            <Input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="Gysgaça düşündiriş" />
          </div>

          {/* Link */}
          <div>
            <Label className="mb-1 block">Salgy (URL)</Label>
            <Input value={form.link_url} onChange={(e) => set('link_url', e.target.value)} placeholder="https://..." />
          </div>

          {/* Button */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Düwme teksti</Label>
              <Input value={form.button_text} onChange={(e) => set('button_text', e.target.value)} placeholder="Satyn al" />
            </div>
            <div>
              <Label className="mb-1 block">Düwme URL</Label>
              <Input value={form.button_url} onChange={(e) => set('button_url', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Başlanýar</Label>
              <Input type="date" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} className="dark:[color-scheme:dark]" />
            </div>
            <div>
              <Label className="mb-1 block">Tamamlanýar</Label>
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
            <span className="text-sm dark:text-white">Işjeň</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t dark:border-white/[0.08] shrink-0">
          <Button variant="outline" onClick={onClose}>Ýatyr</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Sakla
          </Button>
        </div>
      </div>

      <InlineMediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerBannersPage() {
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
    if (!confirm('Banneri pozmak isleýärsiňizmi?')) return
    setDeleting(id)
    try {
      await SellerApi.banners.delete(id)
      setBanners((prev) => prev.filter((b) => b.id !== id))
      toast.success('Pozuldy')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setDeleting(null) }
  }

  async function handleToggle(banner) {
    try {
      const { data } = await SellerApi.banners.update(banner.id, { is_active: !banner.is_active })
      setBanners((prev) => prev.map((b) => b.id === banner.id ? data.model : b))
    } catch (e) { toast.error(e.response?.data?.message ?? 'Ýalňyşlyk') }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold dark:text-white">
          Bannerler <span className="text-slate-400 font-normal text-base">({banners.length})</span>
        </h1>
        <Button size="sm" onClick={() => setEditTarget(null)}>
          <Plus className="h-4 w-4 mr-1.5" />Täze banner
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <ImagePlus className="h-12 w-12 text-slate-200 dark:text-white/10" />
          <p className="text-sm">Banner ýok</p>
          <Button size="sm" variant="outline" onClick={() => setEditTarget(null)}>
            <Plus className="h-4 w-4 mr-1.5" />Ilkinji banneri goş
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
                  {b.is_active ? 'Işjeň' : 'Gizlin'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(b)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
                    title={b.is_active ? 'Gizle' : 'Işjeňleşdir'}
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
