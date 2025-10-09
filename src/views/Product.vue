<!-- views/Product.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const pStore = useProductsStore()
const cart = useCartStore()

const product = ref(pStore.byId(route.params.id as string) || null)

onMounted(async () => {
  if (!pStore.loaded) await pStore.init()
  if (!product.value) product.value = await pStore.fetchOne(route.params.id as string)
})

const mainIndex = ref(0)
const mainImg = computed(() => product.value?.imageUrls[mainIndex.value] ?? '')

function pick(i: number) {
  mainIndex.value = i
}

const pickedColor = ref('')
const pickedSize = ref('')
const canAdd = computed(() => !!product.value && !!pickedColor.value && !!pickedSize.value)

async function addToCart() {
  if (!product.value || !canAdd.value) return
  await cart.add(product.value, pickedColor.value, pickedSize.value, 1)
}
</script>

<template>
  <section v-if="product" class="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-10">
    <!-- Изображения -->
    <div>
      <div class="relative">
        <img
          :src="mainImg"
          :alt="product.title"
          class="w-full h-[480px] object-cover rounded-2xl shadow-md ring-1 ring-gray-200"
        />
      </div>

      <div class="flex gap-2 mt-4 overflow-x-auto">
        <button
          v-for="(src, i) in product.imageUrls"
          :key="i"
          @click="pick(i)"
          :class="[
            'w-20 h-20 rounded-lg overflow-hidden ring-2 transition',
            i === mainIndex ? 'ring-blue-500' : 'ring-transparent hover:ring-gray-300'
          ]"
        >
          <img :src="src" class="w-full h-full object-cover" :alt="`${product.title} ${i}`" />
        </button>
      </div>
    </div>

    <!-- Описание -->
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-3xl font-semibold mb-2">{{ product.title }}</h1>
        <p class="text-2xl text-blue-600 font-medium">{{ product.price.toFixed(2) }} $</p>
      </div>

      <!-- Цвет -->
      <div>
        <h3 class="text-sm text-gray-600 mb-1">Color</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in product.colors"
            :key="c"
            @click="pickedColor = c"
            :aria-pressed="pickedColor === c"
            :class="[
              'px-3 py-1 rounded-lg border text-sm',
              pickedColor === c
                ? 'bg-blue-600 text-white border-blue-600'
                : 'hover:bg-gray-50 border-gray-300'
            ]"
          >
            {{ c }}
          </button>
        </div>
      </div>

      <!-- Размер -->
      <div>
        <h3 class="text-sm text-gray-600 mb-1">Size</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="s in product.sizes"
            :key="s"
            @click="pickedSize = s"
            :aria-pressed="pickedSize === s"
            :class="[
              'px-3 py-1 rounded-lg border text-sm',
              pickedSize === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'hover:bg-gray-50 border-gray-300'
            ]"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Кнопка добавить -->
      <button
        @click="addToCart"
        :disabled="!canAdd"
        class="mt-2 inline-flex justify-center items-center px-5 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add to Cart
      </button>

      <!-- Описание -->
      <div class="space-y-2">
        <h3 class="text-lg font-medium">Description</h3>
        <p class="text-gray-600 leading-relaxed">{{ product.description }}</p>
      </div>

      <!-- Extra -->
      <table v-if="product.extra" class="mt-4 w-full text-sm border-t border-gray-200">
        <tbody>
          <tr v-for="(v, k) in product.extra" :key="k" class="border-b border-gray-100">
            <th class="py-2 pr-3 text-gray-500 font-medium text-left">{{ k }}</th>
            <td class="py-2 text-gray-800">{{ v }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Видео -->
      <div v-if="product.videoUrl" class="mt-6">
        <iframe
          width="100%"
          height="315"
          :src="product.videoUrl"
          title="Product video"
          frameborder="0"
          allowfullscreen
          class="rounded-xl shadow-md"
        ></iframe>
      </div>
    </div>
  </section>

  <div v-else class="text-center py-16 text-gray-500">Loading…</div>
</template>
