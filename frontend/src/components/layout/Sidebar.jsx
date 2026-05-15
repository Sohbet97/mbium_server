import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Shield, Store, MapPin, Settings, LogOut,
  ChevronLeft, Tag, Package, ChevronDown, ShoppingCart, Star, Percent,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { Separator } from '@/components/ui/separator'

export function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [catalogOpen, setCatalogOpen] = useState(true)

  const topNav = [
    { to: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: t('nav.users'), icon: Users },
    { to: '/admin/shops', label: t('nav.shops'), icon: Store },
    { to: '/admin/orders', label: t('nav.orders'), icon: ShoppingCart },
    { to: '/admin/reviews', label: t('nav.reviews'), icon: Star },
    { to: '/admin/discounts', label: t('nav.discounts'), icon: Percent },
  ]

  const bottomNav = [
    { to: '/admin/locations', label: t('nav.locations'), icon: MapPin },
    { to: '/admin/roles', label: t('nav.roles'), icon: Shield },
    { to: '/admin/settings', label: t('nav.settings'), icon: Settings },
  ]

  const navLink = (to, label, icon, end) => (
    <NavLink
      key={to} to={to} end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white',
          collapsed && 'justify-center px-2'
        )
      }
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => {
        const Icon = icon
        return <>
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{label}</span>}
        </>
      }}
    </NavLink>
  )

  return (
    <aside className={cn('flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 shrink-0', collapsed ? 'w-16' : 'w-60')}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
        {!collapsed && <span className="font-bold text-lg tracking-tight">mbium</span>}
        <button onClick={onToggle} className={cn('p-1.5 rounded hover:bg-slate-700 transition-colors', collapsed && 'mx-auto')}>
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {topNav.map(({ to, label, icon, end }) => navLink(to, label, icon, end))}

        {/* Catalog section */}
        <div className="pt-2">
          {!collapsed ? (
            <button
              onClick={() => setCatalogOpen((v) => !v)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
            >
              <span>{t('nav.catalog')}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', catalogOpen && 'rotate-180')} />
            </button>
          ) : (
            <div className="border-t border-slate-700 my-1" />
          )}
          {(catalogOpen || collapsed) && (
            <div className={cn('space-y-1', !collapsed && 'pl-2')}>
              {navLink('/admin/catalog/categories', t('nav.categories'), Tag)}
              {navLink('/admin/catalog/products', t('nav.products'), Package)}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-700 space-y-1">
          {bottomNav.map(({ to, label, icon }) => navLink(to, label, icon))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-slate-700">
        {!collapsed && (
          <div className="px-3 py-1 mb-1">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.name} {user?.surname}</p>
            <p className="text-xs text-slate-400 truncate">{user?.phone_number}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={cn('flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors', collapsed && 'justify-center px-2')}
          title={collapsed ? t('nav.logout') : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}
