import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Loader2, MessageSquare, Store, Package, LifeBuoy } from 'lucide-react'
import { toast } from 'sonner'
import { useNotifications } from '@/store/notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const TABS = [
  { key: '',        icon: MessageSquare },
  { key: 'shop',    icon: Store },
  { key: 'product', icon: Package },
  { key: 'support', icon: LifeBuoy },
]

const POLL_MS = 20_000

const personName = (p) => [p?.name, p?.surname].filter(Boolean).join(' ') || '—'
const fmtTime = (d) => new Date(d).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

// api: { list(params), messages(id, params), send(id, data), read(id) }
// canReply(chat): whether the reply box is shown for this chat
export function ChatsPanel({ api, canReply = () => true, onReadChange, initialChatId = null }) {
  const { t } = useTranslation()
  const { socketRef } = useNotifications() ?? {}

  const [tab, setTab]           = useState('')
  const [chats, setChats]       = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [selectedId, setSelectedId]   = useState(initialChatId)
  const [messages, setMessages] = useState([])
  const [cursor, setCursor]     = useState(null)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef(null)
  const selectedRef = useRef(null)
  selectedRef.current = selectedId

  const selectChat = (id) => { setSelectedId(id); setMessages([]); setCursor(null) }

  const selected = chats.find((c) => c.id === selectedId) ?? null

  const loadList = useCallback(async () => {
    try {
      const { data } = await api.list({ type: tab || undefined, limit: 50 })
      setChats(data.items ?? [])
    } catch {
      toast.error(t('toast.error'))
    } finally {
      setLoadingList(false)
    }
  }, [api, tab, t])

  useEffect(() => {
    loadList()
    const id = setInterval(loadList, POLL_MS)
    return () => clearInterval(id)
  }, [loadList])

  const markRead = useCallback(async (id) => {
    try {
      await api.read(id)
      setChats((cs) => cs.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)))
      onReadChange?.()
    } catch { /* read receipts are best-effort */ }
  }, [api, onReadChange])

  const loadMessages = useCallback(async (id, { older = false, before } = {}) => {
    setLoadingMsgs(true)
    try {
      const { data } = await api.messages(id, { before, limit: 30 })
      if (selectedRef.current !== id) return
      setMessages((prev) => (older ? [...(data.items ?? []), ...prev] : (data.items ?? [])))
      setCursor(data.next_cursor ?? null)
    } catch {
      toast.error(t('toast.error'))
    } finally {
      setLoadingMsgs(false)
    }
  }, [api, t])

  useEffect(() => {
    if (!selectedId) return
    loadMessages(selectedId).then(() => markRead(selectedId))
  }, [selectedId, loadMessages, markRead])

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }) }, [messages.length, selectedId])

  // Live updates: a new message refreshes the list and, if open, the thread
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return
    const onNew = (payload) => {
      loadList()
      const openId = selectedRef.current
      if (openId && Number(payload?.chat_id) === openId) {
        loadMessages(openId).then(() => markRead(openId))
      }
    }
    socket.on('message.new', onNew)
    socket.on('support-message', onNew)
    return () => { socket.off('message.new', onNew); socket.off('support-message', onNew) }
  }, [socketRef, loadList, loadMessages, markRead])

  async function send(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body || !selectedId || sending) return
    setSending(true)
    try {
      const { data } = await api.send(selectedId, { text: body })
      setMessages((prev) => [...prev, data])
      setText('')
      loadList()
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('toast.error'))
    } finally {
      setSending(false)
    }
  }

  const chatTitle = (c) =>
    c.type === 'support' ? `${t('chats.support')} · ${personName(c.customer)}` : personName(c.customer)
  const chatSub = (c) =>
    c.type === 'product' ? c.product?.name : c.type === 'shop' ? c.shop?.name : null

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[420px] rounded-xl border dark:border-white/[0.06] overflow-hidden bg-white dark:bg-transparent">
      {/* Chat list */}
      <div className={cn('w-full md:w-80 shrink-0 border-r dark:border-white/[0.06] flex flex-col', selectedId && 'hidden md:flex')}>
        <div className="flex border-b dark:border-white/[0.06] text-xs">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key || 'all'}
              onClick={() => { setTab(key); setLoadingList(true); selectChat(null) }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 px-2 py-2.5 transition-colors',
                tab === key
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(`chats.tab_${key || 'all'}`)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="py-10 text-center text-sm text-slate-400">…</div>
          ) : chats.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">{t('chats.empty')}</div>
          ) : chats.map((c) => (
            <button
              key={c.id}
              onClick={() => selectChat(c.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b last:border-0 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.03]',
                c.id === selectedId && 'bg-slate-100 dark:bg-white/[0.06]'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate dark:text-white">{chatTitle(c)}</p>
                {c.unread_count > 0 && (
                  <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center">
                    {c.unread_count}
                  </span>
                )}
              </div>
              {chatSub(c) && <p className="text-xs text-slate-500 truncate">{chatSub(c)}</p>}
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {c.last_message
                  ? `${c.last_message.is_mine ? `${t('chats.you')}: ` : ''}${c.last_message.text ?? t('chats.attachment')}`
                  : '—'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className={cn('flex-1 flex flex-col min-w-0', !selectedId && 'hidden md:flex')}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">{t('chats.selectChat')}</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center gap-3">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => selectChat(null)}>←</Button>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate dark:text-white">{chatTitle(selected)}</p>
                {chatSub(selected) && <p className="text-xs text-slate-500 truncate">{chatSub(selected)}</p>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {cursor && (
                <div className="text-center">
                  <Button variant="ghost" size="sm" disabled={loadingMsgs} onClick={() => loadMessages(selectedId, { older: true, before: cursor })}>
                    {t('chats.loadOlder')}
                  </Button>
                </div>
              )}
              {loadingMsgs && messages.length === 0 && <div className="text-center text-sm text-slate-400">…</div>}
              {messages.map((m) => (
                <div key={m.id} className={cn('flex', m.is_mine ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                    m.is_mine
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-white/10 dark:text-white rounded-bl-sm'
                  )}>
                    {!m.is_mine && m.sender?.name && (
                      <p className="text-[11px] font-medium opacity-70 mb-0.5">{personName(m.sender)}</p>
                    )}
                    {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                    {m.attachment_url && (
                      <a href={m.attachment_url} target="_blank" rel="noreferrer" className="underline text-xs">{t('chats.attachment')}</a>
                    )}
                    <p className={cn('text-[10px] mt-1', m.is_mine ? 'text-white/70' : 'text-slate-400')}>{fmtTime(m.sent_at)}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {canReply(selected) ? (
              <form onSubmit={send} className="p-3 border-t dark:border-white/[0.06] flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={500}
                  placeholder={t('chats.placeholder')}
                />
                <Button type="submit" disabled={sending || !text.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            ) : (
              <p className="p-3 border-t dark:border-white/[0.06] text-xs text-slate-400 text-center">{t('chats.readOnly')}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
