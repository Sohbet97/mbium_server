import { useEffect, useState } from 'react'
import { AdminApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AttachmentList } from '@/components/common/AttachmentList'
import { toast } from 'sonner'
import { Handshake, Store, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const REQUEST_STATUS_CLS = {
  0: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  1: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

const OFFER_STATUS_CLS = {
  PENDING:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COUNTERED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACCEPTED:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

const PAGE_SIZE = 20

export default function BuyerRequestsPage() {
  const { t } = useTranslation()

  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)

  const [openId, setOpenId]   = useState(null)
  const [detail, setDetail]   = useState(null)
  const [offers, setOffers]   = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  function load(page = 1) {
    return AdminApi.buyerRequests.getAll({ limit: PAGE_SIZE, page })
      .then(({ data }) => setRequests(data?.data ?? []))
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openDetail(r) {
    setOpenId(r.id)
    setDetail(r)
    setDetailLoading(true)
    AdminApi.buyerRequests.getOne(r.id)
      .then(({ data }) => {
        setDetail(data?.model ?? r)
        setOffers(data?.offers ?? [])
      })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setDetailLoading(false))
  }

  function closeDialog() {
    setOpenId(null)
    setDetail(null)
    setOffers([])
  }

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-white">{t('nav.buyerRequests', 'Buyer requests (ÖTS)')}</h1>
      </div>

      {!requests.length ? (
        <Card><CardContent className="py-10 text-center text-slate-500 text-sm">{t('common.noResults')}</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y dark:divide-white/[0.06]">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3 px-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03]" onClick={() => openDetail(r)}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium dark:text-white flex items-center gap-1.5 truncate">
                    <Handshake className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {r.text || t('common.noResults')}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{r.user?.name} {r.user?.surname}</span>
                    {r.shop && <span className="flex items-center gap-1"><Store className="h-3 w-3" />{r.shop.name}</span>}
                    {r.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city.name}</span>}
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 shrink-0">
                  {r.budget != null && <div>{parseFloat(r.budget).toFixed(2)} TMT</div>}
                  <div>× {r.quantity}</div>
                </div>
                <Badge className={REQUEST_STATUS_CLS[r.status]}>{r.status === 0 ? t('common.active') : t('common.deleted', 'Closed')}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!openId} onOpenChange={(v) => (v ? null : closeDialog())}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('nav.buyerRequests', 'Buyer request')} #{openId}</DialogTitle></DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              {detail?.text && <p className="text-sm text-slate-600 dark:text-slate-300">{detail.text}</p>}
              <div className="text-xs text-slate-500 flex flex-wrap gap-3">
                {detail?.shop && <span className="flex items-center gap-1"><Store className="h-3 w-3" />{detail.shop.name}</span>}
                {detail?.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{detail.city.name}</span>}
                {detail?.budget != null && <span>{parseFloat(detail.budget).toFixed(2)} TMT</span>}
                <span>× {detail?.quantity}</span>
              </div>

              <AttachmentList attachments={detail?.attachments} />

              <div className="space-y-2">
                {!offers.length && (
                  <p className="text-xs text-slate-500">{t('common.noResults')}</p>
                )}
                {offers.map((o) => (
                  <div key={o.id} className="rounded-lg border px-3 py-2 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium dark:text-white">
                          {o.from_role === 'SELLER' ? (detail?.shop?.name ?? t('nav.shops')) : t('users.title', 'Buyer')}:
                        </span>{' '}
                        {parseFloat(o.unit_price).toFixed(2)} {o.currency} × {o.quantity}
                        {o.note && <div className="text-xs text-slate-500">{o.note}</div>}
                        <div className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleString()}</div>
                      </div>
                      <Badge className={OFFER_STATUS_CLS[o.status]}>{o.status}</Badge>
                    </div>
                    <AttachmentList attachments={o.attachments} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
