// Mirrors the GET-permission constants used by backend/utils/permissions.js.
// Only the values needed to gate admin-panel pages are included.
export const Permissions = {
  ROLE_GET: 1,
  USER_GET: 5,
  REGION_GET: 13,
  VILLAGE_GET: 17,
  COUNTRY_GET: 21,
  CATEGORY_GET: 25,
  PRODUCT_GET: 29,
  ORDER_GET: 33,
  REVIEW_GET: 37,
  DISCOUNT_GET: 41,
  BANNER_GET: 45,
  COLLECTION_GET: 57,
  MEDIA_GET: 61,
  DELIVER_GET: 69,
  PLAN_GET: 73,
  SHOP_GET: 81,
  AI_GET: 85,
  PUSH_NOTIF_GET: 89,
  AUDIT_GET: 310,
  ANALYTICS_GET: 311,
  WAREHOUSE_GET: 312,
  COIN_GET: 316,
  BRAND_GET: 320,
  SUPPLIER_GET: 324,
  COMMENT_GET: 328,
  KYC_GET: 332,
  REEL_GET: 336,
  SIZE_GET: 340,
  DELIVERY_TYPE_GET: 344,
  TURBO_GET: 348,
  GIFT_CREATOR_GET: 352,
  GIFT_TYPE_GET: 356,
}

// Required permission per /admin/* page. `null` = any logged-in admin.
// An array means "any one of these" (e.g. the locations page has separate
// tabs gated by separate backend permissions).
export const ADMIN_PAGE_PERMISSIONS = {
  dashboard: null,
  users: Permissions.USER_GET,
  shops: Permissions.SHOP_GET,
  categories: Permissions.CATEGORY_GET,
  products: Permissions.PRODUCT_GET,
  collections: Permissions.COLLECTION_GET,
  orders: Permissions.ORDER_GET,
  reviews: Permissions.REVIEW_GET,
  discounts: Permissions.DISCOUNT_GET,
  roles: Permissions.ROLE_GET,
  locations: [Permissions.REGION_GET, Permissions.VILLAGE_GET, Permissions.COUNTRY_GET],
  settings: null,
  account: null,
  media: Permissions.MEDIA_GET,
  banners: Permissions.BANNER_GET,
  delivers: Permissions.DELIVER_GET,
  plans: Permissions.PLAN_GET,
  shopApplications: Permissions.SHOP_GET,
  shopTypeRequests: null,
  aiRecommendations: Permissions.AI_GET,
  pushNotifications: Permissions.PUSH_NOTIF_GET,
  auditLogs: Permissions.AUDIT_GET,
  analytics: Permissions.ANALYTICS_GET,
  warehouses: Permissions.WAREHOUSE_GET,
  coins: Permissions.COIN_GET,
  turbo: Permissions.TURBO_GET,
  favorites: Permissions.PRODUCT_GET,
  tags: Permissions.PRODUCT_GET,
  brands: Permissions.BRAND_GET,
  sizes: Permissions.SIZE_GET,
  deliveryTypes: Permissions.DELIVERY_TYPE_GET,
  suppliers: Permissions.SUPPLIER_GET,
  comments: Permissions.COMMENT_GET,
  kyc: Permissions.KYC_GET,
  reels: Permissions.REEL_GET,
  gifts: Permissions.GIFT_TYPE_GET,
}

export function hasPerm(user, perm) {
  if (perm == null) return true
  const granted = user?._role?.permissions ?? user?.permissions ?? []
  if (Array.isArray(perm)) return perm.some((p) => granted.includes(p))
  return granted.includes(perm)
}
