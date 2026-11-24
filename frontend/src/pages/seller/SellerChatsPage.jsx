import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { SellerApi } from '@/lib/api'
import { ChatsPanel } from '@/components/chat/ChatsPanel'
import { useSellerPendingCounts } from '@/store/sellerPendingCounts'

// Sellers may remove only the messages they sent themselves
const canDeleteMessage = (message) => message.is_mine
// Deleting a buyer conversation only hides it for the seller; support chats stay
const canDeleteChat = (chat) => chat.type !== 'support'

export default function SellerChatsPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const initialChatId = Number(params.get('chat')) || null
  const { refresh } = useSellerPendingCounts() ?? {}
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold dark:text-white">{t('chats.title')}</h1>
      <ChatsPanel
        api={SellerApi.chat}
        canDeleteMessage={canDeleteMessage}
        canDeleteChat={canDeleteChat}
        chatDeleteHidesOnly
        onReadChange={refresh}
        initialChatId={initialChatId}
      />
    </div>
  )
}
