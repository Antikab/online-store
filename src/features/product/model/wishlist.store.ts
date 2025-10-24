import { defineStore } from 'pinia'
import { ref, computed, watch, type WatchStopHandle } from 'vue'
import { supabase } from '@shared/api/supabase'
import { useAuthStore } from '@entities/user'
import { useProductsStore } from '@entities/product'
import type { Product } from '@entities/product'

interface WishlistRow {
  product_id: string
  products?: {
    id: string
    title: string
    price: number
    image_urls: string[]
  } | null
}

const GUEST_KEY = 'guest_wishlist_v1'

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref<Set<string>>(new Set())
  const idsArray = computed(() => Array.from(ids.value))
  const products = ref<Product[]>([])
  const loading = ref(true)
  const ready = ref(false)
  const isGuest = ref(true)
  let stopAuthWatch: WatchStopHandle | null = null

  function loadGuest() {
    try {
      const raw = localStorage.getItem(GUEST_KEY)
      const arr: string[] = raw ? JSON.parse(raw) : []
      ids.value = new Set(arr)

      const pStore = useProductsStore()
      products.value = arr
        .map((id) => pStore.byId?.(id) ?? null)
        .filter((product): product is Product => Boolean(product))
    } catch {
      ids.value = new Set()
      products.value = []
    } finally {
      loading.value = false
      ready.value = true
    }
  }

  function saveGuest() {
    localStorage.setItem(GUEST_KEY, JSON.stringify(Array.from(ids.value)))
  }

  function clearGuest() {
    localStorage.removeItem(GUEST_KEY)
    ids.value = new Set()
    products.value = []
  }

  async function refresh(uid: string) {
    loading.value = true

    const { data, error } = await supabase
      .from('wishlists')
      .select(
        `
        product_id,
        products (
          id,
          title,
          price,
          image_urls
        )
      `
      )
      .eq('user_id', uid)

    if (error) {
      console.error('[wishlist] refresh error:', error)
      loading.value = false
      return
    }

    const rows = ((data ?? []) as Array<{ product_id: string; products?: unknown }>)
    ids.value = new Set(rows.map((r) => r.product_id))
    products.value = rows
      .map((r) => r.products as WishlistRow['products'])
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        title: p!.title,
        price: Number(p!.price ?? 0),
        imageUrls: p!.image_urls ?? [],
        gender: 'men',
        category: '',
        colors: [],
        sizes: [],
        description: '',
        extra: undefined,
        videoUrl: undefined,
        createdAt: Date.now()
      }))

    loading.value = false
    ready.value = true
  }

  async function syncGuestToUser(uid: string) {
    const guestArr = Array.from(ids.value)
    if (!guestArr.length) return

    const { data: existing } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', uid)

    const existingIds = new Set((existing ?? []).map((r) => r.product_id))
    const newIds = guestArr.filter((id) => !existingIds.has(id))
    if (!newIds.length) {
      clearGuest()
      await refresh(uid)
      return
    }

    const rows = newIds.map((productId) => ({
      user_id: uid,
      product_id: productId,
      created_at: new Date().toISOString(),
      added_at: new Date().toISOString()
    }))

    const { error } = await supabase.from('wishlists').insert(rows)
    if (error) console.error('[wishlist] syncGuestToUser error:', error)

    clearGuest()
    await refresh(uid)
  }

  async function toggle(id: string) {
    const auth = useAuthStore()
    const uid = auth.uid
    const pStore = useProductsStore()

    if (isGuest.value || !uid) {
      if (ids.value.has(id)) {
        ids.value.delete(id)
        products.value = products.value.filter((p) => p.id !== id)
      } else {
        ids.value.add(id)
        const prod = pStore.byId?.(id)
        if (prod) products.value.push(prod)
      }
      saveGuest()
      return
    }

    const had = ids.value.has(id)

    if (had) {
      ids.value.delete(id)
      products.value = products.value.filter((p) => p.id !== id)
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', uid)
        .eq('product_id', id)
      if (error) console.error('[wishlist] delete error:', error)
    } else {
      ids.value.add(id)

    const { data, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: uid,
        product_id: id,
        created_at: new Date().toISOString(),
          added_at: new Date().toISOString()
        })
        .select(
          `
          products (
            id,
            title,
            price,
            image_urls
          )
        `
        )
        .single()

      if (!error && data) {
        const p = (data as unknown as { products?: WishlistRow['products'] | null }).products
        if (!p) return
        products.value.push({
          id: p.id,
          title: p.title,
          price: Number(p.price ?? 0),
          imageUrls: p.image_urls ?? [],
          gender: 'men',
          category: '',
          colors: [],
          sizes: [],
          description: '',
          extra: undefined,
          videoUrl: undefined,
          createdAt: Date.now()
        })
      } else if (error) {
        console.error('[wishlist] insert error', error)
      }
    }
  }

  function has(id: string) {
    return ids.value.has(id)
  }

  function start() {
    if (stopAuthWatch) return

    const auth = useAuthStore()

    if (auth.uid) {
      refresh(auth.uid)
      isGuest.value = false
    } else {
      loadGuest()
    }

    stopAuthWatch = watch(
      () => auth.uid,
      async (newUid, oldUid) => {
        if (newUid) {
          if (!oldUid && isGuest.value) {
            try {
              await syncGuestToUser(newUid)
            } catch (e) {
              console.error('[wishlist] merge guest', e)
            }
          } else {
            await refresh(newUid)
          }
          isGuest.value = false
        } else {
          isGuest.value = true
          loadGuest()
        }
      },
      { immediate: false }
    )
  }

  return { ids, idsArray, products, loading, ready, isGuest, start, toggle, has }
})
