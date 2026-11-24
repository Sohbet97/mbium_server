import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { AdminApi } from '@/lib/api'
import { ChatsPanel } from '@/components/chat/ChatsPanel'
import { usePendingCounts } from '@/store/pendingCounts'
import { useAuth } from '@/store/auth'
import { hasPerm, Permissions } from '@/lib/permissions'

// Admins read every dialog but can only answer in support chats
const canReply = (chat) => chat.type === 'support'

export default function AdminChatsPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const initialChatId = Number(params.get('chat')) || null
  const { refresh } = usePendingCounts() ?? {}
  const { user } = useAuth()
  const canDelete = hasPerm(user, Permissions.CHAT_DELETE)
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('chats.title')}</h1>
      <ChatsPanel
        api={AdminApi.chat}
        canReply={canReply}
        canDeleteMessage={() => canDelete}
        canDeleteChat={() => canDelete}
        onReadChange={refresh}
        initialChatId={initialChatId}
      />
    </div>
  )
}
