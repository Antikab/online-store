<script setup lang="ts">
import { computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import Loader from '@/components/Loader.vue'

const orders = useOrdersStore()
const list = computed(() => orders.list)
</script>

<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <h1 class="text-3xl font-semibold mb-6">Мои заказы</h1>

    <Loader v-if="orders.loading" />

    <div v-else>
      <div v-if="list.length">
        <article
          v-for="o in list"
          :key="o.id"
          class="border rounded-2xl p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-all"
        >
          <header class="flex justify-between text-gray-600 mb-3">
            <b>№ {{ o.id.slice(0, 8) }}</b>
            <span>{{ new Date(o.createdAt).toLocaleString() }}</span>
          </header>

          <ul class="space-y-1 text-sm text-gray-700">
            <li v-for="it in o.items" :key="it.productId + it.color + it.size">
              {{ it.title }} — {{ it.color }}/{{ it.size }} × {{ it.quantity }} =
              {{ (it.price * it.quantity).toFixed(2) }} $
            </li>
          </ul>

          <footer class="flex justify-between text-sm text-gray-600 mt-3 border-t pt-2">
            <span>Subtotal: {{ o.amounts.subtotal.toFixed(2) }} $</span>
            <span v-if="o.amounts.discount">Discount: −{{ o.amounts.discount.toFixed(2) }} $</span>
            <b>Total: {{ o.amounts.total.toFixed(2) }} $</b>
            <span v-if="o.coupon">Coupon: {{ o.coupon }}</span>
          </footer>
        </article>
      </div>

      <div v-else class="text-center py-12 text-gray-400">
        <h3 class="text-xl font-semibold mb-2">Заказов пока нет</h3>
        <RouterLink to="/catalog/men" class="text-blue-500 hover:underline">
          Перейти в каталог
        </RouterLink>
      </div>
    </div>
  </div>
</template>
