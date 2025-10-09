// stores/wishlist.ts
import { defineStore, storeToRefs } from 'pinia'
import { ref, computed, watch, type WatchStopHandle } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/auth'

type WishlistRow = {
  id: string
  user_id: string
  product_id: string
  created_at: string
  added_at: string
  image: string | null
  price: number | null
  color: string | null
  size: string | null
}

const GUEST_KEY = 'guest_wishlist_v1'

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref<Set<string>>(new Set())
  const idsArray = computed(() => Array.from(ids.value))
  const loading = ref(true)
  const isGuest = ref(true)
  let stopAuthWatch: WatchStopHandle | null = null

  /* ================= 🧱 Local guest storage ================= */
  function loadGuest() {
    try {
      const raw = localStorage.getItem(GUEST_KEY)
      const arr: string[] = raw ? JSON.parse(raw) : []
      console.log('[wishlist] loadGuest →', arr)
      ids.value = new Set(arr)
    } catch {
      ids.value = new Set()
    } finally {
      loading.value = false
    }
  }

  function saveGuest() {
    localStorage.setItem(GUEST_KEY, JSON.stringify(Array.from(ids.value)))
  }

  function clearGuest() {
    localStorage.removeItem(GUEST_KEY)
    ids.value = new Set()
  }

  /* ================= 🔄 Server sync ================= */
  async function refresh(uid: string) {
    loading.value = true
    const { data, error } = await supabase.from('wishlists').select('product_id').eq('user_id', uid)

    if (error) {
      console.error('[wishlist] refresh error:', error)
      loading.value = false
      return
    }

    const rows = (data as WishlistRow[]) ?? []
    ids.value = new Set(rows.map((r) => r.product_id))
    loading.value = false
  }

  // 🔁 Перенос из localStorage → Supabase при входе
  async function syncGuestToUser(uid: string) {
    const guestArr = Array.from(ids.value)
    if (!guestArr.length) return

    console.log('[wishlist] merging guest wishlist →', guestArr)

    // 1️⃣ Получаем то, что уже есть у пользователя в базе
    const { data: existing, error: fetchErr } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', uid)

    if (fetchErr) {
      console.error('[wishlist] failed to load existing wishlist:', fetchErr)
      return
    }

    const existingIds = new Set((existing ?? []).map((r) => r.product_id))

    // 2️⃣ Находим только новые ID (которых нет в базе)
    const newIds = guestArr.filter((id) => !existingIds.has(id))
    if (!newIds.length) {
      console.log('[wishlist] all guest items already exist → skip insert')
      clearGuest()
      await refresh(uid)
      return
    }

    // 3️⃣ Подготавливаем строки для вставки
    const rows = newIds.map((productId) => ({
      user_id: uid,
      product_id: productId,
      created_at: new Date().toISOString(),
      added_at: new Date().toISOString()
    }))

    // 4️⃣ Вставляем только новые записи
    const { error } = await supabase.from('wishlists').insert(rows)

    if (error) {
      // иногда Supabase может вернуть 42501 (RLS), просто логируем
      if (error.code === '42501') {
        console.warn('[wishlist] insert blocked by RLS (ignored):', error.message)
      } else {
        console.error('[wishlist] syncGuestToUser error:', error)
      }
    } else {
      console.log(`[wishlist] merged ${newIds.length} new items into database`)
    }

    // 5️⃣ Очищаем localStorage и обновляем store
    clearGuest()
    await refresh(uid)
  }

  /* ================= 💖 Toggle item ================= */
  async function toggle(id: string) {
    const auth = useAuthStore()
    const uid = auth.uid

    // 🧭 Гость
    if (isGuest.value || !uid) {
      if (ids.value.has(id)) ids.value.delete(id)
      else ids.value.add(id)
      saveGuest()
      return
    }

    // 👤 Авторизованный
    const had = ids.value.has(id)

    if (had) {
      ids.value.delete(id)
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', uid)
        .eq('product_id', id)
      if (error) {
        ids.value.add(id) // rollback
        console.error('[wishlist] delete error', error)
      }
    } else {
      ids.value.add(id)
      const { error } = await supabase.from('wishlists').upsert({
        user_id: uid,
        product_id: id,
        created_at: new Date().toISOString(),
        added_at: new Date().toISOString()
      })
      if (error) {
        ids.value.delete(id)
        console.error('[wishlist] insert error', error)
      }
    }
  }

  /* ================= 🚀 Init & Watch ================= */
  async function start() {
    if (stopAuthWatch) return

    const auth = useAuthStore()
    const { uid } = storeToRefs(auth)

    if (auth.uid) {
      await refresh(auth.uid)
      isGuest.value = false
    } else {
      loadGuest()
      isGuest.value = true
    }

    stopAuthWatch = watch(
      uid,
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

  return {
    ids,
    idsArray,
    isGuest,
    loading,
    toggle,
    start,
    isIn: (id: string) => ids.value.has(id)
  }
})
