import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/store/auth'
import { NotificationProvider } from '@/store/notifications'
import { ThemeProvider } from '@/store/theme'
import { AiAssistantProvider } from '@/store/aiAssistant'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { SellerLayout } from '@/components/layout/SellerLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import LoginPage from '@/pages/auth/LoginPage'
import PendingPage from '@/pages/auth/PendingPage'
import ShopApplyPage from '@/pages/auth/ShopApplyPage'
// Admin pages
import DashboardPage from '@/pages/admin/DashboardPage'
import UsersPage from '@/pages/admin/UsersPage'
import ShopsPage from '@/pages/admin/ShopsPage'
import ShopDetailPage from '@/pages/admin/ShopDetailPage'
import CategoriesPage from '@/pages/admin/CategoriesPage'
import ProductsPage from '@/pages/admin/ProductsPage'
import ProductDetailPage from '@/pages/admin/ProductDetailPage'
import ProductFormPage from '@/pages/admin/ProductFormPage'
import CollectionsPage from '@/pages/admin/CollectionsPage'
import CollectionFormPage from '@/pages/admin/CollectionFormPage'
import OrdersPage from '@/pages/admin/OrdersPage'
import ReviewsPage from '@/pages/admin/ReviewsPage'
import DiscountsPage from '@/pages/admin/DiscountsPage'
import RolesPage from '@/pages/admin/RolesPage'
import LocationsPage from '@/pages/admin/LocationsPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import AccountPage from '@/pages/admin/AccountPage'
import MediaPage from '@/pages/admin/MediaPage'
import BannersPage from '@/pages/admin/BannersPage'
import DeliveriesPage from '@/pages/admin/DeliveriesPage'
import PlansPage from '@/pages/admin/PlansPage'
import ShopApplicationsPage from '@/pages/admin/ShopApplicationsPage'
import ShopTypeRequestsPage from '@/pages/admin/ShopTypeRequestsPage'
import AiRecommendationsPage from '@/pages/admin/AiRecommendationsPage'
// Seller pages
import SellerDashboardPage from '@/pages/seller/SellerDashboardPage'
import SellerProductsPage from '@/pages/seller/SellerProductsPage'
import SellerOrdersPage from '@/pages/seller/SellerOrdersPage'
import SellerShopPage from '@/pages/seller/SellerShopPage'
import SellerDiscountsPage from '@/pages/seller/SellerDiscountsPage'
import SellerPayoutsPage from '@/pages/seller/SellerPayoutsPage'
import SellerProductFormPage from '@/pages/seller/SellerProductFormPage'
import SellerMediaPage from '@/pages/seller/SellerMediaPage'
import SellerBannersPage from '@/pages/seller/SellerBannersPage'
import SellerSubscriptionPage from '@/pages/seller/SellerSubscriptionPage'
import AdminPushNotificationsPage from '@/pages/admin/AdminPushNotificationsPage'
import AdminAuditPage from '@/pages/admin/AdminAuditPage'
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage'
import WarehousesPage from '@/pages/admin/WarehousesPage'
import SellerPushNotificationsPage from '@/pages/seller/SellerPushNotificationsPage'
import SellerAnalyticsPage from '@/pages/seller/SellerAnalyticsPage'
import SellerWarehousesPage from '@/pages/seller/SellerWarehousesPage'
import SellerAccountPage from '@/pages/admin/AccountPage'
import AdminCoinsPage from '@/pages/admin/AdminCoinsPage'
import AdminFavoritesPage from '@/pages/admin/AdminFavoritesPage'
import ProductTagsPage from '@/pages/admin/ProductTagsPage'
import BrandsPage from '@/pages/admin/BrandsPage'
import SuppliersPage from '@/pages/admin/SuppliersPage'
import AdminCommentsPage from '@/pages/admin/AdminCommentsPage'
import AdminKycPage from '@/pages/admin/AdminKycPage'

const router = createBrowserRouter([
  { path: '/login',   element: <LoginPage /> },
  { path: '/pending', element: <PendingPage /> },
  { path: '/apply',   element: <ShopApplyPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      // ── Platform admin panel ──────────────────────────────────────────────
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage />, handle: { titleKey: 'dashboard.title' } },
          { path: 'users', element: <UsersPage />, handle: { titleKey: 'users.title' } },
          { path: 'shops', element: <ShopsPage />, handle: { titleKey: 'shops.title' } },
          { path: 'shops/:id', element: <ShopDetailPage />, handle: { titleKey: 'shops.title' } },
          { path: 'catalog/categories', element: <CategoriesPage />, handle: { titleKey: 'categories.title' } },
          { path: 'catalog/products', element: <ProductsPage />, handle: { titleKey: 'products.title' } },
          { path: 'catalog/products/new', element: <ProductFormPage />, handle: { titleKey: 'products.title' } },
          { path: 'catalog/products/:id', element: <ProductDetailPage />, handle: { titleKey: 'products.title' } },
          { path: 'catalog/products/:id/edit', element: <ProductFormPage />, handle: { titleKey: 'products.title' } },
          { path: 'catalog/collections', element: <CollectionsPage />, handle: { titleKey: 'collections.title' } },
          { path: 'catalog/collections/new', element: <CollectionFormPage />, handle: { titleKey: 'collections.title' } },
          { path: 'catalog/collections/:id/edit', element: <CollectionFormPage />, handle: { titleKey: 'collections.title' } },
          { path: 'orders', element: <OrdersPage />, handle: { titleKey: 'orders.title' } },
          { path: 'reviews', element: <ReviewsPage />, handle: { titleKey: 'reviews.title' } },
          { path: 'discounts', element: <DiscountsPage />, handle: { titleKey: 'discounts.title' } },
          { path: 'roles', element: <RolesPage />, handle: { titleKey: 'roles.title' } },
          { path: 'locations', element: <LocationsPage />, handle: { titleKey: 'locations.title' } },
          { path: 'settings', element: <SettingsPage />, handle: { titleKey: 'settings.title' } },
          { path: 'account', element: <AccountPage />, handle: { titleKey: 'account.title' } },
          { path: 'media', element: <MediaPage />, handle: { titleKey: 'media.title' } },
          { path: 'banners', element: <BannersPage />, handle: { titleKey: 'banners.title' } },
          { path: 'delivers', element: <DeliveriesPage />, handle: { titleKey: 'delivers.title' } },
          { path: 'plans', element: <PlansPage />, handle: { titleKey: 'plans.title' } },
          { path: 'shop-applications', element: <ShopApplicationsPage />, handle: { titleKey: 'shopApplications.title' } },
          { path: 'shop-type-requests', element: <ShopTypeRequestsPage />, handle: { titleKey: 'nav.shopTypeRequests' } },
          { path: 'ai-recommendations',  element: <AiRecommendationsPage />,      handle: { titleKey: 'aiRecommendations.title' } },
          { path: 'push-notifications',  element: <AdminPushNotificationsPage />,  handle: { titleKey: 'adminPn.pageTitle' } },
          { path: 'audit-logs',          element: <AdminAuditPage />,               handle: { titleKey: 'auditLogs.title' } },
          { path: 'analytics',           element: <AdminAnalyticsPage />,           handle: { titleKey: 'analytics.title' } },
          { path: 'warehouses',          element: <WarehousesPage />,               handle: { titleKey: 'warehouses.title' } },
          { path: 'coins',              element: <AdminCoinsPage />,               handle: { titleKey: 'coins.title' } },
          { path: 'favorites',          element: <AdminFavoritesPage />,           handle: { titleKey: 'favorites.title' } },
          { path: 'catalog/tags',       element: <ProductTagsPage />,              handle: { titleKey: 'productTags.title' } },
          { path: 'catalog/brands',    element: <BrandsPage />,                   handle: { titleKey: 'brands.title' } },
          { path: 'catalog/suppliers', element: <SuppliersPage />,                handle: { titleKey: 'suppliers.title' } },
          { path: 'comments',         element: <AdminCommentsPage />,            handle: { titleKey: 'comments.title' } },
          { path: 'kyc',             element: <AdminKycPage />,                 handle: { titleKey: 'kyc.title' } },
        ],
      },
      // ── Seller panel ──────────────────────────────────────────────────────
      {
        path: '/seller',
        element: <SellerLayout />,
        children: [
          { index: true,        element: <SellerDashboardPage /> },
          { path: 'products',          element: <SellerProductsPage /> },
          { path: 'products/new',      element: <SellerProductFormPage /> },
          { path: 'products/:id/edit', element: <SellerProductFormPage /> },
          { path: 'orders',     element: <SellerOrdersPage /> },
          { path: 'shop',       element: <SellerShopPage /> },
          { path: 'discounts',  element: <SellerDiscountsPage /> },
          { path: 'payouts',    element: <SellerPayoutsPage /> },
          { path: 'media',        element: <SellerMediaPage /> },
          { path: 'banners',      element: <SellerBannersPage /> },
          { path: 'subscription',       element: <SellerSubscriptionPage /> },
          { path: 'push-notifications', element: <SellerPushNotificationsPage /> },
          { path: 'account',            element: <SellerAccountPage /> },
          { path: 'analytics',          element: <SellerAnalyticsPage /> },
          { path: 'warehouses',         element: <SellerWarehousesPage /> },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
])

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AiAssistantProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" richColors closeButton />
          </AiAssistantProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
