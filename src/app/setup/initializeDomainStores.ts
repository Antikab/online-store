import type { Pinia } from 'pinia'

import { useAuthStore } from '@/entities/auth'
import { useProductsStore } from '@/entities/product'
import { useCartStore } from '@/entities/cart'
import { useWishlistStore } from '@/entities/wishlist'
import { useCouponsStore } from '@/entities/coupon'
import { useOrdersStore } from '@/entities/order'

export async function initializeDomainStores(pinia: Pinia) {
  const auth = useAuthStore(pinia)
  const wishlist = useWishlistStore(pinia)
  const products = useProductsStore(pinia)
  const cart = useCartStore(pinia)
  const coupons = useCouponsStore(pinia)
  const orders = useOrdersStore(pinia)

  await auth.initAuthWatcher()
  await products.init()
  await wishlist.start()
  cart.start()
  coupons.start()
  await orders.init()

  auth.$subscribe(() => {
    void orders.init()
  })
}
