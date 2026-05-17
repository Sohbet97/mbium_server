import { useState } from 'react'
import { Outlet, useMatches, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const SIDEBAR_HIDDEN_PATHS = ['/admin/account']

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useTranslation()
  const matches = useMatches()
  const { pathname } = useLocation()
  const titleKey = matches.at(-1)?.handle?.titleKey
  const title = titleKey ? t(titleKey) : 'Admin Panel'
  const hideSidebar = SIDEBAR_HIDDEN_PATHS.includes(pathname)

  return (
    <div className="flex h-screen overflow-hidden dark:bg-[#0f0f12] bg-slate-50">
      {!hideSidebar && <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
