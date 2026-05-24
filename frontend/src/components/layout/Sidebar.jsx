import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Shield, Store, MapPin, Settings, LogOut,
  PanelLeftClose, PanelLeftOpen, Tag, Package, ChevronDown,
  ShoppingCart, Star, Percent, Layers, Images, LayoutTemplate, Truck, CreditCard, ClipboardList, Bot, ShoppingBag, Bell, ScrollText,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'

export function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [catalogOpen, setCatalogOpen] = useState(true)

  const topNav = [
    { to: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: t('nav.users'), icon: Users },
    { to: '/admin/shops', label: t('nav.shops'), icon: Store },
    { to: '/admin/shop-applications', label: t('nav.shopApplications', 'Dükan arzalary'), icon: ClipboardList },
    { to: '/admin/shop-type-requests', label: t('nav.shopTypeRequests'), icon: Tag },
    { to: '/admin/orders', label: t('nav.orders'), icon: ShoppingCart },
    { to: '/admin/reviews', label: t('nav.reviews'), icon: Star },
    { to: '/admin/discounts', label: t('nav.discounts'), icon: Percent },
    { to: '/admin/banners', label: t('nav.banners'), icon: LayoutTemplate },
    { to: '/admin/ai-recommendations', label: t('nav.aiRecommendations'),   icon: Bot },
    { to: '/admin/push-notifications', label: t('nav.pushNotifications'),   icon: Bell },
  ]
  
  const catalogNav = [
    { to: '/admin/catalog/categories', label: t('nav.categories'), icon: Tag },
    { to: '/admin/catalog/products', label: t('nav.products'), icon: Package },
    { to: '/admin/catalog/collections', label: t('nav.collections'), icon: Layers },
    { to: '/admin/media', label: t('nav.media'), icon: Images },
  ]
  
  const bottomNav = [
    { to: '/admin/delivers', label: t('nav.delivers'), icon: Truck },
    { to: '/admin/plans', label: t('nav.plans'), icon: CreditCard },
    { to: '/admin/locations', label: t('nav.locations'), icon: MapPin },
    { to: '/admin/roles', label: t('nav.roles'), icon: Shield },
    { to: '/admin/audit-logs', label: t('nav.auditLogs'), icon: ScrollText },
    { to: '/admin/settings', label: t('nav.settings'), icon: Settings },
  ]

  const itemBase = cn(
    'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 w-full',
    collapsed && 'justify-center px-0'
  )
  const itemInactive = 'dark:text-[#a0a0ab] text-[#6d7175] dark:hover:bg-white/[0.08] hover:bg-black/[0.06] dark:hover:text-white hover:text-[#202223]'
  const itemActive = 'dark:bg-white/[0.12] bg-black/[0.07] dark:text-white text-[#202223] font-semibold'

  const navLink = (to, label, icon, end) => (
    <NavLink
      key={to} to={to} end={end}
      className={({ isActive }) => cn(itemBase, isActive ? itemActive : itemInactive)}
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => {
        const Icon = icon
        return (
          <>
            <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'opacity-100' : 'opacity-60')} />
            {!collapsed && <span>{label}</span>}
          </>
        )
      }}
    </NavLink>
  )

  const divider = <div className="mx-1 my-1.5 border-t dark:border-white/[0.08] border-black/[0.08]" />

  return (
    <aside className={cn(
      'flex flex-col shrink-0 transition-all duration-300',
      'border-r dark:border-white/[0.08] border-black/[0.08]',
      'dark:bg-[#1a1a1f] bg-[#f6f6f7]',
      collapsed ? 'w-[56px]' : 'w-[220px]'
    )}>

      {/* Header */}
      <div className={cn(
        'flex items-center h-14 shrink-0 border-b dark:border-white/[0.08] border-black/[0.08]',
        collapsed ? 'justify-center' : 'justify-between px-3'
      )}>
        {!collapsed && (
          <span className="text-[15px] font-bold tracking-tight dark:text-white text-[#202223] ml-1">
            mbium
          </span>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand' : 'Collapse'}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            'dark:text-[#a0a0ab] dark:hover:bg-white/[0.08] dark:hover:text-white',
            'text-[#6d7175] hover:bg-black/[0.06] hover:text-[#202223]'
          )}
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {topNav.map(({ to, label, icon, end }) => navLink(to, label, icon, end))}

        {/* Catalog section */}
        <div className="pt-1">
          {divider}
          {!collapsed && (
            <button
              onClick={() => setCatalogOpen((v) => !v)}
              className={cn(
                'flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg',
                'text-[11px] font-semibold uppercase tracking-widest transition-colors',
                'dark:text-[#5a5a6a] dark:hover:text-[#a0a0ab]',
                'text-[#8c9196] hover:text-[#6d7175]'
              )}
            >
              <span>{t('nav.catalog')}</span>
              <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', catalogOpen && 'rotate-180')} />
            </button>
          )}
          {(catalogOpen || collapsed) && (
            <div className={cn('space-y-0.5 mt-0.5', !collapsed && 'pl-1')}>
              {catalogNav.map(({ to, label, icon }) => navLink(to, label, icon))}
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="pt-1 space-y-0.5">
          {divider}
          {bottomNav.map(({ to, label, icon }) => navLink(to, label, icon))}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t dark:border-white/[0.08] border-black/[0.08] p-2">
        {!collapsed && (
          <div className="px-2.5 py-1.5 mb-1">
            <p className="text-[13px] font-semibold dark:text-white text-[#202223] truncate leading-tight">
              {user?.name} {user?.surname}
            </p>
            <p className="text-[11px] dark:text-[#5a5a6a] text-[#8c9196] truncate mt-0.5">
              {user?.phone_number}
            </p>
          </div>
        )}
        {user?.shop?.is_active && (
          <NavLink
            to="/seller"
            title={collapsed ? t('nav.sellerPanel') : undefined}
            className={cn(
              itemBase,
              'text-blue-600 dark:text-blue-400 dark:hover:bg-white/[0.08] hover:bg-black/[0.06]'
            )}
          >
            <ShoppingBag className="h-[18px] w-[18px] shrink-0 opacity-70" />
            {!collapsed && <span>{t('nav.sellerPanel')}</span>}
          </NavLink>
        )}
        <button
          onClick={logout}
          title={collapsed ? t('nav.logout') : undefined}
          className={cn(
            itemBase,
            'dark:text-[#a0a0ab] dark:hover:bg-white/[0.08] dark:hover:text-white',
            'text-[#6d7175] hover:bg-black/[0.06] hover:text-[#202223]'
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 opacity-60" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}
