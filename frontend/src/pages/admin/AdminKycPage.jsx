import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FileCheck, Check, X, Loader2, ExternalLink } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

const PAGE = 20

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  rejected: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
}

export default function AdminKycPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [rows, setRows]         = useState([])
  const [count, setCount]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(0)
  const [statusFilter, setStatusFilter] = useState('pending')

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.kyc.getAll({ status: statusFilter || undefined, limit: PAGE, skip: page * PAGE })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [page, statusFilter, t])

  useEffect(() => { load() }, [load])

  async function handleStatus(doc, status) {
    try {
      await AdminApi.kyc.setStatus(doc.shop_id, doc.id, status)
      toast.success(t('toast.updated'))
      load()
    } catch { toast.error(t('toast.error')) }
  }

  const pages = Math.ceil(count / PAGE)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600/10 flex items-center justify-center">
            <FileCheck size={18} className="text-teal-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold dark:text-white">{t('kyc.title')}</h1>
            <p className="text-xs opacity-50">{t('kyc.totalCount', { count })}</p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {['', 'pending', 'approved', 'rejected'].map((s) => (
            <button key={s} onClick={() => { setPage(0); setStatusFilter(s) }}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5'
              }`}>
              {s ? t(`kyc.status.${s}`) : t('common.all')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-16">{t('kyc.empty')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('kyc.shop')}</th>
                <th className="text-left px-4 py-2">{t('kyc.docType')}</th>
                <th className="text-left px-4 py-2">{t('common.status')}</th>
                <th className="text-left px-4 py-2">{t('common.createdAt')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((doc) => (
                <tr key={doc.id}
                  className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/admin/shops/${doc.shop_id}`)}
                      className="font-medium dark:text-white hover:text-indigo-500 text-left">
                      {doc.shop?.name ?? `#${doc.shop_id}`}
                    </button>
                  </td>
                  <td className="px-4 py-3 opacity-70">{t(`kyc.types.${doc.type}`, doc.type)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status] ?? ''}`}>
                      {t(`kyc.status.${doc.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 opacity-60 text-xs">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <a href={doc.file_url} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100 text-indigo-400">
                        <ExternalLink size={13} />
                      </a>
                      {doc.status !== 'approved' && (
                        <button onClick={() => handleStatus(doc, 'approved')}
                          className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 opacity-60 hover:opacity-100">
                          <Check size={13} />
                        </button>
                      )}
                      {doc.status !== 'rejected' && (
                        <button onClick={() => handleStatus(doc, 'rejected')}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 opacity-60 hover:opacity-100">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
