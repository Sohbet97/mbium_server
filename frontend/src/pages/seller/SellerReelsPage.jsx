import { useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Eye, EyeOff, Film, Play, X, Loader2 } from 'lucide-react'
import { cn, absUrl } from '@/lib/utils'
import { InlineMediaPicker } from '@/components/media/InlineMediaPicker'
import { VideoPreviewModal } from '@/components/media/VideoPreviewModal'
import { ModerationBadge } from '@/components/common/ModerationBadge'
import { MOD } from '@/lib/moderation'

const EMPTY = { caption: '', product_id: '', is_active: true, video_id: '', thumbnail_id: '' }

// ── Reel form modal ───────────────────────────────────────────────────────────
function ReelFormModal({ reel, products, onClose, onSaved }) {
  const [form, setForm] = useState(reel ? {
    caption:      reel.caption      ?? '',
    product_id:   reel.product_id   ?? '',
    is_active:    reel.is_active    ?? true,
    video_id:     reel.video?.id    ?? '',
    thumbnail_id: reel.thumbnail?.id ?? '',
  } : { ...EMPTY })
  const [video, setVideo]   = useState(reel?.video ?? null)
  const [thumb, setThumb]   = useState(reel?.thumbnail ?? null)
  const [videoPickerOpen, setVideoPickerOpen] = useState(false)
  const [thumbPickerOpen, setThumbPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.video_id) { setError('Wideo hökman'); return }
    setError(''); setSaving(true)
    try {
      const payload = {
        caption:      form.caption      || null,
        product_id:   form.product_id   || null,
        is_active:    form.is_active,
        thumbnail_id: form.thumbnail_id || null,
      }
      const { data } = reel
        ? await SellerApi.reels.update(reel.id, payload)
        : await SellerApi.reels.create({ ...payload, video_id: form.video_id })
      onSaved(data.model)
      toast.success(reel ? 'Üýtgedildi' : 'Döredildi')
    } catch (e) {
      setError(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1a1a1f] rounded-xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] shrink-0">
          <h2 className="font-semibold dark:text-white">{reel ? 'Reel-i üýtget' : 'Täze reel'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded p-2">{error}</p>}

          {reel && (
            <div>
              <Label className="mb-1.5 block">Moderasiýa</Label>
              <ModerationBadge status={reel.moderation_status ?? MOD.PENDING} tPrefix="reels" />
              {reel.moderation_status === MOD.REJECTED && reel.moderation_note && (
                <p className="mt-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded p-2">
                  {reel.moderation_note}
                </p>
              )}
            </div>
          )}

          {/* Video */}
          <div>
            <Label className="mb-1.5 block">Wideo <span className="text-red-500">*</span></Label>
            {video ? (
              <div className="space-y-2">
                <video
                  key={video.id}
                  src={absUrl(video.url)}
                  poster={thumb ? absUrl(thumb.thumbnail_url || thumb.url) : undefined}
                  controls
                  className="rounded-xl bg-slate-900 mx-auto"
                  style={{ aspectRatio: '9/16', maxHeight: 220 }}
                />
                <button type="button" onClick={() => setVideoPickerOpen(true)}
                  className="text-xs font-medium text-blue-600 hover:underline block mx-auto">
                  Üýtget
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setVideoPickerOpen(true)}
                className="w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 gap-1.5 transition-colors py-8">
                <Film className="h-7 w-7" />
                <span className="text-sm">Wideo saýla</span>
              </button>
            )}
          </div>

          {/* Thumbnail */}
          <div>
            <Label className="mb-1.5 block">Sur (goşmaça)</Label>
            {thumb ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-white/[0.04]" style={{ aspectRatio: '3/1' }}>
                <img src={absUrl(thumb.thumbnail_url || thumb.url)} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setThumb(null); set('thumbnail_id', '') }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
                  <X className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setThumbPickerOpen(true)}
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs hover:bg-black/80">
                  Üýtget
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setThumbPickerOpen(true)}
                className="w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 gap-1.5 transition-colors py-6">
                <Plus className="h-6 w-6" />
                <span className="text-sm">Sur saýla</span>
              </button>
            )}
          </div>

          {/* Linked product */}
          <div>
            <Label className="mb-1 block">Haryt (goşmaça)</Label>
            <select value={form.product_id} onChange={(e) => set('product_id', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
              <option value="">Haryt ýok</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Caption */}
          <div>
            <Label className="mb-1 block">Ýazgy</Label>
            <textarea rows={3} value={form.caption} onChange={(e) => set('caption', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border dark:bg-[#242430] dark:border-white/[0.08] dark:text-white bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
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

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t dark:border-white/[0.08] shrink-0">
          <Button variant="outline" onClick={onClose}>Ýatyr</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Sakla
          </Button>
        </div>
      </div>

      <InlineMediaPicker
        open={videoPickerOpen}
        onClose={() => setVideoPickerOpen(false)}
        onSelect={(item) => { setVideo(item); set('video_id', item.id) }}
        mediaType="video"
      />
      <InlineMediaPicker
        open={thumbPickerOpen}
        onClose={() => setThumbPickerOpen(false)}
        onSelect={(item) => { setThumb(item); set('thumbnail_id', item.id) }}
        mediaType="image"
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellerReelsPage() {
  const [reels, setReels]     = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(undefined) // undefined=closed, null=new, obj=edit
  const [deleting, setDeleting] = useState(null)
  const [previewReel, setPreviewReel] = useState(null)

  useEffect(() => {
    SellerApi.reels.getAll()
      .then(({ data }) => setReels(data.data ?? []))
      .finally(() => setLoading(false))
    SellerApi.products.getAll({ limit: 200 })
      .then(({ data }) => setProducts(data.data ?? []))
      .catch(() => {})
  }, [])

  function handleSaved(model) {
    setReels((prev) => {
      const idx = prev.findIndex((r) => r.id === model.id)
      return idx >= 0 ? prev.map((r) => r.id === model.id ? model : r) : [model, ...prev]
    })
    setEditTarget(undefined)
  }

  async function handleDelete(id) {
    if (!confirm('Reel-i pozmak isleýärsiňizmi?')) return
    setDeleting(id)
    try {
      await SellerApi.reels.delete(id)
      setReels((prev) => prev.filter((r) => r.id !== id))
      toast.success('Pozuldy')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setDeleting(null) }
  }

  async function handleToggle(reel) {
    try {
      const { data } = await SellerApi.reels.update(reel.id, { is_active: !reel.is_active })
      setReels((prev) => prev.map((r) => r.id === reel.id ? data.model : r))
    } catch (e) { toast.error(e.response?.data?.message ?? 'Ýalňyşlyk') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold dark:text-white">
          Reeller <span className="text-slate-400 font-normal text-base">({reels.length})</span>
        </h1>
        <Button size="sm" onClick={() => setEditTarget(null)}>
          <Plus className="h-4 w-4 mr-1.5" />Täze reel
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : reels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Film className="h-12 w-12 text-slate-200 dark:text-white/10" />
          <p className="text-sm">Reel ýok</p>
          <Button size="sm" variant="outline" onClick={() => setEditTarget(null)}>
            <Plus className="h-4 w-4 mr-1.5" />Ilkinji reeli goş
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reels.map((r) => {
            const thumb = r.thumbnail?.thumbnail_url
              ? absUrl(r.thumbnail.thumbnail_url)
              : r.thumbnail?.url ? absUrl(r.thumbnail.url) : null

            return (
              <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl border dark:border-white/[0.06] bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <button type="button" onClick={() => setPreviewReel(r)} disabled={!r.video}
                  className="relative group w-24 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/[0.04] shrink-0 flex items-center justify-center">
                  {thumb
                    ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                    : <Film className="h-5 w-5 text-slate-300 dark:text-white/20" />
                  }
                  {r.video && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="h-5 w-5 text-white fill-white" />
                    </div>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-sm dark:text-white truncate">{r.caption || '(ýazgy ýok)'}</div>
                    <ModerationBadge status={r.moderation_status ?? MOD.PENDING} tPrefix="reels" />
                  </div>
                  {r.product && (
                    <div className="text-xs text-slate-400 truncate mt-0.5">{r.product.name}</div>
                  )}
                  <div className="text-xs text-slate-400 mt-0.5">
                    {r.view_count ?? 0} gözden geçirme · {r.like_count ?? 0} halanan
                  </div>
                  {r.moderation_status === MOD.REJECTED && r.moderation_note && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-0.5 truncate">{r.moderation_note}</div>
                  )}
                </div>

                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                  r.is_active
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                )}>
                  {r.is_active ? 'Işjeň' : 'Gizlin'}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggle(r)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors" title={r.is_active ? 'Gizle' : 'Işjeňleşdir'}>
                    {r.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setEditTarget(r)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editTarget !== undefined && (
        <ReelFormModal
          reel={editTarget}
          products={products}
          onClose={() => setEditTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {previewReel && (
        <VideoPreviewModal video={previewReel.video} onClose={() => setPreviewReel(null)} />
      )}
    </div>
  )
}
