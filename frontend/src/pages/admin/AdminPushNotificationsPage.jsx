import { useEffect, useState, useCallback } from 'react'
import { AdminApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, CheckCircle, XCircle, Clock, Bell, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const PAGE_SIZE = 20

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

const TARGET_TYPES = ['all', 'ordered', 'active_days', 'specific']

function UserPicker({ selected, onChange, t }) {
  const [search, setSearch]   = useState('')
  const [results, setResults] = useState([])

  const fetchUsers = useCallback(async (text) => {
    if (!text.trim()) { setResults([]); return }
    try {
      const { data } = await AdminApi.users.getAll({ text, limit: 8 })
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
        placeholder={t('users.searchPlaceholder')}
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

function SendForm({ onSent, t }) {
  const [title, setTitle]         = useState('')
  const [body, setBody]           = useState('')
  const [imageUrl, setImageUrl]   = useState('')
  const [targetType, setTargetType] = useState('all')
  const [activeDays, setActiveDays] = useState('7')
  const [pickedUsers, setPickedUsers] = useState([])
  const [loading, setLoading]     = useState(false)

  function buildTarget() {
    if (targetType === 'active_days') return { type: 'active_days', days: Number(activeDays) || 7 }
    if (targetType === 'specific')    return { type: 'specific', user_ids: pickedUsers.map(u => u.id) }
    return { type: targetType }
  }

  const isValid = title.trim() && body.trim()
    && (targetType !== 'specific' || pickedUsers.length > 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    try {
      await AdminApi.pushNotifications.send({
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
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          {t('adminPn.sendTitle')}
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('adminPn.sendSubtitle')}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">
              {t('seller.pnTitle')} <span className="text-red-500">*</span>
            </label>
            <input type="text" maxLength={200} value={title}
              onChange={e => setTitle(e.target.value)} disabled={loading}
              className={inputCls} placeholder={t('seller.pnTitlePlaceholder')} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">
              {t('seller.pnBody')} <span className="text-red-500">*</span>
            </label>
            <textarea rows={3} maxLength={1000} value={body}
              onChange={e => setBody(e.target.value)} disabled={loading}
              className={`${inputCls} resize-none`} placeholder={t('seller.pnBodyPlaceholder')} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">
              {t('seller.pnImageUrl')}
              <span className="ml-1 text-xs text-slate-400">({t('common.optional')})</span>
            </label>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              disabled={loading} className={inputCls} placeholder="https://..." />
          </div>

          {/* Targeting */}
          <div className="rounded-lg border dark:border-slate-700 p-4 space-y-3">
            <p className="text-sm font-medium dark:text-slate-300">{t('adminPn.audience')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TARGET_TYPES.map(type => (
                <button key={type} type="button"
                  onClick={() => setTargetType(type)}
                  className={cn(
                    'text-xs px-3 py-2 rounded-md border font-medium transition-colors',
                    targetType === type
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                  )}
                >
                  {t(`adminPn.target_${type}`)}
                </button>
              ))}
            </div>

            {targetType === 'active_days' && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('adminPn.lastLoginWithin')}</span>
                <input type="number" min={1} max={365} value={activeDays}
                  onChange={e => setActiveDays(e.target.value)}
                  className="w-20 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
                <span className="text-slate-500 dark:text-slate-400">{t('adminPn.days')}</span>
              </div>
            )}

            {targetType === 'specific' && (
              <UserPicker selected={pickedUsers} onChange={setPickedUsers} t={t} />
            )}
          </div>

          <button type="submit" disabled={loading || !isValid}
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

function CampaignTable({ campaigns, total, page, setPage, t }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('adminPn.historyTitle')}</CardTitle>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('adminPn.historyTitle')}</CardTitle>
          <span className="text-xs text-slate-400">{total} {t('adminPn.totalCampaigns')}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-white/[0.06] text-left">
                <th className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{t('seller.pnDate')}</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{t('adminPn.shop')}</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{t('seller.pnTitle')}</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{t('adminPn.sentBy')}</th>
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
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {c.shop ? c.shop.name : <span className="text-xs italic text-slate-400">{t('adminPn.platformWide')}</span>}
                  </td>
                  <td className="px-4 py-3 dark:text-white max-w-[180px] truncate" title={c.title}>{c.title}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {c.sender ? `${c.sender.name} ${c.sender.surname}` : '—'}
                  </td>
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

export default function AdminPushNotificationsPage() {
  const { t } = useTranslation()
  const [campaigns, setCampaigns] = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(0)

  async function load() {
    try {
      const { data: res } = await AdminApi.pushNotifications.getAll({
        limit:  PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      setCampaigns(res.data)
      setTotal(res.total)
    } catch {
      // silent — table will just stay empty
    }
  }

  useEffect(() => { load() }, [page])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold dark:text-white">{t('adminPn.pageTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('adminPn.pageSubtitle')}</p>
      </div>

      <SendForm onSent={() => { setPage(0); load() }} t={t} />

      <CampaignTable
        campaigns={campaigns}
        total={total}
        page={page}
        setPage={setPage}
        t={t}
      />
    </div>
  )
}
