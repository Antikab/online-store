// src/app/setup/initApp.ts

import { useSessionStore } from '@/entities/session'
import { useProductStore } from '@/entities/product'
import { useOrdersStore } from '@/entities/order'
import { useCartStore } from '@/features/cart'
import { useCouponsStore } from '@/features/coupons'
import { useWishlistStore } from '@/features/wishlist'

let started = false

export async function initAppProcesses() {
  if (started) return
  started = true

  const session = useSessionStore()
  const products = useProductStore()
  const wishlist = useWishlistStore()
  const cart = useCartStore()
  const coupons = useCouponsStore()
  const orders = useOrdersStore()

  await session.initAuthWatcher()
  await products.init()
  await wishlist.start()
  cart.start()
  coupons.start()
  await orders.init()

  session.$subscribe(() => orders.init())
}
