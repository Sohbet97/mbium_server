import { useEffect, useState, useCallback } from 'react'
import { AdminApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { RefreshCw, CheckCircle, XCircle, ArrowRight, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const STATUS = {
  0: { label: 'Pending',  cls: 'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400'  },
  1: { label: 'Approved', cls: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400'  },
  2: { label: 'Rejected', cls: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400'    },
}

function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS[0]
  return (
    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', s.cls)}>
      {s.label}
    </span>
  )
}

function RequestRow({ req, onApprove, onReject }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-3 px-4 border-b last:border-0 dark:border-white/[0.06]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-white">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {req.shop?.name ?? `Shop #${req.shop_id}`}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
          <span>{req.currentType?.name ?? req.current_type_id}</span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="font-medium text-slate-700 dark:text-slate-200">{req.requestedType?.name ?? req.requested_type_id}</span>
        </div>
        {req.note && req.status === 2 && (
          <p className="mt-1 text-xs text-red-500 italic">"{req.note}"</p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          {new Date(req.createdAt).toLocaleDateString()}
          {req.requester && ` · ${req.requester.name ?? req.requester.email}`}
        </p>
      </div>

      <StatusBadge status={req.status} />

      {req.status === 0 && (
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30 dark:border-green-800" onClick={() => onApprove(req)}>
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Approve
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-red-800" onClick={() => onReject(req)}>
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Reject
          </Button>
        </div>
      )}
    </div>
  )
}

export default function ShopTypeRequestsPage() {
  const { t } = useTranslation()
  const [requests, setRequests]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('pending') // pending | all
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [acting, setActing]         = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter === 'pending' ? { status: 0 } : {}
      const { data } = await AdminApi.shopTypeRequests.getAll(params)
      setRequests(data.data ?? [])
    } catch {
      toast.error(t('toast.error'))
    } finally {
      setLoading(false)
    }
  }, [filter, t])

  useEffect(() => { load() }, [load])

  async function handleApprove(req) {
    setActing(true)
    try {
      await AdminApi.shopTypeRequests.approve(req.id)
      toast.success('Approved')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setActing(false)
    }
  }

  async function handleReject() {
    if (!rejectTarget) return
    setActing(true)
    try {
      await AdminApi.shopTypeRequests.reject(rejectTarget.id, { note: rejectNote })
      toast.success('Rejected')
      setRejectTarget(null)
      setRejectNote('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setActing(false)
    }
  }

  const pending = requests.filter((r) => r.status === 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            {t('nav.shopTypeRequests')}
          </h1>
          {pending.length > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
              {pending.length} pending
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden text-sm">
            {['pending', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 capitalize transition-colors',
                  filter === f
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No requests found</div>
          ) : (
            requests.map((req) => (
              <RequestRow
                key={req.id}
                req={req}
                onApprove={handleApprove}
                onReject={(r) => { setRejectTarget(r); setRejectNote('') }}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(v) => !v && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500">
              Rejecting type change request for{' '}
              <span className="font-medium text-slate-800 dark:text-white">
                {rejectTarget?.shop?.name}
              </span>
            </p>
            <Textarea
              placeholder="Reason (optional)"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={acting} onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
