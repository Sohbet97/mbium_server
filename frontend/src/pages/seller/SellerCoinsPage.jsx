import { useEffect, useState } from 'react'
import { BuyerApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Coins, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const TOPUP_STATUS_COLORS = {
  PENDING:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const PAGE_SIZE = 20

export default function SellerCoinsPage() {
  const { t } = useTranslation()

  const [balance, setBalance] = useState(null)
  const [history, setHistory] = useState([])
  const [historyCount, setHistoryCount] = useState(0)
  const [topups, setTopups] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [open, setOpen] = useState(false)
  const [amountTmt, setAmountTmt] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function loadAll() {
    return Promise.all([
      BuyerApi.coins.getBalance(),
      BuyerApi.coins.getHistory({ limit: PAGE_SIZE, skip: 0 }),
      BuyerApi.coins.getTopups({ limit: 10, skip: 0 }),
      BuyerApi.wallet.getTransactions({ limit: 10, skip: 0 }),
    ]).then(([balRes, histRes, topupRes, purchaseRes]) => {
      setBalance(balRes.data)
      setHistory(histRes.data?.data ?? [])
      setHistoryCount(histRes.data?.count ?? 0)
      setTopups(topupRes.data?.data ?? [])
      setPurchases(purchaseRes.data?.data ?? [])
    })
  }

  useEffect(() => {
    loadAll().catch(() => toast.error(t('toast.error'))).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function closeDialog() {
    setOpen(false)
    setAmountTmt('')
    setReceiptUrl('')
  }

  function loadMoreHistory() {
    setLoadingMore(true)
    BuyerApi.coins.getHistory({ limit: PAGE_SIZE, skip: history.length })
      .then(({ data }) => setHistory((prev) => [...prev, ...(data?.data ?? [])]))
      .finally(() => setLoadingMore(false))
  }

  async function handleTopup() {
    const amt = parseFloat(amountTmt)
    if (!amountTmt || amt <= 0) { toast.error(t('seller.enterAmount')); return }

    setSubmitting(true)
    try {
      await BuyerApi.coins.submitTopup({ amount_tmt: amt, receipt_url: receiptUrl || undefined })
      toast.success(t('seller.topUpSent'))
      closeDialog()
      await loadAll()
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
        <h1 className="text-xl font-semibold dark:text-white">{t('seller.coinsTitle')}</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />{t('seller.topUp')}</Button>
      </div>

      {/* Balance tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-indigo-200 dark:border-indigo-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
              <Coins className="h-3.5 w-3.5" />{t('seller.coinBalance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
              {balance?.balance ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <div className="text-xs text-slate-500">{t('seller.totalEarned')}</div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">+{balance?.total_earned ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <div className="text-xs text-slate-500">{t('seller.totalSpent')}</div>
            <div className="text-lg font-semibold text-red-500 dark:text-red-400">-{balance?.total_spent ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Coin transaction history */}
      <h2 className="text-sm font-medium text-slate-500">{t('seller.coinHistory')}</h2>
      {!history.length ? (
        <Card><CardContent className="py-10 text-center text-slate-500 text-sm">{t('seller.noCoinHistory')}</CardContent></Card>
      ) : history.map((tx) => (
        <Card key={tx.id}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium dark:text-white">{tx.type} · {tx.source}</div>
                {tx.note && <div className="text-xs text-slate-500">{tx.note}</div>}
                <div className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString()}</div>
              </div>
              <div className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {tx.amount >= 0 ? '+' : ''}{tx.amount}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {history.length > 0 && history.length < historyCount && (
        <div className="flex justify-center pt-1">
          <Button size="sm" variant="outline" disabled={loadingMore} onClick={loadMoreHistory}>
            {loadingMore ? t('common.loading') : t('common.loadMore', 'Load more')}
          </Button>
        </div>
      )}

      {/* Unified purchases (Coin + TMT) */}
      <h2 className="text-sm font-medium text-slate-500 pt-2">{t('seller.allPurchases')}</h2>
      {!purchases.length ? (
        <Card><CardContent className="py-6 text-center text-slate-500 text-sm">{t('seller.noPurchases')}</CardContent></Card>
      ) : purchases.map((p) => (
        <Card key={p.id}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium dark:text-white">{p.feature}</div>
                <div className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {p.currency}
                </span>
                <span className="text-sm font-semibold text-red-500 dark:text-red-400">-{parseFloat(p.amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Top-up requests */}
      <h2 className="text-sm font-medium text-slate-500 pt-2">{t('seller.myTopUps')}</h2>
      {!topups.length ? (
        <Card><CardContent className="py-6 text-center text-slate-500 text-sm">{t('seller.noTopUps')}</CardContent></Card>
      ) : topups.map((tp) => (
        <Card key={tp.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium dark:text-white">
                  {parseFloat(tp.amount_tmt).toFixed(2)} TMT → {tp.coins_requested} {t('seller.coinsRequested')}
                </div>
                <div className="text-xs text-slate-500">{new Date(tp.createdAt).toLocaleDateString()}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TOPUP_STATUS_COLORS[tp.status] ?? TOPUP_STATUS_COLORS.PENDING}`}>
                {tp.status}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('seller.topUpTitle')}</DialogTitle></DialogHeader>
          <div className="grid gap-3 p-2">
            <div>
              <Label>{t('seller.topUpAmountTmt')}</Label>
              <Input type="number" step="0.01" min="0" value={amountTmt} onChange={(e) => setAmountTmt(e.target.value)} placeholder="10.00" />
            </div>
            <div>
              <Label>{t('seller.topUpReceiptUrl')}</Label>
              <Input value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button onClick={handleTopup} disabled={submitting}>{submitting ? t('seller.sending') : t('seller.send')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
