import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SellerApi, BuyerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Search, RefreshCw, PackageX, Eye, EyeOff, Zap, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { CategoryTreeSelect } from '@/components/common/CategoryTreeSelect'
import { ColorSwatches } from '@/components/common/ColorSwatches'
import { ColorFilter } from '@/components/common/ColorSelect'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
function imgUrl(p) { return p ? (p.startsWith('http') ? p : `${BASE}${p}`) : null }

const PAGE = 20

function StockBadge({ stock, track }) {
  if (!track) return <span className="text-xs text-slate-400">–</span>
  if (stock === 0) return <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">0</span>
  if (stock <= 5)  return <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{stock}</span>
  return <span className="text-xs text-slate-600 dark:text-slate-300">{stock}</span>
}

function StatusDot({ active, t }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
      active
        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
        : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-green-500' : 'bg-slate-400')} />
      {active ? t('seller.statusActive') : t('seller.statusHidden')}
    </span>
  )
}

function ModerationDot({ status, note, t }) {
  const cls = status === 1
    ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
    : status === 2
      ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
  const label = status === 1 ? t('seller.modApproved') : status === 2 ? t('seller.modRejected') : t('seller.modPending')
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', cls)}
      title={status === 2 && note ? `${t('seller.modRejectedHint')}: ${note}` : undefined}
    >
      {label}
    </span>
  )
}

function fmtDate(s) {
  if (!s) return ''
  return new Date(s).toLocaleString()
}

function TurboModal({ product, onClose, onBoosted }) {
  const { t } = useTranslation()
  const [packages, setPackages] = useState([])
  const [status, setStatus]     = useState(undefined) // undefined = loading, null = none, object = active
  const [tier, setTier]         = useState(null)
  const [currency, setCurrency] = useState('COIN')
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    Promise.all([
      BuyerApi.turbo.getPackages(),
      BuyerApi.turbo.getStatus(product.id),
    ]).then(([pkgRes, statusRes]) => {
      const pkgs = pkgRes.data?.data ?? []
      setPackages(pkgs)
      setStatus(statusRes.data ?? null)
      if (pkgs.length) setTier(pkgs[0].tier_hours)
    }).catch(() => { setPackages([]); setStatus(null) })
  }, [product.id])

  async function handlePurchase() {
    if (!tier) return
    setError(''); setPurchasing(true)
    try {
      await BuyerApi.turbo.purchase(product.id, { tier_hours: tier, currency })
      toast.success(t('seller.turboBoosted', 'Turbo boost activated'))
      onBoosted()
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally { setPurchasing(false) }
  }

  const selectedPkg = packages.find((p) => p.tier_hours === tier)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08]">
          <h2 className="text-base font-semibold dark:text-white text-slate-900 flex items-center gap-2">
            <Zap size={16} className="text-indigo-500" />
            {t('seller.turboFor', 'Turbo boost')} — {product.name}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {status === undefined ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin opacity-40" size={20} /></div>
          ) : status ? (
            <div className="rounded-lg border dark:border-indigo-500/20 border-indigo-200 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-2.5 text-sm">
              <p className="font-medium text-indigo-700 dark:text-indigo-300">{t('seller.turboActiveTitle', 'Turbo is already active')}</p>
              <p className="text-xs opacity-70 mt-1">
                {t('seller.turboTier', 'Tier')}: Turbo {status.tier_hours} · {t('seller.turboExpires', 'Expires')}: {fmtDate(status.expires_at)}
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium mb-1.5 dark:text-slate-300 text-slate-600">{t('turbo.tierHours', 'Refresh interval (hours)')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {packages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setTier(p.tier_hours)}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-xs text-center transition-colors',
                        tier === p.tier_hours
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-400'
                          : 'dark:border-white/10 border-slate-200 hover:border-indigo-300'
                      )}
                    >
                      <div className="font-semibold dark:text-white">Turbo {p.tier_hours}</div>
                      <div className="opacity-60 mt-0.5">{p.duration_days}d</div>
                    </button>
                  ))}
                </div>
                {packages.length === 0 && <p className="text-xs opacity-50">{t('turbo.noPackages', 'No Turbo packages')}</p>}
              </div>

              {selectedPkg && (
                <div>
                  <label className="block text-xs font-medium mb-1.5 dark:text-slate-300 text-slate-600">{t('seller.payWith', 'Pay with')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCurrency('COIN')}
                      className={cn('rounded-lg border px-3 py-2 text-sm flex flex-col items-center', currency === 'COIN'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-400'
                        : 'dark:border-white/10 border-slate-200')}
                    >
                      <span className="font-semibold dark:text-white">{Number(selectedPkg.price_coin).toLocaleString()}</span>
                      <span className="opacity-60 text-xs">{t('seller.coinBalance', 'Coin')}</span>
                    </button>
                    <button
                      onClick={() => setCurrency('TMT')}
                      className={cn('rounded-lg border px-3 py-2 text-sm flex flex-col items-center', currency === 'TMT'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-400'
                        : 'dark:border-white/10 border-slate-200')}
                    >
                      <span className="font-semibold dark:text-white">{Number(selectedPkg.price_tmt).toLocaleString()} TMT</span>
                      <span className="opacity-60 text-xs">{t('seller.shopWallet', 'Shop wallet')}</span>
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t dark:border-white/[0.08] border-black/[0.08]">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg dark:hover:bg-white/5 hover:bg-black/5">{t('common.cancel')}</button>
          {!status && (
            <button onClick={handlePurchase} disabled={purchasing || !tier || packages.length === 0}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-2">
              {purchasing && <Loader2 size={14} className="animate-spin" />}{t('seller.boostNow', 'Boost now')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SellerProductsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [products, setProducts]   = useState([])
  const [count, setCount]         = useState(0)
  const [categories, setCategories] = useState([])
  const [text, setText]           = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatus] = useState('')
  const [colorFilter, setColorFilter] = useState([])
  const [colors, setColors]       = useState([])
  const [page, setPage]           = useState(0)
  const [loading, setLoading]     = useState(true)
  const [deleting, setDeleting]   = useState(null)
  const [toggling, setToggling]   = useState(null)
  const [turboProduct, setTurboProduct] = useState(null)

  useEffect(() => {
    SellerApi.categories.getAll({ limit: 0, tree: 1 }).then(({ data }) => setCategories(data.data ?? [])).catch(() => {})
    SellerApi.colors.getAll().then(({ data }) => setColors(data.data ?? [])).catch(() => {})
  }, [])

  const load = useCallback((p = 0) => {
    setLoading(true)
    const params = {
      limit: PAGE,
      page: p + 1,
      text: text.trim() || undefined,
      category_id: catFilter || undefined,
      is_active: statusFilter !== '' ? statusFilter : undefined,
      color_hex: colorFilter.length ? colorFilter.join(',') : undefined,
    }
    SellerApi.products.getAll(params)
      .then(({ data }) => { setProducts(data.data ?? []); setCount(data.count ?? 0) })
      .finally(() => setLoading(false))
  }, [text, catFilter, statusFilter, colorFilter])

  useEffect(() => { setPage(0); load(0) }, [catFilter, statusFilter, colorFilter])
  useEffect(() => { load(page) }, [page])

  function search() { setPage(0); load(0) }

  async function handleDelete(id) {
    if (!confirm(t('seller.confirmDeleteProduct'))) return
    setDeleting(id)
    try {
      await SellerApi.products.delete(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setCount((c) => c - 1)
      toast.success(t('seller.productDeleted'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setDeleting(null) }
  }

  async function handleToggle(product) {
    setToggling(product.id)
    try {
      const { data } = await SellerApi.products.update(product.id, { is_active: !product.is_active })
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: data.model?.is_active ?? !product.is_active } : p))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setToggling(null) }
  }

  const totalPages = Math.ceil(count / PAGE)

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold dark:text-white">
          {t('nav.products')} <span className="text-slate-400 font-normal text-base">({count})</span>
        </h1>
        <Button size="sm" onClick={() => navigate('/seller/products/new')}>
          <Plus className="h-4 w-4 mr-1.5" />{t('products.addProduct')}
        </Button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5 flex-1 min-w-0 max-w-sm">
          <Input
            placeholder={t('common.search')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            className="h-8 text-sm"
          />
          <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={search}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 w-56">
          <div className="flex-1 min-w-0">
            <CategoryTreeSelect
              categories={categories}
              value={catFilter || null}
              onChange={(id) => setCatFilter(id ? String(id) : '')}
              placeholder={t('seller.allCategories')}
            />
          </div>
          {catFilter && (
            <button
              type="button"
              onClick={() => setCatFilter('')}
              title={t('seller.allCategories')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className="h-8 border rounded-md px-2.5 text-sm bg-white dark:bg-[#111114] dark:border-white/10 dark:text-white"
        >
          <option value="">{t('seller.allStatuses')}</option>
          <option value="true">{t('seller.statusActive')}</option>
          <option value="false">{t('seller.statusHidden')}</option>
        </select>

        <ColorFilter colors={colors} value={colorFilter} onChange={setColorFilter} />

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
          <p className="text-sm">{t('seller.noProducts')}</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/seller/products/new')}>
            <Plus className="h-4 w-4 mr-1.5" />{t('seller.addFirstProduct')}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden bg-white dark:bg-[#111114]">
          {/* Table header */}
          <div className="grid grid-cols-[2.5rem_1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
            <div />
            <div>{t('products.colProduct')}</div>
            <div className="text-right">{t('products.colPrice')}</div>
            <div className="text-center">{t('products.colStock')}</div>
            <div>{t('products.colStatus')}</div>
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
                    <div className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                      <span className="truncate">
                        {p.category?.name}
                        {p.variants?.length > 0 && ` · ${t('seller.variantsCount', { count: p.variants.length })}`}
                      </span>
                      <ColorSwatches product={p} />
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
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <StatusDot active={p.is_active} t={t} />
                    <ModerationDot status={p.moderation_status ?? 0} note={p.moderation_note} t={t} />
                    {p.turbo_active && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                        <Zap className="h-3 w-3" />{t('seller.turboActive', 'Turbo')}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setTurboProduct(p)}
                      title={t('seller.turboFor', 'Turbo boost')}
                      className={cn(
                        'p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors',
                        p.turbo_active ? 'text-indigo-500' : 'text-slate-400'
                      )}
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggle(p)}
                      disabled={toggling === p.id}
                      title={p.is_active ? t('seller.hideProduct') : t('seller.activateProduct')}
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

      {turboProduct && (
        <TurboModal
          product={turboProduct}
          onClose={() => setTurboProduct(null)}
          onBoosted={() => { setTurboProduct(null); load(page) }}
        />
      )}
    </div>
  )
}
