import { Navigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { hasPerm } from '@/lib/permissions'

// Gates a single admin page behind a specific permission id (or array of
// "any of these"). Unlike AdminRoute (which only checks "is this an admin
// at all"), this checks the exact permission the backend requires for the
// page's data, so a role scoped to e.g. Categories/Media/Brands can't reach
// Users, Orders, etc. just by knowing the URL.
export function PermGate({ perm, children }) {
  const { user } = useAuth()
  if (!hasPerm(user, perm)) return <Navigate to="/admin" replace />
  return children
}
