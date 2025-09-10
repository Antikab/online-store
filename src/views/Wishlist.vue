<!-- views/Wishlist.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useWishlistStore } from '@/stores/wishlist'
import { useProductsStore } from '@/stores/products'

const w = useWishlistStore()
const p = useProductsStore()
const list = computed(() => p.items.filter((x) => w.isIn(x.id)))
</script>

<template>
  <div v-if="list.length">
    <h1>Wishlist</h1>
    <div class="grid">
      <article v-for="prod in list" :key="prod.id">
        <RouterLink :to="`/product/${prod.id}`">
          <img :src="prod.imageUrls[0]" />
          <h4>{{ prod.title }}</h4>
        </RouterLink>
        <button @click="w.toggle(prod.id)">Удалить</button>
      </article>
    </div>
  </div>
  <div v-else class="empty">
    <h2>Список желаний пуст</h2>
    <RouterLink to="/catalog/men">Перейти в каталог</RouterLink>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}
.empty {
  padding: 24px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  text-align: center;
}
</style>
