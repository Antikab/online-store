// stores/wishlist.ts
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch, type WatchStopHandle } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/auth'

type WishlistRow = { user_id: string; product_id: string; created_at: string | number | null }

const GUEST_KEY = 'guest_wishlist_v1'

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref<Set<string>>(new Set())
  const isGuest = ref(true)
  let stopAuthWatch: WatchStopHandle | null = null

  function loadGuest() {
    try {
      const raw = localStorage.getItem(GUEST_KEY)
      const arr: string[] = raw ? JSON.parse(raw) : []
      ids.value = new Set(arr)
    } catch {
      ids.value = new Set()
    }
  }
  function saveGuest() {
    localStorage.setItem(GUEST_KEY, JSON.stringify(Array.from(ids.value)))
  }
  function clearGuest() {
    localStorage.removeItem(GUEST_KEY)
    ids.value = new Set()
  }

  async function refresh(uid: string) {
    const { data, error } = await supabase.from('wishlists').select('product_id').eq('user_id', uid)
    if (error) throw error
    const rows = (data as WishlistRow[] | null) ?? []
    ids.value = new Set(rows.map((r) => r.product_id))
  }

  async function syncGuestToUser(uid: string) {
    const arr = Array.from(ids.value)
    if (!arr.length) return
    const rows = arr.map((productId) => ({
      user_id: uid,
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

  const listIds = computed(() => Array.from(ids.value))
  function isIn(id: string) {
    return ids.value.has(id)
  }

  async function toggle(id: string) {
    if (isGuest.value) {
      if (ids.value.has(id)) ids.value.delete(id)
      else ids.value.add(id)
      saveGuest()
      return
    }

    const auth = useAuthStore()
    const uid = auth.uid
    if (!uid) throw new Error('auth required')

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
        .upsert(
          { user_id: uid, product_id: id, created_at: new Date().toISOString() },
          { onConflict: 'user_id,product_id' }
        )
      if (error) {
        ids.value.delete(id) // rollback
        throw error
      }
    }
  }

  function start() {
    if (stopAuthWatch) return
    const auth = useAuthStore()
    const { uid } = storeToRefs(auth)

    stopAuthWatch = watch(
      uid,
      async (newUid, oldUid) => {
        if (newUid) {
          if (!oldUid && isGuest.value) {
            try {
              await syncGuestToUser(newUid)
            } catch (e) {
              console.error('Failed to merge guest wishlist', e)
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
      { immediate: true }
    )
  }

  return { ids, listIds, isGuest, isIn, toggle, start }
})
