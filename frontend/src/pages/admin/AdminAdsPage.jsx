import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Megaphone, Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminApi } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { hasPerm, Permissions } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from '@/components/ui/dialog'
import { FormField } from '@/components/common/FormField'
import { cn } from '@/lib/utils'
import {
  CampaignStatusBadge, CompletionStatusBadge, CampaignSummary, CampaignTasksTable,
} from '@/components/ads/AdCampaignParts'
import { fmtTmt, taskName } from '@/components/ads/adFormat'

const PAGE = 20
const CAMPAIGN_STATUSES = ['pending', 'active', 'rejected', 'finished']
const COMPLETION_STATUSES = ['pending', 'approved', 'rejected']
const CODES = ['shop_follow', 'reel_like', 'review']
const TARGET_BY_CODE = { review: 'product', reel_like: 'reel', shop_follow: 'shop' }

const errMsg = (e, t) => e.response?.data?.message ?? t('toast.error')

function FilterChips({ value, options, onChange, labelOf }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-2">
      {['', ...options].map((s) => (
        <button key={s || 'all'} type="button" onClick={() => onChange(s)}
          className={cn('px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
            value === s ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10')}>
          {s ? labelOf(s) : t('ads.allTime')}
        </button>
      ))}
    </div>
  )
}

function Pager({ page, count, onPage }) {
  const { t } = useTranslation()
  const pages = Math.ceil(count / PAGE)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>{t('common.previous')}</Button>
      <span className="text-sm text-slate-500">{t('common.page', { current: page, total: pages })}</span>
      <Button variant="outline" size="sm" disabled={page === pages} onClick={() => onPage(page + 1)}>{t('common.next')}</Button>
    </div>
  )
}

/* ── Campaigns ── */

function CampaignDialog({ id, canReview, onClose, onChanged }) {
  const { t } = useTranslation()
  const [campaign, setCampaign] = useState(null)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setCampaign(null); setComment('')
    if (id) AdminApi.ads.getCampaign(id).then(({ data }) => setCampaign(data.model)).catch((e) => toast.error(errMsg(e, t)))
  }, [id, t])

  async function review(status) {
    if (status === 'active' && !window.confirm(t('ads.confirmApprove'))) return
    setSaving(true)
    try {
      const { data } = await AdminApi.ads.reviewCampaign(id, { status, comment: comment.trim() || undefined })
      setCampaign(data.model)
      toast.success(t('toast.updated'))
      onChanged()
    } catch (e) { toast.error(errMsg(e, t)) } finally { setSaving(false) }
  }

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            #{id} {campaign?.shop?.name && `· ${campaign.shop.name}`}
            {campaign && <CampaignStatusBadge status={campaign.status} />}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {!campaign ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : (
            <>
              <CampaignSummary campaign={campaign} />
              <CampaignTasksTable tasks={campaign.tasks} />
              {campaign.comment && <p className="text-sm text-slate-600 dark:text-slate-300">{t('ads.comment')}: {campaign.comment}</p>}
              {canReview && campaign.status === 'pending' && (
                <FormField label={t('ads.rejectReason')}>
                  <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
                </FormField>
              )}
            </>
          )}
        </DialogBody>
        {canReview && campaign?.status === 'pending' && (
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => review('rejected')}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20">
              <X className="h-4 w-4 mr-1.5" />{t('ads.reject')}
            </Button>
            <Button disabled={saving} onClick={() => review('active')}>
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}{t('ads.approve')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function CampaignsTab({ canReview }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.ads.getCampaigns({ status: status || undefined, page, limit: PAGE })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch((e) => toast.error(errMsg(e, t)))
      .finally(() => setLoading(false))
  }, [status, page, t])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <FilterChips value={status} options={CAMPAIGN_STATUSES} onChange={(s) => { setStatus(s); setPage(1) }} labelOf={(s) => t(`ads.status_${s}`)} />
      <div className="rounded-xl border dark:border-white/[0.06] overflow-x-auto bg-white dark:bg-transparent">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-500">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">#</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('ads.shop')}</th>
              <th className="text-right px-4 py-2.5 font-medium">{t('ads.budget')}</th>
              <th className="text-right px-4 py-2.5 font-medium">{t('ads.userPool')}</th>
              <th className="text-right px-4 py-2.5 font-medium">{t('ads.spent')}</th>
              <th className="text-right px-4 py-2.5 font-medium">{t('ads.remaining')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('common.status')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('ads.date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-white/[0.06]">
            {loading ? (
              <tr><td colSpan={8} className="py-10 text-center text-slate-400">{t('common.loading')}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="py-10 text-center text-slate-400">{t('ads.noCampaigns')}</td></tr>
            ) : rows.map((c) => (
              <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                <td className="px-4 py-3 font-medium">#{c.id}</td>
                <td className="px-4 py-3">{c.shop?.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtTmt(c.budget)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtTmt(c.user_pool)} <span className="text-xs text-slate-500">({c.user_percent}%)</span></td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtTmt(c.spent)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtTmt(c.remaining)}</td>
                <td className="px-4 py-3"><CampaignStatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} count={count} onPage={setPage} />
      <CampaignDialog id={openId} canReview={canReview} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  )
}

/* ── Moderation ── */

function ModerationTab({ canModerate }) {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.ads.getCompletions({ status: status || undefined, page, limit: PAGE })
      .then(({ data }) => { setRows(data.data ?? []); setCount(data.count ?? 0) })
      .catch((e) => toast.error(errMsg(e, t)))
      .finally(() => setLoading(false))
  }, [status, page, t])

  useEffect(() => { load() }, [load])

  async function moderate(row, next) {
    let comment
    if (next === 'rejected') {
      comment = window.prompt(t('ads.rejectReason'))
      if (comment === null) return
    }
    setBusy(row.id)
    try {
      await AdminApi.ads.moderateCompletion(row.id, { status: next, comment: comment || undefined })
      toast.success(t('toast.updated'))
      load()
    } catch (e) { toast.error(errMsg(e, t)) } finally { setBusy(null) }
  }

  return (
    <div className="space-y-4">
      <FilterChips value={status} options={COMPLETION_STATUSES} onChange={(s) => { setStatus(s); setPage(1) }} labelOf={(s) => t(`ads.completion_${s}`)} />
      <div className="rounded-xl border dark:border-white/[0.06] overflow-x-auto bg-white dark:bg-transparent">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-500">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">{t('ads.user')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('ads.shop')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('ads.task')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('ads.target')}</th>
              <th className="text-right px-4 py-2.5 font-medium">{t('ads.ball')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('common.status')}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-white/[0.06]">
            {loading ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400">{t('common.loading')}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400">{t('ads.noCompletions')}</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{[r.user?.name, r.user?.surname].filter(Boolean).join(' ') || '—'}</p>
                  <p className="text-xs text-slate-500">{r.user?.phone_number}</p>
                </td>
                <td className="px-4 py-3">{r.shop?.name}</td>
                <td className="px-4 py-3">{taskName(r.task, i18n.language)}</td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-xs text-slate-500">{t(`ads.target_${r.task?.target_type}`, r.task?.target_type)} #{r.target_id}</p>
                  {r.review && (
                    <p className="text-sm mt-0.5">
                      <span className="text-amber-500">{'★'.repeat(r.review.rating)}</span>{' '}
                      <span className="text-slate-700 dark:text-slate-300 break-words">{r.review.comment}</span>
                    </p>
                  )}
                  {r.comment && <p className="text-xs text-slate-500 mt-0.5">{t('ads.comment')}: {r.comment}</p>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{r.ball}</td>
                <td className="px-4 py-3"><CompletionStatusBadge status={r.status} /></td>
                <td className="px-4 py-3">
                  {canModerate && r.status === 'pending' && (
                    <div className="flex gap-1.5 justify-end">
                      <Button size="sm" disabled={busy === r.id} onClick={() => moderate(r, 'approved')}>
                        {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        <span className="ml-1">{t('ads.approve')}</span>
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => moderate(r, 'rejected')}
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20">
                        <X className="h-3.5 w-3.5" /><span className="ml-1">{t('ads.reject')}</span>
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} count={count} onPage={setPage} />
    </div>
  )
}

/* ── Task types ── */

const EMPTY_TYPE = { code: 'shop_follow', name: '', name_ru: '', name_eng: '', min_price: '0.50', needs_moderation: false, status: true }

function TaskTypeDialog({ type, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY_TYPE)
  const [saving, setSaving] = useState(false)
  const creating = type === 'new'

  useEffect(() => {
    if (!type) return
    setForm(creating ? EMPTY_TYPE : { ...EMPTY_TYPE, ...type, min_price: String(type.min_price) })
  }, [type, creating])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function save() {
    setSaving(true)
    try {
      const body = {
        name: form.name, name_ru: form.name_ru || null, name_eng: form.name_eng || null,
        min_price: Number(form.min_price), needs_moderation: form.needs_moderation, status: form.status,
      }
      if (creating) await AdminApi.ads.createTaskType({ ...body, code: form.code })
      else await AdminApi.ads.updateTaskType(type.id, body)
      toast.success(creating ? t('toast.created') : t('toast.updated'))
      onSaved()
    } catch (e) { toast.error(errMsg(e, t)) } finally { setSaving(false) }
  }

  return (
    <Dialog open={!!type} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{creating ? t('ads.addType') : t('ads.editType')}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-3">
          <FormField label={t('ads.code')}>
            <Select value={form.code} disabled={!creating} onChange={(e) => set('code', e.target.value)}>
              {CODES.map((c) => <option key={c} value={c}>{c} · {t(`ads.target_${TARGET_BY_CODE[c]}`)}</option>)}
            </Select>
          </FormField>
          <FormField label={t('ads.name')} required><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('ads.nameRu')}><Input value={form.name_ru ?? ''} onChange={(e) => set('name_ru', e.target.value)} /></FormField>
            <FormField label={t('ads.nameEng')}><Input value={form.name_eng ?? ''} onChange={(e) => set('name_eng', e.target.value)} /></FormField>
          </div>
          <FormField label={t('ads.minPrice')}>
            <Input type="number" min="0.01" step="0.01" value={form.min_price} onChange={(e) => set('min_price', e.target.value)} />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.needs_moderation} onChange={(e) => set('needs_moderation', e.target.checked)} />
            {t('ads.needsModeration')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.status} onChange={(e) => set('status', e.target.checked)} />
            {t('ads.active')}
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={saving || !form.name.trim() || !(Number(form.min_price) > 0)} onClick={save}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}{t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TaskTypesTab({ canEdit, canDelete }) {
  const { t, i18n } = useTranslation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | type

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.ads.getTaskTypes()
      .then(({ data }) => setRows(data.data ?? []))
      .catch((e) => toast.error(errMsg(e, t)))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => { load() }, [load])

  async function remove(type) {
    if (!window.confirm(t('ads.confirmDeleteType'))) return
    try {
      const { data } = await AdminApi.ads.deleteTaskType(type.id)
      toast.success(data.disabled ? t('ads.deletedDisabled') : t('toast.deleted'))
      load()
    } catch (e) { toast.error(errMsg(e, t)) }
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing('new')}><Plus className="h-4 w-4 mr-1.5" />{t('ads.addType')}</Button>
        </div>
      )}
      <div className="rounded-xl border dark:border-white/[0.06] overflow-x-auto bg-white dark:bg-transparent">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-500">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">{t('ads.task')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('ads.code')}</th>
              <th className="text-left px-4 py-2.5 font-medium">{t('ads.targetType')}</th>
              <th className="text-right px-4 py-2.5 font-medium">{t('ads.minPrice')}</th>
              <th className="text-center px-4 py-2.5 font-medium">{t('ads.needsModeration')}</th>
              <th className="text-center px-4 py-2.5 font-medium">{t('ads.active')}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-white/[0.06]">
            {loading ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400">{t('common.loading')}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400">{t('ads.noTaskTypes')}</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className={cn(!r.status && 'opacity-50')}>
                <td className="px-4 py-3 font-medium">{taskName(r, i18n.language)}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                <td className="px-4 py-3">{t(`ads.target_${r.target_type}`)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtTmt(r.min_price)}</td>
                <td className="px-4 py-3 text-center">{r.needs_moderation ? <Check className="h-4 w-4 mx-auto text-green-600" /> : '—'}</td>
                <td className="px-4 py-3 text-center">{r.status ? <Check className="h-4 w-4 mx-auto text-green-600" /> : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    {canEdit && (
                      <button onClick={() => setEditing(r)} title={t('common.edit')} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10">
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => remove(r)} title={t('common.delete')} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TaskTypeDialog type={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
    </div>
  )
}

/* ── Settings ── */

function SettingsTab({ canEdit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    AdminApi.ads.getSettings()
      .then(({ data }) => setForm({ min_budget: String(data.model.min_budget), ball_rate: String(data.model.ball_rate) }))
      .catch((e) => toast.error(errMsg(e, t)))
  }, [t])

  async function save() {
    setSaving(true)
    try {
      const { data } = await AdminApi.ads.updateSettings({ min_budget: Number(form.min_budget), ball_rate: Number(form.ball_rate) })
      setForm({ min_budget: String(data.model.min_budget), ball_rate: String(data.model.ball_rate) })
      toast.success(t('toast.saved'))
    } catch (e) { toast.error(errMsg(e, t)) } finally { setSaving(false) }
  }

  if (!form) return <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>

  return (
    <div className="max-w-md space-y-4">
      <FormField label={t('ads.minBudget')}>
        <Input type="number" min="1" step="1" value={form.min_budget} disabled={!canEdit} onChange={(e) => setForm((f) => ({ ...f, min_budget: e.target.value }))} />
      </FormField>
      <FormField label={t('ads.ballRate')}>
        <Input type="number" min="0.01" step="0.01" value={form.ball_rate} disabled={!canEdit} onChange={(e) => setForm((f) => ({ ...f, ball_rate: e.target.value }))} />
        <p className="text-xs text-slate-500 mt-1">{t('ads.ballRateHint')}</p>
      </FormField>
      {canEdit && (
        <Button disabled={saving} onClick={save}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}{t('common.save')}</Button>
      )}
    </div>
  )
}

/* ── Page ── */

export default function AdminAdsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const canPut = hasPerm(user, Permissions.AD_PUT)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center">
          <Megaphone className="h-[18px] w-[18px] text-blue-600" />
        </div>
        <h1 className="text-xl font-semibold dark:text-white">{t('ads.title')}</h1>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">{t('ads.tabCampaigns')}</TabsTrigger>
          <TabsTrigger value="moderation">{t('ads.tabModeration')}</TabsTrigger>
          <TabsTrigger value="types">{t('ads.tabTaskTypes')}</TabsTrigger>
          <TabsTrigger value="settings">{t('ads.tabSettings')}</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns" className="mt-4"><CampaignsTab canReview={canPut} /></TabsContent>
        <TabsContent value="moderation" className="mt-4"><ModerationTab canModerate={canPut} /></TabsContent>
        <TabsContent value="types" className="mt-4">
          <TaskTypesTab canEdit={hasPerm(user, [Permissions.AD_POST, Permissions.AD_PUT])} canDelete={hasPerm(user, Permissions.AD_DELETE)} />
        </TabsContent>
        <TabsContent value="settings" className="mt-4"><SettingsTab canEdit={canPut} /></TabsContent>
      </Tabs>
    </div>
  )
}
