import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/store/auth'

function hasWebAccess(user) {
  if (user?.permissions?.length > 0 || user?._role?.permissions?.length > 0) return true
  if (user?.shop?.is_active) return true
  return false
}

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!hasWebAccess(user)) return <Navigate to="/login" replace />

  return <Outlet />
}
