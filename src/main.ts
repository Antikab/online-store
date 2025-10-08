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

const auth = useAuthStore()
await auth.initAuthWatcher() // 👈 ждём восстановления сессии

// после этого uid уже точно известен
useProductsStore().init()
useCartStore().start()
useWishlistStore().start()
useCouponsStore().start()

const orders = useOrdersStore()
await orders.init()

auth.$subscribe(() => {
  orders.init()
})

app.mount('#app')
