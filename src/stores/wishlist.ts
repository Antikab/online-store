import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch, type WatchStopHandle } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/auth'

type WishlistRow = { user_id: string; product_id: string; created_at: string | number | null }

const GUEST_KEY = 'guest_wishlist_v1'

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref<Set<string>>(new Set())
  const idsArray = computed(() => Array.from(ids.value))
  const loading = ref(true)
  const isGuest = ref(true)
  let stopAuthWatch: WatchStopHandle | null = null

  /* 🧱 Local guest storage */
  function loadGuest() {
    try {
      const raw = localStorage.getItem(GUEST_KEY)
      const arr: string[] = raw ? JSON.parse(raw) : []
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

  /* 🔄 Server sync */
  async function refresh(uid: string) {
    loading.value = true
    const { data, error } = await supabase.from('wishlists').select('product_id').eq('user_id', uid)
    if (error) throw error
    const rows = (data as WishlistRow[] | null) ?? []
    ids.value = new Set(rows.map((r) => r.product_id))
    loading.value = false
  }

  async function syncGuestToUser(uid: string) {
    const arr = Array.from(ids.value)
    if (!arr.length) return
    const rows = arr.map((productId) => ({
      product_id: productId,
      created_at: new Date().toISOString()
    }))
    const { error } = await supabase
      .from('wishlists')
      .upsert(rows, { onConflict: 'user_id,product_id' })
    if (error) throw error
    clearGuest()
    await refresh(uid)
  }

  /* 💖 Toggle item */
  async function toggle(id: string) {
    const auth = useAuthStore()
    const uid = auth.uid

    // 🧭 Гость
    if (isGuest.value || !uid) {
      if (ids.value.has(id)) {
        ids.value.delete(id)
      } else {
        ids.value.add(id)
      }
      saveGuest()
      return
    }

    // 👤 Авторизованный
    const had = ids.value.has(id)

    if (had) {
      ids.value.delete(id) // optimistic
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', uid)
        .eq('product_id', id)
      if (error) {
        ids.value.add(id) // rollback
        throw error
      }
    } else {
      ids.value.add(id) // optimistic
      const { error } = await supabase
        .from('wishlists')
        .upsert({ product_id: id, created_at: new Date().toISOString() })
      if (error) {
        ids.value.delete(id) // rollback
        throw error
      }
    }
  }

  /* 🚀 Init & watch auth */
  async function start() {
    if (stopAuthWatch) return

    const auth = useAuthStore()
    const { uid } = storeToRefs(auth)

    if (auth.uid) {
      await refresh(auth.uid)
      isGuest.value = false
    } else {
      loadGuest()
    }

    stopAuthWatch = watch(
      uid,
      async (newUid, oldUid) => {
        if (newUid) {
          console.log('[wishlist] Detected login or auth change →', newUid)
          if (oldUid === null && isGuest.value) {
            try {
              await syncGuestToUser(newUid)
            } catch (e: unknown) {
              console.error('Failed to merge guest wishlist', e)
            }
          }

          try {
            await refresh(newUid)
          } catch (e: unknown) {
            console.error('Wishlist refresh failed', e)
          }

          isGuest.value = false
        } else {
          console.log('[wishlist] User logged out → switching to guest mode')
          isGuest.value = true
          loadGuest()
        }
      },
      { immediate: false }
    )
  }

  return { ids, idsArray, isGuest, isIn: (id: string) => ids.value.has(id), toggle, start, loading }
})
