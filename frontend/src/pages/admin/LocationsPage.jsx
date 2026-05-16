import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw, Pencil, Trash2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from '@/components/ui/dialog'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

// ─── Shared ────────────────────────────────────────────────────────────────────

const LOC_ACTIVE   = 0
const LOC_INACTIVE = 99

function LocBadge({ status }) {
  const { t } = useTranslation()
  return status === LOC_ACTIVE
    ? <Badge variant="success">{t('locations.statusActive')}</Badge>
    : <Badge variant="secondary">{t('locations.statusInactive')}</Badge>
}

// Generic toolbar: search + status filter + optional parent filter + refresh + count + add button
function LocToolbar({ search, onSearch, statusFilter, onStatus, parentFilter, onParent, parentOptions, parentPlaceholder, loading, onRefresh, total, addLabel, onAdd }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-40 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder={t('common.search')} className="pl-9"
          value={search} onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <Select value={statusFilter} onChange={(e) => onStatus(e.target.value)} className="w-36">
        <option value="">{t('locations.filterStatus')}</option>
        <option value={LOC_ACTIVE}>{t('locations.statusActive')}</option>
        <option value={LOC_INACTIVE}>{t('locations.statusInactive')}</option>
      </Select>
      {parentOptions && (
        <Select value={parentFilter} onChange={(e) => onParent(e.target.value)} className="w-44">
          <option value="">{parentPlaceholder}</option>
          {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      )}
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onRefresh}>
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
      <span className="text-sm text-slate-500 ml-auto">{t('locations.totalCount', { count: total })}</span>
      <Button size="sm" className="gap-1" onClick={onAdd}>
        <Plus className="h-4 w-4" /> {addLabel}
      </Button>
    </div>
  )
}

// Generic table wrapper with empty/loading states and pagination
function LocTable({ loading, items, headers, renderRow, page, totalPages, onPage }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                {headers.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr><td colSpan={headers.length + 1} className="px-4 py-10 text-center text-slate-400">{t('common.loading')}</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 1} className="px-4 py-16 text-center">
                    <MapPin className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">{t('common.noResults')}</p>
                  </td>
                </tr>
              ) : items.map(renderRow)}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-slate-500">
            <span>{t('common.page', { current: page, total: totalPages })}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>{t('common.previous')}</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>{t('common.next')}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Shared row action buttons
function RowActions({ onEdit, onDelete }) {
  return (
    <td className="px-4 py-3">
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </td>
  )
}

// Shared useLocList hook
function useLocList(apiFn, deps) {
  const [items,       setItems]       = useState([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFn()
      .then(({ data }) => {
        if (cancelled) return
        setItems(data.data  ?? [])
        setTotal(data.count ?? 0)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setItems([]); setLoading(false) } })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshTick])

  function refresh() { setRefreshTick((k) => k + 1) }
  return { items, total, loading, refresh }
}

// ─── Countries ────────────────────────────────────────────────────────────────

function CountryModal({ open, item, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form,   setForm]   = useState(() => ({
    name: item?.name ?? '', code: item?.code ?? '', order: item?.order ?? '', status: item?.status ?? LOC_ACTIVE,
  }))
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const payload = {
        name:   form.name.trim(),
        code:   form.code.trim() || null,
        order:  form.order !== '' ? Number(form.order) : null,
        status: Number(form.status),
      }
      item ? await AdminApi.countries.update(item.id, payload) : await AdminApi.countries.create(payload)
      onSaved(!!item)
    } catch (e) { setError(e.response?.data?.message ?? 'Error') }
    finally     { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{item ? t('locations.editCountry') : t('locations.addCountry')}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          <FormField label={t('locations.name')} required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('locations.code')}>
              <Input value={form.code} onChange={(e) => set('code', e.target.value)} maxLength={10} />
            </FormField>
            <FormField label={t('locations.order')}>
              <Input type="number" min={0} value={form.order} onChange={(e) => set('order', e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('locations.status')}>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value={LOC_ACTIVE}>{t('locations.statusActive')}</option>
              <option value={LOC_INACTIVE}>{t('locations.statusInactive')}</option>
            </Select>
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? '…' : item ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CountriesTab() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState({ open: false, item: null })
  const limit = 20

  const { items, total, loading, refresh } = useLocList(
    () => {
      const p = { limit, skip: (page - 1) * limit }
      if (search)              p.text   = search
      if (statusFilter !== '') p.status = statusFilter
      return AdminApi.countries.getAll(p)
    },
    [page, search, statusFilter],
  )

  async function handleDelete(item) {
    if (!window.confirm(t('locations.confirmDelete'))) return
    try { await AdminApi.countries.delete(item.id); toast.success(t('toast.deleted')); refresh() }
    catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
  }

  return (
    <div className="space-y-4">
      <LocToolbar
        search={search} onSearch={(v) => { setSearch(v); setPage(1) }}
        statusFilter={statusFilter} onStatus={(v) => { setStatusFilter(v); setPage(1) }}
        loading={loading} onRefresh={refresh}
        total={total} addLabel={t('locations.addCountry')} onAdd={() => setModal({ open: true, item: null })}
      />
      <LocTable
        loading={loading} items={items} page={page} totalPages={Math.ceil(total / limit)} onPage={setPage}
        headers={[t('locations.colName'), t('locations.colCode'), t('locations.colOrder'), t('locations.colStatus')]}
        renderRow={(item) => (
          <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{item.code || '—'}</td>
            <td className="px-4 py-3 text-slate-500">{item.order ?? '—'}</td>
            <td className="px-4 py-3"><LocBadge status={item.status} /></td>
            <RowActions onEdit={() => setModal({ open: true, item })} onDelete={() => handleDelete(item)} />
          </tr>
        )}
      />
      <CountryModal
        key={modal.open ? (modal.item?.id ?? 'create') : 'closed'}
        open={modal.open} item={modal.item}
        onClose={() => setModal({ open: false, item: null })}
        onSaved={(isEdit) => { toast.success(t(isEdit ? 'toast.updated' : 'toast.created')); setModal({ open: false, item: null }); refresh() }}
      />
    </div>
  )
}

// ─── Regions ──────────────────────────────────────────────────────────────────

function RegionModal({ open, item, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form,   setForm]   = useState(() => ({
    name: item?.name ?? '', short_name: item?.short_name ?? '',
    order: item?.order ?? '', status: item?.status ?? LOC_ACTIVE,
  }))
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const payload = {
        name:       form.name.trim(),
        short_name: form.short_name.trim(),
        order:      form.order !== '' ? Number(form.order) : null,
        status:     Number(form.status),
      }
      item ? await AdminApi.regions.update(item.id, payload) : await AdminApi.regions.create(payload)
      onSaved(!!item)
    } catch (e) { setError(e.response?.data?.message ?? 'Error') }
    finally     { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{item ? t('locations.editRegion') : t('locations.addRegion')}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          <FormField label={t('locations.name')} required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </FormField>
          <FormField label={t('locations.shortName')} required>
            <Input value={form.short_name} onChange={(e) => set('short_name', e.target.value)} maxLength={2} placeholder="TM" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('locations.order')}>
              <Input type="number" min={0} value={form.order} onChange={(e) => set('order', e.target.value)} />
            </FormField>
            <FormField label={t('locations.status')}>
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value={LOC_ACTIVE}>{t('locations.statusActive')}</option>
                <option value={LOC_INACTIVE}>{t('locations.statusInactive')}</option>
              </Select>
            </FormField>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.short_name.trim()}>
            {saving ? '…' : item ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RegionsTab() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState({ open: false, item: null })
  const limit = 20

  const { items, total, loading, refresh } = useLocList(
    () => {
      const p = { limit, skip: (page - 1) * limit }
      if (search)              p.text   = search
      if (statusFilter !== '') p.status = statusFilter
      return AdminApi.regions.getAll(p)
    },
    [page, search, statusFilter],
  )

  async function handleDelete(item) {
    if (!window.confirm(t('locations.confirmDelete'))) return
    try { await AdminApi.regions.delete(item.id); toast.success(t('toast.deleted')); refresh() }
    catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
  }

  return (
    <div className="space-y-4">
      <LocToolbar
        search={search} onSearch={(v) => { setSearch(v); setPage(1) }}
        statusFilter={statusFilter} onStatus={(v) => { setStatusFilter(v); setPage(1) }}
        loading={loading} onRefresh={refresh}
        total={total} addLabel={t('locations.addRegion')} onAdd={() => setModal({ open: true, item: null })}
      />
      <LocTable
        loading={loading} items={items} page={page} totalPages={Math.ceil(total / limit)} onPage={setPage}
        headers={[t('locations.colName'), t('locations.colShortName'), t('locations.colOrder'), t('locations.colStatus')]}
        renderRow={(item) => (
          <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{item.short_name || '—'}</td>
            <td className="px-4 py-3 text-slate-500">{item.order ?? '—'}</td>
            <td className="px-4 py-3"><LocBadge status={item.status} /></td>
            <RowActions onEdit={() => setModal({ open: true, item })} onDelete={() => handleDelete(item)} />
          </tr>
        )}
      />
      <RegionModal
        key={modal.open ? (modal.item?.id ?? 'create') : 'closed'}
        open={modal.open} item={modal.item}
        onClose={() => setModal({ open: false, item: null })}
        onSaved={(isEdit) => { toast.success(t(isEdit ? 'toast.updated' : 'toast.created')); setModal({ open: false, item: null }); refresh() }}
      />
    </div>
  )
}

// ─── Cities ───────────────────────────────────────────────────────────────────
// Backend filter key: `region` (not region_id); body field: `region`

function CityModal({ open, item, regions, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form,   setForm]   = useState(() => ({
    name: item?.name ?? '', code: item?.code ?? '',
    region: item?.region_id ?? item?.region ?? '',
    order: item?.order ?? '', status: item?.status ?? LOC_ACTIVE,
  }))
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const payload = {
        name:   form.name.trim(),
        code:   form.code.trim() || null,
        region: Number(form.region),
        order:  form.order !== '' ? Number(form.order) : null,
        status: Number(form.status),
      }
      item ? await AdminApi.cities.update(item.id, payload) : await AdminApi.cities.create(payload)
      onSaved(!!item)
    } catch (e) { setError(e.response?.data?.message ?? 'Error') }
    finally     { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{item ? t('locations.editCity') : t('locations.addCity')}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          <FormField label={t('locations.name')} required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </FormField>
          <FormField label={t('locations.region')} required>
            <Select value={form.region} onChange={(e) => set('region', e.target.value)}>
              <option value="">{t('locations.selectRegion')}</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('locations.code')}>
              <Input value={form.code} onChange={(e) => set('code', e.target.value)} maxLength={10} />
            </FormField>
            <FormField label={t('locations.order')}>
              <Input type="number" min={0} value={form.order} onChange={(e) => set('order', e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('locations.status')}>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value={LOC_ACTIVE}>{t('locations.statusActive')}</option>
              <option value={LOC_INACTIVE}>{t('locations.statusInactive')}</option>
            </Select>
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.region}>
            {saving ? '…' : item ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CitiesTab() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [regions, setRegions] = useState([])
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState({ open: false, item: null })
  const limit = 20

  useEffect(() => {
    AdminApi.regions.getAll({ limit: 500, status: LOC_ACTIVE })
      .then(({ data }) => setRegions(data.data ?? []))
      .catch(() => {})
  }, [])

  const { items, total, loading, refresh } = useLocList(
    () => {
      const p = { limit, skip: (page - 1) * limit }
      if (search)              p.text   = search
      if (statusFilter !== '') p.status = statusFilter
      if (regionFilter)        p.region = regionFilter
      return AdminApi.cities.getAll(p)
    },
    [page, search, statusFilter, regionFilter],
  )

  async function handleDelete(item) {
    if (!window.confirm(t('locations.confirmDelete'))) return
    try { await AdminApi.cities.delete(item.id); toast.success(t('toast.deleted')); refresh() }
    catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
  }

  return (
    <div className="space-y-4">
      <LocToolbar
        search={search} onSearch={(v) => { setSearch(v); setPage(1) }}
        statusFilter={statusFilter} onStatus={(v) => { setStatusFilter(v); setPage(1) }}
        parentFilter={regionFilter} onParent={(v) => { setRegionFilter(v); setPage(1) }}
        parentOptions={regions} parentPlaceholder={t('locations.filterRegion')}
        loading={loading} onRefresh={refresh}
        total={total} addLabel={t('locations.addCity')} onAdd={() => setModal({ open: true, item: null })}
      />
      <LocTable
        loading={loading} items={items} page={page} totalPages={Math.ceil(total / limit)} onPage={setPage}
        headers={[t('locations.colName'), t('locations.colRegion'), t('locations.colCode'), t('locations.colStatus')]}
        renderRow={(item) => (
          <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
            <td className="px-4 py-3 text-slate-500 text-sm">{item._region?.name ?? '—'}</td>
            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{item.code || '—'}</td>
            <td className="px-4 py-3"><LocBadge status={item.status} /></td>
            <RowActions onEdit={() => setModal({ open: true, item })} onDelete={() => handleDelete(item)} />
          </tr>
        )}
      />
      <CityModal
        key={modal.open ? (modal.item?.id ?? 'create') : 'closed'}
        open={modal.open} item={modal.item} regions={regions}
        onClose={() => setModal({ open: false, item: null })}
        onSaved={(isEdit) => { toast.success(t(isEdit ? 'toast.updated' : 'toast.created')); setModal({ open: false, item: null }); refresh() }}
      />
    </div>
  )
}

// ─── Districts ────────────────────────────────────────────────────────────────
// Backend filter key: `region`; body field: `region`

function DistrictModal({ open, item, regions, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form,   setForm]   = useState(() => ({
    name: item?.name ?? '', region: item?.region_id ?? item?.region ?? '',
    type: item?.type ?? 0, order: item?.order ?? '', status: item?.status ?? LOC_ACTIVE,
  }))
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const payload = {
        name:   form.name.trim(),
        region: Number(form.region),
        type:   Number(form.type),
        order:  form.order !== '' ? Number(form.order) : null,
        status: Number(form.status),
      }
      item ? await AdminApi.districts.update(item.id, payload) : await AdminApi.districts.create(payload)
      onSaved(!!item)
    } catch (e) { setError(e.response?.data?.message ?? 'Error') }
    finally     { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{item ? t('locations.editDistrict') : t('locations.addDistrict')}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          <FormField label={t('locations.name')} required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </FormField>
          <FormField label={t('locations.region')} required>
            <Select value={form.region} onChange={(e) => set('region', e.target.value)}>
              <option value="">{t('locations.selectRegion')}</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label={t('locations.type')}>
              <Input type="number" min={0} value={form.type} onChange={(e) => set('type', e.target.value)} />
            </FormField>
            <FormField label={t('locations.order')}>
              <Input type="number" min={0} value={form.order} onChange={(e) => set('order', e.target.value)} />
            </FormField>
            <FormField label={t('locations.status')}>
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value={LOC_ACTIVE}>{t('locations.statusActive')}</option>
                <option value={LOC_INACTIVE}>{t('locations.statusInactive')}</option>
              </Select>
            </FormField>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.region}>
            {saving ? '…' : item ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DistrictsTab() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [regions, setRegions] = useState([])
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState({ open: false, item: null })
  const limit = 20

  useEffect(() => {
    AdminApi.regions.getAll({ limit: 500, status: LOC_ACTIVE })
      .then(({ data }) => setRegions(data.data ?? []))
      .catch(() => {})
  }, [])

  const { items, total, loading, refresh } = useLocList(
    () => {
      const p = { limit, skip: (page - 1) * limit }
      if (search)              p.text   = search
      if (statusFilter !== '') p.status = statusFilter
      if (regionFilter)        p.region = regionFilter
      return AdminApi.districts.getAll(p)
    },
    [page, search, statusFilter, regionFilter],
  )

  async function handleDelete(item) {
    if (!window.confirm(t('locations.confirmDelete'))) return
    try { await AdminApi.districts.delete(item.id); toast.success(t('toast.deleted')); refresh() }
    catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
  }

  return (
    <div className="space-y-4">
      <LocToolbar
        search={search} onSearch={(v) => { setSearch(v); setPage(1) }}
        statusFilter={statusFilter} onStatus={(v) => { setStatusFilter(v); setPage(1) }}
        parentFilter={regionFilter} onParent={(v) => { setRegionFilter(v); setPage(1) }}
        parentOptions={regions} parentPlaceholder={t('locations.filterRegion')}
        loading={loading} onRefresh={refresh}
        total={total} addLabel={t('locations.addDistrict')} onAdd={() => setModal({ open: true, item: null })}
      />
      <LocTable
        loading={loading} items={items} page={page} totalPages={Math.ceil(total / limit)} onPage={setPage}
        headers={[t('locations.colName'), t('locations.colRegion'), t('locations.colType'), t('locations.colStatus')]}
        renderRow={(item) => (
          <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
            <td className="px-4 py-3 text-slate-500 text-sm">{item._region?.name ?? '—'}</td>
            <td className="px-4 py-3 text-slate-500 text-sm">{item.type ?? '—'}</td>
            <td className="px-4 py-3"><LocBadge status={item.status} /></td>
            <RowActions onEdit={() => setModal({ open: true, item })} onDelete={() => handleDelete(item)} />
          </tr>
        )}
      />
      <DistrictModal
        key={modal.open ? (modal.item?.id ?? 'create') : 'closed'}
        open={modal.open} item={modal.item} regions={regions}
        onClose={() => setModal({ open: false, item: null })}
        onSaved={(isEdit) => { toast.success(t(isEdit ? 'toast.updated' : 'toast.created')); setModal({ open: false, item: null }); refresh() }}
      />
    </div>
  )
}

// ─── Villages ─────────────────────────────────────────────────────────────────
// Backend filter key: `district`; body field: `district`

function VillageModal({ open, item, districts, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form,   setForm]   = useState(() => ({
    name: item?.name ?? '', district: item?.district_id ?? item?.district ?? '',
    type: item?.type ?? 0, order: item?.order ?? '', status: item?.status ?? LOC_ACTIVE,
  }))
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const payload = {
        name:     form.name.trim(),
        district: Number(form.district),
        type:     Number(form.type),
        order:    form.order !== '' ? Number(form.order) : null,
        status:   Number(form.status),
      }
      item ? await AdminApi.villages.update(item.id, payload) : await AdminApi.villages.create(payload)
      onSaved(!!item)
    } catch (e) { setError(e.response?.data?.message ?? 'Error') }
    finally     { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{item ? t('locations.editVillage') : t('locations.addVillage')}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          <FormField label={t('locations.name')} required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </FormField>
          <FormField label={t('locations.district')} required>
            <Select value={form.district} onChange={(e) => set('district', e.target.value)}>
              <option value="">{t('locations.selectDistrict')}</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label={t('locations.type')}>
              <Input type="number" min={0} value={form.type} onChange={(e) => set('type', e.target.value)} />
            </FormField>
            <FormField label={t('locations.order')}>
              <Input type="number" min={0} value={form.order} onChange={(e) => set('order', e.target.value)} />
            </FormField>
            <FormField label={t('locations.status')}>
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value={LOC_ACTIVE}>{t('locations.statusActive')}</option>
                <option value={LOC_INACTIVE}>{t('locations.statusInactive')}</option>
              </Select>
            </FormField>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.district}>
            {saving ? '…' : item ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function VillagesTab() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [districts, setDistricts] = useState([])
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState({ open: false, item: null })
  const limit = 20

  useEffect(() => {
    AdminApi.districts.getAll({ limit: 1000, status: LOC_ACTIVE })
      .then(({ data }) => setDistricts(data.data ?? []))
      .catch(() => {})
  }, [])

  const { items, total, loading, refresh } = useLocList(
    () => {
      const p = { limit, skip: (page - 1) * limit }
      if (search)               p.text     = search
      if (statusFilter !== '')  p.status   = statusFilter
      if (districtFilter)       p.district = districtFilter
      return AdminApi.villages.getAll(p)
    },
    [page, search, statusFilter, districtFilter],
  )

  async function handleDelete(item) {
    if (!window.confirm(t('locations.confirmDelete'))) return
    try { await AdminApi.villages.delete(item.id); toast.success(t('toast.deleted')); refresh() }
    catch (e) { toast.error(e.response?.data?.message ?? t('toast.error')) }
  }

  return (
    <div className="space-y-4">
      <LocToolbar
        search={search} onSearch={(v) => { setSearch(v); setPage(1) }}
        statusFilter={statusFilter} onStatus={(v) => { setStatusFilter(v); setPage(1) }}
        parentFilter={districtFilter} onParent={(v) => { setDistrictFilter(v); setPage(1) }}
        parentOptions={districts} parentPlaceholder={t('locations.filterDistrict')}
        loading={loading} onRefresh={refresh}
        total={total} addLabel={t('locations.addVillage')} onAdd={() => setModal({ open: true, item: null })}
      />
      <LocTable
        loading={loading} items={items} page={page} totalPages={Math.ceil(total / limit)} onPage={setPage}
        headers={[t('locations.colName'), t('locations.colDistrict'), t('locations.colType'), t('locations.colStatus')]}
        renderRow={(item) => (
          <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
            <td className="px-4 py-3 text-slate-500 text-sm">{item._district?.name ?? '—'}</td>
            <td className="px-4 py-3 text-slate-500 text-sm">{item.type ?? '—'}</td>
            <td className="px-4 py-3"><LocBadge status={item.status} /></td>
            <RowActions onEdit={() => setModal({ open: true, item })} onDelete={() => handleDelete(item)} />
          </tr>
        )}
      />
      <VillageModal
        key={modal.open ? (modal.item?.id ?? 'create') : 'closed'}
        open={modal.open} item={modal.item} districts={districts}
        onClose={() => setModal({ open: false, item: null })}
        onSaved={(isEdit) => { toast.success(t(isEdit ? 'toast.updated' : 'toast.created')); setModal({ open: false, item: null }); refresh() }}
      />
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{t('locations.title')}</h2>
      </div>
      <Tabs defaultValue="countries">
        <TabsList>
          <TabsTrigger value="countries">{t('locations.tabCountries')}</TabsTrigger>
          <TabsTrigger value="regions">{t('locations.tabRegions')}</TabsTrigger>
          <TabsTrigger value="cities">{t('locations.tabCities')}</TabsTrigger>
          <TabsTrigger value="districts">{t('locations.tabDistricts')}</TabsTrigger>
          <TabsTrigger value="villages">{t('locations.tabVillages')}</TabsTrigger>
        </TabsList>
        <TabsContent value="countries"><CountriesTab /></TabsContent>
        <TabsContent value="regions"><RegionsTab /></TabsContent>
        <TabsContent value="cities"><CitiesTab /></TabsContent>
        <TabsContent value="districts"><DistrictsTab /></TabsContent>
        <TabsContent value="villages"><VillagesTab /></TabsContent>
      </Tabs>
    </div>
  )
}
