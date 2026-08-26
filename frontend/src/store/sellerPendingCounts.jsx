import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { SellerApi } from '@/lib/api'
import { useAuth } from './auth'

const SellerPendingCountsContext = createContext(null)

const POLL_INTERVAL_MS = 60_000

export function SellerPendingCountsProvider({ children }) {
  const { user } = useAuth()
  const shopId = user?.shop?.id
  const [counts, setCounts] = useState({})

  const refresh = useCallback(() => {
    SellerApi.pendingCounts.get().then(({ data }) => {
      setCounts(data.data ?? {})
    }).catch(() => { })
  }, [])

  useEffect(() => {
    if (!shopId) return
    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [shopId, refresh])

  return (
    <SellerPendingCountsContext.Provider value={{ counts, refresh }}>
      {children}
    </SellerPendingCountsContext.Provider>
  )
}

export function useSellerPendingCounts() {
  return useContext(SellerPendingCountsContext)
}
