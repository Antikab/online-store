// stores/products.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import type { Product, Gender } from '@/types'

export const useProductsStore = defineStore('products', () => {
  const all = ref<Product[]>([])
  const loaded = ref(false)

  // 🔢 Цены
  const priceMin = computed(() =>
    all.value.length ? Math.min(...all.value.map((p) => p.price)) : 0
  )
  const priceMax = computed(() =>
    all.value.length ? Math.max(...all.value.map((p) => p.price)) : 100000
  )

  // 🧠 Загрузка всех товаров
  async function init() {
    if (loaded.value) return

    const { data, error } = await supabase
      .from('products')
      .select(
        'id,title,gender,category,price,colors,sizes,image_urls,description,is_active,extra,video_url'
      )
      .eq('is_active', true)

    if (error) throw error

    all.value = (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      gender: (r.gender as Gender) || 'men',
      category: r.category,
      price: Number(r.price ?? 0),
      colors: r.colors ?? [],
      sizes: r.sizes ?? [],
      imageUrls: r.image_urls ?? [],
      description: r.description ?? '',
      extra: r.extra ?? null,
      videoUrl: r.video_url ?? null // ✅ правильно!
    }))

    loaded.value = true
  }

  // 🔍 Поиск по id (кэш)
  function byId(id: string): Product | null {
    return all.value.find((p) => p.id === id) ?? null
  }

  // 🌐 Загрузка одного товара (если нет в кэше)
  async function fetchOne(id: string): Promise<Product | null> {
    const cached = byId(id)
    if (cached) return cached

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
      title: data.title,
      gender: (data.gender as Gender) || 'men',
      category: data.category,
      price: Number(data.price ?? 0),
      colors: data.colors ?? [],
      sizes: data.sizes ?? [],
      imageUrls: data.image_urls ?? [],
      description: data.description ?? '',
      extra: data.extra ?? null,
      videoUrl: data.video_url ?? null // ✅
    }

    // кэшируем в all, чтобы при возврате не подгружать повторно
    all.value.push(product)
    return product
  }

  // 🏷️ Фильтры
  const categories = computed(() => [...new Set(all.value.map((p) => p.category))].filter(Boolean))
  const colors = computed(() => [...new Set(all.value.flatMap((p) => p.colors))].filter(Boolean))
  const sizes = computed(() => [...new Set(all.value.flatMap((p) => p.sizes))].filter(Boolean))

  return {
    all,
    loaded,
    init,
    byId,
    fetchOne,
    priceMin,
    priceMax,
    categories,
    colors,
    sizes
  }
})
