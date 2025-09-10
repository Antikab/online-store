<!-- views/Orders.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import Loader from '@/components/Loader.vue'

const orders = useOrdersStore()
const list = computed(() => orders.list)
</script>

<template>
  <div>
    <h1>Orders</h1>

    <Loader v-if="orders.loading" />
    <template v-else>
      <div v-if="list.length">
        <article v-for="o in list" :key="o.id" class="order">
          <header>
            <b>№ {{ o.id }}</b>
            <span>{{ new Date(o.createdAt).toLocaleString() }}</span>
          </header>

          <ul>
            <li v-for="it in o.items" :key="it.productId + it.color + it.size">
              {{ it.title }} — {{ it.color }}/{{ it.size }} × {{ it.qty }} =
              {{ (it.price * it.qty).toFixed(2) }} $
            </li>
          </ul>

          <footer>
            <span>Subtotal: {{ o.amounts.subtotal.toFixed(2) }} $</span>
            <span v-if="o.amounts.discount">Discount: −{{ o.amounts.discount.toFixed(2) }} $</span>
            <b>Total: {{ o.amounts.total.toFixed(2) }} $</b>
            <span v-if="o.coupon">Coupon: {{ o.coupon }}</span>
          </footer>
        </article>
      </div>
      <div v-else>
        <h3>Заказов пока нет</h3>
        <RouterLink to="/catalog/men">Перейти в каталог</RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.order {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.order header,
.order footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
</style>
