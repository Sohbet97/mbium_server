import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { SellerApi } from '@/lib/api'
import { ChatsPanel } from '@/components/chat/ChatsPanel'
import { useSellerPendingCounts } from '@/store/sellerPendingCounts'

export default function SellerChatsPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const initialChatId = Number(params.get('chat')) || null
  const { refresh } = useSellerPendingCounts() ?? {}
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold dark:text-white">{t('chats.title')}</h1>
      <ChatsPanel api={SellerApi.chat} onReadChange={refresh} initialChatId={initialChatId} />
    </div>
  )
}
