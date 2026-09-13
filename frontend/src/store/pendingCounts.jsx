import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AdminApi } from '@/lib/api'

const PendingCountsContext = createContext(null)

const POLL_INTERVAL_MS = 60_000

export function PendingCountsProvider({ children }) {
  const [counts, setCounts] = useState({})

  const refresh = useCallback(() => {
    AdminApi.pendingCounts.get().then(({ data }) => {
      setCounts(data.data ?? {})
    }).catch(() => { })
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <PendingCountsContext.Provider value={{ counts, refresh }}>
      {children}
    </PendingCountsContext.Provider>
  )
}

export function usePendingCounts() {
  return useContext(PendingCountsContext)
}
