import { createContext, useContext, useState, useEffect } from 'react'
import { AuthApi } from '@/lib/api'

const AuthContext = createContext(null)

async function fetchFullProfile() {
  const { data } = await AuthApi.me()
  const model = data.model ?? null
  const shops = model?.shops ?? (model?.shop ? [model.shop] : [])
  const activeShopId = localStorage.getItem('activeShopId')
  const activeShop = activeShopId ? shops.find((s) => String(s.id) === String(activeShopId)) : null

  if (activeShopId && !activeShop?.is_active) {
    // Stored shop is gone or no longer active — fall back to the user's active shop, if any.
    if (model?.shop?.is_active) {
      localStorage.setItem('activeShopId', model.shop.id)
    } else {
      localStorage.removeItem('activeShopId')
    }
  } else if (model?.shop && !activeShopId) {
    localStorage.setItem('activeShopId', model.shop.id)
  }

  return model
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }

    AuthApi.refresh().then(async ({ data }) => {
      if (data.token) localStorage.setItem('accessToken', data.token)
      // Fetch full profile to get shop data
      const full = await fetchFullProfile().catch(() => data.user ?? null)
      setUser(full)
    }).catch(() => {
      localStorage.removeItem('accessToken')
    }).finally(() => setLoading(false))
  }, [])

  // Returns { is2FA, user?, session_id? }
  async function login(phone_number, password) {
    const { data } = await AuthApi.login({ phone_number, password })

    if (data.is2FA) {
      return { is2FA: true, session_id: data.session_id }
    }

    if (data.token) localStorage.setItem('accessToken', data.token)
    const full = await fetchFullProfile().catch(() => data.user ?? null)
    setUser(full)
    return { is2FA: false, user: full }
  }

  async function verifyOtp(session_id, otp) {
    const { data } = await AuthApi.verifyOtp({ session_id, otp })
    if (data.token) localStorage.setItem('accessToken', data.token)
    const full = await fetchFullProfile().catch(() => data.user ?? null)
    setUser(full)
    return { ...data, user: full }
  }

  async function loginWithGoogle(id_token) {
    const { data } = await AuthApi.googleLogin(id_token)
    if (data.token) localStorage.setItem('accessToken', data.token)
    const full = await fetchFullProfile().catch(() => data.user ?? null)
    setUser(full)
    return { ...data, user: full }
  }

  function updateUser(fields) {
    setUser((u) => ({ ...u, ...fields }))
  }

  function setActiveShop(shopId) {
    if (shopId) {
      localStorage.setItem('activeShopId', shopId)
    } else {
      localStorage.removeItem('activeShopId')
    }
    const shops = user?.shops ?? (user?.shop ? [user.shop] : [])
    const selected = shops.find((s) => s.id === shopId) ?? user?.shop ?? null
    setUser((u) => ({ ...u, shop: selected }))
  }

  async function logout() {
    await AuthApi.logout().catch(() => {})
    localStorage.removeItem('accessToken')
    localStorage.removeItem('activeShopId')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, loginWithGoogle, logout, setUser, updateUser, setActiveShop }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
