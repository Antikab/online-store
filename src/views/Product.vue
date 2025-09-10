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
  if (!product.value) product.value = await pStore.fetchOne(route.params.id as string)
})

const mainIndex = ref(0)
const mainImg = computed(() => product.value?.imageUrls[mainIndex.value] ?? '')
function pick(i: number) {
  mainIndex.value = i
}

const pickedColor = ref<string>('')
const pickedSize = ref<string>('')
const canAdd = computed(() => !!product.value && !!pickedColor.value && !!pickedSize.value)

async function addToCart() {
  if (product.value && canAdd.value)
    await cart.add(product.value, pickedColor.value, pickedSize.value, 1)
}
</script>

<template>
  <div v-if="product" class="product">
    <div class="left">
      <img :src="mainImg" class="main" />
      <div class="thumbs">
        <button
          v-for="(src, i) in product.imageUrls"
          :key="i"
          @click="pick(i)"
          :class="{ active: i === mainIndex }"
        >
          <img :src="src" />
        </button>
      </div>
    </div>

    <div class="right">
      <h1>{{ product.title }}</h1>
      <p class="price">{{ product.price.toFixed(2) }} $</p>

      <div class="picker">
        <label>Color</label>
        <div class="row">
          <button
            v-for="c in product.colors"
            :key="c"
            @click="pickedColor = c"
            :class="{ active: pickedColor === c }"
          >
            {{ c }}
          </button>
        </div>
      </div>

      <div class="picker">
        <label>Size</label>
        <div class="row">
          <button
            v-for="s in product.sizes"
            :key="s"
            @click="pickedSize = s"
            :class="{ active: pickedSize === s }"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <button :disabled="!canAdd" class="add" @click="addToCart">Add to cart</button>

      <section class="desc">
        <h3>Description</h3>
        <p>{{ product.description }}</p>
        <table v-if="product.extra">
          <tr v-for="(v, k) in product.extra" :key="k">
            <th>{{ k }}</th>
            <td>{{ v }}</td>
          </tr>
        </table>
      </section>

      <section v-if="product.videoUrl">
        <iframe
          width="560"
          height="315"
          :src="product.videoUrl"
          title="Video"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </section>
    </div>
  </div>
  <div v-else>Loading...</div>
</template>

<style scoped>
.product {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.main {
  width: 100%;
  height: 480px;
  object-fit: cover;
  border-radius: 8px;
}
.thumbs {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.thumbs button {
  width: 100px;
  height: 100px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}
.thumbs img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.picker .row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.picker button {
  border: 1px solid #ddd;
  padding: 6px 10px;
  border-radius: 6px;
}
.picker button.active {
  border-color: #333;
  font-weight: 600;
}
.add[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
.price {
  font-size: 20px;
  font-weight: 700;
}
.desc table {
  width: 100%;
  border-collapse: collapse;
}
.desc th,
.desc td {
  border-bottom: 1px solid #eee;
  padding: 6px 8px;
  text-align: left;
}
</style>
