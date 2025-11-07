<!-- views/Home.vue -->
<script setup lang="ts">
import { ref } from 'vue'

import type { Gender } from '@shared/model'
import { useInfiniteProducts } from '@features/catalog'

const filters = ref<{ gender?: Gender }>({ gender: 'men' })
const { items, loading } = useInfiniteProducts(filters, 4)
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-semibold">Home</h1>
        <p class="text-gray-500">Discover the latest arrivals and trends.</p>
      </div>
      <nav class="space-x-3 text-blue-600">
        <RouterLink class="hover:underline" to="/catalog/men">Men</RouterLink>
        <span>·</span>
        <RouterLink class="hover:underline" to="/catalog/women">Women</RouterLink>
      </nav>
    </header>

    <section>
      <h2 class="text-xl font-semibold mb-3">Popular now</h2>
      <div v-if="loading" class="text-gray-500">Loading products…</div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RouterLink
          v-for="item in items"
          :key="item.id"
          :to="`/product/${item.id}`"
          class="block border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
        >
          <img
            :src="item.imageUrls[0]"
            :alt="item.title"
            class="w-full aspect-square object-cover"
          />
          <div class="p-3">
            <p class="font-medium text-gray-800 truncate">{{ item.title }}</p>
            <p class="text-sm text-gray-500">{{ item.price.toFixed(2) }} $</p>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
