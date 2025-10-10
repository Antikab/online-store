<script setup lang="ts">
import { useWishlistStore } from '@/stores/wishlist'
import Loader from '@/components/Loader.vue'

const w = useWishlistStore()
</script>

<template>
  <div v-if="w.loading" class="flex items-center justify-center py-20">
    <Loader />
  </div>

  <div v-else-if="w.products.length">
    <h1 class="text-2xl font-semibold mb-6 text-gray-800">Избранное</h1>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
      <article
        v-for="prod in w.products"
        :key="prod.id"
        class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
      >
        <RouterLink :to="`/product/${prod.id}`" class="flex flex-col">
          <img :src="prod.imageUrls?.[0]" class="h-56 w-full object-cover" />
          <div class="p-3 flex flex-col flex-1">
            <h4 class="font-medium text-gray-800 truncate">{{ prod.title }}</h4>
            <p class="text-sm text-gray-500 mt-1">{{ prod.price.toFixed(2) }} $</p>
          </div>
        </RouterLink>
        <button
          @click="w.toggle(prod.id)"
          class="border-t border-gray-200 py-2 text-lg hover:bg-gray-100 transition"
        >
          <span :class="w.isIn(prod.id) ? 'text-red-500' : 'text-neutral-400'">
            {{ w.isIn(prod.id) ? '♥' : '♡' }}
          </span>
        </button>
      </article>
    </div>
  </div>

  <div v-else class="text-center py-12 text-gray-400">
    <h2 class="text-xl font-semibold mb-2">Список желаний пуст</h2>
    <RouterLink to="/catalog/men" class="text-blue-500 hover:underline transition-colors">
      Перейти в каталог
    </RouterLink>
  </div>
</template>
