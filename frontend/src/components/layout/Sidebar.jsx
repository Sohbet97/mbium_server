import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Shield, Store, MapPin, Settings, LogOut,
  PanelLeftClose, PanelLeftOpen, Tag, Package, ChevronDown,
  ShoppingCart, Star, Percent, Layers, Images, LayoutTemplate, Truck, CreditCard, ClipboardList, Bot, ShoppingBag, Bell, ScrollText, BarChart2, Building2, Coins, Heart, Award, Factory, MessageSquare, FileCheck, Ruler, PackageCheck, Zap, Clapperboard, Gift, Palette,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { Permissions, hasPerm } from '@/lib/permissions'
import { usePendingCounts } from '@/store/pendingCounts'

export function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [catalogOpen, setCatalogOpen] = useState(true)
  const { counts: pendingCounts } = usePendingCounts() ?? {}

  const topNav = [
    { to: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard, end: true, perm: null },
    { to: '/admin/users', label: t('nav.users'), icon: Users, perm: Permissions.USER_GET },
    { to: '/admin/shops', label: t('nav.shops'), icon: Store, perm: Permissions.SHOP_GET },
    { to: '/admin/shop-applications', label: t('nav.shopApplications', 'Dükan arzalary'), icon: ClipboardList, perm: Permissions.SHOP_GET, countKey: 'shopApplications' },
    { to: '/admin/shop-type-requests', label: t('nav.shopTypeRequests'), icon: Tag, perm: null, countKey: 'shopTypeRequests' },
    { to: '/admin/shop-types', label: t('nav.shopTypes'), icon: Store, perm: null },
    { to: '/admin/orders', label: t('nav.orders'), icon: ShoppingCart, perm: Permissions.ORDER_GET },
    { to: '/admin/reviews', label: t('nav.reviews'), icon: Star, perm: Permissions.REVIEW_GET },
    { to: '/admin/discounts', label: t('nav.discounts'), icon: Percent, perm: Permissions.DISCOUNT_GET },
    { to: '/admin/payouts', label: t('nav.payouts'), icon: CreditCard, perm: Permissions.PAYOUT_GET, countKey: 'payoutRequests' },
    { to: '/admin/banners', label: t('nav.banners'), icon: LayoutTemplate, perm: Permissions.BANNER_GET },
    { to: '/admin/ai-recommendations', label: t('nav.aiRecommendations'),   icon: Bot, perm: Permissions.AI_GET },
    { to: '/admin/push-notifications', label: t('nav.pushNotifications'),   icon: Bell, perm: Permissions.PUSH_NOTIF_GET },
    { to: '/admin/analytics',          label: t('nav.analytics', 'Analytics'), icon: BarChart2, perm: Permissions.ANALYTICS_GET },
    { to: '/admin/warehouses',         label: t('nav.warehouses', 'Warehouses'), icon: Building2, perm: Permissions.WAREHOUSE_GET },
    { to: '/admin/coins',              label: t('nav.coins', 'Coins'), icon: Coins, perm: Permissions.COIN_GET },
    { to: '/admin/turbo',              label: t('nav.turbo', 'Turbo'), icon: Zap, perm: Permissions.TURBO_GET },
    { to: '/admin/gifts',              label: t('nav.gifts', 'Gifts'), icon: Gift, perm: Permissions.GIFT_TYPE_GET },
    { to: '/admin/favorites',          label: t('nav.favorites', 'Favorites'), icon: Heart, perm: Permissions.PRODUCT_GET },
    { to: '/admin/comments',           label: t('nav.comments', 'Comments'),   icon: MessageSquare, perm: Permissions.COMMENT_GET },
    { to: '/admin/kyc',                label: t('nav.kyc', 'KYC Docs'),        icon: FileCheck, perm: Permissions.KYC_GET, countKey: 'kyc' },
  ].filter((item) => hasPerm(user, item.perm))

  const catalogNav = [
    { to: '/admin/catalog/categories', label: t('nav.categories'), icon: Tag, perm: Permissions.CATEGORY_GET },
    { to: '/admin/catalog/products', label: t('nav.products'), icon: Package, perm: Permissions.PRODUCT_GET, countKey: 'products' },
    { to: '/admin/catalog/collections', label: t('nav.collections'), icon: Layers, perm: Permissions.COLLECTION_GET },
    { to: '/admin/catalog/tags',        label: t('productTags.title', 'Tags'),        icon: Tag, perm: Permissions.PRODUCT_GET },
    { to: '/admin/catalog/brands',     label: t('nav.brands', 'Brands'),             icon: Award, perm: Permissions.BRAND_GET },
    { to: '/admin/catalog/sizes',      label: t('nav.sizes', 'Sizes'),               icon: Ruler, perm: Permissions.SIZE_GET },
    { to: '/admin/catalog/colors',     label: t('nav.colors', 'Colors'),             icon: Palette, perm: Permissions.COLOR_GET },
    { to: '/admin/catalog/delivery-types', label: t('nav.deliveryTypes', 'Delivery Types'), icon: PackageCheck, perm: Permissions.DELIVERY_TYPE_GET },
    { to: '/admin/catalog/suppliers',  label: t('nav.suppliers', 'Suppliers'),        icon: Factory, perm: Permissions.SUPPLIER_GET },
    { to: '/admin/catalog/reels',      label: t('nav.reels', 'Reels'),                icon: Clapperboard, perm: Permissions.REEL_GET, countKey: 'reels' },
    { to: '/admin/media', label: t('nav.media'), icon: Images, perm: Permissions.MEDIA_GET },
  ].filter((item) => hasPerm(user, item.perm))

  const bottomNav = [
    { to: '/admin/delivers', label: t('nav.delivers'), icon: Truck, perm: Permissions.DELIVER_GET },
    { to: '/admin/plans', label: t('nav.plans'), icon: CreditCard, perm: Permissions.PLAN_GET },
    { to: '/admin/locations', label: t('nav.locations'), icon: MapPin, perm: [Permissions.REGION_GET, Permissions.VILLAGE_GET, Permissions.COUNTRY_GET] },
    { to: '/admin/roles', label: t('nav.roles'), icon: Shield, perm: Permissions.ROLE_GET },
    { to: '/admin/audit-logs', label: t('nav.auditLogs'), icon: ScrollText, perm: Permissions.AUDIT_GET },
    { to: '/admin/settings', label: t('nav.settings'), icon: Settings, perm: null },
  ].filter((item) => hasPerm(user, item.perm))

  const itemBase = cn(
    'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 w-full',
    collapsed && 'justify-center px-0'
  )
  const itemInactive = 'dark:text-[#a0a0ab] text-[#6d7175] dark:hover:bg-white/[0.08] hover:bg-black/[0.06] dark:hover:text-white hover:text-[#202223]'
  const itemActive = 'dark:bg-white/[0.12] bg-black/[0.07] dark:text-white text-[#202223] font-semibold'

  const navLink = (to, label, icon, end, count) => (
    <NavLink
      key={to} to={to} end={end}
      className={({ isActive }) => cn(itemBase, 'relative', isActive ? itemActive : itemInactive)}
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => {
        const Icon = icon
        return (
          <>
            <span className="relative shrink-0">
              <Icon className={cn('h-[18px] w-[18px]', isActive ? 'opacity-100' : 'opacity-60')} />
              {collapsed && count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </span>
            {!collapsed && <span className="flex-1">{label}</span>}
            {!collapsed && count > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
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
        {topNav.map(({ to, label, icon, end, countKey }) => navLink(to, label, icon, end, pendingCounts?.[countKey]))}

        {/* Catalog section */}
        {catalogNav.length > 0 && (
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
              {catalogNav.map(({ to, label, icon, countKey }) => navLink(to, label, icon, undefined, pendingCounts?.[countKey]))}
            </div>
          )}
        </div>
        )}

        {/* Bottom nav */}
        {bottomNav.length > 0 && (
        <div className="pt-1 space-y-0.5">
          {divider}
          {bottomNav.map(({ to, label, icon }) => navLink(to, label, icon))}
        </div>
        )}
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
