import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Search, RefreshCw, PackageX, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
function imgUrl(p) { return p ? (p.startsWith('http') ? p : `${BASE}${p}`) : null }

const PAGE = 20

function StockBadge({ stock, track }) {
  if (!track) return <span className="text-xs text-slate-400">–</span>
  if (stock === 0) return <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">0</span>
  if (stock <= 5)  return <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{stock}</span>
  return <span className="text-xs text-slate-600 dark:text-slate-300">{stock}</span>
}

function StatusDot({ active }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
      active
        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
        : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-green-500' : 'bg-slate-400')} />
      {active ? 'Işjeň' : 'Gizlin'}
    </span>
  )
}

export default function SellerProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts]   = useState([])
  const [count, setCount]         = useState(0)
  const [categories, setCategories] = useState([])
  const [text, setText]           = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatus] = useState('')
  const [page, setPage]           = useState(0)
  const [loading, setLoading]     = useState(true)
  const [deleting, setDeleting]   = useState(null)
  const [toggling, setToggling]   = useState(null)

  useEffect(() => {
    SellerApi.categories.getAll().then(({ data }) => setCategories(data.data ?? [])).catch(() => {})
  }, [])

  const load = useCallback((p = 0) => {
    setLoading(true)
    const params = {
      limit: PAGE,
      skip: p * PAGE,
      text: text.trim() || undefined,
      category_id: catFilter || undefined,
      is_active: statusFilter !== '' ? statusFilter : undefined,
    }
    SellerApi.products.getAll(params)
      .then(({ data }) => { setProducts(data.data ?? []); setCount(data.count ?? 0) })
      .finally(() => setLoading(false))
  }, [text, catFilter, statusFilter])

  useEffect(() => { setPage(0); load(0) }, [catFilter, statusFilter])
  useEffect(() => { load(page) }, [page])

  function search() { setPage(0); load(0) }

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
    } finally { setDeleting(null) }
  }

  async function handleToggle(product) {
    setToggling(product.id)
    try {
      const { data } = await SellerApi.products.update(product.id, { is_active: !product.is_active })
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: data.model?.is_active ?? !product.is_active } : p))
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Ýalňyşlyk')
    } finally { setToggling(null) }
  }

  const totalPages = Math.ceil(count / PAGE)

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold dark:text-white">
          Harytlar <span className="text-slate-400 font-normal text-base">({count})</span>
        </h1>
        <Button size="sm" onClick={() => navigate('/seller/products/new')}>
          <Plus className="h-4 w-4 mr-1.5" />Haryt goş
        </Button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5 flex-1 min-w-0 max-w-sm">
          <Input
            placeholder="Gözle…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            className="h-8 text-sm"
          />
          <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={search}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="h-8 border rounded-md px-2.5 text-sm bg-white dark:bg-[#111114] dark:border-white/10 dark:text-white"
        >
          <option value="">Ähli kategoriýalar</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className="h-8 border rounded-md px-2.5 text-sm bg-white dark:bg-[#111114] dark:border-white/10 dark:text-white"
        >
          <option value="">Ähli ýagdaý</option>
          <option value="true">Işjeň</option>
          <option value="false">Gizlin</option>
        </select>

        <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={() => { setPage(0); load(0) }}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <PackageX className="h-12 w-12 text-slate-200 dark:text-white/10" />
          <p className="text-sm">Haryt tapylmady</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/seller/products/new')}>
            <Plus className="h-4 w-4 mr-1.5" />Ilkinji harydy goş
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden bg-white dark:bg-[#111114]">
          {/* Table header */}
          <div className="grid grid-cols-[2.5rem_1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
            <div />
            <div>Haryt</div>
            <div className="text-right">Baha</div>
            <div className="text-center">Stok</div>
            <div>Ýagdaý</div>
            <div />
          </div>

          {/* Rows */}
          <div className="divide-y dark:divide-white/[0.04]">
            {products.map((p) => {
              const thumb = p.productMedia?.[0]?.media?.thumbnail_url || p.productMedia?.[0]?.media?.url
              const price = parseFloat(p.price)
              const compareAt = p.compare_at_price ? parseFloat(p.compare_at_price) : null
              const hasDiscount = compareAt && compareAt > price

              return (
                <div
                  key={p.id}
                  className="grid grid-cols-[2.5rem_1fr_auto_auto_auto_auto] gap-x-4 items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Thumbnail */}
                  {thumb
                    ? <img src={imgUrl(thumb)} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                    : <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-white/10 shrink-0" />
                  }

                  {/* Name + category */}
                  <div className="min-w-0">
                    <Link
                      to={`/seller/products/${p.id}/edit`}
                      className="text-sm font-medium dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {p.category?.name}
                      {p.variants?.length > 0 && ` · ${p.variants.length} görnüş`}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold dark:text-white whitespace-nowrap">
                      {price.toFixed(2)} <span className="text-xs font-normal text-slate-400">{p.currency}</span>
                    </div>
                    {hasDiscount && (
                      <div className="text-xs text-slate-400 line-through">{compareAt.toFixed(2)}</div>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="text-center shrink-0">
                    <StockBadge stock={p.stock} track={p.track_inventory} />
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    <StatusDot active={p.is_active} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(p)}
                      disabled={toggling === p.id}
                      title={p.is_active ? 'Gizle' : 'Işjeňleşdir'}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors disabled:opacity-40"
                    >
                      {p.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <Link
                      to={`/seller/products/${p.id}/edit`}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{page * PAGE + 1}–{Math.min((page + 1) * PAGE, count)} / {count}</span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              ←
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
