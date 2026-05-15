import axios from 'axios'
import { ADMIN, AUTH, PATHS } from './endpoints'

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

const http = axios.create({ baseURL: BASE, withCredentials: true })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
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
  restore: (id) => http.post(`${a(path)}/${id}/restore`),
})

export class AdminApi {
  static roles = crud(PATHS.ROLES)
  static users = {
    ...crud(PATHS.USERS),
    unlock: (id) => http.put(a(`${PATHS.USERS}/${id}/unlock`)),
  }
  static shops = crud(PATHS.SHOPS)
  static shopTypes = { getAll: (params) => http.get(a(PATHS.SHOP_TYPES), { params }) }
  static categories = {
    ...crud(PATHS.CATEGORIES),
    tree: (params) => http.get(a(`${PATHS.CATEGORIES}/tree`), { params }),
  }
  static products = {
    ...crud(PATHS.PRODUCTS),
    images: {
      create: (productId, data) => http.post(a(`${PATHS.PRODUCTS}/${productId}/images`), data),
      delete: (productId, imageId) => http.delete(a(`${PATHS.PRODUCTS}/${productId}/images/${imageId}`)),
    },
    variants: {
      create: (productId, data) => http.post(a(`${PATHS.PRODUCTS}/${productId}/variants`), data),
      update: (productId, variantId, data) => http.put(a(`${PATHS.PRODUCTS}/${productId}/variants/${variantId}`), data),
      delete: (productId, variantId) => http.delete(a(`${PATHS.PRODUCTS}/${productId}/variants/${variantId}`)),
    },
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
  static discounts = crud(PATHS.DISCOUNTS)
}

export const AuthApi = {
  login: (data) => http.post(`${AUTH}/login`, data),
  refresh: () => http.post(`${AUTH}/refresh`),
  logout: () => http.post(`${AUTH}/logout`),
  verifyOtp: (data) => http.post(`${AUTH}/verify-otp`, data),
  resendOtp: (data) => http.post(`${AUTH}/resend-otp`, data),
}

export default http
