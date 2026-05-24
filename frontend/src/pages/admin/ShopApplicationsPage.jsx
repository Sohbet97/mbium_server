import { useEffect, useState, useCallback, useRef } from 'react'
import { AdminApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  RefreshCw, CheckCircle, XCircle, FileText, Building2,
  Film, Image, File, Download, ZoomIn, ZoomOut, RotateCw,
  ChevronLeft, ChevronRight, Clock, ChevronDown, ChevronUp,
  History, Inbox, RotateCcw, User, CreditCard, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
function fileType(url) {
  if (!url) return null
  const ext = url.split('?')[0].toLowerCase().split('.').pop()
  if (['jpg','jpeg','png','webp','gif','bmp','svg'].includes(ext)) return 'image'
  if (['mp4','webm','mov','avi','mkv'].includes(ext)) return 'video'
  if (ext === 'pdf') return 'pdf'
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(url)) return 'embed'
  return 'other'
}
function typeIcon(type) {
  if (type === 'image') return Image
  if (type === 'video' || type === 'embed') return Film
  if (type === 'pdf') return FileText
  return File
}

const ACTION_STYLES = {
  approved: { dot: 'bg-green-500',  label: 'Approved', cls: 'text-green-600 dark:text-green-400' },
  rejected: { dot: 'bg-red-500',    label: 'Rejected', cls: 'text-red-600 dark:text-red-400' },
  submitted:{ dot: 'bg-blue-500',   label: 'Submitted', cls: 'text-blue-600 dark:text-blue-400' },
  reopened: { dot: 'bg-amber-500',  label: 'Re-opened', cls: 'text-amber-600 dark:text-amber-400' },
}

const STATUS_BADGE = {
  1: { label: 'Pending',  cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  2: { label: 'Approved', cls: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400' },
  3: { label: 'Rejected', cls: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400' },
}

// ─────────────────────────────────────────────────────────────────────────────
// DocChip
// ─────────────────────────────────────────────────────────────────────────────
function DocChip({ label, url, onClick }) {
  if (!url) return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-300 dark:text-slate-600 px-2.5 py-1 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
      {label}: —
    </span>
  )
  const Icon = typeIcon(fileType(url))
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all
        border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400
        hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-400 dark:hover:border-blue-400/60 active:scale-95">
      <Icon className="h-3.5 w-3.5 shrink-0" />{label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FileViewer + FilePreviewModal
// ─────────────────────────────────────────────────────────────────────────────
function FileViewer({ url, type }) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  if (type === 'image') return (
    <div className="relative flex flex-col items-center h-full overflow-hidden">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/50 rounded-lg px-2 py-1">
        <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="text-white p-1 hover:text-blue-300"><ZoomOut className="h-3.5 w-3.5"/></button>
        <span className="text-white text-xs w-10 text-center">{Math.round(zoom*100)}%</span>
        <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="text-white p-1 hover:text-blue-300"><ZoomIn className="h-3.5 w-3.5"/></button>
        <div className="w-px h-4 bg-white/20 mx-0.5"/>
        <button onClick={() => setRotation(r => (r+90)%360)} className="text-white p-1 hover:text-blue-300"><RotateCw className="h-3.5 w-3.5"/></button>
        <button onClick={() => { setZoom(1); setRotation(0) }} className="text-white text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 ml-1">Reset</button>
      </div>
      <div className="flex-1 overflow-auto w-full flex items-center justify-center p-4">
        <img src={url} alt="" style={{ transform:`scale(${zoom}) rotate(${rotation}deg)`, transformOrigin:'center', transition:'transform 0.15s ease' }} className="max-w-none object-contain rounded select-none"/>
      </div>
    </div>
  )
  if (type === 'video') return <video src={url} controls className="w-full h-full object-contain rounded bg-black"/>
  if (type === 'embed') {
    const embedUrl = url.replace('watch?v=','embed/').replace('youtu.be/','youtube.com/embed/')
    return <iframe src={embedUrl} title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded"/>
  }
  if (type === 'pdf') return <iframe src={url} title="PDF" className="w-full h-full rounded border-0"/>
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
      <File className="h-16 w-16 text-slate-200 dark:text-slate-700"/>
      <p className="text-sm">Preview not available.</p>
      <a href={url} target="_blank" rel="noopener noreferrer" download>
        <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-2"/>Download</Button>
      </a>
    </div>
  )
}

function FilePreviewModal({ docs, initialIndex, onClose }) {
  const [idx, setIdx] = useState(initialIndex ?? 0)
  const doc = docs[idx]
  const type = fileType(doc?.url)
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0 overflow-hidden" style={{ height:'90vh' }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b dark:border-white/[0.08] shrink-0 bg-white dark:bg-[#16161b]">
          <div className="flex items-center gap-2">
            {(() => { const Icon = typeIcon(type); return <Icon className="h-4 w-4 text-slate-400"/> })()}
            <span className="font-medium text-sm dark:text-white">{doc?.label}</span>
            {docs.length > 1 && <span className="text-xs text-slate-400 ml-1">({idx+1} / {docs.length})</span>}
          </div>
          <a href={doc?.url} target="_blank" rel="noopener noreferrer" download className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors">
            <Download className="h-4 w-4"/>
          </a>
        </div>
        <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-[#0f0f12]" style={{ height:'calc(90vh - 57px)' }}>
          {doc?.url ? <FileViewer url={doc.url} type={type}/> : <div className="flex items-center justify-center h-full text-slate-400 text-sm">No file</div>}
          {idx > 0 && <button onClick={() => setIdx(i => i-1)} className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center z-10"><ChevronLeft className="h-5 w-5"/></button>}
          {idx < docs.length-1 && <button onClick={() => setIdx(i => i+1)} className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center z-10"><ChevronRight className="h-5 w-5"/></button>}
        </div>
        {docs.length > 1 && (
          <div className="flex items-center gap-2 px-4 py-2 border-t dark:border-white/[0.08] shrink-0 bg-white dark:bg-[#16161b] overflow-x-auto">
            {docs.map((d,i) => { const Icon = typeIcon(fileType(d.url)); return (
              <button key={i} onClick={() => setIdx(i)} disabled={!d.url}
                className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0',
                  i===idx ? 'bg-blue-600 text-white border-blue-600' :
                  d.url ? 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:border-blue-300' :
                  'border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed')}>
                <Icon className="h-3 w-3"/>{d.label}
              </button>
            )})}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LogTimeline
// ─────────────────────────────────────────────────────────────────────────────
function LogTimeline({ logs }) {
  if (!logs.length) return <p className="text-xs text-slate-400 py-2">No history yet.</p>
  return (
    <ol className="relative border-l border-slate-200 dark:border-white/[0.08] ml-2 space-y-3 py-1">
      {logs.map((log, i) => {
        const s = ACTION_STYLES[log.action] ?? { dot:'bg-slate-400', label:log.action, cls:'text-slate-500' }
        return (
          <li key={log.id ?? i} className="ml-4">
            <span className={cn('absolute -left-[5px] h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#1e1e24]', s.dot)}/>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={cn('text-[12px] font-semibold', s.cls)}>{s.label}</span>
              {log.admin && <span className="text-[11px] text-slate-500 dark:text-slate-400">by {log.admin.name} {log.admin.surname}</span>}
              <span className="text-[11px] text-slate-400 ml-auto">{new Date(log.createdAt).toLocaleString([], { dateStyle:'medium', timeStyle:'short' })}</span>
            </div>
            {log.note && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 italic">"{log.note}"</p>}
          </li>
        )
      })}
    </ol>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ApplicationDetailModal — full review modal opened by clicking a card
// ─────────────────────────────────────────────────────────────────────────────
function ApplicationDetailModal({ shop, onClose, onVerified, onRejected }) {
  const [logs, setLogs]             = useState(null)
  const [preview, setPreview]       = useState(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [busy, setBusy]             = useState(false)

  useEffect(() => {
    AdminApi.shopApplications.getLogs(shop.id)
      .then(({ data }) => setLogs(data.data ?? []))
      .catch(() => setLogs([]))
  }, [shop.id])

  const docs = [
    { label: 'Passport', url: shop.passport_file },
    { label: 'Patent',   url: shop.patent_file },
    { label: 'Video',    url: shop.video_url },
  ]

  async function approve() {
    setBusy(true)
    try {
      await AdminApi.shopApplications.verify(shop.id)
      toast.success(`"${shop.name}" tassyklandy`)
      onVerified(shop.id)
    } catch (e) { toast.error(e.response?.data?.message ?? 'Ýalňyşlyk') }
    finally { setBusy(false) }
  }

  async function reject() {
    setBusy(true)
    try {
      await AdminApi.shopApplications.reject(shop.id, { note: rejectNote || undefined })
      toast.success(`"${shop.name}" ret edildi`)
      onRejected(shop.id)
    } catch (e) { toast.error(e.response?.data?.message ?? 'Ýalňyşlyk') }
    finally { setBusy(false) }
  }

  const isPro = !!(shop.patent_file && shop.bank_iban)

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl w-full p-0 gap-0 flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>

          {/* Header */}
          <div className="px-5 py-4 border-b dark:border-white/[0.08] shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold dark:text-white">{shop.name}</h2>
                  {isPro && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
                      PRO candidate
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submitted {new Date(shop.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">

            {/* Owner */}
            <section className="px-5 py-4 border-b dark:border-white/[0.06]">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Owner</p>
              {shop.owner ? (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                    {(shop.owner.name?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-white">{shop.owner.name} {shop.owner.surname}</p>
                    {shop.owner.phone_number && <p className="text-xs text-slate-400">{shop.owner.phone_number}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">—</p>
              )}
            </section>

            {/* KYC Documents */}
            <section className="px-5 py-4 border-b dark:border-white/[0.06]">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">KYC Documents</p>
              <div className="flex flex-wrap gap-2">
                {docs.map((d) => (
                  <DocChip key={d.label} label={d.label} url={d.url}
                    onClick={() => {
                      const firstIdx = docs.findIndex(x => x.label === d.label && x.url)
                      setPreview({ docs, idx: firstIdx >= 0 ? firstIdx : 0 })
                    }}
                  />
                ))}
              </div>
              {(!shop.passport_file && !shop.patent_file && !shop.video_url) && (
                <p className="text-xs text-slate-400 mt-1">No documents uploaded.</p>
              )}
            </section>

            {/* Financial info */}
            {(shop.bank_iban || shop.card_number) && (
              <section className="px-5 py-4 border-b dark:border-white/[0.06]">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Financial</p>
                <div className="space-y-1.5">
                  {shop.bank_iban && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0"/>
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{shop.bank_iban}</span>
                      <span className="text-[10px] text-slate-400">IBAN</span>
                    </div>
                  )}
                  {shop.card_number && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0"/>
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{shop.card_number}</span>
                      <span className="text-[10px] text-slate-400">Card</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Review history */}
            <section className="px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Review history</p>
              {logs === null
                ? <div className="flex items-center gap-2 text-xs text-slate-400"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"/>Loading…</div>
                : <LogTimeline logs={logs}/>
              }
            </section>
          </div>

          {/* Footer actions */}
          {!rejectOpen ? (
            <div className="px-5 py-3.5 border-t dark:border-white/[0.08] shrink-0 flex items-center justify-between gap-3 bg-white dark:bg-[#16161b]">
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" disabled={busy} onClick={() => setRejectOpen(true)}>
                <XCircle className="h-4 w-4 mr-1.5"/>Reject
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={busy} onClick={approve}>
                {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-1.5"/> : <CheckCircle className="h-4 w-4 mr-1.5"/>}
                Approve
              </Button>
            </div>
          ) : (
            <div className="px-5 py-3.5 border-t dark:border-white/[0.08] shrink-0 space-y-2 bg-white dark:bg-[#16161b]">
              <Textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Rejection reason (optional)…" rows={2} className="text-sm"/>
              <div className="flex items-center gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" disabled={busy} onClick={reject}>
                  {busy ? 'Sending…' : 'Confirm reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {preview && <FilePreviewModal docs={preview.docs} initialIndex={preview.idx} onClose={() => setPreview(null)}/>}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PendingTab
// ─────────────────────────────────────────────────────────────────────────────
function PendingTab({ onCountChange }) {
  const [applications, setApplications] = useState([])
  const [count, setCount]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState(null) // shop being reviewed

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await AdminApi.shopApplications.getAll({ limit: 50 })
      setApplications(data.data ?? [])
      setCount(data.count ?? 0)
      onCountChange?.(data.count ?? 0)
    } finally { setLoading(false) }
  }, [onCountChange])

  useEffect(() => { fetch() }, [fetch])

  function removeShop(id) {
    setApplications(prev => prev.filter(s => s.id !== id))
    setCount(c => { const n = c - 1; onCountChange?.(n); return n })
    setSelected(null)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/></div>

  return (
    <>
      {!applications.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Building2 className="h-12 w-12 mb-3 text-slate-200"/>
            <p className="text-sm">Garaşylýan arza ýok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500">{count} garaşylýan arza</p>
          {applications.map(shop => (
            <button
              key={shop.id}
              onClick={() => setSelected(shop)}
              className="w-full text-left group"
            >
              <Card className="transition-all hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-sm cursor-pointer">
                <CardContent className="py-3.5 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm dark:text-white">{shop.name}</span>
                        {!!(shop.patent_file && shop.bank_iban) && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">PRO candidate</span>
                        )}
                        {/* doc presence indicators */}
                        <div className="flex items-center gap-1 ml-1">
                          {[['P', shop.passport_file], ['T', shop.patent_file], ['V', shop.video_url]].map(([lbl, url]) => (
                            <span key={lbl} className={cn('text-[10px] font-mono px-1 rounded',
                              url ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600')}>
                              {lbl}
                            </span>
                          ))}
                        </div>
                      </div>
                      {shop.owner && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {shop.owner.name} {shop.owner.surname}{shop.owner.phone_number ? ` · ${shop.owner.phone_number}` : ''}
                          {' · '}{new Date(shop.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-blue-400 shrink-0 transition-colors"/>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <ApplicationDetailModal
          shop={selected}
          onClose={() => setSelected(null)}
          onVerified={removeShop}
          onRejected={removeShop}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HistoryTab
// ─────────────────────────────────────────────────────────────────────────────
function HistoryTab({ onPendingChange }) {
  const [rows, setRows]         = useState([])
  const [count, setCount]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState({})
  const [loadingId, setLoadingId] = useState(null)
  const [busyId, setBusyId]     = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.shopApplications.getHistory({ limit: 100 })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleExpand(shopId) {
    if (expanded[shopId] !== undefined) {
      setExpanded(prev => { const n = { ...prev }; delete n[shopId]; return n })
      return
    }
    setLoadingId(shopId)
    try {
      const { data } = await AdminApi.shopApplications.getLogs(shopId)
      setExpanded(prev => ({ ...prev, [shopId]: data.data ?? [] }))
    } catch { setExpanded(prev => ({ ...prev, [shopId]: [] })) }
    finally { setLoadingId(null) }
  }

  async function handleReopen(shop) {
    setBusyId(shop.id)
    try {
      await AdminApi.shopApplications.reopen(shop.id)
      toast.success(`"${shop.name}" pending-e gaýtaryldy`)
      setRows(prev => prev.filter(s => s.id !== shop.id))
      setCount(c => c - 1)
      onPendingChange?.()
    } catch (e) { toast.error(e.response?.data?.message ?? 'Ýalňyşlyk') }
    finally { setBusyId(null) }
  }

  async function handleApprove(shop) {
    setBusyId(shop.id)
    try {
      await AdminApi.shopApplications.verify(shop.id)
      toast.success(`"${shop.name}" tassyklandy`)
      setRows(prev => prev.map(s => s.id === shop.id ? { ...s, verification_status: 2 } : s))
    } catch (e) { toast.error(e.response?.data?.message ?? 'Ýalňyşlyk') }
    finally { setBusyId(null) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/></div>

  if (!rows.length) return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
        <History className="h-12 w-12 mb-3 text-slate-200"/>
        <p className="text-sm">No reviewed applications yet.</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500">{count} reviewed</p>
      {rows.map(shop => {
        const badge = STATUS_BADGE[shop.verification_status]
        const logs  = expanded[shop.id]
        const isRejected = shop.verification_status === 3
        const isBusy = busyId === shop.id

        return (
          <Card key={shop.id}>
            <CardContent className="py-3.5">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm dark:text-white">{shop.name}</span>
                    {badge && <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', badge.cls)}>{badge.label}</span>}
                  </div>
                  {shop.owner && (
                    <p className="text-xs text-slate-500">{shop.owner.name} {shop.owner.surname}{shop.owner.phone_number ? ` · ${shop.owner.phone_number}` : ''}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    {shop.verifier && <span>by {shop.verifier.name} {shop.verifier.surname}</span>}
                    {shop.verified_at && <span>{new Date(shop.verified_at).toLocaleString([], { dateStyle:'medium', timeStyle:'short' })}</span>}
                  </div>
                  {shop.verification_note && <p className="text-xs text-slate-500 italic mt-0.5">"{shop.verification_note}"</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {isRejected && (
                    <>
                      <Button size="sm" variant="outline" disabled={isBusy}
                        className="h-7 text-xs text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-700/40 dark:text-amber-400 dark:hover:bg-amber-900/20"
                        onClick={() => handleReopen(shop)}>
                        <RotateCcw className="h-3 w-3 mr-1"/>{isBusy ? '…' : 'Re-open'}
                      </Button>
                      <Button size="sm" disabled={isBusy}
                        className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(shop)}>
                        <CheckCircle className="h-3 w-3 mr-1"/>{isBusy ? '…' : 'Approve'}
                      </Button>
                    </>
                  )}
                  <button
                    onClick={() => toggleExpand(shop.id)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                  >
                    {loadingId === shop.id
                      ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                      : logs !== undefined ? <ChevronUp className="h-3.5 w-3.5"/> : <ChevronDown className="h-3.5 w-3.5"/>
                    }
                    Log
                  </button>
                </div>
              </div>

              {logs !== undefined && (
                <div className="mt-3 pt-3 border-t dark:border-white/[0.06]">
                  <LogTimeline logs={logs}/>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'pending', label: 'Pending',   icon: Inbox },
  { key: 'history', label: 'Audit log', icon: History },
]

export default function ShopApplicationsPage() {
  const [tab, setTab]                   = useState('pending')
  const [pendingCount, setPendingCount] = useState(null)
  // used to signal PendingTab to reload after a re-open from the history tab
  const [pendingKey, setPendingKey]     = useState(0)

  function bumpPending() {
    setPendingKey(k => k + 1)
    setTab('pending')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold dark:text-white">Dükan arzalary</h1>
        <p className="text-sm text-slate-500">Shop application review &amp; audit</p>
      </div>

      <div className="flex gap-1 border-b dark:border-white/[0.08] border-black/[0.06]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === key ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white')}>
            <Icon className="h-4 w-4"/>{label}
            {key === 'pending' && pendingCount != null && pendingCount > 0 && (
              <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-semibold">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'pending' && <PendingTab key={pendingKey} onCountChange={setPendingCount}/>}
      {tab === 'history' && <HistoryTab onPendingChange={bumpPending}/>}
    </div>
  )
}
