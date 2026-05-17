import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw, MoreHorizontal, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

export default function CollectionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [collections, setCollections] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const limit = 20

  function refresh() { setRefreshKey((k) => k + 1) }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = { page, limit }
        if (search) params.search = search
        const { data } = await AdminApi.collections.getAll(params)
        if (!cancelled) {
          setCollections(data?.data ?? [])
          setTotal(data?.count ?? 0)
        }
      } catch { if (!cancelled) setCollections([]) }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [page, search, refreshKey])

  async function handleDelete(col) {
    if (!window.confirm(t('collections.confirmDelete', { name: col.name }))) return
    try {
      await AdminApi.collections.delete(col.id)
      toast.success(t('toast.deleted'))
      refresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('collections.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('collections.totalCount', { count: total })}</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => navigate('/admin/catalog/collections/new')}>
          <Plus className="h-4 w-4" /> {t('collections.addCollection')}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('collections.searchPlaceholder')}
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Button variant="ghost" size="icon" onClick={refresh} className="h-9 w-9" title={t('common.refresh')}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">{t('collections.colCollection')}</th>
                  <th className="px-4 py-3">{t('collections.colProducts')}</th>
                  <th className="px-4 py-3">{t('collections.colStatus')}</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading && collections.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">{t('common.loading')}</td></tr>
                ) : collections.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center">
                      <Layers className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{t('common.noResults')}</p>
                    </td>
                  </tr>
                ) : collections.map((col) => (
                  <tr
                    key={col.id}
                    className="border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/catalog/collections/${col.id}/edit`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        {col.image_url
                          ? <img src={col.image_url} alt="" className="h-10 w-10 rounded object-cover border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                          : <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center"><Layers className="h-4 w-4 text-slate-300" /></div>
                        }
                        <div>
                          <p className="text-sm font-medium text-slate-900 max-w-[280px] truncate">{col.name}</p>
                          {col.handle && <p className="text-xs text-slate-400 font-mono">{col.handle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{col.product_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <Badge variant={col.is_active ? 'success' : 'secondary'}>
                        {col.is_active ? t('common.active') : t('common.inactive')}
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
                          <DropdownMenuItem onClick={() => navigate(`/admin/catalog/collections/${col.id}/edit`)}>
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(col)}>
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
