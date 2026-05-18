import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Search, Loader2, ImageIcon, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminApi } from '@/lib/api'
import { MediaCard } from '@/components/media/MediaCard'
import { MediaViewer } from '@/components/media/MediaViewer'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TYPES = [
  { value: '', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Video' },
  { value: '3d', label: '3D Models' },
  { value: '360', label: '360° Photos' },
]

const ACCEPT = 'image/*,video/mp4,video/webm,video/quicktime,.glb,.gltf'
const LIMIT = 48

export default function MediaPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [viewer, setViewer] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef(null)
  const searchTimer = useRef(null)

  async function load(p = 1, q = search, t2 = type) {
    setLoading(true)
    try {
      const { data } = await AdminApi.media.list({ search: q || undefined, type: t2 || undefined, page: p, limit: LIMIT })
      if (p === 1) setItems(data.data ?? [])
      else setItems((prev) => [...prev, ...(data.data ?? [])])
      setTotal(data.count ?? 0)
      setPage(p)
    } catch { toast.error(t('toast.error')) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [])

  function handleSearchChange(v) {
    setSearch(v)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => load(1, v, type), 350)
  }

  function handleTypeChange(v) {
    setType(v)
    setSelected(new Set())
    load(1, search, v)
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      await Promise.all(files.map((f) => {
        const fd = new FormData()
        fd.append('file', f)
        return AdminApi.media.upload(fd)
      }))
      toast.success(t('toast.created'))
      load(1)
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function deleteSelected() {
    if (!selected.size) return
    if (!window.confirm(`Delete ${selected.size} file(s)?`)) return
    setDeleting(true)
    try {
      await Promise.all([...selected].map((id) => AdminApi.media.delete(id)))
      toast.success(t('toast.deleted'))
      setSelected(new Set())
      load(1)
    } catch { toast.error(t('toast.error')) }
    finally { setDeleting(false) }
  }

  // Drag-and-drop upload
  function handleDrop(e) {
    e.preventDefault()
    const dt = e.dataTransfer
    if (dt?.files?.length) {
      const input = fileRef.current
      if (input) {
        // Simulate file input change
        const fd = Array.from(dt.files)
        handleUploadFiles(fd)
      }
    }
  }

  async function handleUploadFiles(files) {
    setUploading(true)
    try {
      await Promise.all(files.map((f) => {
        const fd = new FormData()
        fd.append('file', f)
        return AdminApi.media.upload(fd)
      }))
      toast.success(`${files.length} file(s) uploaded`)
      load(1)
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally { setUploading(false) }
  }

  const hasMore = items.length < total

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('media.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('media.totalCount', { count: total })}</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete ({selected.size})
            </button>
          )}
          <input ref={fileRef} type="file" multiple accept={ACCEPT} onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {t('media.upload')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('media.searchPlaceholder')}
            className="w-full pl-9 pr-3 h-9 rounded-lg text-sm border bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:bg-[#1a1a1f] dark:border-white/[0.08] dark:text-white"
          />
        </div>
        <div className="flex items-center gap-1">
          {TYPES.map((tp) => (
            <button
              key={tp.value}
              onClick={() => handleTypeChange(tp.value)}
              className={cn(
                'px-3 h-9 rounded-lg text-sm font-medium transition-colors',
                type === tp.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#1a1a1f] dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.06]'
              )}
            >
              {tp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone / grid */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="min-h-64"
      >
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          </div>
        ) : items.length === 0 ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors dark:border-white/[0.12] border-slate-200 dark:hover:border-white/[0.2] hover:border-slate-300 dark:text-slate-500 text-slate-400"
          >
            <ImageIcon className="h-12 w-12 mb-2" />
            <p className="text-sm font-medium">{t('media.dropzone')}</p>
            <p className="text-xs mt-1">{t('media.dropzoneHint')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {items.map((item) => (
                <div key={item.id} className="relative group">
                  <MediaCard
                    item={item}
                    selected={selected.has(item.id)}
                    selectable
                    onClick={() => setViewer(item)}
                  />
                  {/* Selection checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(item.id) }}
                    className={cn(
                      'absolute top-1.5 left-1.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all z-10',
                      selected.has(item.id)
                        ? 'bg-blue-500 border-blue-500 opacity-100'
                        : 'bg-black/40 border-white/60 opacity-0 group-hover:opacity-100'
                    )}
                    title="Select"
                  >
                    {selected.has(item.id) && <Check className="h-2.5 w-2.5 text-white" />}
                  </button>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => load(page + 1)}
                  disabled={loading}
                  className="px-5 py-2 rounded-lg text-sm border dark:border-white/[0.08] border-slate-200 dark:text-slate-300 text-slate-600 dark:hover:bg-white/[0.06] hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Loading…' : `Show more (${total - items.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview viewer */}
      {viewer && <MediaViewer item={viewer} onClose={() => setViewer(null)} />}
    </div>
  )
}
