import { createContext, useContext, useState, useEffect } from 'react'
import { AuthApi } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }

    AuthApi.refresh().then(({ data }) => {
      if (data.token) localStorage.setItem('accessToken', data.token)
      setUser(data.user ?? null)
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
    setUser(data.user ?? null)
    return { is2FA: false, user: data.user }
  }

  async function verifyOtp(session_id, otp) {
    const { data } = await AuthApi.verifyOtp({ session_id, otp })
    if (data.token) localStorage.setItem('accessToken', data.token)
    setUser(data.user ?? null)
    return data
  }

  async function loginWithGoogle(id_token) {
    const { data } = await AuthApi.googleLogin(id_token)
    if (data.token) localStorage.setItem('accessToken', data.token)
    setUser(data.user ?? null)
    return data
  }

  function updateUser(fields) {
    setUser((u) => ({ ...u, ...fields }))
  }

  async function logout() {
    await AuthApi.logout().catch(() => {})
    localStorage.removeItem('accessToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, loginWithGoogle, logout, setUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
