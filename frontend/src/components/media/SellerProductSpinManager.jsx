import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, Loader2, GripVertical, RotateCw, Eye, Sparkles } from 'lucide-react'
import { SellerApi } from '@/lib/api'
import { toast } from 'sonner'
import { SpinViewer } from './SpinViewer'
import { SpinGenerateModal } from './SpinGenerateModal'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const absUrl = (url) => (!url || url.startsWith('http') ? url : `${BASE}${url}`)

const MAX_FRAMES = 36
const MIN_FRAMES_FOR_PREVIEW = 2

export function SellerProductSpinManager({ productId }) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const fileRef  = useRef(null)
  const dragSrc  = useRef(null)
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])

  async function load() {
    setLoading(true)
    try {
      const { data } = await SellerApi.media.getProductMedia(productId)
      const frames = (data.data ?? [])
        .filter((pm) => pm.role === 'spin')
        .sort((a, b) => a.sort_order - b.sort_order)
      setItems(frames)
    } catch { toast.error('Kadrlar ýüklenip bolmady') }
    finally   { setLoading(false) }
  }

  useEffect(() => { if (productId) load() }, [productId])

  // ── Renormalize sort_order to a contiguous 0..N-1 sequence ─────────────────
  async function persistOrder(ordered) {
    await Promise.all(ordered.map((pm, i) =>
      SellerApi.media.updateProductMedia(productId, pm.media_id, { sort_order: i })
    ))
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const [valid, rejected] = files.reduce(
      ([v, r], f) => f.type.startsWith('image/') ? [[...v, f], r] : [v, [...r, f.name]],
      [[], []]
    )
    if (rejected.length) toast.error(`Ret edildi (diňe surat): ${rejected.join(', ')}`)

    const room = MAX_FRAMES - items.length
    const toUpload = valid.slice(0, room)
    if (valid.length > room) toast.error(`Iň köp ${MAX_FRAMES} kadr bolup biler`)
    if (!toUpload.length) { if (fileRef.current) fileRef.current.value = ''; return }

    setUploading(true)
    try {
      let nextIndex = items.length
      for (const file of toUpload) {
        const fd = new FormData()
        fd.append('file', file)
        const { data } = await SellerApi.media.upload(fd)
        const media = data.model ?? data.data
        await SellerApi.media.attachToProduct(productId, {
          media_id: media.id,
          role: 'spin',
          sort_order: nextIndex,
        })
        nextIndex += 1
      }
      toast.success(`${toUpload.length} kadr goşuldy`)
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýükleme ýalňyşlygy')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(e, pm) {
    e.stopPropagation()
    try {
      await SellerApi.media.detachFromProduct(productId, pm.media_id)
      const remaining = itemsRef.current.filter((it) => it.media_id !== pm.media_id)
      await persistOrder(remaining)
      setItems(remaining.map((it, i) => ({ ...it, sort_order: i })))
    } catch { toast.error('Aýrylyp bolmady') }
  }

  function onDragStart(e, index) {
    dragSrc.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragEnter(index) {
    if (dragSrc.current === null || dragSrc.current === index) return
    const from = dragSrc.current
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(index, 0, moved)
      return next
    })
    dragSrc.current = index
  }

  async function onDragEnd() {
    dragSrc.current = null
    try {
      await persistOrder(itemsRef.current)
      setItems((prev) => prev.map((it, i) => ({ ...it, sort_order: i })))
    } catch { toast.error('Tertip ýatda saklanyp bolmady') }
  }

  const frameUrls = items.map((pm) => pm.media?.url).filter(Boolean)

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
    </div>
  )

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Önümi dürli burçlardan (öň, yan, arka, ýokar) düşüren suratlaryňyzy tertip bilen ýükläň —
        näçe köp kadr, şonça-da tekiz aýlanma bolar (12–36 kadr maslahat berilýär).
      </p>

      {items.length === 0 ? (
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg transition-colors dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 gap-2 disabled:opacity-50"
          >
            {uploading
              ? <Loader2 className="h-8 w-8 animate-spin" />
              : <RotateCw className="h-8 w-8" />
            }
            <p className="text-sm">360° kadrlary ýükle</p>
            <p className="text-xs opacity-60">Birnäçe suraty bir wagtda saýlap bilersiňiz</p>
          </button>

          <button
            type="button"
            onClick={() => setGenerateOpen(true)}
            className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg transition-colors dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 gap-2"
          >
            <Sparkles className="h-8 w-8" />
            <p className="text-sm">AI bilen döret</p>
            <p className="text-xs opacity-60">Bar bolan suratlardan awtomatik aýlanma döret</p>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {items.map((pm, index) => {
              const m = pm.media
              const thumb = m?.thumbnail_url ? absUrl(m.thumbnail_url) : absUrl(m?.url)
              return (
                <div
                  key={pm.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragEnter={() => onDragEnter(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={onDragEnd}
                  className="relative group rounded-lg overflow-hidden border cursor-grab active:cursor-grabbing select-none dark:border-white/[0.08] border-slate-200 aspect-square bg-slate-100 dark:bg-[#242430]"
                >
                  <img src={thumb} alt={`Frame ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />

                  <span className="absolute top-1 left-1 text-[10px] font-bold bg-black/70 text-white rounded px-1.5 py-0.5">
                    #{index + 1}
                  </span>

                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-white drop-shadow-md" />
                  </div>

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, pm)}
                      className="p-1.5 rounded-full bg-white/90 hover:bg-white text-red-600"
                      title="Aýyr"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}

            {items.length < MAX_FRAMES && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 transition-colors disabled:opacity-50"
              >
                {uploading
                  ? <Loader2 className="h-6 w-6 animate-spin" />
                  : <ImagePlus className="h-6 w-6" />
                }
                <span className="text-[10px]">{items.length} / {MAX_FRAMES}</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Tertip üçin sürüň · Sil — kadry aýyr
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGenerateOpen(true)}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border dark:border-white/[0.12] border-slate-200 dark:text-slate-300 text-slate-600 hover:border-slate-300 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                AI bilen täzeden döret
              </button>
              {items.length >= MIN_FRAMES_FOR_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Öňünden görmek
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />

      {previewOpen && (
        <SpinViewer frames={frameUrls} onClose={() => setPreviewOpen(false)} />
      )}

      {generateOpen && (
        <SpinGenerateModal
          productId={productId}
          onClose={() => setGenerateOpen(false)}
          onGenerated={() => load()}
        />
      )}
    </div>
  )
}
