import { useEffect, useState, useCallback } from 'react'
import { AdminApi } from '@/lib/api'
import { usePendingCounts } from '@/store/pendingCounts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { RefreshCw, CheckCircle, XCircle, ArrowRight, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const STATUS_CLS = {
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const planName = (p, fallback) => p?.display_name_tm || p?.name || fallback

export default function TariffRequestsPage() {
  const { t } = useTranslation()
  const pendingCounts = usePendingCounts()
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending') // pending | all
  const [target, setTarget]     = useState(null)      // { req, status }
  const [comment, setComment]   = useState('')
  const [acting, setActing]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter === 'pending' ? { status: 'pending' } : {}
      const { data } = await AdminApi.tariffRequests.getAll(params)
      setRequests(data.data ?? [])
    } catch {
      toast.error(t('toast.error'))
    } finally {
      setLoading(false)
    }
  }, [filter, t])

  useEffect(() => { load() }, [load])

  async function submit() {
    if (!target) return
    setActing(true)
    try {
      await AdminApi.tariffRequests.review(target.req.id, { status: target.status, comment: comment.trim() || undefined })
      toast.success(target.status === 'approved' ? t('tariffRequests.approvedMsg') : t('tariffRequests.rejectedMsg'))
      setTarget(null)
      setComment('')
      load()
      pendingCounts?.refresh?.()
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setActing(false)
    }
  }

  const open = (req, status) => { setTarget({ req, status }); setComment('') }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('tariffRequests.title')}</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden text-sm">
            {['pending', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  filter === f
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                )}
              >
                {t(`tariffRequests.${f}`)}
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
            <div className="py-10 text-center text-sm text-slate-400">…</div>
          ) : requests.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">{t('tariffRequests.noRequests')}</div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="flex flex-wrap items-center gap-3 py-3 px-4 border-b last:border-0 dark:border-white/[0.06]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-white">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {req.shop?.name ?? `#${req.shop_id}`}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{req.currentPlan ? planName(req.currentPlan) : '—'}</span>
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{planName(req.plan, `#${req.plan_id}`)}</span>
                  </div>
                  {req.comment && <p className="mt-1 text-xs text-slate-500 italic">“{req.comment}”</p>}
                  {req.admin_comment && (
                    <p className="mt-1 text-xs text-slate-400">{t('tariffRequests.adminComment')}: {req.admin_comment}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                </div>

                <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', STATUS_CLS[req.status])}>
                  {t(`tariffRequests.${req.status}`)}
                </span>

                {req.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30 dark:border-green-800" onClick={() => open(req, 'approved')}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      {t('tariffRequests.approve')}
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-red-800" onClick={() => open(req, 'rejected')}>
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      {t('tariffRequests.reject')}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!target} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target?.status === 'approved' ? t('tariffRequests.approveTitle') : t('tariffRequests.rejectTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-800 dark:text-white">{target?.req.shop?.name}</span>
              {' → '}
              {planName(target?.req.plan)}
            </p>
            {target?.status === 'approved' && (
              <p className="text-xs text-slate-400">{t('tariffRequests.approveText')}</p>
            )}
            <Textarea
              placeholder={target?.status === 'approved' ? t('tariffRequests.comment') : t('tariffRequests.reason')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>{t('common.cancel', 'Cancel')}</Button>
            <Button variant={target?.status === 'approved' ? 'default' : 'destructive'} disabled={acting} onClick={submit}>
              {target?.status === 'approved' ? t('tariffRequests.approve') : t('tariffRequests.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
