import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Plus, Pencil, Trash2, Package, ArrowLeftRight, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { AdminApi } from '@/lib/api'
import { toast } from 'sonner'

const TYPE_COLORS = {
  INBOUND:    'bg-green-100 text-green-700',
  OUTBOUND:   'bg-red-100 text-red-700',
  ADJUSTMENT: 'bg-blue-100 text-blue-700',
  RETURN:     'bg-yellow-100 text-yellow-700',
}

const ADJUST_TYPES = ['INBOUND', 'ADJUSTMENT', 'RETURN', 'OUTBOUND']

function WarehouseFormModal({ open, onClose, onSaved, initial }) {
  const { t } = useTranslation()
  const [shops, setShops] = useState([])
  const [form, setForm] = useState({ shop_id: '', name: '', address: '', city: '', contact_phone: '', is_active: true, is_default: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    AdminApi.shops.getAll({ limit: 200 }).then(r => setShops(r.data?.data ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (initial) {
      setForm({ shop_id: initial.shop_id ?? '', name: initial.name ?? '', address: initial.address ?? '', city: initial.city ?? '', contact_phone: initial.contact_phone ?? '', is_active: initial.is_active ?? true, is_default: initial.is_default ?? false })
    } else {
      setForm({ shop_id: '', name: '', address: '', city: '', contact_phone: '', is_active: true, is_default: false })
    }
  }, [initial, open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) return toast.error(t('warehouses.warehouseName') + ' required')
    setSaving(true)
    try {
      if (initial) {
        await AdminApi.warehouses.update(initial.id, form)
      } else {
        if (!form.shop_id) return toast.error('Shop required')
        await AdminApi.warehouses.create(form)
      }
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? t('warehouses.editWarehouse') : t('warehouses.addWarehouse')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {!initial && (
            <div>
              <Label className="mb-1 block text-xs">Shop *</Label>
              <select value={form.shop_id} onChange={e => set('shop_id', e.target.value)} className="w-full text-sm border rounded-md px-3 py-2 dark:bg-[#1c1c1f] dark:border-white/10 dark:text-white">
                <option value="">— Select shop —</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <Label className="mb-1 block text-xs">{t('warehouses.warehouseName')} *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">{t('warehouses.city')}</Label>
            <Input value={form.city} onChange={e => set('city', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">{t('warehouses.address')}</Label>
            <Input value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">{t('warehouses.contactPhone')}</Label>
            <Input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} id="wh-active" />
            <Label htmlFor="wh-active" className="text-sm">{t('warehouses.isActive')}</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_default} onCheckedChange={v => set('is_default', v)} id="wh-default" />
            <Label htmlFor="wh-default" className="text-sm">{t('warehouses.isDefault')}</Label>
          </div>
          {form.is_default && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('warehouses.isDefaultHint')}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={submit} disabled={saving}>{saving ? '…' : t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AdjustStockModal({ open, onClose, onSaved, warehouseId, levelRow }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ product_id: '', variant_id: null, quantity: 1, type: 'INBOUND', note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (levelRow) {
      setForm({ product_id: levelRow.product_id, variant_id: levelRow.variant_id ?? null, quantity: 1, type: 'INBOUND', note: '' })
    }
  }, [levelRow, open])

  const submit = async () => {
    setSaving(true)
    try {
      await AdminApi.inventory.adjust({ ...form, warehouse_id: warehouseId })
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Error')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{t('warehouses.adjustTitle')}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          {!levelRow && (
            <div>
              <Label className="mb-1 block text-xs">Product ID</Label>
              <Input type="number" value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: Number(e.target.value) }))} />
            </div>
          )}
          <div>
            <Label className="mb-1 block text-xs">{t('warehouses.adjustType')}</Label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full text-sm border rounded-md px-3 py-2 dark:bg-[#1c1c1f] dark:border-white/10 dark:text-white">
              {ADJUST_TYPES.map(tp => (
                <option key={tp} value={tp}>{t(`warehouses.type${tp.charAt(0) + tp.slice(1).toLowerCase()}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">{t('warehouses.adjustQty')}</Label>
            <Input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">{t('warehouses.adjustNote')}</Label>
            <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={submit} disabled={saving}>{saving ? '…' : t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InventoryTab({ warehouseId }) {
  const { t } = useTranslation()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [adjustModal, setAdjustModal] = useState({ open: false, row: null })

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.inventory.getAll({ warehouse_id: warehouseId, limit: 100 })
      .then(r => setData(r.data?.data ?? []))
      .finally(() => setLoading(false))
  }, [warehouseId])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setAdjustModal({ open: true, row: null })}>
          <Plus className="h-3.5 w-3.5 mr-1" />{t('warehouses.adjust')}
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-8 text-slate-400 text-sm">{t('common.loading')}</div>
      ) : !data.length ? (
        <div className="text-center py-8 text-slate-400 text-sm">{t('warehouses.noInventory')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b dark:border-white/10">
                <th className="text-left py-2 pr-4">{t('warehouses.colProduct')}</th>
                <th className="text-left py-2 pr-4">{t('warehouses.colVariant')}</th>
                <th className="text-right py-2 pr-4">{t('warehouses.colQuantity')}</th>
                <th className="text-right py-2 pr-4">{t('warehouses.colReserved')}</th>
                <th className="text-right py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-b dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="py-2 pr-4 font-medium dark:text-white">{row.product?.name ?? `#${row.product_id}`}</td>
                  <td className="py-2 pr-4 text-slate-500">{row.variant?.name ?? '—'}</td>
                  <td className="py-2 pr-4 text-right font-mono">{row.quantity}</td>
                  <td className="py-2 pr-4 text-right font-mono text-slate-400">{row.reserved}</td>
                  <td className="py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setAdjustModal({ open: true, row })}>
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdjustStockModal
        open={adjustModal.open}
        onClose={() => setAdjustModal({ open: false, row: null })}
        onSaved={load}
        warehouseId={warehouseId}
        levelRow={adjustModal.row}
      />
    </div>
  )
}

function MovementsTab({ warehouseId }) {
  const { t } = useTranslation()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    AdminApi.stockMovements.getAll({ warehouse_id: warehouseId, limit: 100 })
      .then(r => setData(r.data?.data ?? []))
      .finally(() => setLoading(false))
  }, [warehouseId])

  useEffect(() => { load() }, [load])

  return loading ? (
    <div className="text-center py-8 text-slate-400 text-sm">{t('common.loading')}</div>
  ) : !data.length ? (
    <div className="text-center py-8 text-slate-400 text-sm">{t('warehouses.noMovements')}</div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-500 border-b dark:border-white/10">
            <th className="text-left py-2 pr-4">{t('warehouses.colDate')}</th>
            <th className="text-left py-2 pr-4">{t('warehouses.colType')}</th>
            <th className="text-left py-2 pr-4">{t('warehouses.colProduct')}</th>
            <th className="text-right py-2 pr-4">{t('warehouses.colBefore')}</th>
            <th className="text-right py-2 pr-4">{t('warehouses.colQuantity')}</th>
            <th className="text-right py-2 pr-4">{t('warehouses.colAfter')}</th>
            <th className="text-left py-2">{t('warehouses.colNote')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map(m => (
            <tr key={m.id} className="border-b dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
              <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
              <td className="py-2 pr-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[m.type] ?? 'bg-slate-100'}`}>{m.type}</span>
              </td>
              <td className="py-2 pr-4 dark:text-white">{m.product?.name ?? `#${m.product_id}`}{m.variant ? ` / ${m.variant.name}` : ''}</td>
              <td className="py-2 pr-4 text-right font-mono text-slate-400">{m.quantity_before}</td>
              <td className="py-2 pr-4 text-right font-mono font-semibold dark:text-white">{m.quantity}</td>
              <td className="py-2 pr-4 text-right font-mono">{m.quantity_after}</td>
              <td className="py-2 text-slate-500 text-xs">{m.note ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WarehouseDetail({ warehouse, onClose, onRefresh }) {
  const { t } = useTranslation()
  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {warehouse.name}
            {warehouse.is_default && <Badge variant="secondary" className="text-xs">{t('warehouses.defaultBadge')}</Badge>}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        <p className="text-xs text-slate-500">{warehouse.city}{warehouse.address ? ` · ${warehouse.address}` : ''}{warehouse.contact_phone ? ` · ${warehouse.contact_phone}` : ''}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inventory">
          <TabsList className="mb-4">
            <TabsTrigger value="inventory" className="gap-1.5"><Package className="h-3.5 w-3.5" />{t('warehouses.tabInventory')}</TabsTrigger>
            <TabsTrigger value="movements" className="gap-1.5"><ArrowLeftRight className="h-3.5 w-3.5" />{t('warehouses.tabMovements')}</TabsTrigger>
          </TabsList>
          <TabsContent value="inventory">
            <InventoryTab warehouseId={warehouse.id} />
          </TabsContent>
          <TabsContent value="movements">
            <MovementsTab warehouseId={warehouse.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default function WarehousesPage() {
  const { t } = useTranslation()
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [formModal, setFormModal] = useState({ open: false, item: null })
  const [selected, setSelected] = useState(null)
  const [shopFilter, setShopFilter] = useState('')
  const [shops, setShops] = useState([])

  useEffect(() => {
    AdminApi.shops.getAll({ limit: 200 }).then(r => setShops(r.data?.data ?? [])).catch(() => {})
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const params = { limit: 100 }
    if (shopFilter) params.shop_id = shopFilter
    AdminApi.warehouses.getAll(params)
      .then(r => setWarehouses(r.data?.data ?? []))
      .finally(() => setLoading(false))
  }, [shopFilter])

  useEffect(() => { load() }, [load])

  const handleDelete = async (w) => {
    if (!window.confirm(t('warehouses.confirmDelete'))) return
    try {
      await AdminApi.warehouses.delete(w.id)
      if (selected?.id === w.id) setSelected(null)
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Error')
    }
  }

  const handleSelect = (w) => setSelected(prev => prev?.id === w.id ? null : w)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-white flex items-center gap-2">
          <Building2 className="h-5 w-5" />{t('warehouses.title')}
        </h1>
        <Button size="sm" onClick={() => setFormModal({ open: true, item: null })}>
          <Plus className="h-4 w-4 mr-1" />{t('warehouses.addWarehouse')}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <select value={shopFilter} onChange={e => setShopFilter(e.target.value)} className="text-sm border rounded-md px-3 py-2 dark:bg-[#1c1c1f] dark:border-white/10 dark:text-white">
          <option value="">All shops</option>
          {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">{t('common.loading')}</div>
          ) : !warehouses.length ? (
            <div className="text-center py-12 text-slate-400 text-sm">{t('warehouses.noWarehouses')}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b dark:border-white/10">
                  <th className="text-left px-4 py-3">{t('common.name')}</th>
                  <th className="text-left px-4 py-3">Shop</th>
                  <th className="text-left px-4 py-3">{t('warehouses.city')}</th>
                  <th className="text-center px-4 py-3">{t('warehouses.defaultBadge')}</th>
                  <th className="text-center px-4 py-3">{t('warehouses.isActive')}</th>
                  <th className="text-right px-4 py-3">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map(w => (
                  <tr
                    key={w.id}
                    className={`border-b dark:border-white/5 cursor-pointer transition-colors ${selected?.id === w.id ? 'bg-slate-100 dark:bg-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    onClick={() => handleSelect(w)}
                  >
                    <td className="px-4 py-3 font-medium dark:text-white">{w.name}</td>
                    <td className="px-4 py-3 text-slate-500">{w.shop?.name ?? `#${w.shop_id}`}</td>
                    <td className="px-4 py-3 text-slate-500">{w.city ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {w.is_default ? <Star className="h-4 w-4 text-yellow-500 mx-auto" /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${w.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {w.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 mr-1" onClick={() => setFormModal({ open: true, item: w })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete(w)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {selected && (
        <WarehouseDetail
          warehouse={selected}
          onClose={() => setSelected(null)}
          onRefresh={load}
        />
      )}

      <WarehouseFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, item: null })}
        onSaved={load}
        initial={formModal.item}
      />
    </div>
  )
}
