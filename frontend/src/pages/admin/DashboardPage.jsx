import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Store, ShieldCheck, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminApi } from '@/lib/api'

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
        <div className={`p-2 rounded-md ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">
          {value === null ? <span className="text-slate-300 animate-pulse">—</span> : value}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ users: null, shops: null, roles: null, sessions: null })

  useEffect(() => {
    Promise.allSettled([
      AdminApi.users.getAll({ limit: 1 }),
      AdminApi.shops.getAll({ limit: 1 }),
      AdminApi.roles.getAll({ limit: 1 }),
    ]).then(([users, shops, roles]) => {
      setStats({
        users: users.value?.data?.data?.total ?? '—',
        shops: shops.value?.data?.data?.total ?? '—',
        roles: roles.value?.data?.data?.total ?? '—',
        sessions: '—',
      })
    })
  }, [])

  const systemItems = [
    { key: 'apiServer', label: t('dashboard.apiServer') },
    { key: 'database', label: t('dashboard.database') },
    { key: 'socketIO', label: t('dashboard.socketIO') },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{t('dashboard.overview')}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label={t('dashboard.totalUsers')} value={stats.users} icon={Users} color="bg-blue-500" />
        <StatCard label={t('dashboard.totalShops')} value={stats.shops} icon={Store} color="bg-emerald-500" />
        <StatCard label={t('dashboard.roles')} value={stats.roles} icon={ShieldCheck} color="bg-violet-500" />
        <StatCard label={t('dashboard.activeSessions')} value={stats.sessions} icon={Activity} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">{t('dashboard.activityPlaceholder')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.systemStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {systemItems.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  {t('common.operational')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
