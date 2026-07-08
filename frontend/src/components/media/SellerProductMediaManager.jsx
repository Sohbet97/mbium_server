import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, Star, Loader2, Upload, X, GripVertical, CheckCircle, Scissors, RotateCw } from 'lucide-react'
import { SellerApi } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BackgroundRemovalModal } from './BackgroundRemovalModal'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const absUrl = (url) => (!url || url.startsWith('http') ? url : `${BASE}${url}`)

const MAX_ITEMS = 20

function SellerMediaPickerModal({ open, onClose, onSelect, remaining = MAX_ITEMS }) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState([])
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setSelected([])
    setLoading(true)
    SellerApi.media.list({ limit: 80, type: 'image' })
      .then(({ data }) => setItems(data.data ?? []))
      .finally(() => setLoading(false))
  }, [open])

  async function handleUpload(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const [valid, rejected] = files.reduce(
      ([v, r], f) => f.type.startsWith('image/') ? [[...v, f], r] : [v, [...r, f.name]],
      [[], []]
    )
    if (rejected.length) toast.error(`Ret edildi (diňe surat): ${rejected.join(', ')}`)
    if (!valid.length) { if (fileRef.current) fileRef.current.value = ''; return }
    setUploading(true)
    try {
      await Promise.all(valid.map((f) => {
        const fd = new FormData()
        fd.append('file', f)
        return SellerApi.media.upload(fd)
      }))
      toast.success(`${valid.length} faýl ýüklendi`)
      setLoading(true)
      const { data } = await SellerApi.media.list({ limit: 80, type: 'image' })
      setItems(data.data ?? [])
    } catch {
      toast.error('Ýükleme ýalňyşlygy')
    } finally {
      setUploading(false)
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function toggle(item) {
    setSelected((prev) => {
      if (prev.find((s) => s.id === item.id)) return prev.filter((s) => s.id !== item.id)
      if (prev.length >= remaining) return prev
      return [...prev, item]
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#1a1a1f] rounded-xl shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] shrink-0">
          <h3 className="font-semibold dark:text-white">Surat saýla</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upload bar */}
        <div className="px-5 py-3 border-b dark:border-white/[0.08] flex items-center gap-2 shrink-0">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Upload className="h-3.5 w-3.5" />
            }
            Ýükle
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
          <span className="text-xs text-slate-400">{items.length} surat · iň köp {remaining} saýlap bilersiň</span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400 text-sm">
              <ImagePlus className="h-8 w-8" />
              <p>Surat ýok — ilki ýükläň</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {items.map((item) => {
                const thumb = item.thumbnail_url
                  ? absUrl(item.thumbnail_url)
                  : absUrl(item.url)
                const isSelected = selected.some((s) => s.id === item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => toggle(item)}
                    className={cn(
                      'relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all',
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/30'
                        : 'border-transparent hover:border-slate-300 dark:hover:border-white/20'
                    )}
                  >
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-blue-500 drop-shadow-sm" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t dark:border-white/[0.08] shrink-0">
          <span className="text-xs text-slate-400">
            {selected.length} / {remaining} saýlandy
            {selected.length >= remaining && <span className="ml-1 text-amber-500">Limit doldy</span>}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"
            >
              Ýatyr
            </button>
            <button
              onClick={() => { onSelect(selected); onClose() }}
              disabled={!selected.length}
              className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Saýla ({selected.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SellerProductMediaManager({ productId, variantId }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [bgRemovalMedia, setBgRemovalMedia] = useState(null)
  const [rotatingId, setRotatingId] = useState(null)
  const dragSrc  = useRef(null)
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])

  async function load() {
    setLoading(true)
    try {
      const { data } = await SellerApi.media.getProductMedia(productId, variantId)
      setItems(data.data ?? [])
    } catch { toast.error('Suratlar ýüklenip bolmady') }
    finally   { setLoading(false) }
  }

  useEffect(() => { if (productId) load() }, [productId, variantId])

  async function handleSelect(selected) {
    if (!selected.length) return
    const hasPrimary = items.some((it) => it.role === 'primary')
    try {
      await Promise.all(selected.map((m, i) =>
        SellerApi.media.attachToProduct(productId, {
          media_id: m.id,
          role: !hasPrimary && i === 0 ? 'primary' : 'gallery',
        }, variantId)
      ))
      load()
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Goşulyp bolmady')
    }
  }

  async function handleRotate(e, mediaId) {
    e.stopPropagation()
    if (rotatingId === mediaId) return
    setRotatingId(mediaId)
    try {
      await SellerApi.products.rotateMedia(productId, mediaId, 90)
      load()
    } catch { toast.error('Aýlamak başartmady') }
    finally { setRotatingId(null) }
  }

  async function handleDetach(e, mediaId) {
    e.stopPropagation()
    try {
      await SellerApi.media.detachFromProduct(productId, mediaId, variantId)
      setItems((prev) => prev.filter((it) => it.media_id !== mediaId))
    } catch { toast.error('Aýrylyp bolmady') }
  }

  async function handleSetPrimary(e, mediaId) {
    e.stopPropagation()
    try {
      await SellerApi.media.updateProductMedia(productId, mediaId, { role: 'primary' }, variantId)
      load()
    } catch { toast.error('Belläp bolmady') }
  }

  function onDragStart(e, index) {
    dragSrc.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragEnter(index) {
    if (dragSrc.current === null || dragSrc.current === index) return
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragSrc.current, 1)
      next.splice(index, 0, moved)
      dragSrc.current = index
      return next
    })
  }

  async function onDragEnd() {
    dragSrc.current = null
    try {
      await Promise.all(itemsRef.current.map((pm, i) =>
        SellerApi.media.updateProductMedia(productId, pm.media_id, { sort_order: i }, variantId)
      ))
    } catch { /* silently ignore reorder save failure */ }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
    </div>
  )

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg transition-colors dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 gap-2"
        >
          <ImagePlus className="h-8 w-8" />
          <p className="text-sm">Surat goş</p>
          <p className="text-xs opacity-60">Media kitaphanañyzdan saýlaň ýa-da ýükläň</p>
        </button>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map((pm, index) => {
            const m = pm.media
            const thumb = m.thumbnail_url ? absUrl(m.thumbnail_url) : absUrl(m.url)
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
                <img src={thumb} alt={m.original_name} className="w-full h-full object-cover pointer-events-none" />

                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-white drop-shadow-md" />
                </div>

                {pm.role === 'primary' && (
                  <div className="absolute top-1 left-1">
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-black/70 text-white rounded px-1 py-0.5">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 stroke-yellow-400" />
                      Esasy
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  {pm.role !== 'primary' && (
                    <button
                      type="button"
                      onClick={(e) => handleSetPrimary(e, m.id)}
                      className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700"
                      title="Esasy surat et"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleRotate(e, m.id)}
                    disabled={rotatingId === m.id}
                    className="p-1.5 rounded-full bg-white/90 hover:bg-white text-blue-600 disabled:opacity-50"
                    title="Aýla (90°)"
                  >
                    {rotatingId === m.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <RotateCw className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setBgRemovalMedia(m) }}
                    className="p-1.5 rounded-full bg-white/90 hover:bg-white text-violet-600"
                    title="Fon aýyr"
                  >
                    <Scissors className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDetach(e, m.id)}
                    className="p-1.5 rounded-full bg-white/90 hover:bg-white text-red-600"
                    title="Aýyr"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}

          {items.length < MAX_ITEMS && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 transition-colors"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-[10px]">{items.length} / {MAX_ITEMS}</span>
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-xs text-slate-400">
          Tertip üçin sürüň · Ýyldyz — esasy surat · Sil — harytdan aýyr
        </p>
      )}

      <SellerMediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        remaining={Math.max(0, MAX_ITEMS - items.length)}
      />

      {bgRemovalMedia && (
        <BackgroundRemovalModal
          productId={productId}
          variantId={variantId}
          media={bgRemovalMedia}
          onClose={() => setBgRemovalMedia(null)}
          onSaved={() => { setBgRemovalMedia(null); load() }}
        />
      )}
    </div>
  )
}
