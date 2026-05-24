import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollText, Search, RefreshCw } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const PAGE_SIZE = 50

const ENTITY_TYPES = [
  'User', 'Role', 'Position', 'Shop', 'ShopType', 'ShopApplication', 'ShopTypeRequest',
  'Product', 'ProductVariant', 'Category', 'Collection', 'CollectionProduct',
  'Order', 'Shipment', 'Discount', 'FlashSale',
  'Banner', 'BannerType', 'Deliver', 'Review', 'Dispute',
  'Plan', 'ShopSubscription', 'PayoutRequest', 'SellerBalance',
  'AiRecommendation', 'PushNotification', 'ShopMember', 'Media',
  'Country', 'Region', 'District', 'Village', 'City', 'Config',
]

const ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'FORCE_DELETE', 'RESTORE',
  'VERIFY', 'REJECT', 'APPROVE', 'SUBMIT', 'REOPEN', 'UNLOCK',
  'UPDATE_STATUS', 'STATUS', 'SEND', 'UPLOAD',
]

const ACTION_CLASS = {
  CREATE:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE:        'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  DELETE:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  FORCE_DELETE:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  RESTORE:       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  UNLOCK:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REOPEN:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  VERIFY:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  APPROVE:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECT:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SUBMIT:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SEND:          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  UPLOAD:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  UPDATE_STATUS: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  STATUS:        'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('ru', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function ActorCell({ actor }) {
  if (!actor) return <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
  return (
    <div>
      <p className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
        {actor.name} {actor.surname}
      </p>
      {actor.phone_number && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          +993 {actor.phone_number}
        </p>
      )}
    </div>
  )
}

function ActionBadge({ action }) {
  const cls = ACTION_CLASS[action] ?? 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {action}
    </span>
  )
}

export default function AdminAuditPage() {
  const { t } = useTranslation()

  const [rows,    setRows]    = useState([])
  const [count,   setCount]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)

  const [search,     setSearch]     = useState('')
  const [entityType, setEntityType] = useState('')
  const [action,     setAction]     = useState('')
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')

  const debounceRef = useRef(null)
  const totalPages  = Math.max(1, Math.ceil(count / PAGE_SIZE))

  const fetchPage = useCallback(async (pg) => {
    setLoading(true)
    try {
      const params = {
        limit: PAGE_SIZE,
        skip:  (pg - 1) * PAGE_SIZE,
        ...(search     && { search }),
        ...(entityType && { entity_type: entityType }),
        ...(action     && { action }),
        ...(dateFrom   && { date_from: dateFrom }),
        ...(dateTo     && { date_to: dateTo }),
      }
      const { data } = await AdminApi.auditLogs.getAll(params)
      setRows(data.data  ?? [])
      setCount(data.count ?? 0)
    } catch {
      setRows([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [search, entityType, action, dateFrom, dateTo])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchPage(1)
    }, search ? 350 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [fetchPage])

  function handlePage(p) {
    setPage(p)
    fetchPage(p)
  }

  const selectCls = [
    'h-9 rounded-md border border-input bg-background px-3 py-1 text-sm',
    'focus:outline-none focus:ring-1 focus:ring-ring',
    'dark:bg-[#1a1a1f] dark:border-white/[0.08] dark:text-white',
  ].join(' ')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-slate-500" />
          <h1 className="text-xl font-semibold dark:text-white">
            {t('auditLogs.title')}
          </h1>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-1">
            {count} {t('common.total', 'total')}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchPage(page)} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                className="pl-8 h-9"
                placeholder={t('auditLogs.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className={`${selectCls} w-[170px]`}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="">{t('auditLogs.allEntities')}</option>
              {ENTITY_TYPES.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>

            <select
              className={`${selectCls} w-[150px]`}
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="">{t('auditLogs.allActions')}</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            <Input
              type="date"
              className="h-9 w-[145px]"
              title={t('auditLogs.dateFrom')}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              type="date"
              className="h-9 w-[145px]"
              title={t('auditLogs.dateTo')}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-white/[0.08] border-black/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {t('auditLogs.colDateTime')}
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('auditLogs.colEntity')}
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('auditLogs.colAction')}
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('auditLogs.colActor')}
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('auditLogs.colIp')}
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('auditLogs.colDescription')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      {t('common.loading')}
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      {t('common.noData', 'No data')}
                    </td>
                  </tr>
                )}
                {!loading && rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 dark:border-white/[0.05] border-black/[0.04] hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                      {fmtDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800 dark:text-white text-sm">
                        {row.entity_type}
                      </span>
                      {row.entity_id && (
                        <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">
                          #{row.entity_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={row.action} />
                    </td>
                    <td className="px-4 py-3">
                      <ActorCell actor={row.actor} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
                      {row.ip_address || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {row.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t dark:border-white/[0.08] border-black/[0.06]">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t('common.page', { current: page, total: totalPages })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => handlePage(page - 1)}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => handlePage(page + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
