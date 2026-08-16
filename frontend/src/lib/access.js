export function isAdmin(user) {
  return (user?.permissions?.length > 0) || (user?._role?.permissions?.length > 0)
}

export function hasShop(user) {
  return Boolean(user?.shop) || (user?.shops?.length > 0)
}

export function hasActiveShop(user) {
  return Boolean(user?.shop?.is_active)
}

export function hasWebAccess(user) {
  // Any logged-in user may enter the web panel: admins/sellers land in their
  // panel, plain buyers land on the shop-application flow.
  return Boolean(user)
}

export function resolveDestination(user) {
  if (isAdmin(user)) return '/admin'
  if (hasActiveShop(user)) return '/seller'
  if (hasShop(user)) return '/pending'
  return '/apply'
}
