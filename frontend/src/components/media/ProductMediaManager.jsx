import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Trash2, Star, CheckCircle, Loader2, FileVideo, Box, ScanLine, ImageIcon, Eye, GripVertical } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { MediaPicker } from './MediaPicker'
import { MediaViewer } from './MediaViewer'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const absUrl = (url) => (!url || url.startsWith('http') ? url : `${BASE}${url}`)

const TYPE_ICONS = { video: FileVideo, '3d': Box, '360': ScanLine, image: ImageIcon }
const TYPE_LABELS = { image: 'IMG', video: 'VID', '3d': '3D', '360': '360°' }
const TYPE_COLORS = {
  image: 'bg-blue-500/20 text-blue-400',
  video: 'bg-purple-500/20 text-purple-400',
  '3d': 'bg-emerald-500/20 text-emerald-400',
  '360': 'bg-amber-500/20 text-amber-400',
}

export function ProductMediaManager({ productId }) {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [viewer, setViewer] = useState(null)
  const dragSrc = useRef(null)
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])

  async function load() {
    setLoading(true)
    try {
      const { data } = await AdminApi.media.getProductMedia(productId)
      setItems(data.data ?? [])
    } catch { toast.error(t('toast.error')) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [productId])

  async function handleSelect(selected) {
    const list = Array.isArray(selected) ? selected : [selected]
    try {
      const hasPrimary = items.some((it) => it.role === 'primary')
      await Promise.all(list.map((m, i) =>
        AdminApi.media.attachToProduct(productId, {
          media_id: m.id,
          role: !hasPrimary && i === 0 ? 'primary' : 'gallery',
        })
      ))
      load()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  async function handleDetach(e, mediaId) {
    e.stopPropagation()
    try {
      await AdminApi.media.detachFromProduct(productId, mediaId)
      setItems((prev) => prev.filter((it) => it.media_id !== mediaId))
    } catch { toast.error(t('toast.error')) }
  }

  async function handleSetPrimary(mediaId) {
    try {
      await AdminApi.media.attachToProduct(productId, { media_id: mediaId, role: 'primary' })
      // Update viewer item if open
      setViewer((v) => v?.id === mediaId ? v : v)
      load()
    } catch { toast.error(t('toast.error')) }
  }

  // ── Drag-to-reorder ──────────────────────────────────────────────────────────
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
    const current = itemsRef.current
    try {
      await Promise.all(current.map((pm, i) =>
        AdminApi.media.updateProductMedia(productId, pm.media_id, { sort_order: i })
      ))
    } catch { toast.error(t('toast.error')) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
    </div>
  )

  const viewerPm = viewer ? items.find((it) => it.media_id === viewer.id) : null

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg transition-colors dark:border-white/[0.12] border-slate-200 dark:hover:border-white/[0.2] hover:border-slate-300 dark:text-slate-500 text-slate-400 gap-2"
        >
          <ImagePlus className="h-8 w-8" />
          <p className="text-sm">{t('products.addMediaHint')}</p>
        </button>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((pm, index) => {
            const m = pm.media
            const Icon = TYPE_ICONS[m.type] ?? ImageIcon
            const thumbSrc = m.thumbnail_url || m.type === 'image' || m.type === '360'
              ? absUrl(m.thumbnail_url || m.url)
              : null

            return (
              <div
                key={pm.id}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragEnter={() => onDragEnter(index)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={onDragEnd}
                onClick={() => setViewer(m)}
                className="relative group rounded-lg overflow-hidden border cursor-pointer select-none dark:border-white/[0.08] border-slate-200 aspect-square dark:bg-[#242430] bg-slate-100"
              >
                {/* Thumbnail or icon */}
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt={m.alt_text || m.original_name}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="h-10 w-10 dark:text-slate-500 text-slate-300" />
                  </div>
                )}

                {/* Drag handle (top-right, visible on hover) */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-white drop-shadow-md" />
                </div>

                {/* Primary badge (top-left) */}
                {pm.role === 'primary' && (
                  <div className="absolute top-1 left-1">
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-black/70 text-white rounded px-1 py-0.5">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 stroke-yellow-400" />
                      {t('images.primary')}
                    </span>
                  </div>
                )}

                {/* Type badge (bottom-left) */}
                <span className={cn(
                  'absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold',
                  TYPE_COLORS[m.type]
                )}>
                  {TYPE_LABELS[m.type]}
                </span>

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setViewer(m) }}
                    className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700"
                    title={t('common.preview')}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  {pm.role !== 'primary' && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleSetPrimary(m.id) }}
                      className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700"
                      title={t('images.setPrimary')}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDetach(e, m.id)}
                    className="p-1.5 rounded-full bg-white/90 hover:bg-white text-red-600"
                    title={t('common.delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Add more tile */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center dark:border-white/[0.12] border-slate-200 dark:hover:border-white/[0.2] hover:border-slate-300 dark:text-slate-500 text-slate-400 transition-colors"
          >
            <ImagePlus className="h-6 w-6" />
          </button>
        </div>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        multiple
        filterType="image"
      />

      {viewer && (
        <MediaViewer
          item={viewer}
          onClose={() => setViewer(null)}
          isPrimary={viewerPm?.role === 'primary'}
          onSetPrimary={viewerPm?.role !== 'primary'
            ? () => handleSetPrimary(viewer.id)
            : undefined
          }
        />
      )}
    </div>
  )
}
