import { createApp, type App as VueApp } from 'vue'

import App from '../App.vue'
import '../styles/main.css'

import { createAppRouter } from '../providers/router'
import { createAppPinia } from '../providers/pinia'
import { createI18nInstance } from '../providers/i18n'
import { installToast } from '../providers/toast'

import { useAuthStore, useOrdersStore } from '@entities/user'
import { useProductsStore } from '@entities/product'
import { useCartStore, useCouponsStore, useWishlistStore } from '@features/product'

async function bootstrapDomainStores(app: VueApp) {
  const auth = useAuthStore()
  const products = useProductsStore()
  const wishlist = useWishlistStore()
  const cart = useCartStore()
  const coupons = useCouponsStore()
  const orders = useOrdersStore()

  await auth.initAuthWatcher()
  await products.init()
  await wishlist.start()
  cart.start()
  coupons.start()
  await orders.init()

  auth.$subscribe(() => {
    void orders.init()
  })

  app.provide('authStore', auth)
}

export async function setupApp() {
  const app = createApp(App)
  const pinia = createAppPinia()
  app.use(pinia)

  const router = createAppRouter()
  app.use(router)

  const i18n = createI18nInstance()
  if (i18n) app.use(i18n)

  installToast(app)

  await bootstrapDomainStores(app)

  return { app, router, pinia }
}
