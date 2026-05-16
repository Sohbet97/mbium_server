import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, ShoppingCart, Store, Star, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '@/store/notifications'

const TYPE_ICON = {
  100: <ShoppingCart className="h-4 w-4 text-blue-500" />,
  110: <Store className="h-4 w-4 text-violet-500" />,
  120: <Star className="h-4 w-4 text-yellow-500" />,
  130: <AlertTriangle className="h-4 w-4 text-red-500" />,
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export function NotificationPanel() {
  const { t } = useTranslation()
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) fetchNotifications({ limit: 20 }).catch(() => {})
  }, [open])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-500" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            {t('notifications.title')}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => markAllAsRead()}>
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-400">{t('notifications.empty')}</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => n.status === 0 && markAsRead(n.id)}
              className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${n.status === 0 ? 'bg-blue-50/60' : ''}`}
            >
              <div className="mt-0.5 shrink-0">{TYPE_ICON[n.type] ?? <Bell className="h-4 w-4 text-slate-400" />}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 leading-snug">{n.content}</p>
                <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>
              {n.status === 0 && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
