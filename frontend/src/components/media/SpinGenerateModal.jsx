import { useEffect, useRef, useState } from 'react'
import { X, Loader2, CheckCircle, Sparkles, ImagePlus, Trash2 } from 'lucide-react'
import { SellerApi } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const absUrl = (url) => (!url || url.startsWith('http') ? url : `${BASE}${url}`)

const FRAME_COUNTS = [12, 24, 36]
const MIN_REFS = 1
const MAX_REFS = 4

/**
 * Modal for AI-generating a 360° spin frame sequence via Gemini (Nano Banana),
 * either from the product's existing photos or from newly uploaded reference photos.
 */
export function SpinGenerateModal({ productId, variantId, onClose, onGenerated }) {
  const [tab, setTab] = useState('existing') // 'existing' | 'upload'
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState([])
  const [uploadFiles, setUploadFiles] = useState([])
  const [frameCount, setFrameCount] = useState(12)
  const [generating, setGenerating] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    SellerApi.media.getProductMedia(productId, variantId)
      .then(({ data }) => {
        const photos = (data.data ?? []).filter((pm) => pm.media?.type === 'image' && pm.role !== 'spin')
        setItems(photos)
      })
      .catch(() => toast.error('Suratlar ýüklenip bolmady'))
      .finally(() => setLoading(false))
  }, [productId, variantId])

  function toggle(mediaId) {
    setSelected((prev) => {
      if (prev.includes(mediaId)) return prev.filter((id) => id !== mediaId)
      if (prev.length >= MAX_REFS) return prev
      return [...prev, mediaId]
    })
  }

  function handlePickFiles(e) {
    const files = Array.from(e.target.files ?? [])
    const [valid, rejected] = files.reduce(
      ([v, r], f) => f.type.startsWith('image/') ? [[...v, f], r] : [v, [...r, f.name]],
      [[], []]
    )
    if (rejected.length) toast.error(`Ret edildi (diňe surat): ${rejected.join(', ')}`)

    setUploadFiles((prev) => {
      const room = MAX_REFS - prev.length
      if (valid.length > room) toast.error(`Iň köp ${MAX_REFS} surat saýlap bolýar`)
      const accepted = valid.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }))
      return [...prev, ...accepted]
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeUploadFile(index) {
    setUploadFiles((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadFilesRef = useRef(uploadFiles)
  useEffect(() => { uploadFilesRef.current = uploadFiles }, [uploadFiles])

  useEffect(() => {
    return () => uploadFilesRef.current.forEach((f) => URL.revokeObjectURL(f.url))
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    try {
      let data
      if (tab === 'upload') {
        if (uploadFiles.length < MIN_REFS) {
          toast.error(`Iň az ${MIN_REFS} surat saýlaň`)
          return
        }
        const fd = new FormData()
        uploadFiles.forEach(({ file }) => fd.append('files', file))
        fd.append('frame_count', frameCount)
        const res = await SellerApi.products.generateSpinFromUpload(productId, fd, variantId)
        data = res.data
      } else {
        if (selected.length < MIN_REFS) {
          toast.error(`Iň az ${MIN_REFS} surat saýlaň`)
          return
        }
        const res = await SellerApi.products.generateSpin(productId, {
          media_ids: selected,
          frame_count: frameCount,
        }, variantId)
        data = res.data
      }
      toast.success('360° aýlanma görnüşi döredildi')
      onGenerated?.(data.data)
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Döredip bolmady')
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = tab === 'upload' ? uploadFiles.length >= MIN_REFS : selected.length >= MIN_REFS

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1a1a1f] rounded-xl shadow-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] shrink-0">
          <h3 className="font-semibold dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI bilen 360° döret
          </h3>
          <button onClick={onClose} disabled={generating} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 shrink-0">
          {[
            ['existing', 'Bar bolan suratlardan'],
            ['upload', 'Täze surat ýükle'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'px-3 h-8 rounded-lg text-xs font-medium transition-colors',
                tab === key
                  ? 'bg-blue-600 text-white'
                  : 'dark:text-slate-400 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-xs text-slate-400">
            {tab === 'upload'
              ? `1–4 surat ýükläň (öň, yan, arka, ýokar) — AI olardan ${frameCount} kadrly aýlanma yzygiderligini dörediň. Ýüklenen suratlar önümiň galereýasyna hem goşular.`
              : `1–4 sany esasy surat saýlaň (öň, yan, arka, ýokar) — AI olardan ${frameCount} kadrly aýlanma yzygiderligini dörediň.`
            }
            {' '}Eger öň döredilen kadrlar bar bolsa, olar täzeleri bilen ewez ediler.
          </p>

          {tab === 'upload' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {uploadFiles.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border dark:border-white/[0.08] border-slate-200 group">
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeUploadFile(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Aýyr"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              {uploadFiles.length < MAX_REFS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 transition-colors"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-[10px]">{uploadFiles.length} / {MAX_REFS}</span>
                </button>
              )}
              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handlePickFiles} />
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Ilki "Suratlar" bölüminde önümiň suratlaryny goşuň, ýa-da "Täze surat ýükle" sekmesini ulanyň.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {items.map((pm) => {
                const m = pm.media
                const thumb = m.thumbnail_url ? absUrl(m.thumbnail_url) : absUrl(m.url)
                const isSelected = selected.includes(m.id)
                return (
                  <div
                    key={pm.id}
                    onClick={() => toggle(m.id)}
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

          <div>
            <p className="text-xs font-medium mb-2 dark:text-slate-300">Kadr sany</p>
            <div className="flex gap-2">
              {FRAME_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFrameCount(n)}
                  className={cn(
                    'px-3 h-8 rounded-lg text-xs font-medium border transition-colors',
                    frameCount === n
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'dark:border-white/[0.12] border-slate-200 dark:text-slate-400 text-slate-500 hover:border-slate-300'
                  )}
                >
                  {n} kadr
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t dark:border-white/[0.08] shrink-0">
          <span className="text-xs text-slate-400">
            {tab === 'upload'
              ? `${uploadFiles.length} / ${MAX_REFS} surat saýlandy`
              : `${selected.length} / ${MAX_REFS} surat saýlandy`
            }
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={generating} className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg disabled:opacity-50">
              Ýatyr
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || !canGenerate}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generating ? 'Döredilýär… (1-2 min)' : 'Döret'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
