import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { AdminApi } from '@/lib/api'
import { useAuth } from './auth'

const NotificationContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_BASE_URL ?? ''

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const socketRef = useRef(null)

  // Fetch initial unread count
  useEffect(() => {
    if (!user) { setNotifications([]); setUnreadCount(0); return }
    AdminApi.notifications.count().then(({ data }) => {
      setUnreadCount(data.count ?? 0);
    }).catch(() => { })
  }, [user])

  // Connect Socket.IO and join user room
  useEffect(() => {
    if (!user) return

    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', { id: user.id })
    })

    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((c) => c + 1)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  async function fetchNotifications(params) {
    const { data } = await AdminApi.notifications.list(params)
    setNotifications(data.data ?? [])
    return data
  }

  async function markAsRead(id) {
    await AdminApi.notifications.markAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 1, read_at: new Date().toISOString() } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  async function markAllAsRead() {
    await AdminApi.notifications.markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 1, read_at: n.read_at ?? new Date().toISOString() })))
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, socketRef }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
