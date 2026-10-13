import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Star, EyeOff, Trash2, Reply, Loader2 } from 'lucide-react'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const PAGE = 20

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const authorName = (a) => [a?.name, a?.surname].filter(Boolean).join(' ') || '—'

function Pager({ page, count, onPage }) {
  const pages = Math.ceil(count / PAGE)
  if (pages <= 1) return null
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: pages }, (_, i) => (
        <button key={i} onClick={() => onPage(i + 1)}
          className={cn('w-8 h-8 rounded text-sm', i + 1 === page ? 'bg-indigo-600 text-white' : 'dark:hover:bg-white/10 hover:bg-black/5')}>
          {i + 1}
        </button>
      ))}
    </div>
  )
}

function ReplyBox({ placeholder, submitLabel, onSubmit, onCancel }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit() {
    if (!text.trim()) return
    setBusy(true)
    try { await onSubmit(text.trim()) } finally { setBusy(false) }
  }
  return (
    <div className="space-y-2 pt-2">
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>×</Button>
        <Button size="sm" onClick={submit} disabled={busy || !text.trim()}>
          {busy && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}{submitLabel}
        </Button>
      </div>
    </div>
  )
}

function CommentsTab() {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [replyingId, setReplyingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    SellerApi.comments.getAll({ status: status || undefined, limit: PAGE, page })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [status, page, t])

  useEffect(() => { load() }, [load])

  async function act(fn, okMsg) {
    try { await fn(); toast.success(okMsg ?? t('toast.updated')); load() }
    catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button key={s} onClick={() => { setPage(1); setStatus(s) }}
            className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors',
              status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5')}>
            {s ? t(`comments.status.${s}`) : t('common.all')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-16">{t('comments.empty')}</p>
      ) : rows.map((c) => (
        <div key={c.id} className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-xs opacity-60 mb-1">
                <span className="font-medium dark:text-white text-black opacity-100">{authorName(c.author)}</span>
                <span>·</span><span>{c.product?.name}</span>
                <span>·</span><span>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.body}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[c.status])}>
                {t(`comments.status.${c.status}`)}
              </span>
              {c.status === 'approved' && (
                <button onClick={() => setReplyingId(replyingId === c.id ? null : c.id)}
                  className="p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500" title={t('comments.reply')}>
                  <Reply size={14} />
                </button>
              )}
              {c.status !== 'rejected' && (
                <button onClick={() => window.confirm(t('seller.hideCommentConfirm', 'Hide this comment?')) && act(() => SellerApi.comments.reject(c.id))}
                  className="p-1.5 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600" title={t('seller.hideComment', 'Hide')}>
                  <EyeOff size={14} />
                </button>
              )}
            </div>
          </div>

          {c.replies?.length > 0 && (
            <div className="ml-4 pl-3 border-l dark:border-white/10 border-black/10 space-y-2">
              {c.replies.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs opacity-60 mb-0.5">{authorName(r.author)} · {new Date(r.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                  </div>
                  <button onClick={() => window.confirm(t('common.confirmDelete')) && act(() => SellerApi.comments.deleteReply(r.id), t('toast.deleted'))}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 shrink-0" title={t('common.delete')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {replyingId === c.id && (
            <ReplyBox
              placeholder={t('seller.replyPlaceholder', 'Write a reply…')}
              submitLabel={t('comments.reply')}
              onCancel={() => setReplyingId(null)}
              onSubmit={async (text) => { await act(() => SellerApi.comments.reply(c.id, text)); setReplyingId(null) }}
            />
          )}
        </div>
      ))}
      <Pager page={page} count={count} onPage={setPage} />
    </div>
  )
}

function ReviewsTab() {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [replied, setReplied] = useState('')
  const [loading, setLoading] = useState(true)
  const [replyingId, setReplyingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    SellerApi.comments.getReviews({ replied: replied || undefined, limit: PAGE, page })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [replied, page, t])

  useEffect(() => { load() }, [load])

  async function act(fn, okMsg) {
    try { await fn(); toast.success(okMsg ?? t('toast.updated')); load() }
    catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
  }

  const filters = [['', t('common.all')], ['false', t('seller.unanswered', 'Unanswered')], ['true', t('seller.answered', 'Answered')]]

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {filters.map(([v, label]) => (
          <button key={v} onClick={() => { setPage(1); setReplied(v) }}
            className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors',
              replied === v ? 'bg-indigo-600 text-white border-indigo-600' : 'dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5')}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-16">{t('seller.noReviews', 'No reviews yet')}</p>
      ) : rows.map((r) => (
        <div key={r.id} className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap text-xs opacity-60">
            <span className="font-medium dark:text-white text-black opacity-100">{authorName(r.author)}</span>
            <span>·</span><span>{r.product?.name}</span>
            <span>·</span><span>{new Date(r.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-0.5 text-amber-500 opacity-100 ml-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={12} className={i < r.rating ? 'fill-current' : 'opacity-30'} />
              ))}
            </span>
          </div>
          {r.comment && <p className="text-sm whitespace-pre-wrap">{r.comment}</p>}

          {r.reply ? (
            <div className="ml-4 pl-3 border-l dark:border-white/10 border-black/10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs opacity-60 mb-0.5">{t('seller.yourReply', 'Your reply')}</p>
                <p className="text-sm whitespace-pre-wrap">{r.reply.content}</p>
              </div>
              <button onClick={() => window.confirm(t('common.confirmDelete')) && act(() => SellerApi.comments.deleteReviewReply(r.id), t('toast.deleted'))}
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 shrink-0" title={t('common.delete')}>
                <Trash2 size={13} />
              </button>
            </div>
          ) : replyingId === r.id ? (
            <ReplyBox
              placeholder={t('seller.replyPlaceholder', 'Write a reply…')}
              submitLabel={t('comments.reply')}
              onCancel={() => setReplyingId(null)}
              onSubmit={async (text) => { await act(() => SellerApi.comments.replyReview(r.id, text)); setReplyingId(null) }}
            />
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setReplyingId(r.id)}>
              <Reply size={13} />{t('comments.reply')}
            </Button>
          )}
        </div>
      ))}
      <Pager page={page} count={count} onPage={setPage} />
    </div>
  )
}

export default function SellerCommentsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('comments')
  const tabs = [
    ['comments', t('comments.title'), MessageSquare],
    ['reviews', t('reviews.title'), Star],
  ]
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-600/10 flex items-center justify-center">
          <MessageSquare size={18} className="text-purple-500" />
        </div>
        <h1 className="text-xl font-semibold dark:text-white">{t('comments.title')} / {t('reviews.title')}</h1>
      </div>

      <div className="flex gap-1 border-b dark:border-white/[0.08] border-black/[0.08]">
        {tabs.map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex items-center gap-1.5 px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors',
              tab === key ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent opacity-60 hover:opacity-100')}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === 'comments' ? <CommentsTab /> : <ReviewsTab />}
    </div>
  )
}
