import { useCallback, useEffect, useRef, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Upload, Trash2, Images, RefreshCw, X, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
function mediaUrl(url) { return url ? (url.startsWith('http') ? url : `${BASE}${url}`) : null }

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const PAGE = 40

export default function SellerMediaPage() {
  const [items, setItems]       = useState([])
  const [count, setCount]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch]     = useState('')
  const [typeFilter, setType]   = useState('')
  const [page, setPage]         = useState(0)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const fileRef = useRef(null)

  const load = useCallback((p = 0) => {
    setLoading(true)
    SellerApi.media.list({
      limit:  PAGE,
      skip:   p * PAGE,
      type:   typeFilter || undefined,
      search: search.trim() || undefined,
    })
      .then(({ data }) => { setItems(data.data ?? []); setCount(data.count ?? 0) })
      .finally(() => setLoading(false))
  }, [search, typeFilter])

  useEffect(() => { setPage(0); load(0) }, [typeFilter])
  useEffect(() => { load(page) }, [page])

  function doSearch() { setPage(0); load(0) }

  async function handleUpload(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      await Promise.all(
        files.map((f) => {
          const fd = new FormData()
          fd.append('file', f)
          return SellerApi.media.upload(fd)
        })
      )
      toast.success(`${files.length} faýl ýüklendi`)
      setPage(0); load(0)
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýükleme ýalňyşlygy')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu mediany pozmak isleýärsiňizmi?')) return
    setDeleting(id)
    if (selected?.id === id) setSelected(null)
    try {
      await SellerApi.media.delete(id)
      setItems((prev) => prev.filter((m) => m.id !== id))
      setCount((c) => c - 1)
      toast.success('Öçürildi')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setDeleting(null) }
  }

  function copyUrl(url) {
    navigator.clipboard.writeText(mediaUrl(url)).then(() => toast.success('URL göçürildi'))
  }

  const totalPages = Math.ceil(count / PAGE)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold dark:text-white">
          Media <span className="text-slate-400 font-normal text-base">({count})</span>
        </h1>
        <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1.5" />
          {uploading ? 'Ýüklenýär...' : 'Faýl ýükle'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5 flex-1 min-w-0 max-w-sm">
          <Input
            placeholder="Gözle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            className="h-8 text-sm"
          />
          <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={doSearch}>
            Gözle
          </Button>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setType(e.target.value)}
          className="h-8 border rounded-md px-2.5 text-sm bg-white dark:bg-[#111114] dark:border-white/10 dark:text-white"
        >
          <option value="">Ähli görnüş</option>
          <option value="image">Surat</option>
          <option value="video">Wideo</option>
        </select>
        <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={() => { setPage(0); load(0) }}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Images className="h-12 w-12 text-slate-200 dark:text-white/10" />
          <p className="text-sm">Media tapylmady</p>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1.5" />Faýl ýükle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {items.map((m) => {
            const thumb = m.thumbnail_url
              ? mediaUrl(m.thumbnail_url)
              : m.type === 'image' ? mediaUrl(m.url) : null
            const isSelected = selected?.id === m.id
            return (
              <div
                key={m.id}
                onClick={() => setSelected(isSelected ? null : m)}
                className={cn(
                  'relative group rounded-xl overflow-hidden border cursor-pointer transition-all',
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20'
                )}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={m.original_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Images className="h-8 w-8 text-slate-300 dark:text-white/20" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="px-2 py-1.5 bg-white dark:bg-[#111114]">
                  <div className="text-xs text-slate-600 dark:text-slate-300 truncate leading-tight">
                    {m.original_name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{fmtSize(m.size)}</div>
                </div>

                {/* Delete button (appears on hover) */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }}
                  disabled={deleting === m.id}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 dark:bg-black/70 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
                  title="Poz"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{page * PAGE + 1}–{Math.min((page + 1) * PAGE, count)} / {count}</span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>←</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>→</Button>
          </div>
        </div>
      )}

      {/* Selected media info panel */}
      {selected && (
        <div className="fixed bottom-6 right-6 w-72 bg-white dark:bg-[#1a1a1f] rounded-xl border dark:border-white/[0.06] shadow-2xl p-4 z-40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Saýlanan</span>
            <button
              onClick={() => setSelected(null)}
              className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selected.type === 'image' && (
            <img
              src={mediaUrl(selected.thumbnail_url ?? selected.url)}
              alt=""
              className="w-full rounded-lg object-cover mb-3 max-h-40"
            />
          )}

          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div className="truncate">
              <span className="text-slate-400">Faýl: </span>{selected.original_name}
            </div>
            <div>
              <span className="text-slate-400">Görnüş: </span>{selected.type}
            </div>
            {selected.width && (
              <div>
                <span className="text-slate-400">Ölçeg: </span>{selected.width}×{selected.height}
              </div>
            )}
            <div>
              <span className="text-slate-400">Uly: </span>{fmtSize(selected.size)}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex-1 font-mono text-[10px] break-all bg-slate-50 dark:bg-white/[0.04] rounded px-2 py-1.5 text-slate-500 dark:text-slate-400 overflow-hidden">
              {mediaUrl(selected.url)}
            </div>
            <button
              onClick={() => copyUrl(selected.url)}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 shrink-0"
              title="URL göçür"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            size="sm"
            variant="destructive"
            className="w-full mt-3"
            disabled={deleting === selected.id}
            onClick={() => handleDelete(selected.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />Poz
          </Button>
        </div>
      )}
    </div>
  )
}
