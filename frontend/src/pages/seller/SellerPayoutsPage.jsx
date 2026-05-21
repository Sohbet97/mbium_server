import { useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const STATUS_COLORS = {
  0: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  1: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  9: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function SellerPayoutsPage() {
  const { t } = useTranslation()

  const STATUS_LABELS = {
    0: { label: t('seller.payoutPending'), color: STATUS_COLORS[0] },
    1: { label: t('seller.payoutApproved'), color: STATUS_COLORS[1] },
    2: { label: t('seller.payoutPaid'),    color: STATUS_COLORS[2] },
    9: { label: t('seller.payoutRejected'), color: STATUS_COLORS[9] },
  }
  const [balance, setBalance]     = useState(null)
  const [history, setHistory]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [open, setOpen]           = useState(false)
  const [amount, setAmount]       = useState('')
  const [iban, setIban]           = useState('')
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    Promise.all([
      SellerApi.payouts.getBalance(),
      SellerApi.payouts.getHistory({ limit: 20 }),
    ]).then(([balRes, histRes]) => {
      setBalance(balRes.data?.model ?? balRes.data)
      setHistory(histRes.data?.data ?? [])
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleRequest() {
    if (!amount || parseFloat(amount) <= 0) { toast.error(t('seller.enterAmount')); return }
    setRequesting(true)
    try {
      await SellerApi.payouts.request({ amount: parseFloat(amount), bank_iban: iban || undefined })
      toast.success(t('seller.payoutRequestSent'))
      setOpen(false)
      setAmount('')
      setIban('')
      // refresh history
      const { data } = await SellerApi.payouts.getHistory({ limit: 20 })
      setHistory(data?.data ?? [])
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-white">{t('seller.payoutsTitle')}</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Wallet className="h-4 w-4 mr-1" />{t('seller.requestPayout')}</Button>
      </div>

      {/* Balance card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">{t('seller.currentBalance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold dark:text-white">
            {parseFloat(balance?.balance ?? 0).toFixed(2)}
            <span className="text-base font-normal text-slate-500 ml-1">{balance?.currency ?? 'TMT'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payout history */}
      <h2 className="text-sm font-medium text-slate-500">{t('seller.payoutHistory')}</h2>
      {!history.length ? (
        <Card><CardContent className="py-10 text-center text-slate-500 text-sm">{t('seller.noPayouts')}</CardContent></Card>
      ) : history.map((p) => {
        const st = STATUS_LABELS[p.status] ?? STATUS_LABELS[0]
        return (
          <Card key={p.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium dark:text-white">
                    {parseFloat(p.amount).toFixed(2)} {p.currency ?? 'TMT'}
                  </div>
                  <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('seller.withdrawTitle')}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>{t('seller.payoutAmount')}</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100.00" /></div>
            <div><Label>{t('seller.bankIbanOptional')}</Label><Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="TM..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleRequest} disabled={requesting}>{requesting ? t('seller.sending') : t('seller.send')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
