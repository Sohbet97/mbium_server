import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, MoreHorizontal, RefreshCw, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FormField } from '@/components/common/FormField'
import { AdminApi } from '@/lib/api'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_META = {
  0:  { labelKey: 'users.statusNotActivated', variant: 'warning' },
  1:  { labelKey: 'users.statusActive',       variant: 'success' },
  90: { labelKey: 'users.statusBlocked',      variant: 'destructive' },
}

function StatusBadge({ status }) {
  const { t } = useTranslation()
  const meta = STATUS_META[status] ?? { labelKey: 'common.status', variant: 'secondary' }
  return <Badge variant={meta.variant}>{t(meta.labelKey)}</Badge>
}

// ── User Modal (create / edit) ────────────────────────────────────────────────
// Note: parent passes a `key` prop to force remount on open/user change,
// so form state is correctly initialized from props without a useEffect.

const EMPTY_FORM = {
  name: '', surname: '', phone_number: '', email: '',
  birth_date: '', password: '', role_id: '', status: '1',
}

function buildForm(user) {
  if (!user) return EMPTY_FORM
  return {
    name:         user.name         ?? '',
    surname:      user.surname       ?? '',
    phone_number: user.phone_number  ?? '',
    email:        user.email         ?? '',
    birth_date:   user.birth_date    ?? '',
    password:     '',
    role_id:      user.role_id       ?? '',
    status:       String(user.status ?? 1),
  }
}

function UserModal({ open, user, roles, onClose, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm]     = useState(() => buildForm(user))
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(field, val) { setForm((f) => ({ ...f, [field]: val })) }

  const isValid = Boolean(
    form.name.trim() && form.surname.trim() && form.phone_number.trim()
    && (user ? true : form.password)
  )

  async function handleSave() {
    if (!isValid) return
    setError(''); setSaving(true)
    try {
      const payload = {
        name:         form.name.trim(),
        surname:      form.surname.trim(),
        phone_number: form.phone_number.trim(),
        status:       Number(form.status),
        ...(form.email.trim()   && { email:      form.email.trim() }),
        ...(form.birth_date     && { birth_date: form.birth_date }),
        ...(form.role_id !== '' && { role_id:    Number(form.role_id) }),
        ...(form.password       && { password:   form.password }),
      }
      if (user) {
        await AdminApi.users.update(user.id, payload)
      } else {
        if (!payload.password) { setError('Password is required'); return }
        await AdminApi.users.create(payload)
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
          <DialogTitle>{user ? t('users.editUser') : t('users.createUser')}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[75vh] overflow-y-auto">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('common.name')} required>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ali" />
            </FormField>
            <FormField label={t('users.surname')} required>
              <Input value={form.surname} onChange={(e) => set('surname', e.target.value)} placeholder="Durdyyew" />
            </FormField>
          </div>

          <FormField label={t('users.phone')} required>
            <Input
              value={form.phone_number}
              onChange={(e) => set('phone_number', e.target.value)}
              placeholder="61XXXXXX"
              maxLength={8}
            />
            <p className="text-xs text-slate-400 mt-0.5">+993 · 8 digits · starts with 61–65 or 71</p>
          </FormField>

          <FormField label={t('users.email')}>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('users.birthDate')}>
              <Input type="date" value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)} />
            </FormField>
            <FormField label={t('users.role')}>
              <Select value={form.role_id} onChange={(e) => set('role_id', e.target.value)}>
                <option value="">{t('users.noRole')}</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label={t('common.status')}>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="0">{t('users.statusNotActivated')}</option>
              <option value="1">{t('users.statusActive')}</option>
            </Select>
          </FormField>

          <FormField label={t('users.password')} required={!user}>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder={user ? '••••••••' : ''}
              autoComplete="new-password"
            />
            {user && (
              <p className="text-xs text-slate-400 mt-0.5">{t('users.passwordHint')}</p>
            )}
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {saving ? '…' : user ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { t } = useTranslation()

  const [users,       setUsers]       = useState([])
  const [total,       setTotal]       = useState(0)
  const [roles,       setRoles]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [page,        setPage]        = useState(1)
  const [search,      setSearch]      = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter,  setRoleFilter]  = useState('')
  const [refreshTick, setRefreshTick] = useState(0)
  const limit = 20

  const [modal, setModal] = useState({ open: false, user: null })

  // Fetch users — all setState calls are inside async callbacks, not synchronously
  useEffect(() => {
    let cancelled = false
    const params = { limit, skip: (page - 1) * limit }
    if (search)              params.text   = search
    if (statusFilter !== '') params.status = statusFilter
    if (roleFilter   !== '') params.role   = roleFilter

    AdminApi.users.getAll(params)
      .then(({ data }) => {
        if (cancelled) return
        setUsers(data.data  ?? [])
        setTotal(data.count ?? 0)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setUsers([])
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [page, search, statusFilter, roleFilter, refreshTick])

  // Fetch roles once for filter dropdown and modal
  useEffect(() => {
    AdminApi.roles.getAll({ limit: 200 })
      .then(({ data }) => setRoles(data.data ?? []))
      .catch(() => setRoles([]))
  }, [])

  function refresh() {
    setLoading(true)
    setRefreshTick((k) => k + 1)
  }

  function handleSearchChange(val) {
    setSearch(val)
    setLoading(true)
    setPage(1)
  }

  function handleStatusChange(val) {
    setStatusFilter(val)
    setLoading(true)
    setPage(1)
  }

  function handleRoleChange(val) {
    setRoleFilter(val)
    setLoading(true)
    setPage(1)
  }

  function handlePageChange(next) {
    setPage(next)
    setLoading(true)
  }

  async function handleBlock(u) {
    if (!window.confirm(t('users.confirmBlock'))) return
    try {
      await AdminApi.users.update(u.id, {
        name: u.name, surname: u.surname,
        phone_number: u.phone_number, status: 90,
      })
      refresh()
    } catch (e) {
      window.alert(e.response?.data?.message ?? 'Error')
    }
  }

  async function handleUnblock(u) {
    if (!window.confirm(t('users.confirmUnblock'))) return
    try {
      await AdminApi.users.update(u.id, {
        name: u.name, surname: u.surname,
        phone_number: u.phone_number, status: 1,
      })
      refresh()
    } catch (e) {
      window.alert(e.response?.data?.message ?? 'Error')
    }
  }

  async function handleUnlock(u) {
    try {
      await AdminApi.users.unlock(u.id)
      refresh()
    } catch (e) {
      window.alert(e.response?.data?.message ?? 'Error')
    }
  }

  async function handleDelete(u) {
    if (!window.confirm(t('users.confirmDelete'))) return
    try {
      await AdminApi.users.delete(u.id)
      refresh()
    } catch (e) {
      window.alert(e.response?.data?.message ?? 'Error')
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('users.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('users.totalCount', { count: total })}</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setModal({ open: true, user: null })}>
          <Plus className="h-4 w-4" /> {t('users.addUser')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('users.searchPlaceholder')}
            className="pl-9"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)} className="w-44">
          <option value="">{t('users.filterStatus')}</option>
          <option value="0">{t('users.statusNotActivated')}</option>
          <option value="1">{t('users.statusActive')}</option>
          <option value="90">{t('users.statusBlocked')}</option>
        </Select>
        <Select value={roleFilter} onChange={(e) => handleRoleChange(e.target.value)} className="w-44">
          <option value="">{t('users.filterRole')}</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
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
                  <th className="px-4 py-3">{t('users.colUser')}</th>
                  <th className="px-4 py-3">{t('users.colPhone')}</th>
                  <th className="px-4 py-3">{t('users.colRole')}</th>
                  <th className="px-4 py-3">{t('users.colStatus')}</th>
                  <th className="px-4 py-3">{t('users.colLastLogin')}</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Users className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{t('common.noResults')}</p>
                    </td>
                  </tr>
                ) : users.map((u) => {
                  const initials     = [u.name?.[0], u.surname?.[0]].filter(Boolean).join('').toUpperCase() || '?'
                  const loginBlocked = u.blocked_till && new Date(u.blocked_till) > new Date()
                  return (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {u.name} {u.surname}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{u.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                        {u.phone_number ? `+993 ${u.phone_number}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{u._role?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={u.status} />
                          {loginBlocked && (
                            <span className="text-xs text-orange-500 font-medium">Login locked</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {u.last_login_date
                          ? new Date(u.last_login_date).toLocaleDateString()
                          : t('common.never')}
                      </td>
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
                            <DropdownMenuItem onClick={() => setModal({ open: true, user: u })}>
                              {t('users.editUser')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {loginBlocked && (
                              <DropdownMenuItem onClick={() => handleUnlock(u)}>
                                {t('users.unlockUser')}
                              </DropdownMenuItem>
                            )}
                            {u.status === 90 ? (
                              <DropdownMenuItem onClick={() => handleUnblock(u)}>
                                {t('users.unblockUser')}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-orange-600 focus:text-orange-600"
                                onClick={() => handleBlock(u)}
                              >
                                {t('users.blockUser')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleDelete(u)}
                            >
                              {t('users.deleteUser')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
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

      {/* Key changes on open/user so UserModal remounts with fresh state */}
      <UserModal
        key={modal.open ? (modal.user?.id ?? 'create') : 'closed'}
        open={modal.open}
        user={modal.user}
        roles={roles}
        onClose={() => setModal({ open: false, user: null })}
        onSaved={() => { setModal({ open: false, user: null }); refresh() }}
      />
    </div>
  )
}
