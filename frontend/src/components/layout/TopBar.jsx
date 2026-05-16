import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/store/auth'
import { NotificationPanel } from './NotificationPanel'

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'tk', flag: '🇹🇲' },
  { code: 'ru', flag: '🇷🇺' },
]

export function TopBar({ title }) {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const initials = [user?.name?.[0], user?.surname?.[0]].filter(Boolean).join('').toUpperCase() || '?'
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-white shrink-0">
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 transition-colors">
              <Globe className="h-4 w-4" />
              <span>{current.flag}</span>
              <span className="hidden sm:inline">{t(`lang.${current.code}`)}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs text-slate-400 font-normal">Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LANGUAGES.map(({ code, flag }) => (
              <DropdownMenuItem
                key={code}
                onClick={() => i18n.changeLanguage(code)}
                className={i18n.language === code ? 'bg-slate-100 font-medium' : ''}
              >
                <span className="mr-2">{flag}</span>
                {t(`lang.${code}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationPanel />

        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-blue-600 text-white text-xs">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
