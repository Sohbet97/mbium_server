import { useEffect, useRef, useState } from 'react'
import { X, RotateCw, Pause, Play } from 'lucide-react'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const absUrl = (url) => (!url || url.startsWith('http') ? url : `${BASE}${url}`)

const DRAG_SENSITIVITY = 8 // px of drag per frame step

/**
 * 360° spin viewer — drag/swipe to rotate through an ordered list of frame images.
 * `frames` must be pre-sorted by sort_order (frame 0 first).
 */
export function SpinViewer({ frames, onClose }) {
  const [index, setIndex] = useState(0)
  const [autoSpin, setAutoSpin] = useState(false)
  const dragState = useRef(null)

  useEffect(() => {
    if (!autoSpin || frames.length < 2) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % frames.length)
    }, 90)
    return () => clearInterval(id)
  }, [autoSpin, frames.length])

  function step(delta) {
    setIndex((i) => {
      const n = frames.length
      return ((i + delta) % n + n) % n
    })
  }

  function onPointerDown(e) {
    setAutoSpin(false)
    dragState.current = { x: e.clientX, index }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e) {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.x
    const steps = Math.trunc(dx / DRAG_SENSITIVITY)
    setIndex(() => {
      const n = frames.length
      return ((dragState.current.index - steps) % n + n) % n
    })
  }

  function onPointerUp() {
    dragState.current = null
  }

  if (!frames.length) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1f] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/[0.08]">
          <h3 className="font-semibold dark:text-white flex items-center gap-2">
            <RotateCw className="h-4 w-4" />
            360° Aýlanma görnüşi
          </h3>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div
          className="relative aspect-square bg-slate-100 dark:bg-[#0f0f14] cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <img
            src={absUrl(frames[index])}
            alt={`Frame ${index + 1}`}
            draggable={false}
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => setAutoSpin((v) => !v)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {autoSpin ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {autoSpin ? 'Saklamak' : 'Awtomatik aýlanma'}
          </button>

          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={index}
            onChange={(e) => { setAutoSpin(false); setIndex(Number(e.target.value)) }}
            className="flex-1 mx-3"
          />

          <span className="text-xs text-slate-400 tabular-nums w-12 text-right">
            {index + 1}/{frames.length}
          </span>
        </div>

        <div className="px-4 pb-3 flex items-center justify-center gap-2 text-xs text-slate-400">
          <button type="button" onClick={() => step(-1)} className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/10">‹ Yza</button>
          <span>Suraty süýrän</span>
          <button type="button" onClick={() => step(1)} className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/10">Öňe ›</button>
        </div>
      </div>
    </div>
  )
}
