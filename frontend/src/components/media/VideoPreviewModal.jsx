import { X } from 'lucide-react'
import { absUrl } from '@/lib/utils'

export function VideoPreviewModal({ video, onClose }) {
  if (!video) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose}
          className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
          <X className="h-5 w-5" />
        </button>
        <video
          key={video.id}
          src={absUrl(video.url)}
          controls
          autoPlay
          className="w-full rounded-xl bg-black"
          style={{ maxHeight: '80vh' }}
        />
      </div>
    </div>
  )
}
