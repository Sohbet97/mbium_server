import { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, X, Search, Filter, Loader2 } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { MediaCard } from './MediaCard'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TYPES = [
  { value: '', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Video' },
  { value: '3d',    label: '3D' },
  { value: '360',   label: '360°' },
]

const ACCEPT = {
  '':      'image/*,video/mp4,video/webm,video/quicktime,.glb,.gltf',
  image:   'image/*',
  video:   'video/mp4,video/webm,video/quicktime',
  '3d':    '.glb,.gltf',
  '360':   'image/*',
}

export function MediaPicker({ open, onClose, onSelect, multiple = false, filterType = '' }) {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search,    setSearch]    = useState('')
  const [type,      setType]      = useState(filterType)
  const [selected,  setSelected]  = useState([])
  const [page,      setPage]      = useState(1)
  const [total,     setTotal]     = useState(0)
  const fileRef  = useRef(null)
  const searchTimer = useRef(null)

  const LIMIT = 40

  const load = useCallback(async (p = 1, q = search, t = type) => {
    setLoading(true)
    try {
      const { data } = await AdminApi.media.list({ search: q || undefined, type: t || undefined, page: p, limit: LIMIT })
      if (p === 1) setItems(data.data ?? [])
      else setItems((prev) => [...prev, ...(data.data ?? [])])
      setTotal(data.count ?? 0)
      setPage(p)
    } catch { toast.error('Failed to load media') }
    finally  { setLoading(false) }
  }, [search, type])

  useEffect(() => { if (open) { setSelected([]); load(1) } }, [open])

  function handleSearchChange(v) {
    setSearch(v)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => load(1, v, type), 350)
  }

  function handleTypeChange(v) {
    setType(v)
    load(1, search, v)
  }

  function toggleSelect(item) {
    if (multiple) {
      setSelected((prev) =>
        prev.find((s) => s.id === item.id) ? prev.filter((s) => s.id !== item.id) : [...prev, item]
      )
    } else {
      setSelected([item])
    }
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      await Promise.all(files.map((f) => {
        const fd = new FormData()
        fd.append('file', f)
        return AdminApi.media.upload(fd, type === '360' ? '360' : undefined)
      }))
      toast.success(`${files.length} file(s) uploaded`)
      load(1)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleConfirm() {
    if (!selected.length) return
    onSelect(multiple ? selected : selected[0])
    onClose()
  }

  if (!open) return null

  const hasMore = items.length < total

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl flex flex-col"
           style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08] shrink-0">
          <h2 className="text-base font-semibold dark:text-white text-slate-900">Media Library</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 dark:text-slate-400 text-slate-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b dark:border-white/[0.08] border-black/[0.08] shrink-0 flex-wrap">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 dark:text-slate-500 text-slate-400" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search files…"
              className="w-full pl-8 pr-3 h-9 rounded-lg text-sm border dark:bg-[#242430] bg-slate-50 dark:border-white/[0.08] border-black/[0.08] dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTypeChange(t.value)}
                className={cn(
                  'px-3 h-9 rounded-lg text-xs font-medium transition-colors',
                  type === t.value
                    ? 'bg-blue-600 text-white'
                    : 'dark:bg-white/[0.06] bg-slate-100 dark:text-slate-300 text-slate-600 dark:hover:bg-white/[0.1] hover:bg-slate-200'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Upload */}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ACCEPT[type] ?? ACCEPT['']}
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin dark:text-slate-500 text-slate-300" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 dark:text-slate-500 text-slate-400">
              <Filter className="h-10 w-10" />
              <p className="text-sm">No media found</p>
              <p className="text-xs">Upload files using the button above</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
                {items.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    selected={selected.some((s) => s.id === item.id)}
                    selectable
                    onClick={() => toggleSelect(item)}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => load(page + 1)}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg text-sm dark:bg-white/[0.06] bg-slate-100 dark:text-slate-300 text-slate-600 hover:bg-slate-200 dark:hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Loading…' : `Load more (${total - items.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t dark:border-white/[0.08] border-black/[0.08] shrink-0">
          <p className="text-xs dark:text-slate-500 text-slate-400">
            {selected.length > 0
              ? `${selected.length} selected · ${total} total`
              : `${total} files`}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm dark:text-slate-400 text-slate-500 dark:hover:bg-white/[0.06] hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected.length}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {multiple ? `Select ${selected.length || ''}` : 'Select'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
