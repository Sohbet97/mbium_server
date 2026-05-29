import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart, Loader2 } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

const PAGE = 20

export default function AdminFavoritesPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.favorites.getAll({ limit: PAGE, skip: page * PAGE })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [page, t])

  useEffect(() => { load() }, [load])

  const pages = Math.ceil(count / PAGE)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-600/10 flex items-center justify-center">
          <Heart size={18} className="text-rose-500" />
        </div>
        <h1 className="text-xl font-semibold dark:text-white">{t('favorites.title')}</h1>
      </div>

      <p className="text-sm opacity-50">{t('favorites.totalCount', { count })}</p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-16">{t('favorites.noFavorites')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">User</th>
                <th className="text-left px-4 py-2">{t('favorites.colProduct')}</th>
                <th className="text-right px-4 py-2">{t('favorites.colPrice')}</th>
                <th className="text-right px-4 py-2">{t('favorites.colRating')}</th>
                <th className="text-right px-4 py-2">{t('favorites.colAddedAt')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((fav) => (
                <tr key={fav.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium dark:text-white">{fav.user?.name} {fav.user?.surname}</p>
                    <p className="text-xs opacity-50">{fav.user?.phone_number}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {fav.product?.productMedia?.[0]?.media?.thumbnail_url && (
                        <img
                          src={fav.product.productMedia[0].media.thumbnail_url}
                          alt=""
                          className="w-8 h-8 rounded object-cover shrink-0"
                        />
                      )}
                      <p className="font-medium dark:text-white line-clamp-1">{fav.product?.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {parseFloat(fav.product?.price ?? 0).toFixed(2)} {fav.product?.currency ?? 'TMT'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs opacity-70">
                    {parseFloat(fav.product?.rating ?? 0).toFixed(1)} ★
                  </td>
                  <td className="px-4 py-3 text-right text-xs opacity-50">
                    {new Date(fav.createdAt).toLocaleDateString()}
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
