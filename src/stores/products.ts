// stores/products.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/firebase'
import { ref as dbRef, onValue, get } from 'firebase/database'
import type { Product, Gender } from '@/types'

export const useProductsStore = defineStore('products', () => {
  const items = ref<Product[]>([])
  const loaded = ref(false)

  // единый unsubscribe для onValue
  let unsub: (() => void) | null = null

  async function init() {
    if (unsub) return
    const r = dbRef(db, 'products')

    unsub = onValue(r, (snap) => {
      const val = snap.val() || {}
      // важное изменение: возвращаем id из ключа RTDB
      items.value = Object.entries(val).map(([id, p]: [string, any]) => ({
        id,
        ...(p as Omit<Product, 'id'>)
      }))
      loaded.value = true
    })
  }

  const categories = computed(() => Array.from(new Set(items.value.map((p) => p.category))).sort())
  const colors = computed(() => Array.from(new Set(items.value.flatMap((p) => p.colors))).sort())
  const sizes = computed(() => Array.from(new Set(items.value.flatMap((p) => p.sizes))).sort())
  const priceMin = computed(() =>
    items.value.length ? Math.min(...items.value.map((p) => p.price)) : 0
  )
  const priceMax = computed(() =>
    items.value.length ? Math.max(...items.value.map((p) => p.price)) : 0
  )

  function byId(id: string) {
    return items.value.find((p) => p.id === id) || null
  }

  async function fetchOne(id: string) {
    // запасной метод при прямом заходе на /product/:id
    const snap = await get(dbRef(db, `products/${id}`))
    const v = snap.val()
    return v ? ({ id, ...(v as Omit<Product, 'id'>) } as Product) : null
  }

  function filtered(opts: {
    gender?: Gender
    category?: string | null
    color?: string | null
    size?: string | null
    priceRange?: [number, number]
    query?: string | null
  }) {
    const [min, max] = opts.priceRange ?? [priceMin.value, priceMax.value]
    return items.value.filter((p) => {
      if (opts.gender && p.gender !== opts.gender) return false
      if (opts.category && p.category !== opts.category) return false
      if (opts.color && !p.colors.includes(opts.color)) return false
      if (opts.size && !p.sizes.includes(opts.size)) return false
      if (p.price < min || p.price > max) return false
      if (opts.query && !p.title.toLowerCase().includes(opts.query.toLowerCase())) return false
      return true
    })
  }

  // простая пагинация на клиенте
  function paginate(list: Product[], page: number, perPage: number) {
    const start = (page - 1) * perPage
    return list.slice(start, start + perPage)
  }

  return {
    items,
    loaded,
    init,
    categories,
    colors,
    sizes,
    priceMin,
    priceMax,
    byId,
    fetchOne,
    filtered,
    paginate
  }
})
