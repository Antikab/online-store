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

// 1) запустить auth/продукты
useAuthStore().initAuthWatcher()
useProductsStore().init()

// 2) стартовать сто́ры, которые должны работать и для гостя
useCartStore().start()
useWishlistStore().start()
useCouponsStore().start()

// 3) заказы: инициализация сейчас + повторная при смене пользователя
const orders = useOrdersStore()
orders.init()

useAuthStore().$subscribe(() => {
  orders.init()
})

app.mount('#app')
