import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw, MoreHorizontal, Truck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogBody,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'
import { absUrl } from '@/lib/utils'
import { toast } from 'sonner'

// ── Deliver Modal ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  first_name: '', last_name: '', avatar: '',
  city_id: '', status: 0, phones: [],
}

function buildForm(d) {
  if (!d) return EMPTY_FORM
  return {
    first_name: d.first_name ?? '',
    last_name: d.last_name ?? '',
    avatar: d.avatar ?? '',
    city_id: d.city_id ?? '',
    status: d.status ?? 0,
    phones: Array.isArray(d.phones) ? [...d.phones] : [],
  }
}

function DeliverModal({ open, deliver, cities, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => buildForm(deliver))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, val) { setForm((f) => ({ ...f, [field]: val })) }

  function addPhone() { setForm((f) => ({ ...f, phones: [...f.phones, ''] })) }
  function setPhone(i, val) {
    setForm((f) => {
      const phones = [...f.phones]
      phones[i] = val
      return { ...f, phones }
    })
  }
  function removePhone(i) {
    setForm((f) => ({ ...f, phones: f.phones.filter((_, idx) => idx !== i) }))
  }

  const isValid = Boolean(form.first_name.trim() && form.last_name.trim())

  async function handleSave() {
    if (!isValid) return
    setError(''); setSaving(true)
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        avatar: form.avatar.trim() || null,
        city_id: form.city_id !== '' ? Number(form.city_id) : null,
        status: form.status,
        phones: form.phones.filter((p) => p.trim()),
      }
      if (deliver) {
        await AdminApi.delivers.update(deliver.id, payload)
      } else {
        await AdminApi.delivers.create(payload)
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {deliver ? t('delivers.editDeliver') : t('delivers.createDeliver')}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('delivers.firstName')} required>
              <Input
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                placeholder={t('delivers.firstName')}
              />
            </FormField>
            <FormField label={t('delivers.lastName')} required>
              <Input
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                placeholder={t('delivers.lastName')}
              />
            </FormField>
          </div>

          <FormField label={t('delivers.avatar')}>
            <Input
              value={form.avatar}
              onChange={(e) => set('avatar', e.target.value)}
              placeholder="https://…"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('delivers.city')}>
              <Select value={form.city_id} onChange={(e) => set('city_id', e.target.value)}>
                <option value="">{t('delivers.noCity')}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </FormField>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label>{t('delivers.statusOnline')}</Label>
              <Switch
                checked={form.status === 1}
                onCheckedChange={(v) => set('status', v ? 1 : 0)}
              />
            </div>
          </div>

          {/* Phones */}
          <FormField label={t('delivers.phones')}>
            <div className="space-y-2">
              {form.phones.map((phone, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(i, e.target.value)}
                    placeholder={t('delivers.phonePlaceholder')}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => removePhone(i)}
                    className="shrink-0 h-9 w-9 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addPhone} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> {t('delivers.addPhone')}
              </Button>
            </div>
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {saving ? '…' : deliver ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DeliveriesPage() {
  const { t } = useTranslation()

  const [delivers, setDelivers] = useState([])
  const [cities, setCities] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)
  const [modal, setModal] = useState({ open: false, deliver: null })
  const limit = 20

  useEffect(() => {
    let cancelled = false
    const params = { limit, skip: (page - 1) * limit }
    if (search) params.text = search
    if (statusFilter !== '') params.status = statusFilter
    if (cityFilter !== '') params.city_id = cityFilter

    AdminApi.delivers.getAll(params)
      .then(({ data }) => {
        if (cancelled) return
        setDelivers(data.data ?? [])
        setTotal(data.count ?? 0)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setDelivers([])
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [page, search, statusFilter, cityFilter, refreshTick])

  useEffect(() => {
    AdminApi.cities.getAll({ limit: 500 })
      .then(({ data }) => setCities(data.data ?? []))
      .catch(() => { })
  }, [])

  function refresh() { setLoading(true); setRefreshTick((k) => k + 1) }
  function handleSearchChange(val) { setSearch(val); setLoading(true); setPage(1) }
  function handleStatusChange(val) { setStatusFilter(val); setLoading(true); setPage(1) }
  function handleCityChange(val) { setCityFilter(val); setLoading(true); setPage(1) }
  function handlePageChange(next) { setPage(next); setLoading(true) }

  async function handleDelete(d) {
    if (!window.confirm(t('delivers.confirmDelete'))) return
    try {
      await AdminApi.delivers.delete(d.id)
      toast.success(t('toast.deleted'))
      refresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  async function handleForceDelete(d) {
    if (!window.confirm(t('delivers.confirmForceDelete'))) return
    try {
      await AdminApi.delivers.forceDelete(d.id)
      toast.success(t('toast.deleted'))
      refresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('delivers.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5 dark:text-white/[0.8]">
            {t('delivers.totalCount', { count: total })}
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setModal({ open: true, deliver: null })}>
          <Plus className="h-4 w-4" /> {t('delivers.addDeliver')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('delivers.searchPlaceholder')}
            className="pl-9"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-36"
        >
          <option value="">{t('delivers.filterStatus')}</option>
          <option value="1">{t('delivers.statusOnline')}</option>
          <option value="0">{t('delivers.statusOffline')}</option>
        </Select>
        <Select
          value={cityFilter}
          onChange={(e) => handleCityChange(e.target.value)}
          className="w-36"
        >
          <option value="">{t('delivers.filterCity')}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5">
          <RefreshCw className="h-4 w-4" /> {t('common.refresh')}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-white/[0.08] text-left">
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-white/50">{t('delivers.colDeliver')}</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-white/50">{t('delivers.colCity')}</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-white/50">{t('delivers.colStatus')}</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-white/50">{t('delivers.colPhones')}</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-white/50">{t('common.createdAt')}</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : delivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      {t('common.noResults')}
                    </td>
                  </tr>
                ) : (
                  delivers.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b last:border-0 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Deliver name + avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {d.avatar ? (
                            <img
                              src={absUrl(d.avatar)}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover shrink-0 bg-slate-100"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center shrink-0">
                              <Truck className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <span className="font-medium text-slate-900 dark:text-white">
                            {d.first_name} {d.last_name}
                          </span>
                        </div>
                      </td>
                      {/* City */}
                      <td className="px-4 py-3 text-slate-600 dark:text-white/70">
                        {d.city?.name ?? <span className="text-slate-400">—</span>}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge variant={d.status === 1 ? 'success' : 'secondary'}>
                          {d.status === 1 ? t('delivers.statusOnline') : t('delivers.statusOffline')}
                        </Badge>
                      </td>
                      {/* Phones */}
                      <td className="px-4 py-3 text-slate-600 dark:text-white/70">
                        {Array.isArray(d.phones) && d.phones.length > 0
                          ? d.phones.join(', ')
                          : <span className="text-slate-400">{t('delivers.noPhone')}</span>
                        }
                      </td>
                      {/* Created */}
                      <td className="px-4 py-3 text-slate-500 dark:text-white/50 whitespace-nowrap">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setModal({ open: true, deliver: d })}>
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(d)}
                            >
                              {t('common.delete')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-700 font-semibold"
                              onClick={() => handleForceDelete(d)}
                            >
                              {t('common.forceDelete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-white/50">
          <span>{t('common.page', { current: page, total: totalPages })}</span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      <DeliverModal
        key={`${modal.open}-${modal.deliver?.id ?? 'new'}`}
        open={modal.open}
        deliver={modal.deliver}
        cities={cities}
        onClose={() => setModal({ open: false, deliver: null })}
        onSaved={() => {
          setModal({ open: false, deliver: null })
          toast.success(modal.deliver ? t('toast.updated') : t('toast.created'))
          refresh()
        }}
      />
    </div>
  )
}
