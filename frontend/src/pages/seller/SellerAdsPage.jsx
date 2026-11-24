import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Megaphone, Plus, Loader2, ArrowLeft, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { SellerApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from '@/components/ui/dialog'
import { FormField } from '@/components/common/FormField'
import { cn } from '@/lib/utils'
import {
  CampaignStatusBadge, CompletionStatusBadge, CampaignSummary, CampaignTasksTable,
} from '@/components/ads/AdCampaignParts'
import { fmtTmt, taskName } from '@/components/ads/adFormat'

const PAGE = 20
const cents = (v) => Math.round(Number(v || 0) * 100)
const errMsg = (e, t) => e.response?.data?.message ?? t('toast.error')

/* ── Create campaign ── */

// Mirrors the backend checks so the seller sees problems before paying
function validate(form, terms, t, lang) {
  const budget = cents(form.budget)
  const pool = Math.round(budget * terms.user_percent / 100)
  const rate = cents(terms.ball_rate)
  const chosen = terms.data.filter((type) => form.tasks[type.id]?.on)
  const errors = []
  if (budget < cents(terms.min_budget)) errors.push(t('ads.errBudget', { min: terms.min_budget }))
  if (!chosen.length) errors.push(t('ads.errNoTasks'))
  let limited = 0
  for (const type of chosen) {
    const row = form.tasks[type.id]
    const name = taskName(type, lang)
    const price = cents(row.price)
    if (price < cents(type.min_price)) errors.push(t('ads.errPriceMin', { name, min: Number(type.min_price).toFixed(2) }))
    else if (rate > 0 && price % rate !== 0) errors.push(t('ads.errPriceStep', { name, step: (rate / 100).toFixed(2) }))
    if (type.target_type !== 'shop' && row.scope === 'selected' && !row.target_ids.length) errors.push(t('ads.errTargets', { name }))
    if (row.limit) limited += price * Number(row.limit)
  }
  if (limited > pool) errors.push(t('ads.errPool', { total: (limited / 100).toFixed(2), pool: (pool / 100).toFixed(2) }))
  return { errors, budget, pool, limited, chosen }
}

function TargetPicker({ targetType, value, onChange }) {
  const { t } = useTranslation()
  const [items, setItems] = useState(null)

  useEffect(() => {
    const req = targetType === 'product' ? SellerApi.products.getAll({ limit: 200 }) : SellerApi.reels.getAll()
    req.then(({ data }) => setItems(data.data ?? [])).catch(() => setItems([]))
  }, [targetType])

  if (!items) return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
  if (!items.length) return <p className="text-xs text-slate-500">{t('ads.noItems')}</p>

  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  return (
    <div className="max-h-40 overflow-y-auto rounded-lg border dark:border-white/10 divide-y dark:divide-white/[0.06]">
      {items.map((it) => (
        <label key={it.id} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04]">
          <input type="checkbox" checked={value.includes(it.id)} onChange={() => toggle(it.id)} />
          <span className="truncate">{(targetType === 'product' ? it.name : it.caption) || `#${it.id}`}</span>
        </label>
      ))}
    </div>
  )
}

// Mounted only while open and once terms are loaded, so the form always starts from them
function CreateCampaignDialog({ terms, onClose, onCreated }) {
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState(() => ({
    budget: String(terms.min_budget ?? 100),
    tasks: Object.fromEntries((terms.data ?? []).map((type) => [type.id, {
      on: false, price: Number(type.min_price).toFixed(2), limit: '', scope: 'all', target_ids: [],
    }])),
  }))
  const [saving, setSaving] = useState(false)

  const setTask = (id, patch) => setForm((f) => ({ ...f, tasks: { ...f.tasks, [id]: { ...f.tasks[id], ...patch } } }))
  const { errors, budget, pool, limited, chosen } = validate(form, terms, t, i18n.language)
  const rate = cents(terms.ball_rate)

  async function submit() {
    setSaving(true)
    try {
      await SellerApi.ads.createCampaign({
        budget: budget / 100,
        tasks: chosen.map((type) => {
          const row = form.tasks[type.id]
          return {
            task_type_id: type.id,
            price: cents(row.price) / 100,
            limit: row.limit ? Number(row.limit) : null,
            ...(type.target_type !== 'shop' && { scope: row.scope, ...(row.scope === 'selected' && { target_ids: row.target_ids }) }),
          }
        }),
      })
      toast.success(t('toast.created'))
      onCreated()
    } catch (e) { toast.error(errMsg(e, t)) } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{t('ads.createTitle')}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-5">
          <FormField label={t('ads.budget')} required>
            <Input type="number" min={terms.min_budget} step="1" value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} />
            <p className="text-xs text-slate-500">{t('ads.budgetHint', { min: terms.min_budget })}</p>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 tabular-nums">
              {t('ads.splitPreview', { pool: (pool / 100).toFixed(2), fee: ((budget - pool) / 100).toFixed(2), pct: terms.user_percent })}
            </p>
          </FormField>

          <div className="space-y-2">
            <p className="text-sm font-medium dark:text-white">{t('ads.pickTasks')}</p>
            {terms.data.map((type) => {
              const row = form.tasks[type.id]
              const ball = rate ? Math.floor(cents(row.price) / rate) : 0
              return (
                <div key={type.id} className={cn('rounded-lg border dark:border-white/10 p-3 space-y-3', row.on && 'border-blue-300 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/10')}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={row.on} onChange={(e) => setTask(type.id, { on: e.target.checked })} />
                    <span className="font-medium text-sm dark:text-white">{taskName(type, i18n.language)}</span>
                    <span className="text-xs text-slate-500">· {t('ads.priceMin', { min: Number(type.min_price).toFixed(2) })}</span>
                  </label>
                  {row.on && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <FormField label={t('ads.price')}>
                        <Input type="number" min={type.min_price} step={terms.ball_rate} value={row.price}
                          onChange={(e) => setTask(type.id, { price: e.target.value })} />
                        <p className="text-xs text-slate-500">{t('ads.ballsFor', { ball })}</p>
                      </FormField>
                      <FormField label={t('ads.limit')}>
                        <Input type="number" min="1" step="1" placeholder={t('ads.noLimit')} value={row.limit}
                          onChange={(e) => setTask(type.id, { limit: e.target.value })} />
                      </FormField>
                      {type.target_type !== 'shop' && (
                        <FormField label={t('ads.scope')} className="sm:col-span-2">
                          <Select value={row.scope} onChange={(e) => setTask(type.id, { scope: e.target.value })}>
                            <option value="all">{t('ads.scope_all')} ({t(`ads.target_${type.target_type}`)})</option>
                            <option value="selected">{t('ads.scope_selected')}</option>
                          </Select>
                          {row.scope === 'selected' && (
                            <>
                              <TargetPicker targetType={type.target_type} value={row.target_ids} onChange={(ids) => setTask(type.id, { target_ids: ids })} />
                              <p className="text-xs text-slate-500">{t('ads.selectedCount', { count: row.target_ids.length })}</p>
                            </>
                          )}
                        </FormField>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {limited > 0 && (
            <p className="text-xs text-slate-500 tabular-nums">
              {t('ads.limitedTotal', { total: (limited / 100).toFixed(2), pool: (pool / 100).toFixed(2) })}
            </p>
          )}
          {errors.length > 0 && (
            <ul className="text-sm text-red-600 dark:text-red-400 list-disc pl-5 space-y-0.5">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={saving || errors.length > 0} onClick={submit}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}{t('ads.create')} · {fmtTmt(budget / 100)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Campaign dashboard ── */

function CampaignDetail({ id, onBack }) {
  const { t, i18n } = useTranslation()
  const [campaign, setCampaign] = useState(null)
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    SellerApi.ads.getCampaign(id).then(({ data }) => setCampaign(data.model)).catch((e) => toast.error(errMsg(e, t)))
  }, [id, t])

  useEffect(() => {
    SellerApi.ads.getCompletions(id, { page, limit: PAGE })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch(() => {})
  }, [id, page])

  if (!campaign) return <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
  const pages = Math.ceil(count / PAGE)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />{t('ads.back')}</Button>
        <h2 className="text-lg font-semibold dark:text-white">#{campaign.id}</h2>
        <CampaignStatusBadge status={campaign.status} />
      </div>
      {campaign.status === 'rejected' && campaign.comment && (
        <p className="text-sm rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 px-3 py-2">{campaign.comment}</p>
      )}
      <CampaignSummary campaign={campaign} />
      <CampaignTasksTable tasks={campaign.tasks} />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold dark:text-white">{t('ads.completions')}</h3>
        <div className="rounded-xl border dark:border-white/[0.06] overflow-x-auto bg-white dark:bg-transparent">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-500">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">{t('ads.user')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('ads.task')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('ads.target')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('ads.date')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/[0.06]">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">{t('ads.noCompletions')}</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5">{[r.user?.name, r.user?.surname].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-4 py-2.5">{taskName(r.task, i18n.language)}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{t(`ads.target_${r.task?.target_type}`, r.task?.target_type)} #{r.target_id}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2.5"><CompletionStatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>{t('common.previous')}</Button>
            <span className="text-sm text-slate-500">{t('common.page', { current: page, total: pages })}</span>
            <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>{t('common.next')}</Button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Page ── */

export default function SellerAdsPage() {
  const { t } = useTranslation()
  const [terms, setTerms] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([SellerApi.ads.getTaskTypes(), SellerApi.ads.getCampaigns({ limit: 100 })])
      .then(([types, list]) => { setTerms(types.data); setCampaigns(list.data.data ?? []) })
      .catch((e) => toast.error(errMsg(e, t)))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => { load() }, [load])

  if (openId) return <CampaignDetail id={openId} onBack={() => { setOpenId(null); load() }} />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <Megaphone className="h-[18px] w-[18px] text-blue-600" />
          </div>
          <h1 className="text-xl font-semibold dark:text-white">{t('ads.title')}</h1>
        </div>
        {terms?.allowed && (
          <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1.5" />{t('ads.newCampaign')}</Button>
        )}
      </div>

      {terms && !terms.allowed && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">{t('ads.notAllowed', { plan: terms.plan?.name ?? '—' })}</p>
          <Link to="/seller/subscription" className="text-sm font-medium text-amber-800 dark:text-amber-300 underline">{t('ads.upgrade')}</Link>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : campaigns.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">{t('ads.noCampaigns')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => {
            const pool = Number(c.user_pool) || 0
            const used = pool ? Math.min(100, ((Number(c.spent) + Number(c.reserved)) / pool) * 100) : 0
            return (
              <button key={c.id} type="button" onClick={() => setOpenId(c.id)}
                className="text-left rounded-xl border dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 space-y-3 hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold dark:text-white">#{c.id}</span>
                  <CampaignStatusBadge status={c.status} />
                </div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-slate-500">{t('ads.budget')}</span>
                  <span className="font-semibold tabular-nums dark:text-white">{fmtTmt(c.budget)}</span>
                </div>
                <div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${used}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 tabular-nums">{t('ads.remaining')}: {fmtTmt(c.remaining)}</p>
                </div>
                <p className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</p>
              </button>
            )
          })}
        </div>
      )}

      {creating && terms && (
        <CreateCampaignDialog terms={terms} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load() }} />
      )}
    </div>
  )
}
