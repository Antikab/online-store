import { defineStore } from 'pinia'
import { ref, computed, watch, type WatchStopHandle } from 'vue'

import { useSessionStore } from '@/entities/session'
import { useProductStore } from '@/entities/product'
import { supabase } from '@/shared/api/supabase/client'
import { createStoragePublicUrls } from '@/shared/api/storage/publicUrl'
import { SUPABASE_STORAGE_BUCKETS } from '@/shared/config/supabase/storage'
import type { Product } from '@/shared/model/product/types'

const GUEST_KEY = 'guest_wishlist_v1'
const PRODUCT_BUCKET = SUPABASE_STORAGE_BUCKETS.productImages

type WishlistProductRow = {
  id: string
  title: string
  price: number
  image_urls: string[]
}

type WishlistRow = {
  product_id: string
  products?: WishlistProductRow | WishlistProductRow[] | null
}

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref<Set<string>>(new Set())
  const idsArray = computed(() => Array.from(ids.value))
  const products = ref<Product[]>([])
  const loading = ref(true)
  const ready = ref(false)
  const isGuest = ref(true)
  let stopAuthWatch: WatchStopHandle | null = null

  const session = useSessionStore()
  const productStore = useProductStore()

  function resolveProductImages(imageUrls: string[]) {
    return createStoragePublicUrls(PRODUCT_BUCKET, imageUrls)
  }

  function loadGuest() {
    try {
      const raw = localStorage.getItem(GUEST_KEY)
      const arr: string[] = raw ? JSON.parse(raw) : []
      ids.value = new Set(arr)

      products.value = arr
        .map((id) => productStore.byId?.(id))
        .filter(Boolean)
        .map((p) => ({ ...p!, imageUrls: resolveProductImages(p!.imageUrls ?? []) }))
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

    const rows = ((data as unknown) as WishlistRow[]) ?? []
    ids.value = new Set(rows.map((r) => r.product_id))
    products.value = rows
      .map((r) => {
        const p = Array.isArray(r.products) ? r.products[0] : r.products
        if (!p) return null
        const existing = productStore.byId?.(p.id)
        if (existing) return existing
        return {
          id: p.id,
          title: p.title,
          price: Number(p.price ?? 0),
          gender: 'men',
          category: '',
          colors: [],
          sizes: [],
          description: '',
          imageUrls: resolveProductImages(p.image_urls ?? [])
        }
      })
      .filter(Boolean) as Product[]

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
    const uid = session.uid

    if (isGuest.value || !uid) {
      if (ids.value.has(id)) {
        ids.value.delete(id)
        products.value = products.value.filter((p) => p.id !== id)
      } else {
        ids.value.add(id)
        const prod = productStore.byId?.(id)
        if (prod) {
          products.value.push({ ...prod, imageUrls: resolveProductImages(prod.imageUrls ?? []) })
        }
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
      if (error) console.error('[wishlist] delete error', error)
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

      if (!error && data?.products) {
        const raw = Array.isArray(data.products) ? data.products[0] : data.products
        if (raw) {
          const existing = productStore.byId?.(raw.id)
          if (existing) products.value.push(existing)
          else {
            products.value.push({
              id: raw.id,
              title: raw.title,
              price: Number(raw.price ?? 0),
              gender: 'men',
              category: '',
              colors: [],
              sizes: [],
              description: '',
              imageUrls: resolveProductImages(raw.image_urls ?? [])
            })
          }
        }
      } else if (error) {
        console.error('[wishlist] insert error', error)
      }
    }
  }

  async function start() {
    if (ready.value) return

    if (session.uid) {
      await refresh(session.uid)
      isGuest.value = false
    } else {
      loadGuest()
      isGuest.value = true
    }

    stopAuthWatch = watch(
      () => session.uid,
      async (newUid, oldUid) => {
        if (newUid) {
          if (oldUid === null && isGuest.value) {
            await syncGuestToUser(newUid)
          }
          await refresh(newUid)
          isGuest.value = false
        } else {
          isGuest.value = true
          loadGuest()
        }
      },
      { immediate: false }
    )
  }

  return {
    ids,
    idsArray,
    products,
    isGuest,
    loading,
    ready,
    toggle,
    start,
    refresh,
    isIn: (id: string) => ids.value.has(id)
  }
})
