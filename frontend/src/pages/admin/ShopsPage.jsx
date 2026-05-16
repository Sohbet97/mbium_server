import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw, MoreHorizontal, Star, Store } from 'lucide-react'
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
import { MultiLangInput } from '@/components/common/MultiLangInput'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

// ── Shop Modal (create / edit) ────────────────────────────────────────────────
// Parent passes a `key` prop to remount on open/shop change — no useEffect needed.

const EMPTY_FORM = {
  name: '', name_ru: '', name_eng: '',
  type_id: '', is_active: true, order: '',
}

function buildForm(shop) {
  if (!shop) return EMPTY_FORM
  return {
    name:      shop.name      ?? '',
    name_ru:   shop.name_ru   ?? '',
    name_eng:  shop.name_eng  ?? '',
    type_id:   shop.type_id   ?? '',
    is_active: shop.is_active ?? true,
    order:     shop.order     ?? '',
  }
}

function ShopModal({ open, shop, shopTypes, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm]     = useState(() => buildForm(shop))
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(field, val) { setForm((f) => ({ ...f, [field]: val })) }

  const isValid = Boolean(form.name.trim() && form.type_id)

  async function handleSave() {
    if (!isValid) return
    setError(''); setSaving(true)
    try {
      const payload = {
        name:      form.name.trim(),
        name_ru:   form.name_ru.trim()  || null,
        name_eng:  form.name_eng.trim() || null,
        type_id:   Number(form.type_id),
        is_active: form.is_active,
        order:     form.order !== '' ? Number(form.order) : null,
      }
      if (shop) {
        await AdminApi.shops.update(shop.id, payload)
      } else {
        await AdminApi.shops.create(payload)
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
          <DialogTitle>{shop ? t('shops.editShop') : t('shops.createShop')}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
          )}

          <MultiLangInput
            baseField="name" label={t('shops.name')} required
            values={form} onChange={set}
          />

          <FormField label={t('shops.type')} required>
            <Select value={form.type_id} onChange={(e) => set('type_id', e.target.value)}>
              <option value="">{t('shops.noType')}</option>
              {shopTypes.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('shops.order')}>
              <Input
                type="number" min={0} max={1000}
                value={form.order}
                onChange={(e) => set('order', e.target.value)}
                placeholder="0"
              />
            </FormField>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label>{t('shops.isActive')}</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => set('is_active', v)}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {saving ? '…' : shop ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ShopsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [shops,        setShops]        = useState([])
  const [shopTypes,    setShopTypes]    = useState([])
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [showDeleted,  setShowDeleted]  = useState(false)
  const [refreshTick,  setRefreshTick]  = useState(0)
  const [modal,        setModal]        = useState({ open: false, shop: null })
  const limit = 20

  // Fetch shops — all setState in async callbacks to satisfy linter
  useEffect(() => {
    let cancelled = false
    const params = { limit, skip: (page - 1) * limit }
    if (search)              params.text      = search
    if (activeFilter !== '') params.is_active = activeFilter
    if (showDeleted)         params.paranoid  = 'true'

    AdminApi.shops.getAll(params)
      .then(({ data }) => {
        if (cancelled) return
        setShops(data.data  ?? [])
        setTotal(data.count ?? 0)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setShops([])
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [page, search, activeFilter, showDeleted, refreshTick])

  // Fetch shop types once for the modal dropdown
  useEffect(() => {
    AdminApi.shopTypes.getAll({ limit: 200 })
      .then(({ data }) => setShopTypes(data.data ?? []))
      .catch(() => {})
  }, [])

  function refresh() { setLoading(true); setRefreshTick((k) => k + 1) }
  function handleSearchChange(val) { setSearch(val); setLoading(true); setPage(1) }
  function handleActiveChange(val) { setActiveFilter(val); setLoading(true); setPage(1) }
  function handlePageChange(next) { setPage(next); setLoading(true) }
  function toggleDeleted() { setShowDeleted((v) => !v); setLoading(true); setPage(1) }

  async function handleDelete(shop) {
    if (!window.confirm(t('shops.confirmDelete'))) return
    try {
      await AdminApi.shops.delete(shop.id)
      toast.success(t('toast.deleted'))
      refresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  async function handleRestore(shop) {
    if (!window.confirm(t('shops.confirmRestore'))) return
    try {
      await AdminApi.shops.restore(shop.id)
      toast.success(t('toast.updated'))
      refresh()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  async function handleForceDelete(shop) {
    if (!window.confirm(t('shops.confirmForceDelete'))) return
    try {
      await AdminApi.shops.forceDelete(shop.id)
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
          <h2 className="text-xl font-semibold text-slate-900">{t('shops.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('shops.totalCount', { count: total })}</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setModal({ open: true, shop: null })}>
          <Plus className="h-4 w-4" /> {t('shops.addShop')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('shops.searchPlaceholder')}
            className="pl-9"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Select
          value={activeFilter}
          onChange={(e) => handleActiveChange(e.target.value)}
          className="w-40"
        >
          <option value="">{t('shops.filterStatus')}</option>
          <option value="true">{t('common.active')}</option>
          <option value="false">{t('common.inactive')}</option>
        </Select>
        <Button
          variant={showDeleted ? 'default' : 'outline'}
          size="sm"
          onClick={toggleDeleted}
        >
          {t('shops.showDeleted')}
        </Button>
        <Button variant="ghost" size="icon" onClick={refresh} className="h-9 w-9" title={t('common.refresh')}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">{t('shops.colShop')}</th>
                  <th className="px-4 py-3">{t('shops.colType')}</th>
                  <th className="px-4 py-3">{t('shops.colStatus')}</th>
                  <th className="px-4 py-3">{t('shops.colRating')}</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {loading && shops.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : shops.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <Store className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{t('common.noResults')}</p>
                    </td>
                  </tr>
                ) : shops.map((shop) => (
                  <tr
                    key={shop.id}
                    className={`border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${shop.deletedAt ? 'opacity-60' : ''}`}
                    onClick={() => navigate(`/admin/shops/${shop.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {shop.logo
                          ? <img src={shop.logo} alt="" className="h-10 w-10 rounded object-cover border" />
                          : (
                            <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold">
                              {shop.name?.[0]?.toUpperCase()}
                            </div>
                          )
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{shop.name}</p>
                          <p className="text-xs text-slate-400">{shop.phone || shop.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{shop.type?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={shop.is_active ? 'success' : 'secondary'}>
                          {shop.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                        {shop.is_verified && (
                          <Badge variant="outline" className="text-xs">{t('common.verified')}</Badge>
                        )}
                        {shop.deletedAt && (
                          <Badge variant="destructive" className="text-xs">{t('common.deleted')}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-slate-600">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        {Number(shop.rating ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {!shop.deletedAt ? (
                            <>
                              <DropdownMenuItem onClick={() => setModal({ open: true, shop })}>
                                {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(shop)}
                              >
                                {t('common.delete')}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => handleRestore(shop)}>
                                {t('common.restore')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleForceDelete(shop)}
                              >
                                {t('common.forceDelete')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-slate-500">
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
        </CardContent>
      </Card>

      {/* Key remounts the modal on open/shop change so form state is fresh */}
      <ShopModal
        key={modal.open ? (modal.shop?.id ?? 'create') : 'closed'}
        open={modal.open}
        shop={modal.shop}
        shopTypes={shopTypes}
        onClose={() => setModal({ open: false, shop: null })}
        onSaved={() => { toast.success(t(modal.shop ? 'toast.updated' : 'toast.created')); setModal({ open: false, shop: null }); refresh() }}
      />
    </div>
  )
}
