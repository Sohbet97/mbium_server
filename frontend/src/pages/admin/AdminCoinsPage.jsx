import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Coins, Plus, Pencil, Trash2, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

const PAGE = 20

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ status }) {
  const { t } = useTranslation()
  const map = {
    PENDING:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? ''}`}>
      {t(`coins.${status?.toLowerCase()}`, status)}
    </span>
  )
}

function TypeBadge({ type }) {
  const { t } = useTranslation()
  const positive = ['EARN', 'GRANT', 'REFUND'].includes(type)
  return (
    <span className={`text-xs font-semibold ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
      {t(`coins.types.${type}`, type)}
    </span>
  )
}

function fmt(n) { return Number(n ?? 0).toLocaleString() }

// ── Grant Modal ───────────────────────────────────────────────────────────────

function GrantModal({ onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ user_ids_raw: '', amount: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    const ids = form.user_ids_raw.split(',').map((s) => s.trim()).filter(Boolean)
    if (!ids.length || !form.amount) { setError('User IDs and amount required'); return }
    setError(''); setSaving(true)
    try {
      await AdminApi.coins.grant({ user_ids: ids, amount: parseInt(form.amount), note: form.note || null })
      toast.success(t('toast.saved'))
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08]">
          <h2 className="text-base font-semibold dark:text-white text-slate-900">{t('coins.grantTitle')}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('coins.userIds')}</label>
            <input value={form.user_ids_raw} onChange={(e) => set('user_ids_raw', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('coins.amount')}</label>
            <input type="number" min={1} value={form.amount} onChange={(e) => set('amount', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('coins.note')}</label>
            <input value={form.note} onChange={(e) => set('note', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t dark:border-white/[0.08] border-black/[0.08]">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg dark:hover:bg-white/5 hover:bg-black/5">{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}{t('coins.grant')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Condition Modal ───────────────────────────────────────────────────────────

const EVENTS = ['ORDER_CLOSED', 'REVIEW_WRITTEN', 'REFERRAL', 'TASK', 'MANUAL']
const EMPTY_COND = { name: '', source_event: 'ORDER_CLOSED', coins_amount: 1, multiplier_priority: 1.0, max_per_user_per_day: '', is_active: true }

function ConditionModal({ condition, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(condition ? {
    ...condition,
    max_per_user_per_day: condition.max_per_user_per_day ?? '',
  } : { ...EMPTY_COND })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim() || !form.coins_amount) { setError('Name and coins amount required'); return }
    setError(''); setSaving(true)
    try {
      const payload = { ...form, max_per_user_per_day: form.max_per_user_per_day !== '' ? parseInt(form.max_per_user_per_day) : null }
      if (condition) {
        await AdminApi.coins.updateCondition(condition.id, payload)
      } else {
        await AdminApi.coins.createCondition(payload)
      }
      toast.success(condition ? t('toast.updated') : t('toast.created'))
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
            {condition ? t('coins.editCondition') : t('coins.addCondition')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('coins.conditionName')}</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('coins.sourceEvent')}</label>
            <select value={form.source_event} onChange={(e) => set('source_event', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200">
              {EVENTS.map((ev) => <option key={ev} value={ev}>{t(`coins.events.${ev}`, ev)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('coins.coinsAmount')}</label>
              <input type="number" min={1} value={form.coins_amount} onChange={(e) => set('coins_amount', parseInt(e.target.value))}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('coins.multiplier')}</label>
              <input type="number" step="0.1" min={1} value={form.multiplier_priority} onChange={(e) => set('multiplier_priority', parseFloat(e.target.value))}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('coins.maxPerDay')}</label>
            <input type="number" min={1} value={form.max_per_user_per_day} onChange={(e) => set('max_per_user_per_day', e.target.value)}
              placeholder="—"
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

// ── History Modal ─────────────────────────────────────────────────────────────

function HistoryModal({ userId, userName, onClose }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AdminApi.coins.getBalance(userId)
      .then(({ data }) => setRows(data.history ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08]">
          <h2 className="text-base font-semibold dark:text-white text-slate-900">{t('coins.history')} — {userName}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin opacity-50" /></div>
          ) : rows.length === 0 ? (
            <p className="text-center text-sm opacity-40 py-8">{t('coins.noHistory')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Type</th>
                  <th className="pb-2 pr-3">Source</th>
                  <th className="pb-2 pr-3 text-right">Amount</th>
                  <th className="pb-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
                    <td className="py-2 pr-3 text-xs opacity-60">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-3"><TypeBadge type={r.type} /></td>
                    <td className="py-2 pr-3 text-xs opacity-70">{r.source}</td>
                    <td className={`py-2 pr-3 text-right font-mono text-sm font-semibold ${r.amount > 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {r.amount > 0 ? '+' : ''}{fmt(r.amount)}
                    </td>
                    <td className="py-2 text-right font-mono text-xs opacity-60">{fmt(r.balance_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Wallets ──────────────────────────────────────────────────────────────

function WalletsTab() {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [grantOpen, setGrantOpen] = useState(false)
  const [historyUser, setHistoryUser] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.coins.getBalances({ limit: PAGE, skip: page * PAGE })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [page, t])

  useEffect(() => { load() }, [load])

  const pages = Math.ceil(count / PAGE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm opacity-50">{count} {t('coins.tabWallets').toLowerCase()}</p>
        <button onClick={() => setGrantOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus size={14} />{t('coins.grant')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-10">{t('coins.noWallets')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">User</th>
                <th className="text-right px-4 py-2">{t('coins.balance')}</th>
                <th className="text-right px-4 py-2">{t('coins.totalEarned')}</th>
                <th className="text-right px-4 py-2">{t('coins.totalSpent')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium dark:text-white">{w.user?.name} {w.user?.surname}</p>
                    <p className="text-xs opacity-50">{w.user?.phone_number}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-indigo-500">{fmt(w.balance)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-green-500">+{fmt(w.total_earned)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-red-400">-{fmt(w.total_spent)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setHistoryUser(w)} className="text-xs underline opacity-50 hover:opacity-100">
                      {t('coins.history')}
                    </button>
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

      {grantOpen && <GrantModal onClose={() => setGrantOpen(false)} onSaved={() => { setGrantOpen(false); load() }} />}
      {historyUser && <HistoryModal userId={historyUser.user_id} userName={`${historyUser.user?.name ?? ''} ${historyUser.user?.surname ?? ''}`.trim()} onClose={() => setHistoryUser(null)} />}
    </div>
  )
}

// ── Tab: Conditions ───────────────────────────────────────────────────────────

function ConditionsTab() {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | condition object

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.coins.getConditions()
      .then(({ data }) => setRows(data.data ?? []))
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.coins.deleteCondition(id)
      toast.success(t('toast.deleted'))
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch { toast.error(t('toast.error')) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm opacity-50">{rows.length} {t('coins.tabConditions').toLowerCase()}</p>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus size={14} />{t('coins.addCondition')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-10">{t('coins.noConditions')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('coins.conditionName')}</th>
                <th className="text-left px-4 py-2">{t('coins.sourceEvent')}</th>
                <th className="text-right px-4 py-2">{t('coins.coinsAmount')}</th>
                <th className="text-right px-4 py-2">{t('coins.multiplier')}</th>
                <th className="text-right px-4 py-2">{t('coins.maxPerDay')}</th>
                <th className="text-center px-4 py-2">{t('coins.active')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-xs opacity-70">{t(`coins.events.${r.source_event}`, r.source_event)}</td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-500 font-semibold">{fmt(r.coins_amount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{r.multiplier_priority}×</td>
                  <td className="px-4 py-3 text-right text-xs opacity-60">{r.max_per_user_per_day ?? '—'}</td>
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
        <ConditionModal
          condition={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

// ── Tab: Topups ───────────────────────────────────────────────────────────────

function TopupsTab() {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('')
  const [processing, setProcessing] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = { limit: PAGE, skip: page * PAGE }
    if (filter) params.status = filter
    AdminApi.coins.getTopups(params)
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [page, filter, t])

  useEffect(() => { load() }, [load])

  async function handle(id, status) {
    setProcessing(id)
    try {
      await AdminApi.coins.updateTopupStatus(id, { status })
      toast.success(status === 'APPROVED' ? t('coins.approved') : t('coins.rejected'))
      load()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    } finally { setProcessing(null) }
  }

  const pages = Math.ceil(count / PAGE)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button key={s} onClick={() => { setFilter(s); setPage(0) }}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${filter === s ? 'bg-indigo-600 text-white' : 'dark:hover:bg-white/10 hover:bg-black/5 opacity-60'}`}>
            {s ? t(`coins.${s.toLowerCase()}`) : t('common.all', 'All')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-10">{t('coins.noTopups')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('coins.topupUser')}</th>
                <th className="text-right px-4 py-2">{t('coins.topupAmountTmt')}</th>
                <th className="text-right px-4 py-2">{t('coins.coinsRequested')}</th>
                <th className="text-left px-4 py-2">{t('coins.receiptUrl')}</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.requester?.name} {r.requester?.surname}</p>
                    <p className="text-xs opacity-50">{r.requester?.phone_number}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{parseFloat(r.amount_tmt).toFixed(2)} TMT</td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-500 font-semibold">{fmt(r.coins_requested)}</td>
                  <td className="px-4 py-3">
                    {r.receipt_url
                      ? <a href={r.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 underline">View</a>
                      : <span className="text-xs opacity-30">—</span>}
                  </td>
                  <td className="px-4 py-3"><Badge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status === 'PENDING' && (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handle(r.id, 'APPROVED')} disabled={processing === r.id}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                          {processing === r.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                          {t('coins.approve')}
                        </button>
                        <button onClick={() => handle(r.id, 'REJECTED')} disabled={processing === r.id}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">
                          <X size={11} />{t('coins.reject')}
                        </button>
                      </div>
                    )}
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

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = ['tabWallets', 'tabConditions', 'tabTopups']

export default function AdminCoinsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <Coins size={18} className="text-indigo-500" />
        </div>
        <h1 className="text-xl font-semibold dark:text-white">{t('coins.title')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b dark:border-white/[0.06] border-black/[0.06]">
        {TABS.map((key, i) => (
          <button key={key} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === i
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent opacity-50 hover:opacity-80'
            }`}>
            {t(`coins.${key}`)}
          </button>
        ))}
      </div>

      {tab === 0 && <WalletsTab />}
      {tab === 1 && <ConditionsTab />}
      {tab === 2 && <TopupsTab />}
    </div>
  )
}
