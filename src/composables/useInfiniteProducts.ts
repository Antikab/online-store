// composables/useInfiniteProducts.ts
import { ref, watch, type Ref, onMounted } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import type { Product, Gender } from '@/types'
import { useProductsStore } from '@/stores/products'

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

  const items = ref<Product[]>([])
  const page = ref(1)
  const loading = ref(false)
  const done = ref(false)
  const error = ref<string | null>(null)

  const container = ref<HTMLElement | null>(null)

  async function loadMore() {
    if (loading.value || done.value) return
    loading.value = true
    error.value = null

    try {
      const rows = await p.fetchPage({ page: page.value, perPage, ...filtersRef.value })
      if (rows.length === 0) {
        done.value = true
        return
      }
      items.value.push(...rows)
      if (rows.length < perPage) done.value = true
      else page.value += 1
    } catch (e: any) {
      error.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }

  function resetAndLoad() {
    items.value = []
    page.value = 1
    done.value = false
    error.value = null
    void loadMore()
  }

  // Следим за изменением фильтров
  watch(
    () => filtersRef.value,
    () => resetAndLoad(),
    { deep: true, immediate: true }
  )

  onMounted(() => {
    useInfiniteScroll(
      () => window, // 👈 теперь отслеживается именно секция с товарами
      async () => {
        if (!done.value) await loadMore()
      },
      { distance: 100 } // можно 100–200px, в зависимости от визуала
    )
  })

  return { container, items, loading, done, error, loadMore, resetAndLoad }
}
