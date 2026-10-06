import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { AdminApi } from '@/lib/api'
import { ChatsPanel } from '@/components/chat/ChatsPanel'
import { usePendingCounts } from '@/store/pendingCounts'

// Admins read every dialog but can only answer in support chats
const canReply = (chat) => chat.type === 'support'

export default function AdminChatsPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const initialChatId = Number(params.get('chat')) || null
  const { refresh } = usePendingCounts() ?? {}
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('chats.title')}</h1>
      <ChatsPanel api={AdminApi.chat} canReply={canReply} onReadChange={refresh} initialChatId={initialChatId} />
    </div>
  )
}
