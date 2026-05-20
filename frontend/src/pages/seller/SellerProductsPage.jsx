import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SellerApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function SellerProductsPage() {
  const [products, setProducts] = useState([])
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  function load(q = '') {
    setLoading(true)
    SellerApi.products.getAll({ limit: 50, text: q || undefined })
      .then(({ data }) => { setProducts(data.data ?? []); setCount(data.count ?? 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('Harydy pozmak isleýärsiňizmi?')) return
    setDeleting(id)
    try {
      await SellerApi.products.delete(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setCount((c) => c - 1)
      toast.success('Haryt pozuldy')
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold dark:text-white">Harytlar ({count})</h1>
        <Button size="sm" asChild>
          <Link to="/seller/products/new"><Plus className="h-4 w-4 mr-1" />Haryt goş</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Gözle..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(text)}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={() => load(text)}>Gözle</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : !products.length ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-500 text-sm">
            Haryt ýok. Täze haryt goşuň.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt={p.name} className="h-10 w-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-slate-100 dark:bg-white/10 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium dark:text-white truncate">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      {parseFloat(p.price).toFixed(2)} {p.currency}
                      {p.stock != null && ` · Stok: ${p.stock}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" asChild>
                    <Link to={`/seller/products/${p.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    disabled={deleting === p.id}
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
