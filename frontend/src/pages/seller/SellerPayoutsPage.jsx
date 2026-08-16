import { useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Wallet, Clock, CreditCard, Banknote } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const REQUEST_STATUS_COLORS = {
  PENDING:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TXN_TYPE_COLOR = {
  ORDER_CREDIT:    'text-green-600 dark:text-green-400',
  COMMISSION:      'text-slate-500 dark:text-slate-400',
  PAYOUT_DEBIT:    'text-red-600 dark:text-red-400',
  PAYOUT_REVERSAL: 'text-slate-500 dark:text-slate-400',
}

const PAGE_SIZE = 20

export default function SellerPayoutsPage() {
  const { t } = useTranslation()

  const REQUEST_STATUS_LABELS = {
    PENDING:   t('seller.payoutPending'),
    APPROVED:  t('seller.payoutApproved'),
    PROCESSED: t('seller.payoutPaid'),
    REJECTED:  t('seller.payoutRejected'),
  }

  const TXN_TYPE_LABELS = {
    ORDER_CREDIT:    t('seller.txnOrderCredit'),
    COMMISSION:      t('seller.txnCommission'),
    PAYOUT_DEBIT:    t('seller.txnPayoutDebit'),
    PAYOUT_REVERSAL: t('seller.txnPayoutReversal'),
  }

  const [summary, setSummary]     = useState(null)
  const [stats, setStats]         = useState(null)
  const [transactions, setTransactions] = useState([])
  const [txnCount, setTxnCount]   = useState(0)
  const [requests, setRequests]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [open, setOpen]           = useState(false)
  const [amount, setAmount]       = useState('')
  const [method, setMethod]       = useState('CASH')
  const [cardNumber, setCardNumber] = useState('')
  const [requesting, setRequesting] = useState(false)

  function loadAll() {
    return Promise.all([
      SellerApi.payouts.getSummary(),
      SellerApi.payouts.getStats(),
      SellerApi.payouts.getTransactions({ limit: PAGE_SIZE, page: 1 }),
      SellerApi.payouts.getHistory({ limit: 5, page: 1 }),
    ]).then(([summaryRes, statsRes, txnRes, reqRes]) => {
      setSummary(summaryRes.data?.model ?? summaryRes.data)
      setStats(statsRes.data?.model ?? statsRes.data)
      setTransactions(txnRes.data?.data ?? [])
      setTxnCount(txnRes.data?.count ?? 0)
      setRequests(reqRes.data?.data ?? [])
    })
  }

  useEffect(() => {
    loadAll().catch(() => toast.error(t('toast.error'))).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetForm() {
    setAmount('')
    setCardNumber('')
    setMethod('CASH')
  }

  function closeDialog() {
    setOpen(false)
    resetForm()
  }

  function loadMoreTransactions() {
    setLoadingMore(true)
    const nextPage = Math.floor(transactions.length / PAGE_SIZE) + 1
    SellerApi.payouts.getTransactions({ limit: PAGE_SIZE, page: nextPage })
      .then(({ data }) => setTransactions((prev) => [...prev, ...(data?.data ?? [])]))
      .finally(() => setLoadingMore(false))
  }

  async function handleRequest() {
    const amt = parseFloat(amount)
    const withdrawable = summary?.withdrawable_balance ?? summary?.available_balance ?? 0

    if (!amount || amt <= 0) { toast.error(t('seller.enterAmount')); return }
    if (summary && amt < summary.min_payout_amount) {
      toast.error(t('seller.minPayoutError', { amount: summary.min_payout_amount }))
      return
    }
    if (summary && amt > withdrawable) { toast.error(t('seller.insufficientBalance')); return }

    let normalizedCard = ''
    if (method === 'CARD') {
      normalizedCard = cardNumber.replace(/\s+/g, '')
      if (!/^\d{13,19}$/.test(normalizedCard)) { toast.error(t('seller.invalidCardNumber')); return }
    }

    setRequesting(true)
    try {
      await SellerApi.payouts.request({ amount: amt, method, card_number: method === 'CARD' ? normalizedCard : undefined })
      toast.success(t('seller.payoutRequestSent'))
      closeDialog()
      await loadAll()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setRequesting(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  const currency = summary?.currency ?? 'TMT'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-white">{t('seller.payoutsTitle')}</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Wallet className="h-4 w-4 mr-1" />{t('seller.requestPayout')}</Button>
      </div>

      {/* Balance tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">{t('seller.availableBalance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">
              {parseFloat(summary?.available_balance ?? 0).toFixed(2)}
              <span className="text-base font-normal text-slate-500 ml-1">{currency}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />{t('seller.pendingBalance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
              {parseFloat(summary?.pending_balance ?? 0).toFixed(2)}
              <span className="text-base font-normal text-slate-500 ml-1">{currency}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t('seller.pendingBalanceHint')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { key: 'today', label: t('seller.statsToday') },
          { key: 'week',  label: t('seller.statsWeek') },
          { key: 'month', label: t('seller.statsMonth') },
        ].map(({ key, label }) => (
          <Card key={key}>
            <CardContent className="py-3">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="text-lg font-semibold dark:text-white">
                +{parseFloat(stats?.[key]?.amount ?? 0).toFixed(2)} {currency}
              </div>
              <div className="text-xs text-slate-400">{t('seller.ordersCount', { count: stats?.[key]?.orders ?? 0 })}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction ledger */}
      <h2 className="text-sm font-medium text-slate-500">{t('seller.transactionHistory')}</h2>
      {!transactions.length ? (
        <Card><CardContent className="py-10 text-center text-slate-500 text-sm">{t('seller.noTransactions')}</CardContent></Card>
      ) : transactions.map((txn) => (
        <Card key={txn.id}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium dark:text-white">{TXN_TYPE_LABELS[txn.type] ?? txn.type}</div>
                <div className="text-xs text-slate-500">{txn.note}</div>
                <div className="text-xs text-slate-400">{new Date(txn.createdAt).toLocaleString()}</div>
              </div>
              <div className={`text-sm font-semibold ${TXN_TYPE_COLOR[txn.type] ?? ''}`}>
                {parseFloat(txn.amount) >= 0 ? '+' : ''}{parseFloat(txn.amount).toFixed(2)} {currency}
                {txn.status === 'PENDING' && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {t('seller.payoutPending')}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {transactions.length > 0 && transactions.length < txnCount && (
        <div className="flex justify-center pt-1">
          <Button size="sm" variant="outline" disabled={loadingMore} onClick={loadMoreTransactions}>
            {loadingMore ? t('common.loading') : t('common.loadMore', 'Load more')}
          </Button>
        </div>
      )}

      {/* Withdrawal requests */}
      <h2 className="text-sm font-medium text-slate-500 pt-2">{t('seller.payoutRequestsTitle')}</h2>
      {!requests.length ? (
        <Card><CardContent className="py-6 text-center text-slate-500 text-sm">{t('seller.noPayouts')}</CardContent></Card>
      ) : requests.map((p) => {
        const color = REQUEST_STATUS_COLORS[p.status] ?? REQUEST_STATUS_COLORS.PENDING
        const label = REQUEST_STATUS_LABELS[p.status] ?? p.status
        return (
          <Card key={p.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium dark:text-white flex items-center gap-1.5">
                    {p.method === 'CARD' ? <CreditCard className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
                    {parseFloat(p.amount).toFixed(2)} {p.currency ?? 'TMT'}
                  </div>
                  <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('seller.withdrawTitle')}</DialogTitle></DialogHeader>
          <div className="grid gap-3 p-2">
            <div>
              <Label>{t('seller.payoutAmount')}</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100.00" />
              {summary && (
                <p className="text-xs text-slate-500 mt-1">
                  {t('seller.withdrawableHint', { amount: (summary.withdrawable_balance ?? summary.available_balance).toFixed(2) })}
                </p>
              )}
            </div>
            <div>
              <Label>{t('seller.payoutMethod')}</Label>
              <div className="flex gap-2 mt-1">
                <Button type="button" size="sm" variant={method === 'CASH' ? 'default' : 'outline'} onClick={() => setMethod('CASH')}>
                  <Banknote className="h-4 w-4 mr-1" />{t('seller.methodCash')}
                </Button>
                <Button type="button" size="sm" variant={method === 'CARD' ? 'default' : 'outline'} onClick={() => setMethod('CARD')}>
                  <CreditCard className="h-4 w-4 mr-1" />{t('seller.methodCard')}
                </Button>
              </div>
            </div>
            {method === 'CARD' && (
              <div><Label>{t('seller.cardNumber')}</Label><Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder={t('seller.cardNumberPlaceholder')} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button onClick={handleRequest} disabled={requesting}>{requesting ? t('seller.sending') : t('seller.send')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
