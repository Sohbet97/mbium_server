import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw, MoreHorizontal, Package } from 'lucide-react'
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
  const [shopFilter, setShopFilter] = useState(searchParams.get('shop_id') ?? '')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const limit = 20

  function fetchProducts() { setRefreshKey((k) => k + 1) }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = { page, limit }
        if (search) params.search = search
        if (shopFilter) params.shop_id = shopFilter
        if (categoryFilter) params.category_id = categoryFilter
        const { data } = await AdminApi.products.getAll(params)
        if (!cancelled) {
          setProducts(data?.data ?? data.data?.products ?? [])
          setTotal(data?.count ?? data.data?.total ?? 0)
        }
      } catch { if (!cancelled) setProducts([]) }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [page, search, shopFilter, categoryFilter, refreshKey])

  useEffect(() => {
    Promise.all([
      AdminApi.shops.getAll({ limit: 500 }),
      AdminApi.categories.getAll({ limit: 500 }),
    ]).then(([shopsRes, catsRes]) => {
      setShops(shopsRes.data?.data?.rows ?? shopsRes.data?.data?.shops ?? [])
      setCategories(catsRes.data?.data?.rows ?? catsRes.data?.data?.categories ?? [])
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
        <Button variant="ghost" size="icon" onClick={fetchProducts} className="h-9 w-9" title={t('common.refresh')}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-black dark:text-white text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">{t('products.colProduct')}</th>
                  <th className="px-4 py-3">{t('products.colShop')}</th>
                  <th className="px-4 py-3">{t('products.colCategory')}</th>
                  <th className="px-4 py-3">{t('products.colPrice')}</th>
                  <th className="px-4 py-3">{t('products.colStock')}</th>
                  <th className="px-4 py-3">{t('products.colStatus')}</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading && products.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">{t('common.loading')}</td></tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Package className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{t('common.noResults')}</p>
                    </td>
                  </tr>
                ) : products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/catalog/products/${p.id}`)}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        {(() => { const pm = p.productMedia?.find((m) => m.role === 'primary') ?? p.productMedia?.[0]; const src = absUrl(pm?.media?.thumbnail_url || pm?.media?.url); return src
                          ? <img src={src} alt="" className="h-10 w-10 rounded object-cover border" />
                          : <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center"><Package className="h-4 w-4 text-slate-300" /></div>
                        })()}
                        <div>
                          <p className="text-sm font-medium text-slate-900 max-w-[200px] truncate">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.sku || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.shop?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.price} {p.currency}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.stock}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.is_active ? 'success' : 'secondary'}>
                        {p.is_active ? t('common.active') : t('common.inactive')}
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
