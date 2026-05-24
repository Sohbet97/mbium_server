import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Store,
  Percent, Wallet, LogOut, PanelLeftClose, PanelLeftOpen, Images, LayoutTemplate, Crown, ShieldCheck, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useTranslation } from 'react-i18next'
import { TopBar } from './TopBar'
import { AiAssistant } from './AiAssistant'
import { useAiAssistant } from '@/store/aiAssistant'

function SellerSidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const shop = user?.shop

  const nav = [
    { to: '/seller',          label: t('nav.dashboard'),    icon: LayoutDashboard, end: true },
    { to: '/seller/products', label: t('nav.products'),     icon: Package },
    { to: '/seller/orders',   label: t('nav.orders'),       icon: ShoppingCart },
    { to: '/seller/shop',     label: t('nav.myShop'),       icon: Store },
    { to: '/seller/discounts',label: t('nav.discounts'),    icon: Percent },
    { to: '/seller/payouts',  label: t('nav.payouts'),      icon: Wallet },
    { to: '/seller/media',    label: t('nav.media'),        icon: Images },
    { to: '/seller/banners',  label: t('nav.banners'),      icon: LayoutTemplate },
    { to: '/seller/subscription',       label: t('nav.subscription'),       icon: Crown },
    { to: '/seller/push-notifications', label: t('nav.pushNotifications'),  icon: Bell },
  ]

  const itemBase = cn(
    'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 w-full',
    collapsed && 'justify-center px-0'
  )
  const inactive = 'dark:text-[#a0a0ab] text-[#6d7175] dark:hover:bg-white/[0.08] hover:bg-black/[0.06] dark:hover:text-white hover:text-[#202223]'
  const active   = 'dark:bg-white/[0.12] bg-black/[0.07] dark:text-white text-[#202223] font-semibold'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <aside className={cn(
      'flex flex-col h-screen border-r dark:border-white/[0.06] border-black/[0.06] dark:bg-[#111114] bg-white shrink-0 transition-all duration-200',
      collapsed ? 'w-[52px]' : 'w-[220px]'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center h-14 px-3 gap-2 border-b dark:border-white/[0.06] border-black/[0.06]', collapsed && 'justify-center')}>
        <button onClick={onToggle} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight dark:text-white">
            {shop?.name ?? 'Seller'}
          </span>
        )}
      </div>

      {/* Seller tier badge */}
      {!collapsed && shop?.seller_tier === 2 && (
        <div className="mx-3 mt-3 px-2.5 py-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-xs text-blue-700 dark:text-blue-300 font-medium">
          ✓ Verified PRO
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to} to={to} end={end}
            className={({ isActive }) => cn(itemBase, isActive ? active : inactive)}
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'opacity-100' : 'opacity-60')} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User / logout */}
      <div className="px-2 pb-3 border-t dark:border-white/[0.06] border-black/[0.06] pt-2">
        {!collapsed && (
          <div className="px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
            {user?.name} {user?.surname}
          </div>
        )}
        {(user?.permissions?.length > 0 || user?._role?.permissions?.length > 0) && (
          <NavLink
            to="/admin"
            className={cn(itemBase, inactive, 'text-blue-600 dark:text-blue-400')}
            title={collapsed ? t('nav.adminPanel') : undefined}
          >
            <ShieldCheck className="h-[18px] w-[18px] shrink-0 opacity-70" />
            {!collapsed && <span>{t('nav.adminPanel')}</span>}
          </NavLink>
        )}
        <button
          onClick={handleLogout}
          className={cn(itemBase, inactive, 'text-red-500 dark:text-red-400 hover:!text-red-600')}
          title={collapsed ? t('nav.logout') : undefined}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 opacity-70" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}

export function SellerLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { open: aiOpen } = useAiAssistant()
  const { pathname } = useLocation()
  const hideSidebar = pathname === '/seller/account'

  return (
    <div className="flex h-screen overflow-hidden dark:bg-[#0f0f12] bg-slate-50">
      {!hideSidebar && <SellerSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />}
      <div className={`flex flex-col flex-1 overflow-hidden transition-[margin] duration-300 ${aiOpen ? 'mr-[380px]' : ''}`}>
        <TopBar title="Seller Panel" />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <AiAssistant />
    </div>
  )
}
