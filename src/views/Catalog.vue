<!-- views/Catalog.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { useWishlistStore } from '@/stores/wishlist'
import type { Gender } from '@/types'

const route = useRoute()
const p = useProductsStore()
const w = useWishlistStore()

const category = ref<string | null>(null)
const color = ref<string | null>(null)
const size = ref<string | null>(null)
const query = ref<string>('')
const price = ref<[number, number]>([0, 999999])
const page = ref(1)
const perPage = 9

watch(
  () => p.loaded,
  (v) => {
    if (v) price.value = [p.priceMin, p.priceMax]
  },
  { immediate: true }
)

const gender = computed<Gender>(() => (route.params.gender as Gender) || 'men')
const filtered = computed(() =>
  p.filtered({
    gender: gender.value,
    category: category.value,
    color: color.value,
    size: size.value,
    priceRange: price.value,
    query: query.value || null
  })
)
const pageItems = computed(() => p.paginate(filtered.value, page.value, perPage))

function resetFilters() {
  category.value = color.value = size.value = null
  query.value = ''
  price.value = [p.priceMin, p.priceMax]
  page.value = 1
}
</script>

<template>
  <div class="catalog" v-if="p.loaded">
    <aside class="filters">
      <h3>Filters</h3>
      <div>
        <label>Search</label>
        <input v-model="query" placeholder="Поиск по названию" />
      </div>
      <div>
        <label>Category</label>
        <select v-model="category">
          <option :value="null">All</option>
          <option v-for="c in p.categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div>
        <label>Color</label>
        <select v-model="color">
          <option :value="null">All</option>
          <option v-for="c in p.colors" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div>
        <label>Size</label>
        <select v-model="size">
          <option :value="null">All</option>
          <option v-for="s in p.sizes" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div>
        <label>Price</label>
        <input type="number" v-model.number="price[0]" :min="p.priceMin" :max="price[1]" />
        —
        <input type="number" v-model.number="price[1]" :min="price[0]" :max="p.priceMax" />
      </div>
      <button @click="resetFilters">Reset</button>
    </aside>

    <section class="grid">
      <article v-for="prod in pageItems" :key="prod.id" class="card">
        <RouterLink :to="`/product/${prod.id}`">
          <img :src="prod.imageUrls[0]" :alt="prod.title" />
          <h4>{{ prod.title }}</h4>
        </RouterLink>
        <p>{{ prod.price.toFixed(2) }} $</p>
        <button @click="w.toggle(prod.id)">
          {{ w.isIn(prod.id) ? '♥' : '♡' }}
        </button>
      </article>
    </section>

    <div class="pager">
      <button :disabled="page === 1" @click="page--">Prev</button>
      <span>{{ page }}</span>
      <button :disabled="page * 9 >= filtered.length" @click="page++">Next</button>
    </div>
  </div>

  <div v-else>Loading...</div>
</template>

<style scoped>
.catalog {
  display: flex;
  gap: 24px;
}
.filters {
  width: 260px;
}
.grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card img {
  width: 100%;
  height: 260px;
  object-fit: cover;
}
.pager {
  margin: 16px 0;
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>
