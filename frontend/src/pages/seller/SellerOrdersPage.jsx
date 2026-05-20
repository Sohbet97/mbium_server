import { useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const STATUSES = {
  0: { label: 'Garaşylýar',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  1: { label: 'Tassyklanan',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  2: { label: 'Taýýarlanylýar',color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  3: { label: 'Ugradyldy',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  4: { label: 'Gowşuryldy',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  5: { label: 'Ýapyldy',       color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  6: { label: 'Ýatyryldy',     color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const NEXT_STATUS = { 0: 1, 1: 2, 2: 3 }
const NEXT_LABEL  = { 0: 'Tassykla', 1: 'Taýýarlamaga başla', 2: 'Ugrat' }

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(null)

  useEffect(() => {
    SellerApi.orders.getAll({ limit: 50 })
      .then(({ data }) => { setOrders(data.data ?? []); setCount(data.count ?? 0) })
      .finally(() => setLoading(false))
  }, [])

  async function advance(order) {
    const next = NEXT_STATUS[order.status]
    if (next == null) return
    setAdvancing(order.id)
    try {
      const { data } = await SellerApi.orders.updateStatus(order.id, { status: next })
      setOrders((prev) => prev.map((o) => o.id === order.id ? data.model : o))
      toast.success('Status üýtgedildi')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally {
      setAdvancing(null)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold dark:text-white">Sargytlar ({count})</h1>

      {!orders.length ? (
        <Card><CardContent className="py-10 text-center text-slate-500 text-sm">Sargyt ýok</CardContent></Card>
      ) : orders.map((order) => {
        const st = STATUSES[order.status]
        const nextStatus = NEXT_STATUS[order.status]
        return (
          <Card key={order.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">#{order.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st?.color}`}>
                      {st?.label}
                    </span>
                  </div>
                  <div className="text-sm font-medium dark:text-white">
                    {order.customer?.name} {order.customer?.surname}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                    {' · '}
                    {parseFloat(order.total_price).toFixed(2)} {order.currency}
                  </div>
                </div>

                {nextStatus != null && (
                  <Button
                    size="sm"
                    disabled={advancing === order.id}
                    onClick={() => advance(order)}
                  >
                    {advancing === order.id ? '...' : NEXT_LABEL[order.status]}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
