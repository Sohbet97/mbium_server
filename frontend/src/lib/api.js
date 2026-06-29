import axios from 'axios'
import { ADMIN, AUTH, PATHS } from './endpoints'

const SELLER = '/seller'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

const http = axios.create({ baseURL: BASE, withCredentials: true })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  const shopId = localStorage.getItem('activeShopId')
  if (shopId) config.headers['X-Shop-Id'] = shopId
  return config
})

let isRefreshing = false
let queue = []

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return http(original)
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post(`${BASE}${AUTH}/refresh`, {}, { withCredentials: true })
        const token = data.token
        if (token) {
          localStorage.setItem('accessToken', token)
          queue.forEach((p) => p.resolve(token))
          queue = []
          original.headers.Authorization = `Bearer ${token}`
          return http(original)
        }
      } catch {
        queue.forEach((p) => p.reject())
        queue = []
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

const a = (path) => `${ADMIN}${path}`

const crud = (path) => ({
  getAll: (params) => http.get(a(path), { params }),
  getOne: (id, params) => http.get(`${a(path)}/${id}`, { params }),
  create: (data) => http.post(a(path), data),
  update: (id, data) => http.put(`${a(path)}/${id}`, data),
  patch: (id, data) => http.patch(`${a(path)}/${id}`, data),
  delete: (id) => http.delete(`${a(path)}/${id}`),
  forceDelete: (id) => http.delete(`${a(path)}/${id}/force`),
  restore: (id) => http.patch(`${a(path)}/${id}/restore`),
})

export class AdminApi {
  static roles = crud(PATHS.ROLES)
  static users = {
    ...crud(PATHS.USERS),
    unlock: (id) => http.put(a(`${PATHS.USERS}/${id}/unlock`)),
  }
  static shops = {
    ...crud(PATHS.SHOPS),
    verify:          (id)       => http.patch(a(`${PATHS.SHOPS}/${id}/verify`)),
    reject:          (id, data) => http.patch(a(`${PATHS.SHOPS}/${id}/reject`), data),
    submitForReview: (id)       => http.patch(a(`${PATHS.SHOPS}/${id}/submit`)),
  }
  static shopTypes = { getAll: (params) => http.get(a(PATHS.SHOP_TYPES), { params }) }
  static categories = {
    ...crud(PATHS.CATEGORIES),
    tree: (params) => http.get(a(`${PATHS.CATEGORIES}/tree`), { params }),
  }
  static products = {
    ...crud(PATHS.PRODUCTS),
    variants: {
      create: (productId, data) => http.post(a(`${PATHS.PRODUCTS}/${productId}/variants`), data),
      update: (productId, variantId, data) => http.put(a(`${PATHS.PRODUCTS}/${productId}/variants/${variantId}`), data),
      delete: (productId, variantId) => http.delete(a(`${PATHS.PRODUCTS}/${productId}/variants/${variantId}`)),
    },
  }
  static collections = {
    ...crud(PATHS.COLLECTIONS),
    addProduct:     (id, data)      => http.post(a(`${PATHS.COLLECTIONS}/${id}/products`), data),
    removeProduct:  (id, productId) => http.delete(a(`${PATHS.COLLECTIONS}/${id}/products/${productId}`)),
    searchProducts: (params)        => http.get(a(`${PATHS.COLLECTIONS}/search-products`), { params }),
  }
  static orders = {
    ...crud(PATHS.ORDERS),
    updateStatus: (id, data) => http.patch(a(`${PATHS.ORDERS}/${id}/status`), data),
    addPayment: (id, data) => http.post(a(`${PATHS.ORDERS}/${id}/payments`), data),
  }
  static reviews = {
    ...crud(PATHS.REVIEWS),
    updateStatus: (id, status) => http.patch(a(`${PATHS.REVIEWS}/${id}/status`), { status }),
  }
  static discounts  = crud(PATHS.DISCOUNTS)
  static countries  = crud(PATHS.COUNTRIES)
  static regions    = crud(PATHS.REGIONS)
  static cities     = crud(PATHS.CITIES)
  static districts  = crud(PATHS.DISTRICTS)
  static villages   = crud(PATHS.VILLAGES)
  static config = {
    get:    ()     => http.get(a(PATHS.CONFIG)),
    update: (data) => http.put(a(PATHS.CONFIG), data),
  }
  static notifications = {
    list:       (params) => http.get(a(PATHS.NOTIFICATIONS), { params }),
    count:      ()       => http.get(a(`${PATHS.NOTIFICATIONS}/count`)),
    markAsRead: (id)     => http.patch(a(`${PATHS.NOTIFICATIONS}/${id}/read`)),
    markAllAsRead: ()    => http.patch(a(`${PATHS.NOTIFICATIONS}/read-all`)),
  }
  static bannerTypes = {
    getAll: ()        => http.get(a(PATHS.BANNER_TYPES)),
    create: (data)    => http.post(a(PATHS.BANNER_TYPES), data),
    update: (id, data)=> http.put(a(`${PATHS.BANNER_TYPES}/${id}`), data),
    delete: (id)      => http.delete(a(`${PATHS.BANNER_TYPES}/${id}`)),
  }
  static delivers = crud(PATHS.DELIVERS)
  static plans = {
    getAll:  (params) => http.get(a(PATHS.PLANS), { params }),
    getOne:  (id)     => http.get(a(`${PATHS.PLANS}/${id}`)),
    create:  (data)   => http.post(a(PATHS.PLANS), data),
    update:  (id, data) => http.put(a(`${PATHS.PLANS}/${id}`), data),
    delete:  (id)     => http.delete(a(`${PATHS.PLANS}/${id}`)),
  }
  static shopSubscriptions = {
    getAll:           (params)      => http.get(a(PATHS.SHOP_SUBSCRIPTIONS), { params }),
    getActiveForShop: (shopId)      => http.get(a(`${PATHS.SHOP_SUBSCRIPTIONS}/shop/${shopId}/active`)),
    assign:           (data)        => http.post(a(PATHS.SHOP_SUBSCRIPTIONS), data),
    updateStatus:     (id, data)    => http.patch(a(`${PATHS.SHOP_SUBSCRIPTIONS}/${id}/status`), data),
    remove:           (id)          => http.delete(a(`${PATHS.SHOP_SUBSCRIPTIONS}/${id}`)),
  }
  static aiRecommendations = crud(PATHS.AI_RECOMMENDATIONS)
  static aiConversations = {
    getAll:  ()         => http.get(a('/ai/conversations')),
    getOne:  (id)       => http.get(a(`/ai/conversations/${id}`)),
    create:  (data)     => http.post(a('/ai/conversations'), data),
    update:  (id, data) => http.put(a(`/ai/conversations/${id}`), data),
    delete:  (id)       => http.delete(a(`/ai/conversations/${id}`)),
  }
  static banners = {
    getAll:  (params) => http.get(a(PATHS.BANNERS), { params }),
    getOne:  (id)     => http.get(a(`${PATHS.BANNERS}/${id}`)),
    create:  (data)   => http.post(a(PATHS.BANNERS), data),
    update:  (id, data) => http.put(a(`${PATHS.BANNERS}/${id}`), data),
    delete:  (id)     => http.delete(a(`${PATHS.BANNERS}/${id}`)),
    reorder: (items)  => http.post(a(`${PATHS.BANNERS}/reorder`), { items }),
    toggleActive: (id, is_active) => http.put(a(`${PATHS.BANNERS}/${id}`), { is_active }),
  }
  static media = {
    upload:    (formData, mediaType) =>
      http.post(a(`${PATHS.MEDIA}/upload${mediaType ? `?media_type=${mediaType}` : ''}`), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    list:      (params)        => http.get(a(PATHS.MEDIA), { params }),
    getOne:    (id)            => http.get(a(`${PATHS.MEDIA}/${id}`)),
    update:    (id, data)      => http.patch(a(`${PATHS.MEDIA}/${id}`), data),
    delete:    (id)            => http.delete(a(`${PATHS.MEDIA}/${id}`)),
    // Product ↔ Media
    getProductMedia: (productId) =>
      http.get(a(`${PATHS.MEDIA}/product/${productId}`)),
    attachToProduct: (productId, data) =>
      http.post(a(`${PATHS.MEDIA}/product/${productId}`), data),
    updateProductMedia: (productId, mediaId, data) =>
      http.patch(a(`${PATHS.MEDIA}/product/${productId}/${mediaId}`), data),
    detachFromProduct: (productId, mediaId) =>
      http.delete(a(`${PATHS.MEDIA}/product/${productId}/${mediaId}`)),
  }
  static shopApplications = {
    getAll:      (params)      => http.get(a('/shop-applications'), { params }),
    getHistory:  (params)      => http.get(a('/shop-applications/history'), { params }),
    getLogs:     (id)          => http.get(a(`/shop-applications/${id}/history`)),
    verify:      (id)          => http.post(a(`/shop-applications/${id}/verify`)),
    reject:      (id, data)    => http.post(a(`/shop-applications/${id}/reject`), data),
    reopen:      (id)          => http.post(a(`/shop-applications/${id}/reopen`)),
  }
  static shopTypeRequests = {
    getAll:  (params) => http.get(a('/shop-type-requests'), { params }),
    approve: (id)     => http.post(a(`/shop-type-requests/${id}/approve`)),
    reject:  (id, data) => http.post(a(`/shop-type-requests/${id}/reject`), data),
  }
  static pushNotifications = {
    getAll: (params) => http.get(a(PATHS.PUSH_NOTIFICATIONS), { params }),
    send:   (data)   => http.post(a(PATHS.PUSH_NOTIFICATIONS), data),
  }
  static support = {
    getRooms:    (params)       => http.get(a('/support/rooms'), { params }),
    getMessages: (roomId)       => http.get(a(`/support/rooms/${roomId}/messages`)),
    sendMessage: (roomId, data) => http.post(a(`/support/rooms/${roomId}/messages`), data),
    startRoom:   (userId)       => http.post(a('/support/rooms/start'), { user_id: userId }),
  }
  static auditLogs = {
    getAll: (params) => http.get(a(PATHS.AUDIT_LOGS), { params }),
  }
  static analytics = {
    getOverview: (params) => http.get(a(`${PATHS.ANALYTICS}/overview`), { params }),
    getShops:    (params) => http.get(a(`${PATHS.ANALYTICS}/shops`),    { params }),
    getUsers:    (params) => http.get(a(`${PATHS.ANALYTICS}/users`),    { params }),
    getOrders:   (params) => http.get(a(`${PATHS.ANALYTICS}/orders`),   { params }),
  }
  static warehouses = crud(PATHS.WAREHOUSES)
  static inventory = {
    getAll:  (params) => http.get(a(PATHS.INVENTORY), { params }),
    upsert:  (data)   => http.put(a(PATHS.INVENTORY), data),
    adjust:  (data)   => http.post(a(`${PATHS.INVENTORY}/adjust`), data),
  }
  static stockMovements = {
    getAll: (params) => http.get(a(PATHS.STOCK_MOVEMENTS), { params }),
  }
  static coins = {
    getBalances:       (params)   => http.get(a(`${PATHS.COINS}/balances`), { params }),
    getBalance:        (userId)   => http.get(a(`${PATHS.COINS}/balances/${userId}`)),
    grant:             (data)     => http.post(a(`${PATHS.COINS}/grant`), data),
    deduct:            (data)     => http.post(a(`${PATHS.COINS}/deduct`), data),
    getConditions:     (params)   => http.get(a(`${PATHS.COINS}/conditions`), { params }),
    createCondition:   (data)     => http.post(a(`${PATHS.COINS}/conditions`), data),
    updateCondition:   (id, data) => http.put(a(`${PATHS.COINS}/conditions/${id}`), data),
    deleteCondition:   (id)       => http.delete(a(`${PATHS.COINS}/conditions/${id}`)),
    getTopups:         (params)   => http.get(a(`${PATHS.COINS}/topups`), { params }),
    updateTopupStatus: (id, data) => http.patch(a(`${PATHS.COINS}/topups/${id}/status`), data),
  }
  static favorites = {
    getAll: (params) => http.get(a(`${PATHS.FAVORITES}`), { params }),
  }
  static catalog = {
    getTags:      (params)     => http.get(a(`${PATHS.PRODUCT_TAGS}`), { params }),
    createTag:    (data)       => http.post(a(`${PATHS.PRODUCT_TAGS}`), data),
    updateTag:    (id, data)   => http.put(a(`${PATHS.PRODUCT_TAGS}/${id}`), data),
    deleteTag:    (id)         => http.delete(a(`${PATHS.PRODUCT_TAGS}/${id}`)),
    attachTag:    (productId, tagId)  => http.post(a(`${PATHS.PRODUCT_TAGS}/${productId}/attach`), { tag_id: tagId }),
    detachTag:    (productId, tagId)  => http.delete(a(`${PATHS.PRODUCT_TAGS}/${productId}/detach/${tagId}`)),
  }
  static brands = {
    getAll:  (params)     => http.get(a(`${PATHS.BRANDS}`), { params }),
    getTree: ()           => http.get(a(`${PATHS.BRANDS}/tree`)),
    getOne:  (id)         => http.get(a(`${PATHS.BRANDS}/${id}`)),
    create:  (data)       => http.post(a(`${PATHS.BRANDS}`), data),
    update:  (id, data)   => http.put(a(`${PATHS.BRANDS}/${id}`), data),
    delete:  (id)         => http.delete(a(`${PATHS.BRANDS}/${id}`)),
  }
  static suppliers = {
    getAll:  (params)     => http.get(a(`${PATHS.SUPPLIERS}`), { params }),
    getOne:  (id)         => http.get(a(`${PATHS.SUPPLIERS}/${id}`)),
    create:  (data)       => http.post(a(`${PATHS.SUPPLIERS}`), data),
    update:  (id, data)   => http.put(a(`${PATHS.SUPPLIERS}/${id}`), data),
    delete:  (id)         => http.delete(a(`${PATHS.SUPPLIERS}/${id}`)),
  }
  static comments = {
    getAll:    (params)      => http.get(a(PATHS.COMMENTS), { params }),
    setStatus: (id, status)  => http.patch(a(`${PATHS.COMMENTS}/${id}/status`), { status }),
    delete:    (id)          => http.delete(a(`${PATHS.COMMENTS}/${id}`)),
  }
  static kyc = {
    getAll:    (params)         => http.get(a(PATHS.KYC), { params }),
    getByShop: (shopId)         => http.get(a(`${PATHS.SHOPS}/${shopId}${PATHS.KYC}`)),
    create:    (shopId, data)   => http.post(a(`${PATHS.SHOPS}/${shopId}${PATHS.KYC}`), data),
    upload:    (shopId, fd)     => http.post(a(`${PATHS.SHOPS}/${shopId}${PATHS.KYC}/upload`), fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    setStatus: (shopId, docId, status) => http.patch(a(`${PATHS.SHOPS}/${shopId}${PATHS.KYC}/${docId}/status`), { status }),
    delete:    (shopId, docId)  => http.delete(a(`${PATHS.SHOPS}/${shopId}${PATHS.KYC}/${docId}`)),
  }
}

// ─── BuyerApi ──────────────────────────────────────────────────────────────────

const b = (path) => `/buyer${path}`

export class BuyerApi {
  static favorites = {
    getAll:  (params)     => http.get(b(`${PATHS.FAVORITES}`), { params }),
    add:     (productId)  => http.post(b(`${PATHS.FAVORITES}/${productId}`)),
    remove:  (productId)  => http.delete(b(`${PATHS.FAVORITES}/${productId}`)),
  }
  static comments = {
    getByProduct: (productId, params) => http.get(b(`/catalog/products/${productId}/comments`), { params }),
    create:       (productId, data)   => http.post(b(`/catalog/products/${productId}/comments`), data),
  }
  static coins = {
    getBalance: ()       => http.get(b(`${PATHS.COINS}/balance`)),
    getHistory: (params) => http.get(b(`${PATHS.COINS}/history`), { params }),
    submitTopup:(data)   => http.post(b(`${PATHS.COINS}/topup`), data),
    getTopups:  (params) => http.get(b(`${PATHS.COINS}/topup`), { params }),
  }
}

const s = (path) => `${SELLER}${path}`

export class SellerApi {
  static dashboard = {
    get: () => http.get(s('/dashboard')),
  }
  static categories = {
    getAll: (params) => http.get(s('/categories'), { params }),
  }
  static shop = {
    get:           ()             => http.get(s('/shop')),
    update:        (data)         => http.patch(s('/shop'), data),
    setCategories: (category_ids) => http.put(s('/shop/categories'), { category_ids }),
    uploadLogo:    (formData)     => http.post(s('/shop/logo'), formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    uploadDocs:    (formData)     => http.post(s('/shop/docs'), formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getTypes:                ()       => http.get(s('/shop/types')),
    getTypeChangeRequest:    ()       => http.get(s('/shop/type-change-request')),
    createTypeChangeRequest: (data)   => http.post(s('/shop/type-change-request'), data),
  }
  static products = {
    getAll:  (params)       => http.get(s('/products'), { params }),
    getOne:  (id)           => http.get(s(`/products/${id}`)),
    generateSpin: (id, data) => http.post(s(`/products/${id}/spin/generate`), data),
    generateSpinFromUpload: (id, formData) =>
      http.post(s(`/products/${id}/spin/generate-from-upload`), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    removeBg:        (productId, mediaId) =>
      http.post(s(`/products/${productId}/media/${mediaId}/remove-bg`)),
    confirmRemoveBg: (productId, mediaId, data) =>
      http.post(s(`/products/${productId}/media/${mediaId}/remove-bg/confirm`), data),
    rejectRemoveBg:  (productId, mediaId, data) =>
      http.post(s(`/products/${productId}/media/${mediaId}/remove-bg/reject`), data),
    rotateMedia:     (productId, mediaId, degrees) =>
      http.post(s(`/products/${productId}/media/${mediaId}/rotate`), { degrees }),
    create:  (data)         => http.post(s('/products'), data),
    update:  (id, data)     => http.put(s(`/products/${id}`), data),
    delete:  (id)           => http.delete(s(`/products/${id}`)),
    variants: {
      create: (productId, data)             => http.post(s(`/products/${productId}/variants`), data),
      update: (productId, variantId, data)  => http.put(s(`/products/${productId}/variants/${variantId}`), data),
      delete: (productId, variantId)        => http.delete(s(`/products/${productId}/variants/${variantId}`)),
    },
  }
  static orders = {
    getAll:       (params)       => http.get(s('/orders'), { params }),
    getOne:       (id)           => http.get(s(`/orders/${id}`)),
    updateStatus: (id, data)     => http.patch(s(`/orders/${id}/status`), data),
    getShipments:   (id)                          => http.get(s(`/orders/${id}/shipments`)),
    addShipment:    (id, data)                    => http.post(s(`/orders/${id}/shipments`), data),
    updateShipment: (id, shipmentId, data)        => http.patch(s(`/orders/${id}/shipments/${shipmentId}`), data),
    deleteShipment: (id, shipmentId)              => http.delete(s(`/orders/${id}/shipments/${shipmentId}`)),
    updateItem:     (id, itemId, data)            => http.patch(s(`/orders/${id}/items/${itemId}`), data),
    deleteItem:     (id, itemId)                  => http.delete(s(`/orders/${id}/items/${itemId}`)),
  }
  static payouts = {
    getBalance:  ()     => http.get(s('/payouts/balance')),
    getHistory:  (params) => http.get(s('/payouts/history'), { params }),
    request:     (data) => http.post(s('/payouts/request'), data),
  }
  static discounts = {
    getAll:  (params)       => http.get(s('/discounts'), { params }),
    create:  (data)         => http.post(s('/discounts'), data),
    update:  (id, data)     => http.put(s(`/discounts/${id}`), data),
    delete:  (id)           => http.delete(s(`/discounts/${id}`)),
  }
  static banners = {
    getAll:  ()             => http.get(s('/banners')),
    create:  (data)         => http.post(s('/banners'), data),
    update:  (id, data)     => http.put(s(`/banners/${id}`), data),
    delete:  (id)           => http.delete(s(`/banners/${id}`)),
  }
  static plans = {
    getAll:          () => http.get(s('/plans')),
    getSubscription: () => http.get(s('/plans/subscription')),
    getHistory:      () => http.get(s('/plans/subscription/history')),
  }
  static pushNotifications = {
    getAll:          (params) => http.get(s(PATHS.PUSH_NOTIFICATIONS), { params }),
    send:            (data)   => http.post(s(PATHS.PUSH_NOTIFICATIONS), data),
    searchCustomers: (text)   => http.get(s(`${PATHS.PUSH_NOTIFICATIONS}/customers`), { params: { text } }),
  }
  static media = {
    list:   (params)              => http.get(s('/media'), { params }),
    upload: (formData, mediaType) =>
      http.post(s(`/media/upload${mediaType ? `?media_type=${mediaType}` : ''}`), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    delete: (id)                  => http.delete(s(`/media/${id}`)),
    getProductMedia:    (productId)             => http.get(s(`/media/product/${productId}`)),
    attachToProduct:    (productId, data)       => http.post(s(`/media/product/${productId}`), data),
    updateProductMedia: (productId, mediaId, data) => http.patch(s(`/media/product/${productId}/${mediaId}`), data),
    detachFromProduct:  (productId, mediaId)   => http.delete(s(`/media/product/${productId}/${mediaId}`)),
  }
  static support = {
    getRoom:     ()     => http.get(s('/support/room')),
    getMessages: ()     => http.get(s('/support/messages')),
    sendMessage: (data) => http.post(s('/support/messages'), data),
  }
  static analytics = {
    getOverview: (params) => http.get(s(`${PATHS.ANALYTICS}/overview`), { params }),
    getProducts: (params) => http.get(s(`${PATHS.ANALYTICS}/products`), { params }),
    getPayouts:  (params) => http.get(s(`${PATHS.ANALYTICS}/payouts`),  { params }),
  }
  static warehouses = {
    getAll:          (params)     => http.get(s('/warehouses'), { params }),
    getOne:          (id)         => http.get(s(`/warehouses/${id}`)),
    create:          (data)       => http.post(s('/warehouses'), data),
    update:          (id, data)   => http.put(s(`/warehouses/${id}`), data),
    delete:          (id)         => http.delete(s(`/warehouses/${id}`)),
    getInventory:    (id, params) => http.get(s(`/warehouses/${id}/inventory`), { params }),
    upsertInventory: (id, data)   => http.put(s(`/warehouses/${id}/inventory`), data),
    adjustInventory: (id, data)   => http.post(s(`/warehouses/${id}/inventory/adjust`), data),
    getMovements:    (id, params) => http.get(s(`/warehouses/${id}/movements`), { params }),
  }
}

export const AuthApi = {
  login:            (data) => http.post(`${AUTH}/login`, data),
  refresh:          ()     => http.post(`${AUTH}/refresh`),
  logout:           ()     => http.post(`${AUTH}/logout`),
  verifyOtp:        (data) => http.post(`${AUTH}/verify-otp`, data),
  resendOtp:        (data) => http.post(`${AUTH}/resend-otp`, data),
  googleLogin:      (id_token) => http.post(`${AUTH}/google`, { id_token }),
  me:               ()     => http.get(`${AUTH}/me`),
  updateMe:         (data) => http.patch(`${AUTH}/me`, data),
  disconnectGoogle: ()     => http.delete(`${AUTH}/me/google`),
  getSessions:      ()     => http.get(`${AUTH}/sessions`),
  deleteSession:    (id)   => http.delete(`${AUTH}/sessions/${id}`),
  changePassword:   (data) => http.post(`${AUTH}/change-password`, data),
  uploadAvatar:     (formData) => http.post(`${AUTH}/me/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getShopTypes:     ()         => http.get(`${AUTH}/shop-types`),
  applyForShop:     (data)     => http.post(`${AUTH}/me/shop`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyShop:        ()         => http.get(`${AUTH}/me/shop`),
  getWebToken:      ()         => http.post(`${AUTH}/web-token`),
  consumeWebToken:  (token)    => http.post(`${AUTH}/consume-web-token`, { token }),
}

export default http
