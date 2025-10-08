// composables/useInfiniteProducts.ts
import { ref, watch, computed, type Ref, onMounted, nextTick } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import { useProductsStore } from '@/stores/products'
import type { Product, Gender } from '@/types'

type Filters = {
  gender?: Gender
  category?: string | null
  color?: string | null
  size?: string | null
  priceRange?: [number, number]
  query?: string | null
}

export function useInfiniteProducts(filtersRef: Ref<Filters>, perPage = 6) {
  const p = useProductsStore()

  // 📦 состояния
  const container = ref<HTMLElement | null>(null)
  const items = ref<Product[]>([])
  const page = ref(1)
  const loading = ref(false)
  const done = ref(false)
  const error = ref<string | null>(null)

  /* 🔍 Фильтрация — локальная */
  const filtered = computed(() => {
    let list = p.all
    const f = filtersRef.value

    if (f.gender) list = list.filter((x) => x.gender === f.gender)
    if (f.category) list = list.filter((x) => x.category === f.category)
    if (f.color) list = list.filter((x) => x.colors.includes(f.color))
    if (f.size) list = list.filter((x) => x.sizes.includes(f.size))
    if (f.priceRange) {
      const [min, max] = f.priceRange
      list = list.filter((x) => x.price >= min && x.price <= max)
    }
    if (f.query) list = list.filter((x) => x.title.toLowerCase().includes(f.query.toLowerCase()))

    return list
  })

  /* ⚡ Порционная подгрузка */
  function loadMore() {
    if (loading.value || done.value) return
    loading.value = true

    const start = (page.value - 1) * perPage
    const end = start + perPage
    const slice = filtered.value.slice(start, end)

    if (slice.length === 0) {
      done.value = true
      loading.value = false
      return
    }

    items.value.push(...slice)
    page.value++
    if (slice.length < perPage) done.value = true
    loading.value = false
  }

  /* 🔁 Сброс списка */
  function reset() {
    items.value = []
    page.value = 1
    done.value = false
    error.value = null
  }

  /* 🔁 Полный сброс с перезагрузкой */
  function resetAndLoad() {
    reset()
    loadMore()
  }

  /* 🧭 Инициализация infinite scroll */
  let stop: (() => void) | undefined

  async function setupScroll() {
    await nextTick()
    stop?.() // очищаем старый watcher

    stop = useInfiniteScroll(
      container,
      () => {
        if (!done.value) loadMore()
      },
      {
        distance: 200,
        canLoadMore: () => !done.value && !loading.value
      }
    )
  }

  /* 🚀 При монтировании */
  onMounted(async () => {
    if (!p.loaded) await p.init()
    resetAndLoad()
    await setupScroll()
  })

  // ♻️ Обновление при изменении фильтров
  watch(filtered, () => resetAndLoad(), { deep: true })

  // 🧠 При первой инициализации продуктов
  watch(
    () => p.loaded,
    (v) => {
      if (v) resetAndLoad()
    },
    { immediate: true }
  )

  return { container, items, loading, done, error, reset, resetAndLoad }
}
