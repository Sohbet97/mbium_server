import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Send, Bot, Loader2, MessageCircle, ChevronLeft, History, Plus, Pencil, Trash2, Search, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAiAssistant } from '@/store/aiAssistant'
import { useAuth } from '@/store/auth'
import { useNotifications } from '@/store/notifications'
import { AdminApi, SellerApi } from '@/lib/api'
import { useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtDate(dateStr, today, yesterday) {
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return today
  const y = new Date(now); y.setDate(y.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return yesterday
  return d.toLocaleDateString()
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, selfId, isStreaming }) {
  const isMe = selfId ? msg.createdBy === selfId || msg.sender?.id === selfId : msg.role === 'user'
  return (
    <div className={cn('flex gap-2 items-end', isMe && 'flex-row-reverse')}>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
        isMe
          ? 'bg-blue-600 text-white rounded-br-sm'
          : 'bg-slate-100 dark:bg-white/[0.07] text-slate-800 dark:text-slate-100 rounded-bl-sm',
      )}>
        {msg.content ?? msg.text}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-current opacity-70 ml-0.5 animate-pulse rounded-sm align-middle" />
        )}
      </div>
    </div>
  )
}

// ── Input bar ─────────────────────────────────────────────────────────────────
function InputBar({ value, onChange, onKeyDown, onSend, onStop, streaming, placeholder }) {
  return (
    <div className="shrink-0 px-3 pb-3 pt-2 border-t dark:border-white/[0.08] border-black/[0.08]">
      <div className={cn(
        'flex items-end gap-2 rounded-xl border px-3 py-2',
        'dark:border-white/[0.10] border-slate-200',
        'dark:bg-white/[0.04] bg-slate-50',
        'focus-within:border-blue-500 dark:focus-within:border-blue-500/60 transition-colors',
      )}>
        <textarea
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-sm outline-none',
            'dark:text-white text-slate-900',
            'dark:placeholder-slate-500 placeholder-slate-400',
            'max-h-32 overflow-y-auto',
          )}
          style={{ lineHeight: '1.5' }}
        />
        {streaming ? (
          <button
            onClick={onStop}
            className="shrink-0 h-7 w-7 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          >
            <span className="h-2.5 w-2.5 bg-white rounded-sm" />
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!value.trim()}
            className={cn(
              'shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition-colors',
              value.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-200 dark:bg-white/[0.08] text-slate-400 cursor-not-allowed',
            )}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── AI Chat tab ───────────────────────────────────────────────────────────────
function AiTab() {
  const { t, i18n } = useTranslation()
  const { messages, addMessage, updateLastAssistant, clearMessages } = useAiAssistant()

  const [input, setInput]             = useState('')
  const [streaming, setStreaming]     = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [token, setToken]             = useState(null)

  // Conversation persistence
  const [conversations, setConversations] = useState([])
  const [currentConvId, setCurrentConvId] = useState(null)
  const [showHistory, setShowHistory]     = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  const bottomRef = useRef(null)
  const abortRef  = useRef(null)
  const lang = i18n.language ?? 'en'

  useEffect(() => {
    AdminApi.aiRecommendations.getAll().then(({ data }) => setSuggestions(data.data ?? [])).catch(() => {})
    setToken(localStorage.getItem('accessToken'))
    loadConversations()
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streaming])

  function loadConversations() {
    AdminApi.aiConversations.getAll()
      .then(({ data }) => setConversations(data.data ?? []))
      .catch(() => {})
  }

  async function openConversation(conv) {
    setHistoryLoading(true)
    try {
      const { data } = await AdminApi.aiConversations.getOne(conv.id)
      clearMessages()
      const msgs = data.model?.messages ?? []
      msgs.forEach((m) => addMessage(m))
      setCurrentConvId(conv.id)
      setShowHistory(false)
    } catch { /* ignore */ } finally {
      setHistoryLoading(false)
    }
  }

  async function deleteConversation(e, id) {
    e.stopPropagation()
    await AdminApi.aiConversations.delete(id).catch(() => {})
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (currentConvId === id) { clearMessages(); setCurrentConvId(null) }
  }

  function startNewChat() {
    clearMessages()
    setCurrentConvId(null)
    setShowHistory(false)
  }

  async function saveConversation(finalMessages, title) {
    try {
      if (currentConvId) {
        await AdminApi.aiConversations.update(currentConvId, { messages: finalMessages })
      } else {
        const { data } = await AdminApi.aiConversations.create({ title, messages: finalMessages })
        setCurrentConvId(data.model.id)
        loadConversations()
      }
    } catch { /* non-critical */ }
  }

  async function send(text) {
    const trimmed = text.trim()
    if (!trimmed || streaming) return
    setInput('')
    const userMsg = { role: 'user', content: trimmed }
    addMessage(userMsg)
    setStreaming(true)
    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

    let accumulated = ''
    try {
      const controller = new AbortController()
      abortRef.current = controller
      const res = await fetch(`${API_BASE}/admin/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ messages: history, lang }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        addMessage({ role: 'assistant', content: err.message ?? t('aiAssistant.error') })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break
          try {
            const { text } = JSON.parse(payload)
            if (text) { updateLastAssistant(text); accumulated += text }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') addMessage({ role: 'assistant', content: t('aiAssistant.error') })
      return
    } finally {
      setStreaming(false)
      abortRef.current = null
    }

    // Persist after successful streaming
    if (accumulated) {
      const finalMessages = [
        ...history,
        { role: 'assistant', content: accumulated },
      ]
      const title = trimmed.slice(0, 60)
      await saveConversation(finalMessages, title)
    }
  }

  const showSuggestions = messages.length === 0 && suggestions.length > 0 && !showHistory

  // ── History view ──────────────────────────────────────────────────────────
  if (showHistory) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b dark:border-white/[0.06] border-black/[0.06]">
          <button
            onClick={() => setShowHistory(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-[13px] font-semibold dark:text-white text-slate-800 flex-1">{t('aiAssistant.history')}</p>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1 text-[12px] text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />{t('aiAssistant.newChat')}
          </button>
        </div>

        {historyLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[12px] text-slate-400">{t('aiAssistant.noHistory')}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={cn(
                  'w-full flex items-start justify-between gap-2 px-4 py-3 text-left transition-colors',
                  'hover:bg-slate-50 dark:hover:bg-white/[0.04]',
                  'border-b dark:border-white/[0.05] border-black/[0.04]',
                  currentConvId === conv.id && 'bg-blue-50 dark:bg-blue-900/20',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium dark:text-white text-slate-800 truncate">{conv.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {fmtDate(conv.updatedAt, t('aiAssistant.today'), t('aiAssistant.yesterday'))}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteConversation(e, conv.id)}
                  className="shrink-0 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Chat view ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="px-3 pt-2 pb-1 shrink-0 flex items-center gap-2">
        {messages.length > 0 && (
          <button
            onClick={startNewChat}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <Plus className="h-3 w-3" /> {t('aiAssistant.newChat')}
          </button>
        )}
        <button
          onClick={() => setShowHistory(true)}
          className="ml-auto flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <History className="h-3 w-3" /> {t('aiAssistant.history')}
          {conversations.length > 0 && (
            <span className="ml-0.5 text-[10px] bg-slate-200 dark:bg-white/10 rounded px-1">{conversations.length}</span>
          )}
        </button>
      </div>

      {/* Messages / Suggestions */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {showSuggestions ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              {t('aiAssistant.suggestions')}
            </p>
            {suggestions.map((rec) => (
              <button
                key={rec.id}
                onClick={() => send(rec.prompt)}
                className={cn(
                  'flex items-start gap-2 w-full text-left rounded-xl border px-3 py-2.5 text-sm transition-colors',
                  'border-slate-200 dark:border-white/[0.08]',
                  'hover:bg-slate-50 dark:hover:bg-white/[0.05]',
                  'hover:border-blue-200 dark:hover:border-blue-500/30',
                )}
              >
                {rec.emoji && <span className="text-lg leading-none shrink-0 mt-0.5">{rec.emoji}</span>}
                <p className="font-medium text-slate-800 dark:text-white text-[13px] leading-snug">
                  {lang === 'tk' ? rec.title_tk || rec.title_en : lang === 'ru' ? rec.title_ru || rec.title_en : rec.title_en}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <Bubble key={i} msg={msg} isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'} />
            ))}
            {streaming && messages[messages.length - 1]?.role === 'user' && (
              <Bubble msg={{ role: 'assistant', content: '' }} isStreaming />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <InputBar
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
        onSend={() => send(input)}
        onStop={() => abortRef.current?.abort()}
        streaming={streaming}
        placeholder={t('aiAssistant.placeholder')}
      />
    </div>
  )
}

// ── Support: seller view ──────────────────────────────────────────────────────
function SellerSupportTab({ socketRef }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { supportRoom, setSupportRoom, supportMessages, setSupportMessages, appendSupportMessage } = useAiAssistant()

  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    SellerApi.support.getRoom()
      .then(({ data }) => { setSupportRoom(data.data); return SellerApi.support.getMessages() })
      .then(({ data }) => setSupportMessages(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return
    const handler = (msg) => { if (supportRoom && msg.room_id === supportRoom.id) appendSupportMessage(msg) }
    socket.on('support-message', handler)
    return () => socket.off('support-message', handler)
  }, [socketRef, supportRoom])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [supportMessages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    try {
      const { data } = await SellerApi.support.sendMessage({ text })
      appendSupportMessage(data.data)
    } catch { /* ignore */ } finally { setSending(false) }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 py-2 shrink-0 border-b dark:border-white/[0.06] border-black/[0.06]">
        <p className="text-[11px] text-slate-400">{t('support.helpDescription')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {supportMessages.length === 0 && (
          <p className="text-center text-[12px] text-slate-400 mt-8">{t('support.noMessages')}</p>
        )}
        {supportMessages.map((msg) => (
          <Bubble key={msg.id} msg={msg} selfId={user?.id} />
        ))}
        <div ref={bottomRef} />
      </div>

      <InputBar
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        onSend={send}
        streaming={sending}
        placeholder={t('support.placeholder')}
      />
    </div>
  )
}

// ── Support: admin view ───────────────────────────────────────────────────────
function AdminSupportTab({ socketRef }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [rooms, setRooms]               = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [messages, setMessages]         = useState([])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(true)
  const [sending, setSending]           = useState(false)
  const [search, setSearch]             = useState('')
  const [composing, setComposing]       = useState(false)   // new chat picker
  const [userSearch, setUserSearch]     = useState('')
  const [userResults, setUserResults]   = useState([])
  const [userLoading, setUserLoading]   = useState(false)
  const [startingRoom, setStartingRoom] = useState(false)

  const bottomRef   = useRef(null)
  const searchTimer = useRef(null)
  const userTimer   = useRef(null)

  function loadRooms(q) {
    AdminApi.support.getRooms(q ? { search: q } : undefined)
      .then(({ data }) => setRooms(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRooms() }, [])

  // Debounce room search
  useEffect(() => {
    clearTimeout(searchTimer.current)
    setLoading(true)
    searchTimer.current = setTimeout(() => loadRooms(search), 350)
    return () => clearTimeout(searchTimer.current)
  }, [search])

  // Debounce user search in compose mode
  useEffect(() => {
    if (!composing) return
    clearTimeout(userTimer.current)
    if (!userSearch.trim()) { setUserResults([]); return }
    setUserLoading(true)
    userTimer.current = setTimeout(async () => {
      try {
        const { data } = await AdminApi.users.getAll({ text: userSearch, limit: 10, page: 1 })
        setUserResults(data.data ?? [])
      } catch { setUserResults([]) } finally { setUserLoading(false) }
    }, 350)
    return () => clearTimeout(userTimer.current)
  }, [userSearch, composing])

  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return
    const handler = (msg) => {
      if (selectedRoom && msg.chatroom_id === selectedRoom.id) {
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
      }
      setRooms((prev) => prev.map((r) => r.id === msg.room_id ? { ...r, messages: [msg] } : r))
    }
    socket.on('support-message', handler)
    return () => socket.off('support-message', handler)
  }, [socketRef, selectedRoom])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function openRoom(room) {
    setSelectedRoom(room)
    AdminApi.support.getMessages(room.id)
      .then(({ data }) => setMessages(data.data ?? []))
      .catch(() => {})
  }

  async function startRoomWithUser(userId) {
    setStartingRoom(true)
    try {
      const { data } = await AdminApi.support.startRoom(userId)
      setComposing(false)
      setUserSearch('')
      openRoom(data.data)
    } catch { /* ignore */ } finally { setStartingRoom(false) }
  }

  async function send() {
    const text = input.trim()
    if (!text || sending || !selectedRoom) return
    setInput('')
    setSending(true)
    try {
      const { data } = await AdminApi.support.sendMessage(selectedRoom.id, { text })
      setMessages((prev) => prev.some((m) => m.id === data.data.id) ? prev : [...prev, data.data])
    } catch { /* ignore */ } finally { setSending(false) }
  }

  if (loading && !rooms.length) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
    </div>
  )

  // ── Compose: user picker overlay ──────────────────────────────────────────
  if (composing) return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b dark:border-white/[0.06] border-black/[0.06]">
        <button
          onClick={() => { setComposing(false); setUserSearch('') }}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-[13px] font-semibold dark:text-white text-slate-800">{t('support.selectUser')}</p>
      </div>

      <div className="shrink-0 px-3 py-2 border-b dark:border-white/[0.06] border-black/[0.06]">
        <div className="flex items-center gap-2 rounded-lg border dark:border-white/[0.08] border-slate-200 px-3 py-1.5 dark:bg-white/[0.04] bg-slate-50">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            autoFocus
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder={t('support.searchUsers')}
            className="flex-1 bg-transparent text-sm outline-none dark:text-white text-slate-900 dark:placeholder-slate-500 placeholder-slate-400"
          />
          {userLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 shrink-0" />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {userResults.length === 0 && userSearch.trim() && !userLoading && (
          <p className="text-center text-[12px] text-slate-400 mt-6">{t('support.noUsers')}</p>
        )}
        {userResults.length === 0 && !userSearch.trim() && (
          <p className="text-center text-[12px] text-slate-400 mt-6">{t('support.searchUsers')}</p>
        )}
        {userResults.map((u) => (
          <button
            key={u.id}
            onClick={() => startRoomWithUser(u.id)}
            disabled={startingRoom}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors border-b dark:border-white/[0.05] border-black/[0.04] text-left"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {(u.name?.[0] ?? u.phone_number?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium dark:text-white text-slate-800 truncate">
                {[u.name, u.surname].filter(Boolean).join(' ') || u.phone_number || '—'}
              </p>
              {u.phone_number && (
                <p className="text-[11px] text-slate-400 truncate">{u.phone_number}</p>
              )}
            </div>
            {startingRoom && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  )

  // ── Room list ─────────────────────────────────────────────────────────────
  if (!selectedRoom) return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header with search and compose */}
      <div className="shrink-0 border-b dark:border-white/[0.06] border-black/[0.06]">
        <div className="flex items-center gap-2 px-3 py-2">
          <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold flex-1">
            {t('support.sellerInbox')}
          </p>
          <button
            onClick={() => setComposing(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title={t('support.newConversation')}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 rounded-lg border dark:border-white/[0.08] border-slate-200 px-3 py-1.5 dark:bg-white/[0.04] bg-slate-50">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('support.searchChats')}
              className="flex-1 bg-transparent text-sm outline-none dark:text-white text-slate-900 dark:placeholder-slate-500 placeholder-slate-400"
            />
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 shrink-0" />}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 && !loading && (
          <p className="text-center text-[12px] text-slate-400 mt-8">{t('support.noRooms')}</p>
        )}
        {rooms.map((room) => {
          const seller = room.participants?.[0]?.user
          const lastMsg = room.messages?.[0]
          return (
            <button
              key={room.id}
              onClick={() => openRoom(room)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors border-b dark:border-white/[0.05] border-black/[0.04] text-left"
            >
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {seller ? (seller.name?.[0] ?? '?').toUpperCase() : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium dark:text-white text-slate-800 truncate">
                  {seller ? `${seller.name ?? ''} ${seller.surname ?? ''}`.trim() : t('support.unknownSeller')}
                </p>
                {seller?.phone_number && (
                  <p className="text-[11px] text-slate-400 truncate">{seller.phone_number}</p>
                )}
                {lastMsg && (
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{lastMsg.text}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )

  // ── Selected room messages ────────────────────────────────────────────────
  const seller = selectedRoom.participants?.[0]?.user
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-3 py-2 shrink-0 border-b dark:border-white/[0.06] border-black/[0.06] flex items-center gap-2">
        <button
          onClick={() => { setSelectedRoom(null); loadRooms(search) }}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <p className="text-[13px] font-medium dark:text-white text-slate-800 truncate">
            {seller ? `${seller.name ?? ''} ${seller.surname ?? ''}`.trim() : t('support.unknownSeller')}
          </p>
          {seller?.phone_number && (
            <p className="text-[11px] text-slate-400">{seller.phone_number}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} selfId={user?.id} />
        ))}
        <div ref={bottomRef} />
      </div>

      <InputBar
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        onSend={send}
        streaming={sending}
        placeholder={t('support.replyPlaceholder')}
      />
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function AiAssistant() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { open, close, activeTab, setActiveTab } = useAiAssistant()
  const { socketRef } = useNotifications()

  const inAdmin  = pathname.startsWith('/admin')
  const inSeller = pathname.startsWith('/seller')

  const tabs = [
    { key: 'support', label: t('support.tab'), icon: MessageCircle },
    ...(inAdmin ? [{ key: 'ai', label: t('aiAssistant.tab'), icon: Bot }] : []),
  ]

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={close} />}

      <aside className={cn(
        'fixed top-0 right-0 h-full z-50 flex flex-col',
        'w-[380px] max-w-[100vw]',
        'dark:bg-[#16161b] bg-white',
        'border-l dark:border-white/[0.08] border-black/[0.08]',
        'shadow-2xl',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'translate-x-full',
      )}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/[0.08] border-black/[0.08] shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <p className="text-[13px] font-semibold dark:text-white text-slate-900">mbium Assistant</p>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex border-b dark:border-white/[0.08] border-black/[0.08] shrink-0">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium transition-colors border-b-2',
                  activeTab === key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'support' && (inAdmin
          ? <AdminSupportTab socketRef={socketRef} />
          : <SellerSupportTab socketRef={socketRef} />
        )}
        {activeTab === 'ai' && inAdmin && <AiTab />}
      </aside>
    </>
  )
}
