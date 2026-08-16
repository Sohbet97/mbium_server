import { useEffect, useRef, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { toast } from 'sonner'
import { ImagePlus, Film, X, Upload, Loader2 } from 'lucide-react'
import { absUrl } from '@/lib/utils'

const MEDIA_PAGE_SIZE = 80

const ACCEPT = { image: 'image/*', video: 'video/mp4,video/webm,video/quicktime' }
const EMPTY_ICON = { image: ImagePlus, video: Film }
const EMPTY_LABEL = { image: 'Surat ýok — ilki ýükläň', video: 'Wideo ýok — ilki ýükläň' }
const TITLE = { image: 'Surat saýla', video: 'Wideo saýla' }

// Seller's own media library, filtered to `mediaType` ('image' | 'video').
export function InlineMediaPicker({ open, onClose, onSelect, mediaType = 'image' }) {
  const [items, setItems]       = useState([])
  const [count, setCount]       = useState(0)
  const [loading, setLoading]   = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    SellerApi.media.list({ limit: MEDIA_PAGE_SIZE, skip: 0, type: mediaType })
      .then(({ data }) => { setItems(data.data ?? []); setCount(data.count ?? 0) })
      .finally(() => setLoading(false))
  }, [open, mediaType])

  function loadMore() {
    setLoadingMore(true)
    SellerApi.media.list({ limit: MEDIA_PAGE_SIZE, skip: items.length, type: mediaType })
      .then(({ data }) => setItems((prev) => [...prev, ...(data.data ?? [])]))
      .finally(() => setLoadingMore(false))
  }

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
      const { data } = await SellerApi.media.list({ limit: MEDIA_PAGE_SIZE, skip: 0, type: mediaType })
      setItems(data.data ?? [])
      setCount(data.count ?? 0)
    } catch { toast.error('Ýükleme ýalňyşlygy') }
    finally {
      setUploading(false); setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (!open) return null

  const EmptyIcon = EMPTY_ICON[mediaType]

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1a1a1f] rounded-xl shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] shrink-0">
          <h3 className="font-semibold dark:text-white">{TITLE[mediaType]}</h3>
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
          <input ref={fileRef} type="file" multiple accept={ACCEPT[mediaType]} className="hidden" onChange={handleUpload} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400 text-sm">
              <EmptyIcon className="h-8 w-8" />
              <p>{EMPTY_LABEL[mediaType]}</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {items.map((item) => {
                const thumb = item.thumbnail_url ? absUrl(item.thumbnail_url) : (mediaType === 'image' ? absUrl(item.url) : null)
                return (
                  <div
                    key={item.id}
                    onClick={() => { onSelect(item); onClose() }}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all bg-slate-100 dark:bg-white/[0.04]"
                  >
                    {thumb
                      ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Film className="h-6 w-6 text-slate-300 dark:text-white/20" /></div>
                    }
                  </div>
                )
              })}
            </div>
          )}
          {!loading && items.length < count && (
            <div className="flex justify-center pt-3">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-3 h-8 rounded-lg text-xs font-medium border dark:border-white/[0.12] text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50"
              >
                {loadingMore ? 'Ýüklenýär…' : 'Ýene ýükle'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
