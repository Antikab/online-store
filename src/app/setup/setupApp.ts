import type { App } from 'vue'
import { createAppRouter } from '../providers/router'
import { createPiniaProvider } from '../providers/pinia'
import { registerToast } from '../providers/toast'
import { registerI18n } from '../providers/i18n'
import { useAuthStore } from '@entities/user'
import { useProductsStore } from '@entities/product'
import { useCartStore, useCouponsStore, useWishlistStore } from '@features/product'
import { useOrdersStore } from '@features/user'

export async function setupApp(app: App) {
  const pinia = createPiniaProvider()
  app.use(pinia)

  const router = createAppRouter()
  app.use(router)

  registerToast(app)
  registerI18n(app)

  const auth = useAuthStore()
  const products = useProductsStore()
  const cart = useCartStore()
  const wishlist = useWishlistStore()
  const coupons = useCouponsStore()
  const orders = useOrdersStore()

  await auth.initAuthWatcher()
  await products.init()
  wishlist.start()
  cart.start()
  coupons.start()
  await orders.init()

  auth.$subscribe(() => orders.init())

  await router.isReady()
}
