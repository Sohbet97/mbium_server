import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Star, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { AdminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const REVIEW_STATUSES = [
  { value: 0, labelKey: 'reviews.statusPending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 1, labelKey: 'reviews.statusApproved', color: 'bg-green-100 text-green-800' },
  { value: 2, labelKey: 'reviews.statusRejected', color: 'bg-red-100 text-red-800' },
]

function StatusBadge({ status }) {
  const { t } = useTranslation()
  const meta = REVIEW_STATUSES.find((s) => s.value === status) ?? REVIEW_STATUSES[0]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', meta.color)}>
      {t(meta.labelKey)}
    </span>
  )
}

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn('h-3.5 w-3.5', i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200')}
        />
      ))}
    </span>
  )
}

export default function ReviewsPage() {
  const { t } = useTranslation()
  const [reviews, setReviews] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const [filterStatus, setFilterStatus] = useState('')
  const [filterRating, setFilterRating] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }
      if (filterStatus !== '') params.status = filterStatus
      if (filterRating !== '') params.rating = filterRating
      const { data } = await AdminApi.reviews.getAll(params)
      setReviews(data.data ?? [])
      setCount(data.count ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, filterRating])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  async function updateStatus(id, status) {
    try {
      await AdminApi.reviews.updateStatus(id, status)
      toast.success(t('toast.updated'))
      fetchReviews()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  async function deleteReview(id) {
    if (!confirm(t('reviews.confirmDelete'))) return
    try {
      await AdminApi.reviews.delete(id)
      toast.success(t('toast.deleted'))
      fetchReviews()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  const totalPages = Math.ceil(count / PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }} className="w-44">
          <option value="">{t('reviews.filterStatus')}</option>
          {REVIEW_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
          ))}
        </Select>
        <Select value={filterRating} onChange={(e) => { setFilterRating(e.target.value); setPage(1) }} className="w-36">
          <option value="">{t('reviews.filterRating')}</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} ★</option>
          ))}
        </Select>
        <Button variant="outline" size="sm" onClick={fetchReviews} className="ml-auto">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-sm text-slate-500 mb-3">{t('reviews.totalCount', { count })}</p>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b sticky top-0 z-10 dark:bg-black dark:text-white">
              <tr>
                <th className="text-left px-4 py-3 font-medium w-1/3">{t('reviews.colReview')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('reviews.colProduct')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('reviews.colRating')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('reviews.colStatus')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('reviews.colDate')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t('common.loading')}</td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t('common.noResults')}</td></tr>
              ) : reviews.map((review) => (
                <tr key={review.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.08] cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs text-slate-500 dark:text-white">
                      {review.author?.name} {review.author?.surname}
                    </p>
                    {review.comment && (
                      <p className="text-slate-700 dark:text-white/[0.5] mt-0.5 line-clamp-2">{review.comment}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-white/[0.5]">{review.product?.name ?? `#${review.product_id}`}</td>
                  <td className="px-4 py-3"><StarRating rating={review.rating} /></td>
                  <td className="px-4 py-3"><StatusBadge status={review.status} /></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(review.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {review.status !== 1 && (
                        <button
                          onClick={() => updateStatus(review.id, 1)}
                          title={t('reviews.approve')}
                          className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {review.status !== 2 && (
                        <button
                          onClick={() => updateStatus(review.id, 2)}
                          title={t('reviews.reject')}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteReview(review.id)}
                        title={t('common.delete')}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            {t('common.previous')}
          </Button>
          <span className="text-sm text-slate-500">
            {t('common.page', { current: page, total: totalPages })}
          </span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
