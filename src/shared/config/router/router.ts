import { ROUTE_NAMES } from './routerNames'
import { ROUTE_PATHS } from './routerPaths'

export const routes = [
  {
    path: ROUTE_PATHS.HOME,
    name: ROUTE_NAMES.HOME,
    component: () => import('@pages/home/ui/HomePage.vue')
  },
  {
    path: ROUTE_PATHS.AUTH_LOGIN,
    name: ROUTE_NAMES.AUTH_LOGIN,
    component: () => import('@pages/auth/ui/LoginPage.vue'),
    meta: { guestOnly: true }
  },
  {
    path: ROUTE_PATHS.AUTH_REGISTER,
    name: ROUTE_NAMES.AUTH_REGISTER,
    component: () => import('@pages/auth/ui/RegisterPage.vue'),
    meta: { guestOnly: true }
  },
  {
    path: ROUTE_PATHS.AUTH_RESET_PASSWORD,
    name: ROUTE_NAMES.AUTH_RESET_PASSWORD,
    component: () => import('@pages/auth/ui/ResetPasswordPage.vue'),
    meta: { guestOnly: true }
  },
  {
    path: ROUTE_PATHS.AUTH_CHANGE_PASSWORD,
    name: ROUTE_NAMES.AUTH_CHANGE_PASSWORD,
    component: () => import('@pages/auth/ui/RecoveryChangePasswordPage.vue'),
    meta: { guestOnly: true, allowRecovery: true }
  },
  {
    path: ROUTE_PATHS.ACCOUNT_CHANGE_PASSWORD,
    name: ROUTE_NAMES.ACCOUNT_CHANGE_PASSWORD,
    component: () => import('@pages/account/ui/AccountChangePasswordPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: ROUTE_PATHS.CATALOG_GENDER,
    name: ROUTE_NAMES.CATALOG_GENDER,
    component: () => import('@pages/catalog/ui/CatalogPage.vue')
  },
  {
    path: ROUTE_PATHS.PRODUCT_DETAILS,
    name: ROUTE_NAMES.PRODUCT_DETAILS,
    component: () => import('@pages/catalog/ui/ProductPage.vue')
  },
  {
    path: ROUTE_PATHS.CART,
    name: ROUTE_NAMES.CART,
    component: () => import('@pages/cart/ui/CartPage.vue')
  },
  {
    path: ROUTE_PATHS.WISHLIST,
    name: ROUTE_NAMES.WISHLIST,
    component: () => import('@pages/wishlist/ui/WishlistPage.vue')
  },
  {
    path: ROUTE_PATHS.ORDERS,
    name: ROUTE_NAMES.ORDERS,
    component: () => import('@pages/orders/ui/OrdersPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: ROUTE_PATHS.CHECKOUT,
    name: ROUTE_NAMES.CHECKOUT,
    component: () => import('@pages/cart/ui/CheckoutPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: ROUTE_PATHS.CHECKOUT_SUCCESS,
    name: ROUTE_NAMES.CHECKOUT_SUCCESS,
    component: () => import('@pages/cart/ui/SuccessPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: ROUTE_PATHS.NOT_FOUND,
    name: ROUTE_NAMES.NOT_FOUND,
    component: () => import('@pages/not-found/ui/NotFoundPage.vue')
  }
]
