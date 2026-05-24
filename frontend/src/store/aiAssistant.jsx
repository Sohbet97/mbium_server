import { createContext, useContext, useState, useCallback } from 'react'

const AiAssistantContext = createContext(null)

export function AiAssistantProvider({ children }) {
  const [open, setOpen]               = useState(false)
  const [activeTab, setActiveTab]     = useState('support') // 'support' | 'ai'
  const [messages, setMessages]       = useState([])        // AI tab messages
  const [supportRoom, setSupportRoom] = useState(null)
  const [supportMessages, setSupportMessages] = useState([])

  const toggle = useCallback(() => setOpen((v) => !v), [])
  const close  = useCallback(() => setOpen(false), [])

  // AI tab helpers
  function addMessage(msg) { setMessages((prev) => [...prev, msg]) }

  function updateLastAssistant(chunk) {
    setMessages((prev) => {
      const copy = [...prev]
      const last = copy[copy.length - 1]
      if (last?.role === 'assistant') {
        copy[copy.length - 1] = { ...last, content: last.content + chunk }
      } else {
        copy.push({ role: 'assistant', content: chunk })
      }
      return copy
    })
  }

  function clearMessages() { setMessages([]) }

  // Support tab helpers
  function appendSupportMessage(msg) {
    setSupportMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }

  return (
    <AiAssistantContext.Provider value={{
      open, toggle, close,
      activeTab, setActiveTab,
      messages, addMessage, updateLastAssistant, clearMessages,
      supportRoom, setSupportRoom,
      supportMessages, setSupportMessages, appendSupportMessage,
    }}>
      {children}
    </AiAssistantContext.Provider>
  )
}

export function useAiAssistant() {
  return useContext(AiAssistantContext)
}
