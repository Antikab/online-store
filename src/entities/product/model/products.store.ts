import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { supabase } from '@/shared/api/supabase/client'
import { createStoragePublicUrls } from '@/shared/api/storage/publicUrl'
import { SUPABASE_STORAGE_BUCKETS } from '@/shared/config/supabase/storage'
import { parseArray } from '@/shared/lib/utils/parseArray'
import type { Product, Gender } from '@/shared/model/product/types'

const PRODUCT_BUCKET = SUPABASE_STORAGE_BUCKETS.productImages

export const useProductStore = defineStore('products', () => {
  const all = ref<Product[]>([])
  const loaded = ref(false)

  const priceMin = computed(() => (all.value.length ? Math.min(...all.value.map((p) => p.price)) : 0))
  const priceMax = computed(() => (all.value.length ? Math.max(...all.value.map((p) => p.price)) : 100000))

  const categories = computed(() => [...new Set(all.value.map((p) => p.category))].filter(Boolean))
  const colors = computed(() => [...new Set(all.value.flatMap((p) => p.colors))].filter(Boolean))
  const sizes = computed(() => [...new Set(all.value.flatMap((p) => p.sizes))].filter(Boolean))

  function mapImageUrls(imageField: unknown) {
    const images = parseArray(imageField)
    return images.length ? createStoragePublicUrls(PRODUCT_BUCKET, images) : []
  }

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
      .select(
        'id,title,gender,category,price,colors,sizes,image_urls,description,is_active,extra,video_url'
      )
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
      title: r.title ?? '',
      gender: (r.gender as Gender) || 'men',
      category: r.category ?? '',
      price: Number(r.price ?? 0),
      colors: parseArray(r.colors),
      sizes: parseArray(r.sizes),
      imageUrls: mapImageUrls(r.image_urls),
      description: r.description ?? '',
      extra: (r.extra as Record<string, string> | null) ?? undefined,
      videoUrl: (r.video_url as string | null) ?? undefined
    }))

    return rows
  }

  async function fetchOne(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(
        'id,title,gender,category,price,colors,sizes,image_urls,description,is_active,extra,video_url'
      )
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    const product: Product = {
      id: data.id,
      title: data.title ?? '',
      gender: (data.gender as Gender) || 'men',
      category: data.category ?? '',
      price: Number(data.price ?? 0),
      colors: (data.colors as string[] | null) ?? [],
      sizes: (data.sizes as string[] | null) ?? [],
      imageUrls: mapImageUrls(data.image_urls),
      description: data.description ?? '',
      extra: (data.extra as Record<string, string> | null) ?? undefined,
      videoUrl: (data.video_url as string | null) ?? undefined
    }

    if (!all.value.some((p) => p.id === product.id)) all.value.push(product)
    return product
  }

  function byId(id: string): Product | null {
    return all.value.find((p) => p.id === id) || null
  }

  async function init() {
    if (loaded.value) return

    const { data, error } = await supabase
      .from('products')
      .select('id,title,category,price,colors,sizes,image_urls,is_active')
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
      imageUrls: mapImageUrls(r.image_urls),
      description: '',
      extra: undefined,
      videoUrl: undefined
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
