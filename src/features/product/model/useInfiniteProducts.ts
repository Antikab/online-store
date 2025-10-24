import { ref, watch, type Ref, onMounted } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import { useProductsStore } from '@entities/product'
import type { Product, Gender } from '@entities/product'

type Filters = {
  gender?: Gender
  category?: string | null
  color?: string | null
  size?: string | null
  priceRange?: [number, number]
  query?: string | null
}

export function useInfiniteProducts(filtersRef: Ref<Filters>, perPage = 9) {
  const p = useProductsStore()
  const items = ref<Product[]>([])
  const page = ref(1)
  const loading = ref(false)
  const done = ref(false)
  const error = ref<string | null>(null)

  async function loadMore() {
    if (loading.value || done.value) return
    loading.value = true
    try {
      const rows = await p.fetchPage({ page: page.value, perPage, ...filtersRef.value })
      if (!rows.length) done.value = true
      else {
        items.value.push(...rows)
        page.value++
      }
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
    loadMore()
  }

  watch(filtersRef, resetAndLoad, { deep: true })

  useInfiniteScroll(
    window,
    () => {
      if (!loading.value && !done.value) loadMore()
    },
    {
      distance: 300,
      canLoadMore: () => !done.value && !loading.value
    }
  )

  onMounted(async () => {
    if (!p.loaded) await p.init()
    resetAndLoad()
  })

  return { items, loading, done, error, resetAndLoad }
}
