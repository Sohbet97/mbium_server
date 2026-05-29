import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Check, X, Trash2, Loader2, ChevronDown } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

const PAGE = 20

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  rejected: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
}

export default function AdminCommentsPage() {
  const { t } = useTranslation()
  const [rows, setRows]         = useState([])
  const [count, setCount]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(0)
  const [statusFilter, setStatusFilter] = useState('pending')

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.comments.getAll({ status: statusFilter || undefined, limit: PAGE, skip: page * PAGE })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [page, statusFilter, t])

  useEffect(() => { load() }, [load])

  async function handleStatus(id, status) {
    try {
      await AdminApi.comments.setStatus(id, status)
      toast.success(t('toast.updated'))
      load()
    } catch { toast.error(t('toast.error')) }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.comments.delete(id)
      toast.success(t('toast.deleted'))
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const pages = Math.ceil(count / PAGE)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/10 flex items-center justify-center">
            <MessageSquare size={18} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold dark:text-white">{t('comments.title')}</h1>
            <p className="text-xs opacity-50">{t('comments.totalCount', { count })}</p>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5">
          {['', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => { setPage(0); setStatusFilter(s) }}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5'
              }`}
            >
              {s ? t(`comments.status.${s}`) : t('common.all')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-16">{t('comments.empty')}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <div key={c.id}
              className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Author + product */}
                  <div className="flex items-center gap-2 flex-wrap text-xs opacity-60 mb-1">
                    <span className="font-medium dark:text-white text-black opacity-100">
                      {c.author?.name} {c.author?.surname}
                    </span>
                    <span>·</span>
                    <span>{c.product?.name}</span>
                    {c.parent_id && (
                      <>
                        <span>·</span>
                        <span className="text-indigo-400">{t('comments.reply')}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm dark:text-slate-200 text-slate-800 whitespace-pre-wrap">{c.body}</p>
                </div>

                {/* Status badge + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? ''}`}>
                    {t(`comments.status.${c.status}`)}
                  </span>
                  {c.status !== 'approved' && (
                    <button onClick={() => handleStatus(c.id, 'approved')}
                      className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 opacity-70 hover:opacity-100"
                      title={t('comments.approve')}>
                      <Check size={14} />
                    </button>
                  )}
                  {c.status !== 'rejected' && (
                    <button onClick={() => handleStatus(c.id, 'rejected')}
                      className="p-1.5 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 opacity-70 hover:opacity-100"
                      title={t('comments.reject')}>
                      <X size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 opacity-70 hover:opacity-100"
                    title={t('common.delete')}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-8 h-8 rounded text-sm ${i === page ? 'bg-indigo-600 text-white' : 'dark:hover:bg-white/10 hover:bg-black/5'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
