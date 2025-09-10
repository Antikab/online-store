<!-- views/Cart.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useCouponsStore } from '@/stores/coupons'
import { useRouter } from 'vue-router'

const cart = useCartStore()
const coupons = useCouponsStore()
const router = useRouter()

const code = ref('')
const discountSum = computed(() => cart.subtotal * (coupons.discount ?? 0))
const total = computed(() => cart.subtotal - discountSum.value)

async function apply() {
  const ok = await coupons.apply(code.value)
  if (!ok) alert('Такого купона не существует')
}

function proceed() {
  // переход на checkout всегда разрешён — редирект на login случится уже в Checkout.vue
  router.push('/checkout')
}
</script>

<template>
  <div v-if="cart.list.length">
    <h1>Cart</h1>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Options</th>
          <th>Qty</th>
          <th>Price</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in cart.list" :key="cart.compoundId(i.productId, i.color, i.size)">
          <td style="display: flex; gap: 12px; align-items: center">
            <img
              :src="i.image"
              style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px"
            />
            <span>{{ i.title }}</span>
          </td>
          <td>{{ i.color }} / {{ i.size }}</td>
          <td>
            <button @click="cart.setQty(cart.compoundId(i.productId, i.color, i.size), i.qty - 1)">
              −
            </button>
            <span style="padding: 0 8px">{{ i.qty }}</span>
            <button @click="cart.setQty(cart.compoundId(i.productId, i.color, i.size), i.qty + 1)">
              +
            </button>
          </td>
          <td>{{ (i.price * i.qty).toFixed(2) }} $</td>
          <td>
            <button @click="cart.removeItem(cart.compoundId(i.productId, i.color, i.size))">
              Remove
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 16px; display: flex; gap: 16px; align-items: center">
      <input v-model="code" placeholder="Coupon code" />
      <button @click="apply">Apply</button>
      <span v-if="coupons.valid" style="color: green"
        >Купон применён (−{{ (coupons.discount * 100).toFixed(0) }}%)</span
      >
    </div>

    <div style="margin-top: 16px">
      <p>
        Subtotal: <b>{{ cart.subtotal.toFixed(2) }} $</b>
      </p>
      <p v-if="coupons.valid">Discount: −{{ discountSum.toFixed(2) }} $</p>
      <h3>Total: {{ total.toFixed(2) }} $</h3>
    </div>

    <div style="margin-top: 16px; display: flex; gap: 12px">
      <RouterLink to="/catalog/men">Continue Shopping</RouterLink>
      <button @click="proceed">Proceed To Checkout</button>
    </div>
  </div>

  <div v-else>
    <h2>Корзина пуста</h2>
    <RouterLink to="/catalog/men">Перейти в каталог</RouterLink>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  border-bottom: 1px solid #eee;
  padding: 8px;
  text-align: left;
}
button {
  border: 1px solid #ddd;
  background: #fff;
  padding: 6px 10px;
  border-radius: 6px;
}
</style>
