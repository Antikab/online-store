import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/supabase'
import type { Product, Gender } from '@/types'

type ProductRow = {
  id: string
  title: string
  gender: Gender | null
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

type ProductFilters = {
  gender?: Gender
  category?: string | null
  color?: string | null
  size?: string | null
  priceRange?: [number, number]
  query?: string | null
}

function toMs(ts: string | null): number {
  if (!ts) return Date.now()
  const n = Date.parse(ts)
  return Number.isFinite(n) ? n : Date.now()
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    gender: (row.gender as Gender) || 'men',
    category: row.category,
    price: Number(row.price ?? 0),
    colors: row.colors ?? [],
    sizes: row.sizes ?? [],
    imageUrls: row.image_urls ?? [],
    description: row.description ?? '',
    extra: row.extra ?? undefined,
    videoUrl: row.video_url ?? undefined,
    createdAt: toMs(row.created_at)
  }
}

function buildQuery(f: ProductFilters) {
  let q = supabase
    .from('products')
    .select(
      'id,title,gender,category,price,colors,sizes,image_urls,description,extra,video_url,created_at,is_active'
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (f.gender) q = q.eq('gender', f.gender)
  if (f.category) q = q.eq('category', f.category)
  if (f.color) q = q.contains('colors', [f.color])
  if (f.size) q = q.contains('sizes', [f.size])
  if (f.priceRange) {
    const [min, max] = f.priceRange
    q = q.gte('price', min).lte('price', max)
  }
  if (f.query) q = q.ilike('title', `%${f.query}%`)

  return q
}

export const useProductsStore = defineStore('products', () => {
  const items = ref<Product[]>([])
  const loaded = ref(false)

  // 🔹 Инициализация (для фильтров)
  async function refresh() {
    const { data, error } = await buildQuery({}).range(0, 999)
    if (error) throw error
    const rows = (data as ProductRow[] | null) ?? []
    items.value = rows.map(mapProduct)
    loaded.value = true
  }

  async function init() {
    await refresh()
  }

  // 🔹 Пагинированная загрузка для infinite scroll
  async function fetchPage(opts: { page: number; perPage: number } & ProductFilters) {
    const { page, perPage, ...filters } = opts
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const query = buildQuery(filters)
    const { data, error } = await query.range(from, to)

    if (error) {
      console.error('Supabase fetchPage error:', error)
      throw error
    }

    const rows = (data as ProductRow[] | null) ?? []
    console.log(`fetchPage page=${page}, rows=${rows.length}`)
    return rows.map(mapProduct)
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

  return {
    items,
    loaded,
    init,
    refresh,
    fetchPage,
    categories,
    colors,
    sizes,
    priceMin,
    priceMax,
    byId
  }
})
