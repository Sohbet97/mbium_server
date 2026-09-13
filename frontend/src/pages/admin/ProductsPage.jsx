import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw, MoreHorizontal, Package, X, Check, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminApi } from '@/lib/api'
import { ColorSwatches } from '@/components/common/ColorSwatches'
import { ColorFilter } from '@/components/common/ColorSelect'
import { BlueBadge } from '@/components/common/BlueBadge'
import { absUrl } from '@/lib/utils'
import { toast } from 'sonner'

export default function ProductsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [shopFilter, setShopFilter] = useState(searchParams.get('shop_id') ?? '')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [moderationFilter, setModerationFilter] = useState('')
  const [colorFilter, setColorFilter] = useState([])
  const [colors, setColors] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const limit = 20

  function fetchProducts() { setRefreshKey((k) => k + 1) }

  function toggleSelectAll() {
    setSelectedIds((prev) => prev.length === products.length ? [] : products.map((p) => p.id))
  }

  function toggleSelectOne(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleBulkUpdate(data) {
    if (!selectedIds.length) return
    setBulkLoading(true)
    try {
      await AdminApi.products.bulkUpdate({ ids: selectedIds, ...data })
      toast.success(t('products.bulkUpdateSuccess', { count: selectedIds.length }))
      setSelectedIds([])
      fetchProducts()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally {
      setBulkLoading(false)
    }
  }

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = { page, limit }
        if (debouncedSearch.trim()) params.text = debouncedSearch.trim()
        if (shopFilter) params.shop_id = shopFilter
        if (categoryFilter) params.category_id = categoryFilter
        if (moderationFilter !== '') params.moderation_status = moderationFilter
        if (colorFilter.length) params.color_hex = colorFilter.join(',')
        const { data } = await AdminApi.products.getAll(params)
        if (!cancelled) {
          setProducts(data?.data ?? data.data?.products ?? [])
          setTotal(data?.count ?? data.data?.total ?? 0)
          setSelectedIds([])
        }
      } catch { if (!cancelled) setProducts([]) }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [page, debouncedSearch, shopFilter, categoryFilter, moderationFilter, colorFilter, refreshKey])

  useEffect(() => {
    Promise.all([
      AdminApi.shops.getAll({ limit: 500 }),
      AdminApi.categories.getAll({ limit: 0 }),
      AdminApi.colors.getAll({ limit: 500, is_active: true }),
    ]).then(([shopsRes, catsRes, colorsRes]) => {
      setShops(shopsRes.data?.data ?? [])
      setCategories(catsRes.data?.data ?? [])
      setColors(colorsRes.data?.data ?? [])
    }).catch(() => {})
  }, [])

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return
    try {
      await AdminApi.products.delete(product.id)
      toast.success(t('toast.deleted'))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
    fetchProducts()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('products.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('products.totalCount', { count: total })}</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => navigate('/admin/catalog/products/new')}>
          <Plus className="h-4 w-4" /> {t('products.addProduct')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('products.searchPlaceholder')}
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={shopFilter} onChange={(e) => { setShopFilter(e.target.value); setPage(1) }} className="w-44">
          <option value="">{t('products.filterShop')}</option>
          {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="w-44">
          <option value="">{t('products.filterCategory')}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={moderationFilter} onChange={(e) => { setModerationFilter(e.target.value); setPage(1) }} className="w-44">
          <option value="">{t('products.filterModeration')}</option>
          <option value="0">{t('products.modStatusPending')}</option>
          <option value="1">{t('products.modStatusApproved')}</option>
          <option value="2">{t('products.modStatusRejected')}</option>
        </Select>
        <ColorFilter
          colors={colors}
          value={colorFilter}
          onChange={(next) => { setColorFilter(next); setPage(1) }}
        />
        <Button variant="ghost" size="icon" onClick={fetchProducts} className="h-9 w-9" title={t('common.refresh')}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap rounded-md border bg-slate-50 dark:bg-black px-4 py-2.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 mr-2">
            {t('products.bulkSelected', { count: selectedIds.length })}
          </span>

          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('products.colStatus')}:</span>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => handleBulkUpdate({ is_active: true })}>
            {t('products.bulkSetActive')}
          </Button>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => handleBulkUpdate({ is_active: false })}>
            {t('products.bulkSetInactive')}
          </Button>

          <span className="h-5 w-px bg-slate-200" />

          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('products.moderationStatus')}:</span>
          <Button size="sm" variant="outline" className="gap-1" disabled={bulkLoading} onClick={() => handleBulkUpdate({ moderation_status: 1 })}>
            <Check className="h-3.5 w-3.5" /> {t('products.bulkApprove')}
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-red-600" disabled={bulkLoading} onClick={() => handleBulkUpdate({ moderation_status: 2 })}>
            <Ban className="h-3.5 w-3.5" /> {t('products.bulkReject')}
          </Button>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => handleBulkUpdate({ moderation_status: 0 })}>
            {t('products.bulkSetPending')}
          </Button>

          <Button size="sm" variant="ghost" className="gap-1 ml-auto" disabled={bulkLoading} onClick={() => setSelectedIds([])}>
            <X className="h-3.5 w-3.5" /> {t('products.bulkClearSelection')}
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-black dark:text-white text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                      checked={products.length > 0 && selectedIds.length === products.length}
                      onChange={toggleSelectAll}
                      aria-label={t('products.selectAll')}
                    />
                  </th>
                  <th className="px-4 py-3">{t('products.colProduct')}</th>
                  <th className="px-4 py-3">{t('products.colShop')}</th>
                  <th className="px-4 py-3">{t('products.colCategory')}</th>
                  <th className="px-4 py-3">{t('products.colPrice')}</th>
                  <th className="px-4 py-3">{t('products.colStock')}</th>
                  <th className="px-4 py-3">{t('products.colStatus')}</th>
                  <th className="px-4 py-3">{t('products.moderationStatus')}</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading && products.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">{t('common.loading')}</td></tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <Package className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{t('common.noResults')}</p>
                    </td>
                  </tr>
                ) : products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/catalog/products/${p.id}`)}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelectOne(p.id)}
                      />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        {(() => { const pm = p.productMedia?.find((m) => m.role === 'primary') ?? p.productMedia?.[0]; const src = absUrl(pm?.media?.thumbnail_url || pm?.media?.url); return src
                          ? <img src={src} alt="" className="h-10 w-10 rounded object-cover border" />
                          : <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center"><Package className="h-4 w-4 text-slate-300" /></div>
                        })()}
                        <div>
                          <p className="text-sm font-medium text-slate-900 max-w-[200px] truncate">{p.name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span>{p.sku || '—'}</span>
                            <ColorSwatches product={p} />
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <span className="truncate">{p.shop?.name ?? '—'}</span>
                        <BlueBadge show={p.shop?.has_blue_badge} />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.price} {p.currency}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.stock}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.is_active ? 'success' : 'secondary'}>
                        {p.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        p.moderation_status === 1 ? 'success' : p.moderation_status === 2 ? 'destructive' : 'warning'
                      }>
                        {p.moderation_status === 1
                          ? t('products.modStatusApproved')
                          : p.moderation_status === 2
                            ? t('products.modStatusRejected')
                            : t('products.modStatusPending')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/admin/catalog/products/${p.id}`)}>
                            {t('products.tabInfo')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/catalog/products/${p.id}/edit`)}>
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(p)}>
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-slate-500">
              <span>{t('common.page', { current: page, total: totalPages })}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common.previous')}</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('common.next')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
