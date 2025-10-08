<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useCouponsStore } from '@/stores/coupons'
import { useRouter } from 'vue-router'
import Loader from '@/components/Loader.vue' // 👈 добавляем

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
  router.push('/checkout')
}
</script>

<template>
  <section class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-semibold mb-6">Shopping Cart</h1>

    <!-- 🌀 Показываем Loader пока идёт загрузка -->
    <Loader v-if="cart.loading" />

    <template v-else>
      <template v-if="cart.list.length">
        <!-- таблица товаров -->
        <div class="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
          <table class="min-w-full text-sm text-gray-700">
            <thead class="bg-gray-50 text-gray-600">
              <tr>
                <th class="px-5 py-3 text-left font-medium">Item</th>
                <th class="px-5 py-3 text-left font-medium">Options</th>
                <th class="px-5 py-3 text-left font-medium">Quantity</th>
                <th class="px-5 py-3 text-left font-medium">Price</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="i in cart.list"
                :key="cart.cid(i.productId, i.color, i.size)"
                class="border-t hover:bg-gray-50 transition"
              >
                <td class="px-5 py-4">
                  <div class="flex items-center gap-4">
                    <img
                      :src="i.image"
                      alt=""
                      class="w-16 h-16 rounded-lg object-cover ring-1 ring-gray-200"
                    />
                    <span class="font-medium">{{ i.title }}</span>
                  </div>
                </td>
                <td class="px-5 py-4 text-gray-500">{{ i.color }} / {{ i.size }}</td>
                <td class="px-5 py-4">
                  <div class="inline-flex items-center gap-2">
                    <button
                      class="px-2 py-1 border rounded-md hover:bg-gray-100"
                      @click="cart.setQty(cart.cid(i.productId, i.color, i.size), i.quantity - 1)"
                    >
                      −
                    </button>
                    <span class="min-w-[2ch] text-center">{{ i.quantity }}</span>
                    <button
                      class="px-2 py-1 border rounded-md hover:bg-gray-100"
                      @click="cart.setQty(cart.cid(i.productId, i.color, i.size), i.quantity + 1)"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td class="px-5 py-4 font-medium">{{ (i.price * i.quantity).toFixed(2) }} $</td>
                <td class="px-5 py-4 text-right">
                  <button
                    class="text-red-600 hover:text-red-700 hover:underline"
                    @click="cart.removeItem(cart.cid(i.productId, i.color, i.size))"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- купон и итоги -->
        <div class="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div class="flex items-center gap-3">
            <input
              v-model="code"
              placeholder="Coupon code"
              class="border rounded-lg px-3 py-2 focus:ring focus:ring-blue-100"
            />
            <button @click="apply" class="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50">
              Apply
            </button>
            <span v-if="coupons.valid" class="text-green-600 font-medium">
              −{{ (coupons.discount * 100).toFixed(0) }}% discount applied
            </span>
          </div>

          <div class="text-right space-y-1">
            <p>
              Subtotal: <b>{{ cart.subtotal.toFixed(2) }} $</b>
            </p>
            <p v-if="coupons.valid">Discount: −{{ discountSum.toFixed(2) }} $</p>
            <h3 class="text-xl font-semibold">Total: {{ total.toFixed(2) }} $</h3>
          </div>
        </div>

        <div class="mt-8 flex gap-4">
          <RouterLink to="/catalog/men" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Continue shopping
          </RouterLink>
          <button
            @click="proceed"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Proceed to checkout
          </button>
        </div>
      </template>

      <template v-else>
        <div class="border border-dashed rounded-xl p-10 text-center text-gray-500 bg-gray-50">
          <h2 class="text-xl font-medium mb-2">Корзина пуста</h2>
          <RouterLink to="/catalog/men" class="text-blue-600 hover:underline">
            Перейти в каталог
          </RouterLink>
        </div>
      </template>
    </template>
  </section>
</template>
