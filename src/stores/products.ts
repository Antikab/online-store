// stores/products.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/supabase'
import type { Product, Gender } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

type ProductRow = {
  id: string
  title: string
  gender: Gender
  category: string
  price: number
  colors: string[] | null
  sizes: string[] | null
  image_urls: string[] | null
  description: string | null
  extra: Record<string, string> | null
  video_url: string | null
  created_at: string | null
  is_active?: boolean | null
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    gender: row.gender,
    category: row.category,
    price: Number(row.price ?? 0),
    colors: row.colors ?? [],
    sizes: row.sizes ?? [],
    imageUrls: row.image_urls ?? [],
    description: row.description ?? '',
    extra: row.extra ?? undefined,
    videoUrl: row.video_url ?? undefined,
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now()
  }
}

export const useProductsStore = defineStore('products', () => {
  const items = ref<Product[]>([])
  const loaded = ref(false)
  let channel: RealtimeChannel | null = null

  async function refresh() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    const rows = (data as ProductRow[] | null) ?? []
    items.value = rows.filter((p) => p.is_active ?? true).map(mapProduct)
    loaded.value = true
  }

  async function init() {
    if (channel) return
    await refresh()

    channel = supabase
      .channel('products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        try {
          await refresh()
        } catch (e) {
          console.error('Failed to refresh products', e)
        }
      })
      .subscribe()
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
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    const row = (data as ProductRow | null) ?? null
    return row ? mapProduct(row) : null
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
