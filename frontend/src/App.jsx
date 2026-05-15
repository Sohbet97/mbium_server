import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/store/auth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import UsersPage from '@/pages/admin/UsersPage'
import ShopsPage from '@/pages/admin/ShopsPage'
import CategoriesPage from '@/pages/admin/CategoriesPage'
import ProductsPage from '@/pages/admin/ProductsPage'
import ProductDetailPage from '@/pages/admin/ProductDetailPage'
import OrdersPage from '@/pages/admin/OrdersPage'
import ReviewsPage from '@/pages/admin/ReviewsPage'
import DiscountsPage from '@/pages/admin/DiscountsPage'
import RolesPage from '@/pages/admin/RolesPage'
import PlaceholderPage from '@/pages/admin/PlaceholderPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage />, handle: { titleKey: 'dashboard.title' } },
          { path: 'users', element: <UsersPage />, handle: { titleKey: 'users.title' } },
          { path: 'shops', element: <ShopsPage />, handle: { titleKey: 'shops.title' } },
          { path: 'catalog/categories', element: <CategoriesPage />, handle: { titleKey: 'categories.title' } },
          { path: 'catalog/products', element: <ProductsPage />, handle: { titleKey: 'products.title' } },
          { path: 'catalog/products/:id', element: <ProductDetailPage />, handle: { titleKey: 'products.title' } },
          { path: 'orders', element: <OrdersPage />, handle: { titleKey: 'orders.title' } },
          { path: 'reviews', element: <ReviewsPage />, handle: { titleKey: 'reviews.title' } },
          { path: 'discounts', element: <DiscountsPage />, handle: { titleKey: 'discounts.title' } },
          { path: 'roles', element: <RolesPage />, handle: { titleKey: 'roles.title' } },
          { path: 'locations', element: <PlaceholderPage titleKey="locations.title" />, handle: { titleKey: 'locations.title' } },
          { path: 'settings', element: <PlaceholderPage titleKey="settings.title" />, handle: { titleKey: 'settings.title' } },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/admin" replace /> },
  { path: '*', element: <Navigate to="/admin" replace /> },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
