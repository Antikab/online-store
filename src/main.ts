// main.ts
import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useCouponsStore } from '@/stores/coupons'
import { useOrdersStore } from '@/stores/orders'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// ⏳ 1. ждем восстановления сессии
const auth = useAuthStore()
await auth.initAuthWatcher()

// ⏳ 2. инициализируем продукты
const products = useProductsStore()
await products.init()

// ⏳ 3. инициализируем корзину и избранное
const cart = useCartStore()
cart.start()

const wishlist = useWishlistStore()
await wishlist.start()

// ⏳ 4. купоны и заказы
useCouponsStore().start()
const orders = useOrdersStore()
await orders.init()

auth.$subscribe(() => orders.init())

// ✅ только теперь монтируем
app.mount('#app')
