import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Zap, Plus, Pencil, Trash2, Check, X, Loader2, Ban } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

function fmt(n) { return Number(n ?? 0).toLocaleString() }
function fmtDate(s) { return s ? new Date(s).toLocaleString() : '—' }

const BOOSTS_PAGE = 20

function BoostStatusBadge({ status, t }) {
  const cls = status === 'ACTIVE'
    ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
    : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{status === 'ACTIVE' ? t('turbo.statusActive', 'Active') : t('turbo.statusExpired', 'Expired')}</span>
}

function BoostsTab() {
  const { t } = useTranslation()
  const [rows, setRows]         = useState([])
  const [count, setCount]       = useState(0)
  const [page, setPage]         = useState(0)
  const [status, setStatusF]    = useState('ACTIVE')
  const [loading, setLoading]   = useState(true)
  const [cancelling, setCancelling] = useState(null)

  const load = useCallback((p = 0) => {
    setLoading(true)
    AdminApi.turbo.getBoosts({ status: status || undefined, page: p + 1, limit: BOOSTS_PAGE })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [status, t])

  useEffect(() => { setPage(0); load(0) }, [status])
  useEffect(() => { load(page) }, [page])

  async function handleCancel(id) {
    if (!window.confirm(t('turbo.confirmCancel', 'End this Turbo boost early? The seller will not be refunded.'))) return
    setCancelling(id)
    try {
      await AdminApi.turbo.cancelBoost(id)
      toast.success(t('toast.updated'))
      load(page)
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setCancelling(null) }
  }

  const totalPages = Math.ceil(count / BOOSTS_PAGE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm opacity-50">{count} {t('turbo.boostsLower', 'boosts')}</p>
        <select
          value={status}
          onChange={(e) => setStatusF(e.target.value)}
          className="h-8 border rounded-md px-2.5 text-sm bg-white dark:bg-[#111114] dark:border-white/10 dark:text-white"
        >
          <option value="">{t('turbo.allStatuses', 'All statuses')}</option>
          <option value="ACTIVE">{t('turbo.statusActive', 'Active')}</option>
          <option value="EXPIRED">{t('turbo.statusExpired', 'Expired')}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-10">{t('turbo.noBoosts', 'No Turbo boosts')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('turbo.colProduct', 'Product')}</th>
                <th className="text-left px-4 py-2">{t('turbo.colShop', 'Shop')}</th>
                <th className="text-right px-4 py-2">{t('turbo.colTier', 'Tier')}</th>
                <th className="text-right px-4 py-2">{t('turbo.colPaid', 'Paid')}</th>
                <th className="text-left px-4 py-2">{t('seller.turboExpires', 'Expires')}</th>
                <th className="text-center px-4 py-2">{t('products.colStatus')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium">{r.product?.name ?? `#${r.product_id}`}</td>
                  <td className="px-4 py-3 opacity-70">{r.shop?.name ?? `#${r.shop_id}`}</td>
                  <td className="px-4 py-3 text-right">Turbo {r.tier_hours}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {fmt(r.paid_amount)} {r.currency === 'COIN' ? '' : 'TMT'}
                  </td>
                  <td className="px-4 py-3 text-xs opacity-70">{fmtDate(r.expires_at)}</td>
                  <td className="px-4 py-3 text-center"><BoostStatusBadge status={r.status} t={t} /></td>
                  <td className="px-4 py-3">
                    {r.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={cancelling === r.id}
                        title={t('turbo.cancelBoost', 'End boost')}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-60 hover:opacity-100 text-red-500 disabled:opacity-30"
                      >
                        <Ban size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{page * BOOSTS_PAGE + 1}–{Math.min((page + 1) * BOOSTS_PAGE, count)} / {count}</span>
          <div className="flex gap-1.5">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-2.5 py-1 rounded border dark:border-white/10 disabled:opacity-30">←</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-2.5 py-1 rounded border dark:border-white/10 disabled:opacity-30">→</button>
          </div>
        </div>
      )}
    </div>
  )
}

const EMPTY = { tier_hours: '', price_tmt: '', price_coin: '', duration_days: 7, is_active: true }

function PackageModal({ pkg, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(pkg ? { ...pkg } : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.tier_hours || !form.price_tmt || !form.price_coin) {
      setError(t('turbo.fieldsRequired', 'Tier hours, TMT price and Coin price are required'))
      return
    }
    setError(''); setSaving(true)
    try {
      const payload = {
        tier_hours: parseInt(form.tier_hours),
        price_tmt: parseFloat(form.price_tmt),
        price_coin: parseInt(form.price_coin),
        duration_days: parseInt(form.duration_days) || 7,
        is_active: form.is_active,
      }
      if (pkg) {
        await AdminApi.turbo.updatePackage(pkg.id, payload)
      } else {
        await AdminApi.turbo.createPackage(payload)
      }
      toast.success(pkg ? t('toast.updated') : t('toast.created'))
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08]">
          <h2 className="text-base font-semibold dark:text-white text-slate-900">
            {pkg ? t('turbo.editPackage', 'Edit Turbo package') : t('turbo.addPackage', 'Add Turbo package')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('turbo.tierHours', 'Refresh interval (hours)')}</label>
            <input type="number" min={1} value={form.tier_hours} onChange={(e) => set('tier_hours', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('turbo.priceTmt', 'Price (TMT)')}</label>
              <input type="number" min={0} step="0.01" value={form.price_tmt} onChange={(e) => set('price_tmt', e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('turbo.priceCoin', 'Price (Coin)')}</label>
              <input type="number" min={0} value={form.price_coin} onChange={(e) => set('price_coin', e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('turbo.durationDays', 'Duration (days)')}</label>
            <input type="number" min={1} value={form.duration_days} onChange={(e) => set('duration_days', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
            <span className="dark:text-slate-300 text-slate-700">{t('coins.active')}</span>
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t dark:border-white/[0.08] border-black/[0.08]">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg dark:hover:bg-white/5 hover:bg-black/5">{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}{t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminTurboPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | package object
  const [tab, setTab] = useState('packages') // 'packages' | 'boosts'

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.turbo.getPackages()
      .then(({ data }) => setRows(data.data ?? []))
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.turbo.deletePackage(id)
      toast.success(t('toast.deleted'))
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <Zap size={18} className="text-indigo-500" />
        </div>
        <h1 className="text-xl font-semibold dark:text-white">{t('turbo.title', 'Turbo Packages')}</h1>
      </div>

      <div className="flex items-center gap-1 border-b dark:border-white/[0.06] border-black/[0.06]">
        {['packages', 'boosts'].map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === tb
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent opacity-50 hover:opacity-80'
            }`}
          >
            {tb === 'packages' ? t('turbo.tabPackages', 'Packages') : t('turbo.tabBoosts', 'Boosted products')}
          </button>
        ))}
      </div>

      {tab === 'boosts' ? <BoostsTab /> : (
      <>
      <div className="flex items-center justify-between">
        <p className="text-sm opacity-50">{rows.length} {t('turbo.packagesLower', 'packages')}</p>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus size={14} />{t('turbo.addPackage', 'Add Turbo package')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-10">{t('turbo.noPackages', 'No Turbo packages')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('turbo.tierHours', 'Refresh interval (hours)')}</th>
                <th className="text-right px-4 py-2">{t('turbo.priceTmt', 'Price (TMT)')}</th>
                <th className="text-right px-4 py-2">{t('turbo.priceCoin', 'Price (Coin)')}</th>
                <th className="text-right px-4 py-2">{t('turbo.durationDays', 'Duration (days)')}</th>
                <th className="text-center px-4 py-2">{t('coins.active')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium">Turbo {r.tier_hours}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(r.price_tmt)} TMT</td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-500 font-semibold">{fmt(r.price_coin)}</td>
                  <td className="px-4 py-3 text-right text-xs opacity-70">{r.duration_days}</td>
                  <td className="px-4 py-3 text-center">
                    {r.is_active
                      ? <Check size={14} className="text-green-500 mx-auto" />
                      : <X size={14} className="text-red-400 mx-auto" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setModal(r)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-60 hover:opacity-100 text-red-500">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <PackageModal
          pkg={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
      </>
      )}
    </div>
  )
}
