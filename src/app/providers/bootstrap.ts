import type { Pinia } from 'pinia'

import { useAuthStore } from '@/entities/session'
import { useOrdersStore } from '@/entities/order'
import { useProductsStore } from '@/entities/product'
import { useCartStore } from '@/features/cart'
import { useWishlistStore } from '@/features/wishlist'
import { useCouponsStore } from '@/features/coupons'

export async function bootstrapDomain(pinia: Pinia) {
  const auth = useAuthStore(pinia)
  const products = useProductsStore(pinia)
  const wishlist = useWishlistStore(pinia)
  const cart = useCartStore(pinia)
  const coupons = useCouponsStore(pinia)
  const orders = useOrdersStore(pinia)

  await auth.initAuthWatcher()
  await products.init()
  await wishlist.start()
  cart.start()
  coupons.start()
  await orders.init()

  auth.$subscribe(() => orders.init())
}
