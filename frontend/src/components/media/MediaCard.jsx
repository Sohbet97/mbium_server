import { cn } from '@/lib/utils'
import { FileVideo, Box, ScanLine, ImageIcon, Check } from 'lucide-react'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const absUrl = (url) => (!url || url.startsWith('http') ? url : `${BASE}${url}`)

const TYPE_ICONS = {
  video: FileVideo,
  '3d': Box,
  '360': ScanLine,
  image: ImageIcon,
}

const TYPE_LABELS = {
  image: 'IMG', video: 'VID', '3d': '3D', '360': '360°',
}

const TYPE_COLORS = {
  image: 'bg-blue-500/20 text-blue-400',
  video: 'bg-purple-500/20 text-purple-400',
  '3d': 'bg-emerald-500/20 text-emerald-400',
  '360': 'bg-amber-500/20 text-amber-400',
}

export function MediaCard({ item, selected, selectable, onClick }) {
  const Icon = TYPE_ICONS[item.type] ?? ImageIcon
  const thumb = absUrl(item.thumbnail_url || (item.type === 'image' || item.type === '360' ? item.url : null))

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative group rounded-lg overflow-hidden border-2 transition-all duration-150 text-left w-full aspect-square',
        selected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-transparent dark:hover:border-white/20 hover:border-black/15',
        selectable && 'cursor-pointer'
      )}
    >
      {/* Thumbnail / placeholder */}
      {thumb ? (
        <img
          src={thumb}
          alt={item.alt_text || item.original_name}
          className="w-full h-full object-cover dark:bg-[#1a1a1f] bg-slate-100"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center dark:bg-[#242430] bg-slate-100">
          <Icon className="h-10 w-10 dark:text-slate-500 text-slate-300" />
        </div>
      )}

      {/* Type badge */}
      <span className={cn(
        'absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold',
        TYPE_COLORS[item.type]
      )}>
        {TYPE_LABELS[item.type]}
      </span>

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Hover overlay with filename */}
      <div className={cn(
        'absolute inset-x-0 bottom-0 px-2 py-1.5 transition-opacity',
        'bg-gradient-to-t from-black/70 to-transparent',
        'opacity-0 group-hover:opacity-100'
      )}>
        <p className="text-[11px] text-white truncate">{item.original_name}</p>
        <p className="text-[10px] text-white/60">{formatBytes(item.size)}</p>
      </div>
    </button>
  )
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
