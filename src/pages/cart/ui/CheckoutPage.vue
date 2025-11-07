<!-- views/cart/Checkout.vue -->
<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useSessionStore } from '@entities/session'
import { useCartStore } from '@features/cart'
import { useCouponsStore } from '@features/coupons'
import { useOrdersStore } from '@entities/order'
import { useDeliveryForm } from '@shared/model'

const router = useRouter()
const auth = useSessionStore()
const cart = useCartStore()
const coupons = useCouponsStore()
const orders = useOrdersStore()

const { form, isValid } = useDeliveryForm()

// если корзина пустая — по ТЗ редиректим на /cart (там пустое состояние)
onMounted(() => {
  if (!cart.list.length) router.replace('/cart')
})

// если разлогинились на чекауте — вернём на логин
watch(
  () => auth.isAuthed,
  (ok) => {
    if (!ok) router.replace({ path: '/login', query: { redirect: '/checkout' } })
  },
  { immediate: true }
)

// скидка коэффициентом (0..1)
const discountRate = computed(() => coupons.discount ?? 0)
const discountSum = computed(() => cart.subtotal * discountRate.value)
const total = computed(() => Math.max(0, cart.subtotal - discountSum.value))

const placing = ref(false)

async function submit() {
  if (placing.value) return
  if (!auth.isAuthed) {
    return router.push({ path: '/login', query: { redirect: '/checkout' } })
  }
  if (!cart.list.length) {
    return router.replace('/cart')
  }
  if (!isValid.value) {
    return alert('Проверьте обязательные поля и номер телефона')
  }

  placing.value = true
  try {
    await orders.placeOrder({
      delivery: { ...form },
      items: cart.list, // [{ productId,color,size,quantity,price,title,image }]
      amounts: {
        subtotal: cart.subtotal,
        discount: discountSum.value,
        total: total.value
      },
      coupon: coupons.valid ? coupons.code : null,
      createdAt: Date.now()
    })

    // ✅ очищаем корзину
    await cart.clear()

    // ✅ сбрасываем купон
    coupons.reset()

    // ✅ переходим на страницу успеха
    router.push('/success')
  } finally {
    placing.value = false
  }
}
</script>

<template>
  <div>
    <h1>Checkout</h1>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px">
      <form @submit.prevent="submit" novalidate>
        <input v-model="form.fullName" placeholder="Full name *" />
        <input v-model="form.phone" placeholder="Phone *" />
        <input v-model="form.city" placeholder="City *" />
        <input v-model="form.address" placeholder="Address *" />
        <input v-model="form.zip" placeholder="ZIP" />
        <button :disabled="placing || !isValid || !cart.list.length">
          {{ placing ? 'Processing...' : 'Continue to delivery' }}
        </button>
      </form>

      <aside>
        <h3>Order summary</h3>
        <p>Items: {{ cart.list.length }}</p>
        <p>Subtotal: {{ cart.subtotal.toFixed(2) }} $</p>
        <p v-if="discountRate > 0">Discount: −{{ discountSum.toFixed(2) }} $</p>
        <h4>Total: {{ total.toFixed(2) }} $</h4>
      </aside>
    </div>
  </div>
</template>

<style scoped>
input {
  display: block;
  margin-bottom: 8px;
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
button {
  border: 1px solid #ddd;
  background: #fff;
  padding: 8px 12px;
  border-radius: 6px;
}
button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
aside {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
}
</style>
