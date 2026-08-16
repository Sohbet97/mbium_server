import { useEffect, useRef, useState } from 'react'
import { Box, Trash2, Loader2, Upload, Pencil, Check, X, ExternalLink, CheckCircle, Search } from 'lucide-react'
import { SellerApi } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const absUrl = (url) => (!url || url.startsWith('http') ? url : `${BASE}${url}`)

const ACCEPT = '.glb,.gltf,.obj,.usdz'
const MAX_ITEMS = 10

function formatBytes(n) {
  if (!n) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)))
  return `${(n / 1024 ** i).toFixed(1)} ${units[i]}`
}

function fileFormat(m) {
  return (m?.mime_type?.split('/')?.[1] || m?.original_name?.split('.').pop() || '').toUpperCase()
}

function Seller3DPickerModal({ open, onClose, onSelect, remaining = MAX_ITEMS }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState([])
  const [search, setSearch]     = useState('')
  const fileRef = useRef(null)

  async function fetchItems(text) {
    setLoading(true)
    try {
      const { data } = await SellerApi.media.list({ limit: 80, type: '3d', search: text || undefined })
      setItems(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setSelected([])
    setSearch('')
    fetchItems('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => fetchItems(search), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

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
      toast.success(`${files.length} faýl ýüklendi`)
      await fetchItems(search)
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýükleme ýalňyşlygy')
    } finally {
      setUploading(false)
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
        className="w-full max-w-2xl bg-white dark:bg-[#1a1a1f] rounded-xl shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] shrink-0">
          <h3 className="font-semibold dark:text-white">3D model saýla</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

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
          <input ref={fileRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={handleUpload} />

          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ady boýunça gözle…"
              className="w-full h-8 pl-8 pr-2 text-xs border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <span className="text-xs text-slate-400 shrink-0">{items.length} model · iň köp {remaining} saýlap bilersiň</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400 text-sm">
              <Box className="h-8 w-8" />
              <p>{search ? 'Hiç zat tapylmady' : '3D model ýok — ilki ýükläň'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const isSelected = selected.some((s) => s.id === item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => toggle(item)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-transparent bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20'
                    )}
                  >
                    <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Box className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium dark:text-white truncate">
                        {item.alt_text || item.original_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {fileFormat(item)} · {formatBytes(item.size)}
                      </p>
                    </div>
                    {isSelected && <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>

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

// Product-wide 3D models — stored as product_media rows with role='3d' and
// variant_id=null, so a single upload/selection applies to the whole product, not one variant.
export function SellerProduct3DMediaManager({ productId }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [titleDraft, setTitleDraft] = useState('')

  async function load() {
    setLoading(true)
    try {
      const { data } = await SellerApi.media.getProductMedia(productId, null)
      setItems((data.data ?? []).filter((pm) => pm.role === '3d'))
    } catch { toast.error('3D modeller ýüklenip bolmady') }
    finally   { setLoading(false) }
  }

  useEffect(() => { if (productId) load() }, [productId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelect(selected) {
    if (!selected.length) return
    try {
      await Promise.all(selected.map((m) =>
        SellerApi.media.attachToProduct(productId, { media_id: m.id, role: '3d' }, null)
      ))
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Goşulyp bolmady')
    }
  }

  async function handleDelete(mediaId) {
    if (!confirm('3D modeli pozmak?')) return
    try {
      await SellerApi.media.detachFromProduct(productId, mediaId, null)
      setItems((prev) => prev.filter((it) => it.media_id !== mediaId))
    } catch { toast.error('Pozup bolmady') }
  }

  function startEdit(item) {
    setEditingId(item.media_id)
    setTitleDraft(item.media?.alt_text ?? '')
  }

  async function saveTitle(item) {
    try {
      await SellerApi.media.update(item.media_id, { alt_text: titleDraft || null })
      setItems((prev) => prev.map((it) =>
        it.media_id === item.media_id ? { ...it, media: { ...it.media, alt_text: titleDraft || null } } : it
      ))
      setEditingId(null)
    } catch { toast.error('Ýatda saklap bolmady') }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
    </div>
  )

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Bu ýerde saýlanan 3D modeller haryda degişli bolar — her aýratyn görnüş (reňk ýaly) üçin gaýtadan saýlamaly däl.
      </p>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg transition-colors dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 gap-2"
        >
          <Box className="h-8 w-8" />
          <p className="text-sm">3D model goş</p>
          <p className="text-xs opacity-60">Media kitaphanañyzdan saýlaň ýa-da ýükläň</p>
        </button>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const m = item.media
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]"
              >
                <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <Box className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === item.media_id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(item); if (e.key === 'Escape') setEditingId(null) }}
                        placeholder="At (islege görä)"
                        className="h-7 flex-1 text-sm border rounded px-2 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                      <button type="button" onClick={() => saveTitle(item)} className="p-1 text-green-600 hover:text-green-700">
                        <Check className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium dark:text-white truncate">
                      {m?.alt_text || m?.original_name}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {fileFormat(m)} · {formatBytes(m?.size)}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={absUrl(m?.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-blue-600"
                    title="Aç"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    title="Ady üýtget"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.media_id)}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500"
                    title="Poz"
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
              className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed rounded-lg dark:border-white/[0.12] border-slate-200 dark:hover:border-white/20 hover:border-slate-300 dark:text-slate-500 text-slate-400 text-sm transition-colors"
            >
              <Upload className="h-4 w-4" />
              Ýene goş ({items.length} / {MAX_ITEMS})
            </button>
          )}
        </div>
      )}

      <Seller3DPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        remaining={Math.max(0, MAX_ITEMS - items.length)}
      />
    </div>
  )
}
