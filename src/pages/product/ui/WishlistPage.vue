<!-- src/pages/product/ui/WishlistPage.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useWishlistStore } from '@features/product'
import { BaseLoader } from '@shared/ui'

const wishlist = useWishlistStore()

onMounted(() => {
  wishlist.start()
})
</script>

<template>
  <div v-if="wishlist.loading" class="flex items-center justify-center py-20">
    <BaseLoader />
  </div>

  <div v-else-if="wishlist.products.length">
    <h1 class="text-2xl font-semibold mb-6 text-gray-800">Избранное</h1>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
      <article
        v-for="prod in wishlist.products"
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
        <button @click="wishlist.toggle(prod.id)" class="border-t border-gray-200 py-2 text-lg hover:bg-gray-100 transition">
          <span :class="wishlist.has(prod.id) ? 'text-red-500' : 'text-neutral-400'">
            {{ wishlist.has(prod.id) ? '♥' : '♡' }}
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
