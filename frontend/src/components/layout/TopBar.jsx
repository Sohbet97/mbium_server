import { Globe, LogOut, UserCircle, Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/store/auth'
import { useTheme } from '@/store/theme'
import { NotificationPanel } from './NotificationPanel'

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'tk', flag: '🇹🇲' },
  { code: 'ru', flag: '🇷🇺' },
]

const iconBtn = 'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors dark:text-[#a0a0ab] dark:hover:bg-white/[0.08] dark:hover:text-white text-slate-500 hover:bg-slate-100 hover:text-slate-800'

export function TopBar({ title }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const hideSidebar = pathname.startsWith('/admin/account')
  const initials = [user?.name?.[0], user?.surname?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  async function handleLogout() {
    await logout()
    navigate('/login')
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
        {/* Theme toggle */}
        <button onClick={toggle} className={iconBtn} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark'
            ? <Sun className="h-4 w-4" />
            : <Moon className="h-4 w-4" />
          }
        </button>

        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={iconBtn}>
              <Globe className="h-4 w-4" />
              <span>{current.flag}</span>
              <span className="hidden sm:inline text-[13px]">{t(`lang.${current.code}`)}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
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

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-blue-600 text-white text-[11px] font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold truncate">{user?.name} {user?.surname}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admin/account')}>
              <UserCircle className="mr-2 h-4 w-4" />
              {t('account.title')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              {t('nav.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
