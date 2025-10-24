<!-- src/pages/product/ui/ProductDetailsPage.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@entities/product'
import { useCartStore } from '@features/product'
import emblaCarouselVue from 'embla-carousel-vue'

const route = useRoute()
const productsStore = useProductsStore()
const cart = useCartStore()
const product = ref(productsStore.byId(route.params.id as string) || null)

onMounted(async () => {
  if (!productsStore.loaded) await productsStore.init()
  if (!product.value) product.value = await productsStore.fetchOne(route.params.id as string)
  await nextTick()
  setTimeout(() => emblaApi.value?.reInit(), 400)
})

const [emblaRef, emblaApi] = emblaCarouselVue({
  axis: 'y',
  align: 'center',
  containScroll: false,
  loop: false
})

const canScrollPrev = ref(false)
const canScrollNext = ref(false)
const activeIndex = ref(0)

function updateState(api: any) {
  canScrollPrev.value = api.canScrollPrev()
  canScrollNext.value = api.canScrollNext()
  activeIndex.value = api.selectedScrollSnap()
}

watch(emblaApi, (api) => {
  if (!api) return
  api.on('init', () => updateState(api))
  api.on('select', () => updateState(api))
  api.on('reInit', () => updateState(api))
  nextTick(() => updateState(api))
})

function scrollPrev() {
  emblaApi.value?.scrollPrev()
}
function scrollNext() {
  emblaApi.value?.scrollNext()
}

const activeImage = computed(() => product.value?.imageUrls?.[activeIndex.value] ?? '')
function selectImage(i: number) {
  emblaApi.value?.scrollTo(i, true)
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
  <section
    v-if="product"
    class="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[120px_1fr_1fr] gap-10 items-start"
  >
    <div class="flex flex-col items-center relative w-24">
      <div class="embla">
        <div class="embla__viewport" ref="emblaRef">
          <div class="embla__container">
            <div v-for="(src, i) in product.imageUrls" :key="i" class="embla__slide">
              <button @click="selectImage(i)" class="thumb-btn" :class="{ active: i === activeIndex }">
                <img :src="src" :alt="`${product.title} ${i + 1}`" class="thumb" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="controls mt-2 flex flex-col gap-2 items-center">
        <button class="btn" @click="scrollPrev" :disabled="!canScrollPrev">▲</button>
        <button class="btn" @click="scrollNext" :disabled="!canScrollNext">▼</button>
      </div>
    </div>

    <div class="w-full flex justify-center">
      <transition name="fade" mode="out-in">
        <img
          :key="activeImage"
          :src="activeImage"
          :alt="product.title"
          class="w-full max-w-lg aspect-square object-cover rounded-2xl shadow-lg ring-1 ring-gray-200"
        />
      </transition>
    </div>

    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-3xl font-semibold mb-2">{{ product.title }}</h1>
        <p class="text-2xl text-blue-600 font-medium">{{ product.price.toFixed(2) }} $</p>
      </div>

      <div>
        <h3 class="text-sm text-gray-600 mb-1">Select Size</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="s in product.sizes"
            :key="s"
            @click="pickedSize = s"
            :class="[
              'w-10 h-10 rounded-lg border flex items-center justify-center transition',
              pickedSize === s ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50 border-gray-300'
            ]"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <div>
        <h3 class="text-sm text-gray-600 mb-1">Colours Available</h3>
        <div class="flex gap-3">
          <button
            v-for="c in product.colors"
            :key="c"
            @click="pickedColor = c"
            :aria-pressed="pickedColor === c"
            :title="c"
            class="w-7 h-7 rounded-full border"
            :class="pickedColor === c ? 'ring-2 ring-blue-600 ring-offset-2' : 'hover:ring ring-gray-300'"
            :style="{ backgroundColor: c.toLowerCase() }"
          ></button>
        </div>
      </div>

      <div class="flex gap-4 items-center mt-2">
        <button
          @click="addToCart"
          :disabled="!canAdd"
          class="flex-1 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add to Cart
        </button>
        <span class="text-xl font-semibold">{{ product.price.toFixed(2) }} $</span>
      </div>

      <div class="pt-4 border-t border-gray-200 space-y-2">
        <h3 class="text-lg font-medium">Description</h3>
        <p class="text-gray-600 leading-relaxed">{{ product.description }}</p>
      </div>
    </div>
  </section>

  <div v-else class="text-center py-16 text-gray-500">Loading...</div>
</template>

<style scoped>
.embla {
  overflow: hidden;
  height: 220px;
  width: 100px;
  touch-action: pan-y;
}

.embla__viewport {
  overflow: hidden;
}

.embla__container {
  display: flex;
  flex-direction: column;
  will-change: transform;
}

.embla__slide {
  flex: 0 0 auto;
  padding: 0.25rem;
}

.thumb-btn {
  border: 1px solid transparent;
  border-radius: 0.75rem;
  width: 70px;
  height: 70px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: white;
  transition: border-color 0.2s ease;
}

.thumb-btn.active {
  border-color: #2563eb;
}

.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.75rem;
}

.controls .btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: white;
  font-size: 0.75rem;
  transition: background 0.2s ease;
}

.controls .btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
