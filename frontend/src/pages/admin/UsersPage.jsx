import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, MoreHorizontal, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminApi } from '@/lib/api'

function useStatusMap() {
  const { t } = useTranslation()
  return {
    0: { label: t('users.statusNotActivated'), variant: 'warning' },
    1: { label: t('users.statusActive'), variant: 'success' },
    2: { label: t('users.statusBlocked'), variant: 'destructive' },
  }
}

function UserRow({ user, onAction }) {
  const { t } = useTranslation()
  const statusMap = useStatusMap()
  const initials = [user.name?.[0], user.surname?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  const status = statusMap[user.status] ?? { label: '—', variant: 'secondary' }

  return (
    <tr className="border-b last:border-0 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-slate-900">{user.name} {user.surname}</p>
            <p className="text-xs text-slate-400">{user.email || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{user.phone_number || '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{user._role?.name ?? '—'}</td>
      <td className="px-4 py-3">
        <Badge variant={status.variant}>{status.label}</Badge>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {user.last_login_date ? new Date(user.last_login_date).toLocaleDateString() : t('common.never')}
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
            <DropdownMenuItem onClick={() => onAction('view', user)}>{t('users.viewDetails')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('edit', user)}>{t('users.editUser')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => onAction('block', user)}
            >
              {user.status === 2 ? t('users.unblockUser') : t('users.blockUser')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

export default function UsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const limit = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit }
      if (search) params.search = search
      const { data } = await AdminApi.users.getAll(params)
      setUsers(data.data?.rows ?? data.data?.users ?? [])
      setTotal(data.data?.count ?? data.data?.total ?? 0)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('users.title')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('users.totalCount', { count: total })}</p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> {t('users.addUser')}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('users.searchPlaceholder')}
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" size="sm">{t('common.search')}</Button>
        </form>
        <Button variant="ghost" size="icon" onClick={fetchUsers} className="h-9 w-9" title={t('common.refresh')}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

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
                  <th className="px-4 py-3 w-12"></th>
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
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      {t('common.noResults')}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => <UserRow key={u.id} user={u} onAction={(a, user) => console.log(a, user)} />)
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-slate-500">
              <span>{t('common.page', { current: page, total: totalPages })}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t('common.previous')}
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
