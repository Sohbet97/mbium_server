import { useState } from 'react'
import { X, Loader2, Scissors } from 'lucide-react'
import { SellerApi } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const absUrl = (u) => (!u || u.startsWith('http') ? u : `${BASE}${u}`)

const TABS = ['white', 'transparent', 'compare']
const TAB_LABELS = { white: 'Ak fon', transparent: 'Aç-açan', compare: 'Deňeşdir' }

export function BackgroundRemovalModal({ productId, variantId, media, onClose, onSaved }) {
  const [phase, setPhase]   = useState('idle')   // idle | processing | preview | saving
  const [error, setError]   = useState(null)
  const [result, setResult] = useState(null)     // { token, whiteUrl, transparentUrl }
  const [tab, setTab]       = useState('white')

  const busy = phase === 'processing' || phase === 'saving'

  async function handleProcess() {
    setPhase('processing')
    setError(null)
    try {
      const { data } = await SellerApi.products.removeBg(productId, media.id, variantId)
      setResult(data)
      setTab('white')
      setPhase('preview')
    } catch (e) {
      setError(e.response?.data?.message ?? 'Ýalňyşlyk ýüze çykdy')
      setPhase('idle')
    }
  }

  async function handleSave(action) {
    setPhase('saving')
    // On compare tab default to transparent (most useful for production)
    const variant = tab === 'white' ? 'white' : 'transparent'
    try {
      await SellerApi.products.confirmRemoveBg(productId, media.id, {
        token: result.token,
        action,
        variant,
      }, variantId)
      toast.success(action === 'replace' ? 'Surat çalşyldy' : 'Täze surat hökmünde goşuldy')
      onSaved?.()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýatda saklanmady')
      setPhase('preview')
    }
  }

  function handleReject() {
    if (result?.token) {
      SellerApi.products.rejectRemoveBg(productId, media.id, { token: result.token }).catch(() => {})
    }
    onClose()
  }

  const originalUrl = absUrl(media.url)
  const whiteUrl    = result ? absUrl(result.whiteUrl) : null
  const transUrl    = result ? absUrl(result.transparentUrl) : null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1a1a1f] rounded-xl shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] shrink-0">
          <h3 className="font-semibold dark:text-white flex items-center gap-2">
            <Scissors className="h-4 w-4 text-violet-500" />
            Fon aýyr
          </h3>
          <button
            onClick={handleReject}
            disabled={busy}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {phase === 'idle' && (
            <>
              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              <div className="rounded-lg overflow-hidden border dark:border-white/[0.08] bg-slate-100 dark:bg-[#242430] mx-auto max-w-xs aspect-square flex items-center justify-center">
                <img src={originalUrl} alt="" className="w-full h-full object-contain" />
              </div>
              <p className="text-xs text-slate-400 text-center">
                Fonuň aýrylmagyna 5–15 sekunt gerek
              </p>
            </>
          )}

          {phase === 'processing' && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
              <p className="text-sm dark:text-slate-300 text-slate-600">
                Fon aýrylýar… (5–15 sek)
              </p>
            </div>
          )}

          {phase === 'preview' && result && (
            <>
              {/* Tab switcher */}
              <div className="flex gap-1">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      'px-3 h-8 rounded-lg text-xs font-medium transition-colors',
                      tab === t
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                    )}
                  >
                    {TAB_LABELS[t]}
                  </button>
                ))}
              </div>

              {/* Preview area */}
              <div className={cn(
                'rounded-lg overflow-hidden border dark:border-white/[0.08]',
                tab === 'transparent' ? 'bg-checkerboard' : 'bg-slate-100 dark:bg-[#242430]'
              )}>
                {tab === 'compare' ? (
                  <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-white/10">
                    <div className="relative bg-slate-100 dark:bg-[#242430]">
                      <img src={originalUrl} alt="Asyl" className="w-full object-contain aspect-square" />
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        Asyl
                      </span>
                    </div>
                    <div className="relative bg-checkerboard">
                      <img src={transUrl} alt="Işlenilen" className="w-full object-contain aspect-square" />
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        Işlenilen
                      </span>
                    </div>
                  </div>
                ) : (
                  <img
                    src={tab === 'white' ? whiteUrl : transUrl}
                    alt=""
                    className="w-full object-contain max-h-72"
                  />
                )}
              </div>

              {tab === 'compare' && (
                <p className="text-[11px] text-slate-400 text-center">
                  "Ýatda sakla" basylanda aç-açan PNG ýatda saklanar
                </p>
              )}
            </>
          )}

          {phase === 'saving' && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
              <p className="text-sm dark:text-slate-300 text-slate-600">Ýatda saklanýar…</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t dark:border-white/[0.08] shrink-0">
          {phase === 'idle' && (
            <>
              <button
                onClick={handleReject}
                className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"
              >
                Ýatyr
              </button>
              <button
                onClick={handleProcess}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                <Scissors className="h-3.5 w-3.5" />
                Işle
              </button>
            </>
          )}

          {phase === 'preview' && (
            <>
              <button
                onClick={handleReject}
                className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"
              >
                Ret et
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave('save_new')}
                  className="px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-white/[0.12] rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 dark:text-slate-200 transition-colors"
                >
                  Täze goş
                </button>
                <button
                  onClick={() => handleSave('replace')}
                  className="px-4 py-1.5 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Çalyş
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
