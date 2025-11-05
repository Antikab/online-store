// src/shared/config/router/routerPaths.ts
export const ROUTE_PATHS = {
  HOME: '/',
  AUTH_LOGIN: '/login',
  AUTH_REGISTER: '/register',
  AUTH_RESET_PASSWORD: '/reset-password',
  AUTH_CHANGE_PASSWORD: '/change-password',
  ACCOUNT_CHANGE_PASSWORD: '/account/change-password',
  CATALOG_GENDER: '/catalog/:gender(men|women)',
  PRODUCT_DETAILS: '/product/:id',
  CART: '/cart',
  WISHLIST: '/wishlist',
  ORDERS: '/orders',
  CHECKOUT: '/checkout',
  CHECKOUT_SUCCESS: '/success',
  NOT_FOUND: '/:pathMatch(.*)*'
}
