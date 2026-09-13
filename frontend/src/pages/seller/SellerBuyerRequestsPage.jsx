import { useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AttachmentList } from '@/components/common/AttachmentList'
import { AttachmentPicker } from '@/components/common/AttachmentPicker'
import { toast } from 'sonner'
import { Handshake, Check, X, ArrowLeftRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const OFFER_STATUS_COLORS = {
  PENDING:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COUNTERED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACCEPTED:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export default function SellerBuyerRequestsPage() {
  const { t } = useTranslation()

  const OFFER_STATUS_LABELS = {
    PENDING:   t('seller.otsPending'),
    COUNTERED: t('seller.otsCountered'),
    ACCEPTED:  t('seller.otsAccepted'),
    REJECTED:  t('seller.otsRejected'),
    EXPIRED:   t('seller.otsExpired'),
  }

  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)

  const [openId, setOpenId]     = useState(null)
  const [detail, setDetail]     = useState(null)
  const [offers, setOffers]     = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  const [unitPrice, setUnitPrice] = useState('')
  const [quantity, setQuantity]   = useState('')
  const [note, setNote]           = useState('')
  const [offerAttachments, setOfferAttachments] = useState([])
  const [submitting, setSubmitting] = useState(false)

  function loadRequests() {
    return SellerApi.buyerRequests.getAll({ limit: 50 }).then(({ data }) => setRequests(data?.data ?? []))
  }

  useEffect(() => {
    loadRequests().catch(() => toast.error(t('toast.error'))).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetForm() {
    setUnitPrice('')
    setQuantity('')
    setNote('')
    setOfferAttachments([])
  }

  function openDetail(request) {
    setOpenId(request.id)
    setDetail(request)
    resetForm()
    setDetailLoading(true)
    SellerApi.buyerRequests.getOne(request.id)
      .then(({ data }) => {
        setDetail(data?.model ?? request)
        setOffers(data?.offers ?? [])
      })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setDetailLoading(false))
  }

  function closeDialog() {
    setOpenId(null)
    setDetail(null)
    setOffers([])
    resetForm()
  }

  const lastOffer = offers.length ? offers[offers.length - 1] : null
  const canRespond = lastOffer && lastOffer.from_role === 'BUYER' && lastOffer.status === 'PENDING'
  const waitingForBuyer = lastOffer && lastOffer.from_role === 'SELLER' && lastOffer.status === 'PENDING'
  const isFinal = lastOffer && ['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(lastOffer.status)

  async function handleSubmitOffer() {
    const price = parseFloat(unitPrice)
    if (!price || price <= 0) { toast.error(t('seller.otsEnterPrice')); return }

    setSubmitting(true)
    try {
      const attachments = offerAttachments.length ? offerAttachments : undefined
      if (!lastOffer) {
        await SellerApi.buyerRequests.createOffer(openId, {
          unit_price: price,
          quantity: quantity ? parseInt(quantity, 10) : undefined,
          note: note || undefined,
          attachments,
        })
      } else {
        await SellerApi.buyerRequests.counterOffer(openId, lastOffer.id, {
          unit_price: price,
          quantity: quantity ? parseInt(quantity, 10) : undefined,
          note: note || undefined,
          attachments,
        })
      }
      toast.success(t('seller.otsOfferSent'))
      openDetail(detail)
      await loadRequests()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAccept() {
    setSubmitting(true)
    try {
      await SellerApi.buyerRequests.acceptOffer(openId, lastOffer.id)
      toast.success(t('seller.otsAccepted'))
      openDetail(detail)
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject() {
    setSubmitting(true)
    try {
      await SellerApi.buyerRequests.rejectOffer(openId, lastOffer.id)
      toast.success(t('seller.otsRejected'))
      openDetail(detail)
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-white">{t('seller.otsTitle')}</h1>
      </div>

      {!requests.length ? (
        <Card><CardContent className="py-10 text-center text-slate-500 text-sm">{t('seller.otsNoRequests')}</CardContent></Card>
      ) : requests.map((r) => (
        <Card key={r.id} className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-800" onClick={() => openDetail(r)}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium dark:text-white flex items-center gap-1.5">
                  <Handshake className="h-3.5 w-3.5" />
                  {r.text || t('seller.otsNoDescription')}
                </div>
                <div className="text-xs text-slate-500">
                  {r.user?.name} {r.user?.surname} · {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                {r.budget != null && <div>{t('seller.otsBudget')}: {parseFloat(r.budget).toFixed(2)} TMT</div>}
                <div>{t('seller.otsQuantity')}: {r.quantity}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!openId} onOpenChange={(v) => (v ? null : closeDialog())}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('seller.otsThreadTitle')}</DialogTitle></DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              {detail?.text && <p className="text-sm text-slate-600 dark:text-slate-300">{detail.text}</p>}

              <AttachmentList attachments={detail?.attachments} />

              <div className="space-y-2">
                {!offers.length && (
                  <p className="text-xs text-slate-500">{t('seller.otsNoOffersYet')}</p>
                )}
                {offers.map((o) => (
                  <div key={o.id} className={`rounded-lg border px-3 py-2 space-y-2 ${o.from_role === 'SELLER' ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium dark:text-white">
                          {o.from_role === 'SELLER' ? t('seller.otsYou') : t('seller.otsBuyer')}:
                        </span>{' '}
                        {parseFloat(o.unit_price).toFixed(2)} {o.currency} × {o.quantity}
                        {o.note && <div className="text-xs text-slate-500">{o.note}</div>}
                      </div>
                      <Badge className={OFFER_STATUS_COLORS[o.status]}>{OFFER_STATUS_LABELS[o.status] ?? o.status}</Badge>
                    </div>
                    <AttachmentList attachments={o.attachments} />
                  </div>
                ))}
              </div>

              {canRespond && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAccept} disabled={submitting}><Check className="h-4 w-4 mr-1" />{t('seller.otsAccept')}</Button>
                  <Button size="sm" variant="destructive" onClick={handleReject} disabled={submitting}><X className="h-4 w-4 mr-1" />{t('seller.otsReject')}</Button>
                </div>
              )}

              {waitingForBuyer && (
                <p className="text-xs text-slate-500">{t('seller.otsWaitingForBuyer')}</p>
              )}

              {!isFinal && (
                <div className="grid gap-2 border-t pt-3 dark:border-white/10">
                  <Label className="text-xs">
                    {lastOffer ? t('seller.otsCounterOffer') : t('seller.otsSendOffer')}
                  </Label>
                  <div className="flex gap-2">
                    <Input type="number" step="0.01" min="0" placeholder={t('seller.otsPricePlaceholder')} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
                    <Input type="number" min="1" placeholder={t('seller.otsQuantity')} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-28" />
                  </div>
                  <Textarea placeholder={t('seller.otsNotePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                  <AttachmentPicker
                    value={offerAttachments}
                    onChange={setOfferAttachments}
                    onUpload={SellerApi.buyerRequests.uploadAttachment}
                    disabled={submitting}
                    accept="image/*,video/*,.pdf,.xls,.xlsx,.doc,.docx"
                  />
                  <Button size="sm" onClick={handleSubmitOffer} disabled={submitting}>
                    <ArrowLeftRight className="h-4 w-4 mr-1" />
                    {submitting ? t('seller.sending') : (lastOffer ? t('seller.otsCounterOffer') : t('seller.otsSendOffer'))}
                  </Button>
                </div>
              )}
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
