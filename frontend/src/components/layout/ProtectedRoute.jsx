import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/store/auth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
