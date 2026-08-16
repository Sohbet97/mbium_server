import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Gift, Plus, Pencil, Trash2, Check, X, Loader2, Upload, History } from 'lucide-react'
import { AdminApi } from '@/lib/api'
import { absUrl } from '@/lib/utils'
import { toast } from 'sonner'

function fmt(n) { return Number(n ?? 0).toLocaleString() }
function fmtDate(s) { return s ? new Date(s).toLocaleString() : '—' }

// ── Creators tab ─────────────────────────────────────────────────────────────

const EMPTY_CREATOR = { name: '', contact_note: '', avatar_id: '', avatar_url: '' }

function CreatorModal({ creator, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(creator ? {
    name: creator.name ?? '',
    contact_note: creator.contact_note ?? '',
    avatar_id: creator.avatar?.id ?? '',
    avatar_url: creator.avatar?.url ?? '',
    is_active: creator.is_active,
  } : { ...EMPTY_CREATOR })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await AdminApi.media.upload(fd)
      set('avatar_id', data?.data?.id ?? '')
      set('avatar_url', data?.data?.url ?? '')
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally { setUploading(false) }
  }

  async function handleSave() {
    if (!form.name.trim()) { setError(t('gifts.nameRequired', 'Name is required')); return }
    setError(''); setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        contact_note: form.contact_note.trim() || null,
        avatar_id: form.avatar_id || null,
      }
      if (creator) {
        payload.is_active = form.is_active
        await AdminApi.giftCreators.update(creator.id, payload)
      } else {
        await AdminApi.giftCreators.create(payload)
      }
      toast.success(creator ? t('toast.updated') : t('toast.created'))
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
            {creator ? t('gifts.editCreator', 'Edit gift creator') : t('gifts.addCreator', 'Add gift creator')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-white/[0.06] shrink-0 flex items-center justify-center">
              {form.avatar_url
                ? <img src={absUrl(form.avatar_url)} alt="" className="w-full h-full object-cover" />
                : <Gift size={20} className="text-slate-300 dark:text-white/20" />}
            </div>
            <label className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border dark:border-white/10 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {t('gifts.uploadAvatar', 'Upload avatar')}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('gifts.creatorName', 'Name')}</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('gifts.contactNote', 'Contact note')}</label>
            <textarea rows={2} value={form.contact_note} onChange={(e) => set('contact_note', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
          </div>
          {creator && (
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              <span className="dark:text-slate-300 text-slate-700">{t('coins.active')}</span>
            </label>
          )}
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

function CreatorTransactionsModal({ creator, onClose }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AdminApi.giftCreators.getTransactions(creator.id, { limit: 50 })
      .then(({ data }) => setRows(data.data ?? []))
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [creator.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08] shrink-0">
          <div>
            <h2 className="text-base font-semibold dark:text-white text-slate-900">{creator.name}</h2>
            <p className="text-xs opacity-50 mt-0.5">
              {t('gifts.balance', 'Balance')}: <span className="font-mono">{fmt(creator.balance?.available_balance)} TMT</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin opacity-40" /></div>
          ) : rows.length === 0 ? (
            <p className="text-center text-sm opacity-40 py-10">{t('gifts.noTransactions', 'No transactions yet')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06] sticky top-0 dark:bg-[#1a1a1f] bg-white">
                <tr>
                  <th className="text-left px-4 py-2">{t('gifts.colType', 'Type')}</th>
                  <th className="text-right px-4 py-2">{t('gifts.colAmount', 'Amount')}</th>
                  <th className="text-right px-4 py-2">{t('gifts.colBalanceAfter', 'Balance after')}</th>
                  <th className="text-left px-4 py-2">{t('gifts.colDate', 'Date')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tx) => (
                  <tr key={tx.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        tx.type === 'GIFT_CREDIT'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                      }`}>{tx.type}</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${Number(tx.amount) < 0 ? 'text-red-500' : ''}`}>{fmt(tx.amount)}</td>
                    <td className="px-4 py-3 text-right font-mono opacity-70">{tx.balance_after != null ? fmt(tx.balance_after) : '—'}</td>
                    <td className="px-4 py-3 text-xs opacity-60">{fmtDate(tx.createdAt)}</td>
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

function CreatorsTab() {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | creator object
  const [historyFor, setHistoryFor] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.giftCreators.getAll({ limit: 100 })
      .then(({ data }) => setRows(data.data ?? []))
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.giftCreators.delete(id)
      toast.success(t('toast.deleted'))
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm opacity-50">{rows.length} {t('gifts.creatorsLower', 'creators')}</p>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus size={14} />{t('gifts.addCreator', 'Add gift creator')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-10">{t('gifts.noCreators', 'No gift creators')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('gifts.creatorName', 'Name')}</th>
                <th className="text-right px-4 py-2">{t('gifts.balance', 'Balance')}</th>
                <th className="text-center px-4 py-2">{t('coins.active')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-white/[0.06] shrink-0 flex items-center justify-center">
                        {r.avatar?.url
                          ? <img src={absUrl(r.avatar.url)} alt="" className="w-full h-full object-cover" />
                          : <Gift size={14} className="text-slate-300 dark:text-white/20" />}
                      </div>
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(r.balance?.available_balance)} TMT</td>
                  <td className="px-4 py-3 text-center">
                    {r.is_active
                      ? <Check size={14} className="text-green-500 mx-auto" />
                      : <X size={14} className="text-red-400 mx-auto" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setHistoryFor(r)} title={t('gifts.viewHistory', 'View balance/transactions')}
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100">
                        <History size={13} />
                      </button>
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
        <CreatorModal
          creator={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
      {historyFor && <CreatorTransactionsModal creator={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  )
}

// ── Gift types tab ───────────────────────────────────────────────────────────

const EMPTY_TYPE = {
  name: '', animation_id: '', animation_url: '', icon_id: '', icon_url: '',
  effect_description: '', price_coin: '', price_tmt: '', gift_creator_id: '', sort_order: 0,
}

function GiftTypeModal({ giftType, creators, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(giftType ? {
    name: giftType.name ?? '',
    animation_id: giftType.animation?.id ?? '',
    animation_url: giftType.animation?.url ?? '',
    icon_id: giftType.icon?.id ?? '',
    icon_url: giftType.icon?.url ?? '',
    effect_description: giftType.effect_description ?? '',
    price_coin: giftType.price_coin ?? '',
    price_tmt: giftType.price_tmt ?? '',
    gift_creator_id: giftType.gift_creator?.id ?? '',
    sort_order: giftType.sort_order ?? 0,
    is_active: giftType.is_active,
  } : { ...EMPTY_TYPE })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('') // '' | 'animation' | 'icon'
  const [error, setError] = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleFileChange(field, e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(field)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await AdminApi.media.upload(fd)
      set(`${field}_id`, data?.data?.id ?? '')
      set(`${field}_url`, data?.data?.url ?? '')
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally { setUploading('') }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.animation_id || !form.price_coin || !form.price_tmt || !form.gift_creator_id) {
      setError(t('gifts.fieldsRequired', 'Name, animation, prices and creator are required'))
      return
    }
    setError(''); setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        animation_id: form.animation_id,
        icon_id: form.icon_id || null,
        effect_description: form.effect_description.trim() || null,
        price_coin: parseInt(form.price_coin),
        price_tmt: parseFloat(form.price_tmt),
        gift_creator_id: parseInt(form.gift_creator_id),
        sort_order: parseInt(form.sort_order) || 0,
      }
      if (giftType) {
        payload.is_active = form.is_active
        await AdminApi.giftTypes.update(giftType.id, payload)
      } else {
        await AdminApi.giftTypes.create(payload)
      }
      toast.success(giftType ? t('toast.updated') : t('toast.created'))
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? t('toast.error'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md dark:bg-[#1a1a1f] bg-white rounded-xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.08] border-black/[0.08] shrink-0">
          <h2 className="text-base font-semibold dark:text-white text-slate-900">
            {giftType ? t('gifts.editType', 'Edit gift type') : t('gifts.addType', 'Add gift type')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/[0.06] shrink-0 flex items-center justify-center">
              {form.animation_url
                ? <img src={absUrl(form.animation_url)} alt="" className="w-full h-full object-cover" />
                : <Gift size={22} className="text-slate-300 dark:text-white/20" />}
            </div>
            <label className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border dark:border-white/10 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
              {uploading === 'animation' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {t('gifts.uploadGif', 'Upload GIF')}
              <input type="file" accept="image/gif,image/*" className="hidden" onChange={(e) => handleFileChange('animation', e)} disabled={!!uploading} />
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('gifts.typeName', 'Name')}</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('gifts.creator', 'Creator')}</label>
            <select value={form.gift_creator_id} onChange={(e) => set('gift_creator_id', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm border dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200">
              <option value="">—</option>
              {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('gifts.priceCoin', 'Price (Coin)')}</label>
              <input type="number" min={1} value={form.price_coin} onChange={(e) => set('price_coin', e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('gifts.priceTmt', 'Price (TMT)')}</label>
              <input type="number" min={0} step="0.01" value={form.price_tmt} onChange={(e) => set('price_tmt', e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('gifts.effectDescription', 'Effect description')}</label>
            <input value={form.effect_description} onChange={(e) => set('effect_description', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-slate-600">{t('gifts.sortOrder', 'Sort order')}</label>
            <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-[#111] dark:border-white/10 dark:text-white border-slate-200" />
          </div>
          {giftType && (
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              <span className="dark:text-slate-300 text-slate-700">{t('coins.active')}</span>
            </label>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t dark:border-white/[0.08] border-black/[0.08] shrink-0">
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

function GiftTypesTab() {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      AdminApi.giftTypes.getAll(),
      AdminApi.giftCreators.getAll({ limit: 200 }),
    ])
      .then(([typesRes, creatorsRes]) => {
        setRows(typesRes.data.data ?? [])
        setCreators(creatorsRes.data.data ?? [])
      })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await AdminApi.giftTypes.delete(id)
      toast.success(t('toast.deleted'))
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm opacity-50">{rows.length} {t('gifts.typesLower', 'gift types')}</p>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus size={14} />{t('gifts.addType', 'Add gift type')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-10">{t('gifts.noTypes', 'No gift types')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('gifts.typeName', 'Gift')}</th>
                <th className="text-left px-4 py-2">{t('gifts.creator', 'Creator')}</th>
                <th className="text-right px-4 py-2">{t('gifts.priceCoin', 'Price (Coin)')}</th>
                <th className="text-right px-4 py-2">{t('gifts.priceTmt', 'Price (TMT)')}</th>
                <th className="text-center px-4 py-2">{t('coins.active')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/[0.06] shrink-0 flex items-center justify-center">
                        {r.animation?.url
                          ? <img src={absUrl(r.animation.url)} alt="" className="w-full h-full object-cover" />
                          : <Gift size={14} className="text-slate-300 dark:text-white/20" />}
                      </div>
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 opacity-70">{r.gift_creator?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-500 font-semibold">{fmt(r.price_coin)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(r.price_tmt)} TMT</td>
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
        <GiftTypeModal
          giftType={modal === 'add' ? null : modal}
          creators={creators}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

// ── Sent gifts tab (read-only audit) ─────────────────────────────────────────

const SENT_GIFTS_PAGE = 20

function SentGiftsTab() {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback((p = 0) => {
    setLoading(true)
    AdminApi.reelGifts.getAll({ page: p + 1, limit: SENT_GIFTS_PAGE })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => toast.error(t('toast.error')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => { load(page) }, [page])

  const totalPages = Math.ceil(count / SENT_GIFTS_PAGE)

  return (
    <div className="space-y-4">
      <p className="text-sm opacity-50">{count} {t('gifts.sentLower', 'gifts sent')}</p>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin opacity-40" /></div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm opacity-40 py-10">{t('gifts.noSent', 'No gifts sent yet')}</p>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs opacity-50 border-b dark:border-white/[0.06] border-black/[0.06]">
              <tr>
                <th className="text-left px-4 py-2">{t('gifts.colSender', 'Sender')}</th>
                <th className="text-left px-4 py-2">{t('gifts.colReel', 'Reel')}</th>
                <th className="text-left px-4 py-2">{t('gifts.typeName', 'Gift')}</th>
                <th className="text-left px-4 py-2">{t('gifts.creator', 'Creator')}</th>
                <th className="text-right px-4 py-2">{t('gifts.priceCoin', 'Price (Coin)')}</th>
                <th className="text-left px-4 py-2">{t('gifts.colDate', 'Date')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id} className="border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
                  <td className="px-4 py-3">{g.user ? `${g.user.name ?? ''} ${g.user.surname ?? ''}`.trim() : `#${g.user_id}`}</td>
                  <td className="px-4 py-3 opacity-70">{g.reel?.caption || `#${g.reel_id}`}</td>
                  <td className="px-4 py-3">{g.gift_type?.name ?? '—'}</td>
                  <td className="px-4 py-3 opacity-70">{g.gift_creator?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-500 font-semibold">{fmt(g.price_coin)}</td>
                  <td className="px-4 py-3 text-xs opacity-60">{fmtDate(g.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{page * SENT_GIFTS_PAGE + 1}–{Math.min((page + 1) * SENT_GIFTS_PAGE, count)} / {count}</span>
          <div className="flex gap-1.5">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-2.5 py-1 rounded border dark:border-white/10 disabled:opacity-30">←</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-2.5 py-1 rounded border dark:border-white/10 disabled:opacity-30">→</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS = {
  creators: (t) => t('gifts.tabCreators', 'Creators'),
  types:    (t) => t('gifts.tabTypes', 'Gift types'),
  sent:     (t) => t('gifts.tabSent', 'Sent gifts'),
}

export default function AdminGiftsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('creators')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600/10 flex items-center justify-center">
          <Gift size={18} className="text-indigo-500" />
        </div>
        <h1 className="text-xl font-semibold dark:text-white">{t('gifts.title', 'Gifts')}</h1>
      </div>

      <div className="flex items-center gap-1 border-b dark:border-white/[0.06] border-black/[0.06]">
        {Object.keys(TABS).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === tb
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent opacity-50 hover:opacity-80'
            }`}
          >
            {TABS[tb](t)}
          </button>
        ))}
      </div>

      {tab === 'creators' ? <CreatorsTab /> : tab === 'types' ? <GiftTypesTab /> : <SentGiftsTab />}
    </div>
  )
}
