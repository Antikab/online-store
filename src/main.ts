// main.ts
import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useWishlistStore } from '@/stores/wishlist'
import { useCartStore } from '@/stores/cart'
import { useOrdersStore } from '@/stores/orders'
import { useCouponsStore } from '@/stores/coupons'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// сторы
const auth = useAuthStore()
const products = useProductsStore()
const wishlist = useWishlistStore()
const cart = useCartStore()
const orders = useOrdersStore()
const coupons = useCouponsStore()

// инициализация
auth.initAuthWatcher()
products.init()

// корзина и избранное должны стартовать всегда (гость или нет)
cart.start()
wishlist.start()
coupons.start()

// подписка на смену пользователя — обновляем подписку на заказы
auth.$subscribe(() => {
  orders.init()
})

// на случай, если сессия уже была восстановлена при загрузке
orders.init()

app.mount('#app')
