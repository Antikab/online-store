import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@shared/api/supabase'
import { parseArray } from '@shared/lib'
import type { Product, Gender } from './types'

export const useProductsStore = defineStore('products', () => {
  const all = ref<Product[]>([])
  const loaded = ref(false)

  const priceMin = computed(() => (all.value.length ? Math.min(...all.value.map((p) => p.price)) : 0))
  const priceMax = computed(() => (all.value.length ? Math.max(...all.value.map((p) => p.price)) : 100000))

  const categories = computed(() => [...new Set(all.value.map((p) => p.category))].filter(Boolean))
  const colors = computed(() => [...new Set(all.value.flatMap((p) => p.colors))].filter(Boolean))
  const sizes = computed(() => [...new Set(all.value.flatMap((p) => p.sizes))].filter(Boolean))

  async function fetchPage({
    page = 1,
    perPage = 6,
    gender,
    category,
    color,
    size,
    priceRange,
    query
  }: {
    page?: number
    perPage?: number
    gender?: Gender
    category?: string | null
    color?: string | null
    size?: string | null
    priceRange?: [number, number]
    query?: string | null
  }) {
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    let q = supabase
      .from('products')
      .select('id,title,gender,category,price,colors,sizes,image_urls,description,is_active,extra,video_url')
      .eq('is_active', true)
      .range(from, to)

    if (gender) q = q.eq('gender', gender)
    if (category) q = q.eq('category', category)
    if (color) q = q.contains('colors', [color])
    if (size) q = q.contains('sizes', [size])
    if (priceRange) q = q.gte('price', priceRange[0]).lte('price', priceRange[1])
    if (query) q = q.ilike('title', `%${query}%`)

    const { data, error } = await q
    if (error) throw error

    const rows = (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      gender: (r.gender as Gender) || 'men',
      category: r.category ?? '',
      price: Number(r.price ?? 0),
      colors: parseArray(r.colors),
      sizes: parseArray(r.sizes),
      imageUrls: parseArray(r.image_urls),
      description: r.description ?? '',
      extra: (r.extra as Record<string, string> | null) ?? undefined,
      videoUrl: r.video_url ?? null,
      createdAt: Date.now()
    })) as Product[]

    return rows
  }

  async function fetchOne(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('id,title,gender,category,price,colors,sizes,image_urls,description,is_active,extra,video_url,created_at')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    const product: Product = {
      id: data.id,
      title: data.title,
      gender: (data.gender as Gender) || 'men',
      category: data.category ?? '',
      price: Number(data.price ?? 0),
      colors: parseArray(data.colors),
      sizes: parseArray(data.sizes),
      imageUrls: parseArray(data.image_urls),
      description: data.description ?? '',
      extra: (data.extra as Record<string, string> | null) ?? undefined,
      videoUrl: data.video_url ?? null,
      createdAt: Date.parse(data.created_at ?? String(Date.now()))
    }

    if (!all.value.some((p) => p.id === product.id)) all.value.push(product)
    return product
  }

  function byId(id: string): Product | null {
    return all.value.find((p) => p.id === id) ?? null
  }

  async function init() {
    if (loaded.value) return

    const { data, error } = await supabase
      .from('products')
      .select('id,title,category,price,colors,sizes,image_urls,is_active,created_at')
      .eq('is_active', true)

    if (error) throw error

    all.value = (data ?? []).map((r) => ({
      id: r.id,
      title: r.title ?? '',
      gender: 'men',
      category: r.category ?? '',
      price: Number(r.price ?? 0),
      colors: parseArray(r.colors),
      sizes: parseArray(r.sizes),
      imageUrls: parseArray(r.image_urls),
      description: '',
      extra: undefined,
      videoUrl: undefined,
      createdAt: Date.parse(r.created_at ?? String(Date.now()))
    }))
    loaded.value = true
  }

  return {
    all,
    loaded,
    init,
    fetchPage,
    fetchOne,
    byId,
    priceMin,
    priceMax,
    categories,
    colors,
    sizes
  }
})
