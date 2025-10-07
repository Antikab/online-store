<!-- views/Catalog.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { useWishlistStore } from '@/stores/wishlist'
import { useInfiniteProducts } from '@/composables/useInfiniteProducts'
import type { Gender } from '@/types'

const route = useRoute()
const p = useProductsStore()
const w = useWishlistStore()

const category = ref<string | null>(null)
const color = ref<string | null>(null)
const size = ref<string | null>(null)
const query = ref<string>('')

const price = ref<[number, number]>([0, 999999])
watch(
  () => p.loaded,
  (v) => {
    if (v) price.value = [p.priceMin, p.priceMax]
  },
  { immediate: true }
)

const gender = computed<Gender>(() => (route.params.gender as Gender) || 'men')

const filters = computed(() => ({
  gender: gender.value,
  category: category.value,
  color: color.value,
  size: size.value,
  priceRange: price.value,
  query: query.value || null
}))

const { container, items, loading, done, resetAndLoad } = useInfiniteProducts(filters, 3)

async function init() {
  if (!p.loaded) await p.refresh()
}
init()

function resetFilters() {
  category.value = color.value = size.value = null
  query.value = ''
  price.value = [p.priceMin, p.priceMax]
  resetAndLoad()
}
</script>

<template>
  <div class="flex flex-col md:flex-row gap-6 p-6">
    <!-- Фильтры -->
    <aside
      class="w-full md:w-64 flex flex-col gap-4 bg-white p-4 rounded-2xl shadow-sm border border-neutral-200 h-fit sticky top-6"
    >
      <h3 class="text-lg font-semibold text-neutral-800">Фильтры</h3>

      <div class="space-y-1">
        <label class="text-sm text-neutral-600">Поиск</label>
        <input
          v-model="query"
          placeholder="Название товара"
          class="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div class="space-y-1">
        <label class="text-sm text-neutral-600">Категория</label>
        <select
          v-model="category"
          class="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option :value="null">Все</option>
          <option v-for="c in p.categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm text-neutral-600">Цвет</label>
        <select
          v-model="color"
          class="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option :value="null">Все</option>
          <option v-for="c in p.colors" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm text-neutral-600">Размер</label>
        <select
          v-model="size"
          class="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option :value="null">Все</option>
          <option v-for="s in p.sizes" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm text-neutral-600">Цена</label>
        <div class="flex items-center gap-2">
          <input
            type="number"
            v-model.number="price[0]"
            :min="p.priceMin"
            :max="price[1]"
            class="w-1/2 border border-neutral-300 rounded-xl px-2 py-2 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span class="text-neutral-400">—</span>
          <input
            type="number"
            v-model.number="price[1]"
            :min="price[0]"
            :max="p.priceMax"
            class="w-1/2 border border-neutral-300 rounded-xl px-2 py-2 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <button
        @click="resetFilters"
        class="mt-3 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition rounded-xl py-2 text-sm font-medium"
      >
        Сбросить фильтры
      </button>
    </aside>

    <!-- Сетка товаров -->
    <section ref="container" class="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      <article
        v-for="prod in items"
        :key="prod.id"
        class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-neutral-200 flex flex-col"
      >
        <RouterLink :to="`/product/${prod.id}`" class="flex flex-col flex-1">
          <img
            :src="prod.imageUrls[0]"
            :alt="prod.title"
            class="h-64 w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div class="p-3 flex flex-col justify-between flex-1">
            <h4 class="font-semibold text-neutral-800 line-clamp-1">{{ prod.title }}</h4>
            <p class="text-sm text-neutral-500 mt-1">{{ prod.price.toFixed(2) }} $</p>
          </div>
        </RouterLink>

        <button
          @click="w.toggle(prod.id)"
          class="border-t border-neutral-200 py-2 text-lg hover:bg-neutral-100 transition"
        >
          <span :class="w.isIn(prod.id) ? 'text-red-500' : 'text-neutral-400'">
            {{ w.isIn(prod.id) ? '♥' : '♡' }}
          </span>
        </button>
      </article>

      <div class="col-span-full text-center py-8 text-neutral-500">
        <span v-if="loading">Загрузка…</span>
        <span v-else-if="done">Больше товаров нет</span>
      </div>
    </section>
  </div>
</template>
