import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { isAdmin, hasShop, hasActiveShop, hasWebAccess } from '@/lib/access'

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )
}

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!hasWebAccess(user)) return <Navigate to="/login" replace />

  return <Outlet />
}

// Admin panel: only platform staff with an assigned role/permissions may enter.
export function AdminRoute() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin(user)) {
    if (hasActiveShop(user)) return <Navigate to="/seller" replace />
    if (hasShop(user)) return <Navigate to="/pending" replace />
    return <Navigate to="/apply" replace />
  }

  return <Outlet />
}

// Seller panel: only shop owners with an active shop may enter.
// A seller-type user whose shop isn't active yet is sent to /pending instead.
export function SellerRoute() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!hasActiveShop(user)) {
    if (hasShop(user)) return <Navigate to="/pending" replace />
    if (isAdmin(user)) return <Navigate to="/admin" replace />
    return <Navigate to="/apply" replace />
  }

  return <Outlet />
}
