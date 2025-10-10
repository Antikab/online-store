import { defineStore } from 'pinia'
import { ref, computed, watch, type WatchStopHandle } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'

type WishlistRow = {
  product_id: string
  products?: {
    id: string
    title: string
    price: number
    image_urls: string[]
  }
}

const GUEST_KEY = 'guest_wishlist_v1'

export const useWishlistStore = defineStore('wishlist', () => {
  // 🧩 Состояние
  const ids = ref<Set<string>>(new Set())
  const idsArray = computed(() => Array.from(ids.value))
  const products = ref<any[]>([])
  const loading = ref(true)
  const ready = ref(false) // 👈 флаг готовности стора
  const isGuest = ref(true)
  let stopAuthWatch: WatchStopHandle | null = null

  /* ================= Гостевой режим ================= */
  function loadGuest() {
    try {
      const raw = localStorage.getItem(GUEST_KEY)
      const arr: string[] = raw ? JSON.parse(raw) : []
      ids.value = new Set(arr)
    } catch {
      ids.value = new Set()
    }
    products.value = [] // гости не хранят подробные данные
    loading.value = false
    ready.value = true
  }

  function saveGuest() {
    localStorage.setItem(GUEST_KEY, JSON.stringify(Array.from(ids.value)))
  }

  function clearGuest() {
    localStorage.removeItem(GUEST_KEY)
    ids.value = new Set()
    products.value = []
  }

  /* ================= Загрузка из Supabase ================= */
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

    const rows = (data as WishlistRow[]) ?? []
    ids.value = new Set(rows.map((r) => r.product_id))
    products.value = rows
      .map((r) => r.products)
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        title: p!.title,
        price: Number(p!.price ?? 0),
        imageUrls: p!.image_urls ?? []
      }))

    loading.value = false
    ready.value = true
  }

  /* ================= Перенос гостевого списка ================= */
  async function syncGuestToUser(uid: string) {
    const guestArr = Array.from(ids.value)
    if (!guestArr.length) return

    console.log('[wishlist] merging guest wishlist →', guestArr)

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

  /* ================= Добавить / Удалить ================= */
  async function toggle(id: string) {
    const auth = useAuthStore()
    const uid = auth.uid
    const pStore = useProductsStore()

    // 🧭 Гость
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

    // 👤 Авторизованный
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
        const p = data.products
        products.value.push({
          id: p.id,
          title: p.title,
          price: Number(p.price ?? 0),
          imageUrls: p.image_urls ?? []
        })
      } else if (error) {
        console.error('[wishlist] insert error', error)
      }
    }
  }

  /* ================= Инициализация при старте ================= */
  async function start() {
    if (ready.value) return // ✅ уже инициализирован — выходим

    const auth = useAuthStore()

    if (auth.uid) {
      await refresh(auth.uid)
      isGuest.value = false
    } else {
      loadGuest()
      isGuest.value = true
    }

    // 👁️ Наблюдаем за изменением статуса авторизации
    stopAuthWatch = watch(
      () => auth.uid,
      async (newUid, oldUid) => {
        if (newUid) {
          console.log('[wishlist] login detected →', newUid)
          if (oldUid === null && isGuest.value) {
            await syncGuestToUser(newUid)
          }
          await refresh(newUid)
          isGuest.value = false
        } else {
          console.log('[wishlist] logout → guest mode')
          isGuest.value = true
          loadGuest()
        }
      },
      { immediate: false }
    )
  }

  /* ================= Экспорт API ================= */
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
