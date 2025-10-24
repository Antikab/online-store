import { onMounted, ref, watch, type Ref } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'

import { useProductsStore } from '@/entities/product'
import type { Product, Gender } from '@/shared/types'

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
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
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

  // 🔁 при смене фильтров всё перезапускаем
  watch(filtersRef, resetAndLoad, { deep: true })

  // ♾️ Автоподгрузка при прокрутке страницы
  useInfiniteScroll(
    window, // 👈 слушаем глобальный scroll
    () => {
      if (!loading.value && !done.value) loadMore()
    },
    {
      distance: 300, // за сколько пикселей до низа страницы подгружать
      canLoadMore: () => !done.value && !loading.value
    }
  )

  onMounted(async () => {
    if (!p.loaded) await p.init()
    resetAndLoad()
  })

  return { items, loading, done, error, resetAndLoad }
}
