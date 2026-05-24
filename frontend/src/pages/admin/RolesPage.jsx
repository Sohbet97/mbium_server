import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, RefreshCw, Pencil, Trash2, Shield, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from '@/components/ui/dialog'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Permission definitions ────────────────────────────────────────────────────
// Each group: { label, perms: [GET, POST, PUT, DELETE] }
const PERM_GROUPS = [
  { label: 'Roles',         perms: [1, 2, 3, 4] },
  { label: 'Users',         perms: [5, 6, 7, 8] },
  { label: 'Positions',     perms: [9, 10, 11, 12] },
  { label: 'Regions',       perms: [13, 14, 15, 16] },
  { label: 'Villages',      perms: [17, 18, 19, 20] },
  { label: 'Countries',     perms: [21, 22, 23, 24] },
  { label: 'Categories',    perms: [25, 26, 27, 28] },
  { label: 'Products',      perms: [29, 30, 31, 32] },
  { label: 'Orders',        perms: [33, 34, 35, 36] },
  { label: 'Reviews',       perms: [37, 38, 39, 40] },
  { label: 'Discounts',     perms: [41, 42, 43, 44] },
  { label: 'Banners',       perms: [45, 46, 47, 48] },
  { label: 'Shop Members',  perms: [49, 50, 51, 52] },
  { label: 'Payouts',       perms: [53, 54, 55, 56] },
  { label: 'Collections',   perms: [57, 58, 59, 60] },
  { label: 'Media',         perms: [61, 62, 63, 64] },
  { label: 'Disputes',      perms: [65, 66, 67, 68] },
  { label: 'Delivers',      perms: [69, 70, 71, 72] },
  { label: 'Plans',         perms: [73, 74, 75, 76] },
  { label: 'Subscriptions', perms: [77, 78, 79, 80] },
  { label: 'Shops',         perms: [81, 82, 83, 84] },
  { label: 'AI',            perms: [85, 86, 87, 88] },
  { label: 'Push Notif',    perms: [89, 90, 91, 92] },
]

const ALL_PERMS = PERM_GROUPS.flatMap((g) => g.perms)

function togglePerm(set, perm) {
  return set.includes(perm) ? set.filter((p) => p !== perm) : [...set, perm]
}

// ── Permissions Matrix ────────────────────────────────────────────────────────
function PermissionsMatrix({ value, onChange }) {
  const { t } = useTranslation()
  const selected = new Set(value)

  function toggle(perm) { onChange(togglePerm(value, perm)) }
  function toggleGroup(perms) {
    const allSelected = perms.every((p) => selected.has(p))
    if (allSelected) {
      onChange(value.filter((p) => !perms.includes(p)))
    } else {
      const toAdd = perms.filter((p) => !selected.has(p))
      onChange([...value, ...toAdd])
    }
  }

  const colLabels = ['Read', 'Create', 'Edit', 'Delete']

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-slate-600 w-36">{t('roles.permissions')}</th>
            {colLabels.map((col) => (
              <th key={col} className="text-center px-2 py-2 font-medium text-slate-500 text-xs">{col}</th>
            ))}
            <th className="text-center px-2 py-2 font-medium text-slate-400 text-xs w-12">{t('roles.selectAll')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {PERM_GROUPS.map((group) => {
            const allGroupSelected = group.perms.every((p) => selected.has(p))
            return (
              <tr key={group.label} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-700">{group.label}</td>
                {group.perms.map((perm, idx) => (
                  <td key={perm} className="text-center px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(perm)}
                      onChange={() => toggle(perm)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer"
                    />
                  </td>
                ))}
                <td className="text-center px-2 py-2">
                  <input
                    type="checkbox"
                    checked={allGroupSelected}
                    onChange={() => toggleGroup(group.perms)}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Role Modal ────────────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', order: '', permissions: [] }

function RoleModal({ open, role, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setForm(role
        ? { name: role.name ?? '', order: role.order ?? '', permissions: role.permissions ?? [] }
        : EMPTY_FORM
      )
    }
  }, [open, role])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSave() {
    if (!form.name.trim()) return
    setError(''); setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        order: form.order !== '' ? Number(form.order) : null,
        permissions: form.permissions,
        modules: form.permissions,
        status: 0,
      }
      if (role) {
        await AdminApi.roles.update(role.id, payload)
      } else {
        await AdminApi.roles.create(payload)
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error')
    } finally {
      setSaving(false)
    }
  }

  const allSelected = ALL_PERMS.every((p) => form.permissions.includes(p))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{role ? t('roles.editRole') : t('roles.createRole')}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[75vh] overflow-y-auto">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('roles.roleName')} required>
              <Input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Shop Manager"
              />
            </FormField>
            <FormField label={t('roles.roleOrder')}>
              <Input
                type="number"
                min="0"
                value={form.order}
                onChange={(e) => set('order', e.target.value)}
              />
            </FormField>
          </div>

          {/* Bulk toggles */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 font-medium">{t('roles.permissions')}:</span>
            <button
              type="button"
              onClick={() => set('permissions', [...ALL_PERMS])}
              className="text-blue-600 hover:underline"
            >
              {t('roles.selectAll')}
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => set('permissions', [])}
              className="text-slate-500 hover:underline"
            >
              {t('roles.clearAll')}
            </button>
            <span className="ml-auto text-xs text-slate-400">
              {form.permissions.length} / {ALL_PERMS.length}
            </span>
          </div>

          <PermissionsMatrix
            value={form.permissions}
            onChange={(perms) => set('permissions', perms)}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? '…' : role ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Role Card ─────────────────────────────────────────────────────────────────
function RoleCard({ role, onEdit, onDelete }) {
  const permCount = role.permissions?.length ?? 0
  const isSystem = role.is_system

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('shrink-0 h-9 w-9 rounded-lg flex items-center justify-center', isSystem ? 'bg-purple-50' : 'bg-blue-50')}>
              {isSystem ? <Lock className="h-4 w-4 text-purple-600" /> : <Shield className="h-4 w-4 text-blue-600" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-slate-800 dark:text-white truncate">{role.name}</p>
                {isSystem && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium dark:bg-purple-900/30 dark:text-purple-300">system</span>
                )}
              </div>
              {role.slug && <p className="text-xs text-slate-400 font-mono">{role.slug}</p>}
              <p className="text-xs text-slate-400">{permCount} permissions</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(role)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {!isSystem && (
              <button
                onClick={() => onDelete(role)}
                className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Permission summary pills */}
        {permCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {PERM_GROUPS.filter((g) => g.perms.some((p) => role.permissions?.includes(p))).map((g) => {
              const has = g.perms.filter((p) => role.permissions?.includes(p)).length
              const total = g.perms.length
              return (
                <span
                  key={g.label}
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                    has === total
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {g.label} {has < total && `${has}/${total}`}
                </span>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const { t } = useTranslation()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ open: false, role: null })

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await AdminApi.roles.getAll({ limit: 200 })
      setRoles(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  async function handleDelete(role) {
    if (!confirm(t('roles.confirmDelete'))) return
    try {
      await AdminApi.roles.delete(role.id)
      toast.success(t('toast.deleted'))
      fetchRoles()
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('toast.error'))
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => setModal({ open: true, role: null })}>
          <Plus className="h-4 w-4 mr-1.5" />{t('roles.addRole')}
        </Button>
        <Button variant="outline" size="sm" onClick={fetchRoles} className="ml-auto">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">{t('common.loading')}</div>
      ) : roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Shield className="h-12 w-12 mb-3 text-slate-200" />
          <p>{t('roles.noRoles')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={(r) => setModal({ open: true, role: r })}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <RoleModal
        open={modal.open}
        role={modal.role}
        onClose={() => setModal({ open: false, role: null })}
        onSaved={() => { toast.success(t(modal.role ? 'toast.updated' : 'toast.created')); setModal({ open: false, role: null }); fetchRoles() }}
      />
    </div>
  )
}
