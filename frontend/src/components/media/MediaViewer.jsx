import { useEffect, useRef } from 'react'
import { X, Download, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function absUrl(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : `${BASE}${url}`
}

function ImageViewer({ item }) {
  return (
    <img
      src={absUrl(item.url)}
      alt={item.alt_text || item.original_name}
      className="max-w-full max-h-full object-contain rounded-lg"
    />
  )
}

function VideoViewer({ item }) {
  return (
    <video
      src={absUrl(item.url)}
      controls
      autoPlay={false}
      className="max-w-full max-h-full rounded-lg"
      style={{ maxHeight: '70vh' }}
    />
  )
}

function ModelViewer3D({ item }) {
  return (
    <div className="w-full" style={{ height: '65vh' }}>
      {/* model-viewer web component loaded via CDN in index.html */}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <model-viewer
        src={absUrl(item.url)}
        alt={item.alt_text || item.original_name}
        auto-rotate
        camera-controls
        shadow-intensity="1"
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      />
    </div>
  )
}

function Viewer360({ item }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Load Pannellum dynamically
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css'
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js'
    script.onload = () => {
      if (window.pannellum) {
        window.pannellum.viewer(container, {
          type: 'equirectangular',
          panorama: absUrl(item.url),
          autoLoad: true,
          showControls: true,
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      try { document.head.removeChild(css) } catch {}
      try { document.head.removeChild(script) } catch {}
    }
  }, [item.url])

  return <div ref={containerRef} style={{ width: '100%', height: '65vh', borderRadius: 8 }} />
}

const VIEWERS = {
  image: ImageViewer,
  video: VideoViewer,
  '3d':  ModelViewer3D,
  '360': Viewer360,
}

export function MediaViewer({ item, onClose }) {
  const Viewer = VIEWERS[item.type] ?? ImageViewer

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-4xl dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/[0.08] border-black/[0.08]">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate dark:text-white text-slate-900">{item.original_name}</p>
            <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
              {item.type.toUpperCase()} · {formatBytes(item.size)}
              {item.width && ` · ${item.width}×${item.height}px`}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-4 shrink-0">
            <a
              href={absUrl(item.url)}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 dark:text-slate-400 text-slate-500 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={absUrl(item.url)}
              download={item.original_name}
              className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 dark:text-slate-400 text-slate-500 transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg dark:hover:bg-white/[0.08] hover:bg-slate-100 dark:text-slate-400 text-slate-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewer area */}
        <div className={cn(
          'flex items-center justify-center p-4',
          'dark:bg-[#0f0f12] bg-slate-50',
          item.type === '360' || item.type === '3d' || item.type === 'video' ? '' : 'min-h-64'
        )}>
          <Viewer item={item} />
        </div>

        {/* Alt text (editable in future) */}
        {item.alt_text && (
          <div className="px-4 py-2 border-t dark:border-white/[0.08] border-black/[0.08]">
            <p className="text-xs dark:text-slate-400 text-slate-500">{item.alt_text}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
