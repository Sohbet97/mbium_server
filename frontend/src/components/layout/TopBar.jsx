import { Globe, LogOut, Sun, Moon, Check, PlusCircle, Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/store/auth'
import { useTheme } from '@/store/theme'
import { useAiAssistant } from '@/store/aiAssistant'
import { NotificationPanel } from './NotificationPanel'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'tk', flag: '🇹🇲' },
  { code: 'ru', flag: '🇷🇺' },
]

const SHOP_COLORS = [
  'bg-violet-600', 'bg-blue-600', 'bg-green-600',
  'bg-orange-500', 'bg-pink-600', 'bg-indigo-600',
]

function shopColor(id) {
  return SHOP_COLORS[(id ?? 0) % SHOP_COLORS.length]
}

function shopInitials(name) {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

const iconBtn = 'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors dark:text-[#a0a0ab] dark:hover:bg-white/[0.08] dark:hover:text-white text-slate-500 hover:bg-slate-100 hover:text-slate-800'

export function TopBar({ title }) {
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const hideSidebar = pathname.startsWith('/admin/account') || pathname.startsWith('/seller/account')
  const inSeller    = pathname.startsWith('/seller')
  const inAdmin     = pathname.startsWith('/admin')
  const shop        = user?.shop
  const { open: aiOpen, toggle: aiToggle } = useAiAssistant()

  const userInitials = [user?.name?.[0], user?.surname?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  const current      = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function handleShopClick() {
    if (inSeller) navigate('/seller/shop')
    else navigate('/seller')
  }

  function handleCreateShop() {
    navigate('/apply')
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-5 shrink-0 dark:bg-[#1a1a1f] dark:border-white/[0.08] bg-white border-black/[0.08]">
      {hideSidebar ? (
        <button
          onClick={() => navigate('/admin')}
          className="font-bold text-[15px] tracking-tight dark:text-white text-slate-900 hover:opacity-75 transition-opacity cursor-pointer"
        >
          mbium
        </button>
      ) : (
        <h1 className="text-sm font-semibold dark:text-white text-slate-700">{title}</h1>
      )}

      <div className="flex items-center gap-0.5">
        <ThemeSwitcher />

        {/* Chat / AI Assistant toggle — admin + seller */}
        {(inAdmin || inSeller) && (
          <button
            onClick={aiToggle}
            title={t('aiAssistant.title')}
            className={cn(
              iconBtn,
              aiOpen && 'dark:bg-white/[0.10] bg-slate-100 dark:text-white text-slate-800'
            )}
          >
            <Bot className="h-4 w-4" />
          </button>
        )}

        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={iconBtn}>
              <Globe className="h-4 w-4" />
              <span>{current.flag}</span>
              <span className="hidden sm:inline text-[13px]">{t(`lang.${current.code}`)}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {LANGUAGES.map(({ code, flag }) => (
              <DropdownMenuItem
                key={code}
                onClick={() => i18n.changeLanguage(code)}
                className={i18n.language === code ? 'font-semibold' : ''}
              >
                <span className="mr-2">{flag}</span>
                {t(`lang.${code}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationPanel />

        {/* Profile panel */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-blue-600 text-white text-[11px] font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[220px] p-1.5">

            {/* Shop row */}
            {shop && (
              <DropdownMenuItem
                onClick={handleShopClick}
                className="flex items-center gap-3 px-2.5 py-2 rounded-lg h-auto cursor-pointer"
              >
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-white text-[11px] font-bold', shopColor(shop.id))}>
                  {shopInitials(shop.name)}
                </div>
                <span className="flex-1 text-sm font-medium truncate">{shop.name}</span>
                <Check className="h-4 w-4 text-slate-400 shrink-0" />
              </DropdownMenuItem>
            )}

            {/* Create / apply for shop */}
            {!shop?.is_active && (
              <DropdownMenuItem
                onClick={handleCreateShop}
                className="flex items-center gap-3 px-2.5 py-2 rounded-lg h-auto cursor-pointer text-slate-500 dark:text-slate-400"
              >
                <div className="h-8 w-8 rounded-full border-2 border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center shrink-0">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <span className="text-sm">Dükan döret</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="my-1" />

            {/* User info — navigates to account page */}
            <DropdownMenuItem
              onClick={() => navigate(inSeller ? '/seller/account' : '/admin/account')}
              className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg h-auto cursor-pointer"
            >
              <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                <AvatarFallback className="bg-blue-600 text-white text-[11px] font-semibold rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name} {user?.surname}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email ?? user?.phone_number}</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            {/* Logout */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-slate-600 dark:text-slate-300 hover:text-red-500 focus:text-red-500"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="text-sm">Çykmak</span>
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export function ThemeSwitcher() {
  const { theme, toggle } = useTheme()
  return (
    <button onClick={toggle} className={iconBtn} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
