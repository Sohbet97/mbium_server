import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/store/auth'
import { NotificationProvider } from '@/store/notifications'
import { ThemeProvider } from '@/store/theme'
import { AiAssistantProvider } from '@/store/aiAssistant'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { SellerLayout } from '@/components/layout/SellerLayout'
import { ProtectedRoute, AdminRoute, SellerRoute } from '@/components/layout/ProtectedRoute'
import { PermGate } from '@/components/layout/PermGate'
import { Permissions } from '@/lib/permissions'
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
import ReelsPage from '@/pages/admin/ReelsPage'
import DeliveriesPage from '@/pages/admin/DeliveriesPage'
import PlansPage from '@/pages/admin/PlansPage'
import ShopApplicationsPage from '@/pages/admin/ShopApplicationsPage'
import ShopTypeRequestsPage from '@/pages/admin/ShopTypeRequestsPage'
import AdminPayoutsPage from '@/pages/admin/PayoutsPage'
import AiRecommendationsPage from '@/pages/admin/AiRecommendationsPage'
// Seller pages
import SellerDashboardPage from '@/pages/seller/SellerDashboardPage'
import SellerProductsPage from '@/pages/seller/SellerProductsPage'
import SellerOrdersPage from '@/pages/seller/SellerOrdersPage'
import SellerShopPage from '@/pages/seller/SellerShopPage'
import SellerDiscountsPage from '@/pages/seller/SellerDiscountsPage'
import SellerPayoutsPage from '@/pages/seller/SellerPayoutsPage'
import SellerBuyerRequestsPage from '@/pages/seller/SellerBuyerRequestsPage'
import SellerCoinsPage from '@/pages/seller/SellerCoinsPage'
import SellerProductFormPage from '@/pages/seller/SellerProductFormPage'
import SellerProductVariantPage from '@/pages/seller/SellerProductVariantPage'
import SellerMediaPage from '@/pages/seller/SellerMediaPage'
import SellerBannersPage from '@/pages/seller/SellerBannersPage'
import SellerReelsPage from '@/pages/seller/SellerReelsPage'
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
import AdminTurboPage from '@/pages/admin/AdminTurboPage'
import AdminFavoritesPage from '@/pages/admin/AdminFavoritesPage'
import ProductTagsPage from '@/pages/admin/ProductTagsPage'
import BrandsPage from '@/pages/admin/BrandsPage'
import SizesPage from '@/pages/admin/SizesPage'
import ColorsPage from '@/pages/admin/ColorsPage'
import DeliveryTypesPage from '@/pages/admin/DeliveryTypesPage'
import ShopTypesPage from '@/pages/admin/ShopTypesPage'
import SuppliersPage from '@/pages/admin/SuppliersPage'
import AdminCommentsPage from '@/pages/admin/AdminCommentsPage'
import AdminKycPage from '@/pages/admin/AdminKycPage'
import AdminGiftsPage from '@/pages/admin/AdminGiftsPage'
import BuyerRequestsPage from '@/pages/admin/BuyerRequestsPage'

const g = (perm, element) => <PermGate perm={perm}>{element}</PermGate>

const router = createBrowserRouter([
  { path: '/login',   element: <LoginPage /> },
  { path: '/apply',   element: <ShopApplyPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/pending', element: <PendingPage /> },
      // ── Platform admin panel ──────────────────────────────────────────────
      {
        element: <AdminRoute />,
        children: [{
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage />, handle: { titleKey: 'dashboard.title' } },
          { path: 'users', element: g(Permissions.USER_GET, <UsersPage />), handle: { titleKey: 'users.title' } },
          { path: 'shops', element: g(Permissions.SHOP_GET, <ShopsPage />), handle: { titleKey: 'shops.title' } },
          { path: 'shops/:id', element: g(Permissions.SHOP_GET, <ShopDetailPage />), handle: { titleKey: 'shops.title' } },
          { path: 'catalog/categories', element: g(Permissions.CATEGORY_GET, <CategoriesPage />), handle: { titleKey: 'categories.title' } },
          { path: 'catalog/products', element: g(Permissions.PRODUCT_GET, <ProductsPage />), handle: { titleKey: 'products.title' } },
          { path: 'catalog/products/new', element: g(Permissions.PRODUCT_GET, <ProductFormPage />), handle: { titleKey: 'products.title' } },
          { path: 'catalog/products/:id', element: g(Permissions.PRODUCT_GET, <ProductDetailPage />), handle: { titleKey: 'products.title' } },
          { path: 'catalog/products/:id/edit', element: g(Permissions.PRODUCT_GET, <ProductFormPage />), handle: { titleKey: 'products.title' } },
          { path: 'catalog/collections', element: g(Permissions.COLLECTION_GET, <CollectionsPage />), handle: { titleKey: 'collections.title' } },
          { path: 'catalog/collections/new', element: g(Permissions.COLLECTION_GET, <CollectionFormPage />), handle: { titleKey: 'collections.title' } },
          { path: 'catalog/collections/:id/edit', element: g(Permissions.COLLECTION_GET, <CollectionFormPage />), handle: { titleKey: 'collections.title' } },
          { path: 'orders', element: g(Permissions.ORDER_GET, <OrdersPage />), handle: { titleKey: 'orders.title' } },
          { path: 'reviews', element: g(Permissions.REVIEW_GET, <ReviewsPage />), handle: { titleKey: 'reviews.title' } },
          { path: 'discounts', element: g(Permissions.DISCOUNT_GET, <DiscountsPage />), handle: { titleKey: 'discounts.title' } },
          { path: 'roles', element: g(Permissions.ROLE_GET, <RolesPage />), handle: { titleKey: 'roles.title' } },
          { path: 'locations', element: g([Permissions.REGION_GET, Permissions.VILLAGE_GET, Permissions.COUNTRY_GET], <LocationsPage />), handle: { titleKey: 'locations.title' } },
          { path: 'settings', element: <SettingsPage />, handle: { titleKey: 'settings.title' } },
          { path: 'account', element: <AccountPage />, handle: { titleKey: 'account.title' } },
          { path: 'media', element: g(Permissions.MEDIA_GET, <MediaPage />), handle: { titleKey: 'media.title' } },
          { path: 'banners', element: g(Permissions.BANNER_GET, <BannersPage />), handle: { titleKey: 'banners.title' } },
          { path: 'delivers', element: g(Permissions.DELIVER_GET, <DeliveriesPage />), handle: { titleKey: 'delivers.title' } },
          { path: 'plans', element: g(Permissions.PLAN_GET, <PlansPage />), handle: { titleKey: 'plans.title' } },
          { path: 'shop-applications', element: g(Permissions.SHOP_GET, <ShopApplicationsPage />), handle: { titleKey: 'shopApplications.title' } },
          { path: 'shop-type-requests', element: <ShopTypeRequestsPage />, handle: { titleKey: 'nav.shopTypeRequests' } },
          { path: 'shop-types', element: <ShopTypesPage />, handle: { titleKey: 'shopTypes.title' } },
          { path: 'payouts', element: g(Permissions.PAYOUT_GET, <AdminPayoutsPage />), handle: { titleKey: 'nav.payouts' } },
          { path: 'ai-recommendations',  element: g(Permissions.AI_GET, <AiRecommendationsPage />),      handle: { titleKey: 'aiRecommendations.title' } },
          { path: 'push-notifications',  element: g(Permissions.PUSH_NOTIF_GET, <AdminPushNotificationsPage />),  handle: { titleKey: 'adminPn.pageTitle' } },
          { path: 'audit-logs',          element: g(Permissions.AUDIT_GET, <AdminAuditPage />),               handle: { titleKey: 'auditLogs.title' } },
          { path: 'analytics',           element: g(Permissions.ANALYTICS_GET, <AdminAnalyticsPage />),           handle: { titleKey: 'analytics.title' } },
          { path: 'warehouses',          element: g(Permissions.WAREHOUSE_GET, <WarehousesPage />),               handle: { titleKey: 'warehouses.title' } },
          { path: 'coins',              element: g(Permissions.COIN_GET, <AdminCoinsPage />),               handle: { titleKey: 'coins.title' } },
          { path: 'turbo',              element: g(Permissions.TURBO_GET, <AdminTurboPage />),              handle: { titleKey: 'turbo.title' } },
          { path: 'favorites',          element: g(Permissions.PRODUCT_GET, <AdminFavoritesPage />),           handle: { titleKey: 'favorites.title' } },
          { path: 'catalog/tags',       element: g(Permissions.PRODUCT_GET, <ProductTagsPage />),              handle: { titleKey: 'productTags.title' } },
          { path: 'catalog/brands',    element: g(Permissions.BRAND_GET, <BrandsPage />),                   handle: { titleKey: 'brands.title' } },
          { path: 'catalog/sizes',     element: g(Permissions.SIZE_GET, <SizesPage />),                    handle: { titleKey: 'sizes.title' } },
          { path: 'catalog/colors',    element: g(Permissions.COLOR_GET, <ColorsPage />),                  handle: { titleKey: 'colors.title' } },
          { path: 'catalog/delivery-types', element: g(Permissions.DELIVERY_TYPE_GET, <DeliveryTypesPage />),       handle: { titleKey: 'deliveryTypes.title' } },
          { path: 'catalog/suppliers', element: g(Permissions.SUPPLIER_GET, <SuppliersPage />),                handle: { titleKey: 'suppliers.title' } },
          { path: 'catalog/reels',     element: g(Permissions.REEL_GET, <ReelsPage />),                       handle: { titleKey: 'reels.title' } },
          { path: 'gifts',             element: g(Permissions.GIFT_TYPE_GET, <AdminGiftsPage />),             handle: { titleKey: 'gifts.title' } },
          { path: 'comments',         element: g(Permissions.COMMENT_GET, <AdminCommentsPage />),            handle: { titleKey: 'comments.title' } },
          { path: 'kyc',             element: g(Permissions.KYC_GET, <AdminKycPage />),                 handle: { titleKey: 'kyc.title' } },
          { path: 'buyer-requests', element: <BuyerRequestsPage />, handle: { titleKey: 'nav.buyerRequests' } },
        ],
      }],
      },
      // ── Seller panel ──────────────────────────────────────────────────────
      {
        element: <SellerRoute />,
        children: [{
        path: '/seller',
        element: <SellerLayout />,
        children: [
          { index: true,        element: <SellerDashboardPage /> },
          { path: 'products',                         element: <SellerProductsPage /> },
          { path: 'products/new',                     element: <SellerProductFormPage /> },
          { path: 'products/:id/edit',                element: <SellerProductFormPage /> },
          { path: 'products/:id/variants/new',        element: <SellerProductVariantPage /> },
          { path: 'products/:id/variants/:variantId', element: <SellerProductVariantPage /> },
          { path: 'orders',     element: <SellerOrdersPage /> },
          { path: 'shop',       element: <SellerShopPage /> },
          { path: 'discounts',  element: <SellerDiscountsPage /> },
          { path: 'payouts',    element: <SellerPayoutsPage /> },
          { path: 'buyer-requests', element: <SellerBuyerRequestsPage /> },
          { path: 'coins',      element: <SellerCoinsPage /> },
          { path: 'media',        element: <SellerMediaPage /> },
          { path: 'banners',      element: <SellerBannersPage /> },
          { path: 'reels',        element: <SellerReelsPage /> },
          { path: 'subscription',       element: <SellerSubscriptionPage /> },
          { path: 'push-notifications', element: <SellerPushNotificationsPage /> },
          { path: 'account',            element: <SellerAccountPage /> },
          { path: 'analytics',          element: <SellerAnalyticsPage /> },
          { path: 'warehouses',         element: <SellerWarehousesPage /> },
        ],
      }],
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
