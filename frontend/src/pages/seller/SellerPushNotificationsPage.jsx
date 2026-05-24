import { useEffect, useState, useCallback } from 'react'
import { SellerApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Send, CheckCircle, XCircle, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('ru', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status, t }) {
  const map = {
    0: { label: t('seller.pnStatusPending'), icon: Clock,       cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    1: { label: t('seller.pnStatusSent'),    icon: CheckCircle, cls: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400' },
    2: { label: t('seller.pnStatusFailed'),  icon: XCircle,     cls: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400' },
  }
  const { label, icon: Icon, cls } = map[status] ?? map[0]
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

function QuotaBanner({ used, quota, t }) {
  if (quota === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-4 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
        <Bell className="h-4 w-4 shrink-0" />
        {t('seller.pnNotAvailable')}
      </div>
    )
  }
  const pct = Math.min(Math.round((used / quota) * 100), 100)
  const exhausted = used >= quota
  return (
    <div className={cn(
      'rounded-lg border p-4',
      exhausted
        ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
        : 'border-slate-200 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700'
    )}>
      <div className="flex items-center justify-between mb-2 text-sm font-medium">
        <span className="flex items-center gap-2 dark:text-white">
          <Bell className="h-4 w-4" />
          {t('seller.pnQuota')}
        </span>
        <span className={exhausted ? 'text-red-600 dark:text-red-400' : 'dark:text-slate-300'}>
          {used} / {quota}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', exhausted ? 'bg-red-500' : 'bg-blue-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {exhausted && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{t('seller.pnLimitReached')}</p>
      )}
    </div>
  )
}

const TARGET_TYPES = ['all', 'ordered', 'active_days', 'specific']

function UserPicker({ selected, onChange, t }) {
  const [search, setSearch]   = useState('')
  const [results, setResults] = useState([])

  const fetchUsers = useCallback(async (text) => {
    if (!text.trim()) { setResults([]); return }
    try {
      const { data } = await SellerApi.pushNotifications.searchCustomers(text)
      setResults(data.data ?? [])
    } catch { setResults([]) }
  }, [])

  useEffect(() => {
    const id = setTimeout(() => fetchUsers(search), 300)
    return () => clearTimeout(id)
  }, [search, fetchUsers])

  function add(u) {
    if (!selected.find(s => s.id === u.id)) onChange([...selected, u])
    setSearch(''); setResults([])
  }
  function remove(id) { onChange(selected.filter(u => u.id !== id)) }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('seller.pnSearchCustomers')}
        className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
      {results.length > 0 && (
        <div className="border rounded-md divide-y dark:border-slate-700 dark:divide-slate-700 overflow-hidden">
          {results.map(u => (
            <button key={u.id} type="button" onClick={() => add(u)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/[0.05]">
              <span className="font-medium dark:text-white">{u.name} {u.surname}</span>
              <span className="ml-2 text-xs text-slate-400">{u.phone_number ? `+993 ${u.phone_number}` : u.email}</span>
            </button>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(u => (
            <span key={u.id}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {u.name} {u.surname}
              <button type="button" onClick={() => remove(u.id)} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function SendForm({ quota, used, onSent, t }) {
  const [title, setTitle]           = useState('')
  const [body, setBody]             = useState('')
  const [imageUrl, setImageUrl]     = useState('')
  const [targetType, setTargetType] = useState('all')
  const [activeDays, setActiveDays] = useState('7')
  const [pickedUsers, setPickedUsers] = useState([])
  const [loading, setLoading]       = useState(false)

  const quotaExhausted = quota === 0 || used >= quota

  function buildTarget() {
    if (targetType === 'active_days') return { type: 'active_days', days: Number(activeDays) || 7 }
    if (targetType === 'specific')    return { type: 'specific', user_ids: pickedUsers.map(u => u.id) }
    return { type: targetType }
  }

  const isValid = !quotaExhausted && title.trim() && body.trim()
    && (targetType !== 'specific' || pickedUsers.length > 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    try {
      await SellerApi.pushNotifications.send({
        title:    title.trim(),
        body:     body.trim(),
        imageUrl: imageUrl.trim() || undefined,
        target:   buildTarget(),
      })
      toast.success(t('seller.pnSentSuccess'))
      setTitle(''); setBody(''); setImageUrl('')
      setTargetType('all'); setActiveDays('7'); setPickedUsers([])
      onSent()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t('seller.pnSentError'))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('seller.pnSendTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">
              {t('seller.pnTitle')} <span className="text-red-500">*</span>
            </label>
            <input type="text" maxLength={200} value={title}
              onChange={e => setTitle(e.target.value)} disabled={quotaExhausted || loading}
              className={inputCls} placeholder={t('seller.pnTitlePlaceholder')} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">
              {t('seller.pnBody')} <span className="text-red-500">*</span>
            </label>
            <textarea rows={3} maxLength={1000} value={body}
              onChange={e => setBody(e.target.value)} disabled={quotaExhausted || loading}
              className={`${inputCls} resize-none`} placeholder={t('seller.pnBodyPlaceholder')} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">
              {t('seller.pnImageUrl')}
              <span className="ml-1 text-xs text-slate-400">({t('common.optional')})</span>
            </label>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              disabled={quotaExhausted || loading} className={inputCls} placeholder="https://..." />
          </div>

          {/* Targeting */}
          <div className="rounded-lg border dark:border-slate-700 p-4 space-y-3">
            <p className="text-sm font-medium dark:text-slate-300">{t('seller.pnAudience')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TARGET_TYPES.map(type => (
                <button key={type} type="button"
                  disabled={quotaExhausted}
                  onClick={() => setTargetType(type)}
                  className={cn(
                    'text-xs px-3 py-2 rounded-md border font-medium transition-colors disabled:opacity-40',
                    targetType === type
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                  )}
                >
                  {t(`seller.pnTarget_${type}`)}
                </button>
              ))}
            </div>

            {targetType === 'active_days' && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('seller.pnLastLoginWithin')}</span>
                <input type="number" min={1} max={365} value={activeDays}
                  onChange={e => setActiveDays(e.target.value)}
                  className="w-20 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
                <span className="text-slate-500 dark:text-slate-400">{t('seller.pnDays')}</span>
              </div>
            )}

            {targetType === 'ordered' && (
              <p className="text-xs text-slate-400">{t('seller.pnOrderedHint')}</p>
            )}

            {targetType === 'specific' && (
              <UserPicker selected={pickedUsers} onChange={setPickedUsers} t={t} />
            )}
          </div>

          <button type="submit" disabled={!isValid || loading}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
            {loading ? t('seller.pnSending') : t('seller.pnSendBtn')}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}

function CampaignHistory({ campaigns, total, page, setPage, loading, t }) {
  const PAGE_SIZE = 20
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (!loading && campaigns.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('seller.pnHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">{t('seller.pnNoHistory')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('seller.pnHistory')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-white/[0.06] text-left">
                <th className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{t('seller.pnDate')}</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{t('seller.pnTitle')}</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{t('seller.pnStatus')}</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">{t('seller.pnRecipients')}</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">{t('seller.pnDelivered')}</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400 text-right">{t('seller.pnFailed')}</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} className="border-b last:border-0 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(c.created_at)}</td>
                  <td className="px-4 py-3 dark:text-white max-w-[200px] truncate" title={c.title}>{c.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} t={t} /></td>
                  <td className="px-4 py-3 text-right dark:text-slate-300">{c.recipient_count}</td>
                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{c.success_count}</td>
                  <td className="px-4 py-3 text-right text-red-500 dark:text-red-400">{c.fail_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-white/[0.06]">
            <span className="text-xs text-slate-400">
              {t('common.page', { current: page + 1, total: totalPages })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="text-xs px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              >
                {t('common.previous')}
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="text-xs px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function SellerPushNotificationsPage() {
  const { t } = useTranslation()

  const [campaigns, setCampaigns] = useState([])
  const [total, setTotal]         = useState(0)
  const [used, setUsed]           = useState(0)
  const [quota, setQuota]         = useState(0)
  const [page, setPage]           = useState(0)
  const [loading, setLoading]     = useState(false)

  const PAGE_SIZE = 20

  async function load() {
    setLoading(true)
    try {
      const { data: res } = await SellerApi.pushNotifications.getAll({
        limit:  PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      setCampaigns(res.data)
      setTotal(res.total)
      setUsed(res.used)
      setQuota(res.quota)
    } catch {
      // handled silently — quota/history not critical on first load failure
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold dark:text-white">{t('seller.pnPageTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('seller.pnPageSubtitle')}</p>
      </div>

      <QuotaBanner used={used} quota={quota} t={t} />

      <SendForm quota={quota} used={used} onSent={() => { setPage(0); load() }} t={t} />

      <CampaignHistory
        campaigns={campaigns}
        total={total}
        page={page}
        setPage={setPage}
        loading={loading}
        t={t}
      />
    </div>
  )
}
