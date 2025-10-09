// composables/useInfiniteProducts.ts
import { ref, watch, type Ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
  const items = ref<Product[]>([])
  const page = ref(1)
  const loading = ref(false)
  const done = ref(false)
  const error = ref<string | null>(null)
  const container = ref<HTMLElement | null>(null)

  async function loadMore() {
    if (loading.value || done.value) return
    loading.value = true
    try {
      const rows = await p.fetchPage({ page: page.value, perPage, ...filtersRef.value })
      if (rows.length === 0) done.value = true
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

  watch(filtersRef, () => resetAndLoad(), { deep: true })

  onMounted(async () => {
    if (!p.loaded) await p.init()
    resetAndLoad()
    await nextTick()
    useInfiniteScroll(container, loadMore, { distance: 200 })
  })

  onBeforeUnmount(() => (items.value = []))

  return { container, items, loading, done, error, loadMore, resetAndLoad }
}
