// main.ts
import './assets/main.css'
import 'vue-sonner/style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'

// Stores
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useCouponsStore } from '@/stores/coupons'
import { useOrdersStore } from '@/stores/orders'

const app = createApp(App)
app.use(createPinia())
app.use(router)

const auth = useAuthStore()
const wishlist = useWishlistStore()
const products = useProductsStore()
const cart = useCartStore()
const coupons = useCouponsStore()
const orders = useOrdersStore()

await auth.initAuthWatcher()
await products.init()
await wishlist.start()
cart.start()
coupons.start()
await orders.init()

// при изменении авторизации обновляем заказы
auth.$subscribe(() => orders.init())

app.mount('#app')
