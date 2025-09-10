// stores/wishlist.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, db } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { ref as dbRef, onValue, set, remove, update } from 'firebase/database'

const GUEST_KEY = 'guest_wishlist_v1'

export const useWishlistStore = defineStore('wishlist', () => {
  // для UI используем Set id-шников
  const ids = ref<Set<string>>(new Set())
  const isGuest = ref(true)
  let rtdbUnsub: (() => void) | null = null

  // ===== guest storage =====
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

  // ===== firebase bind =====
  function bindUser(uid: string) {
    unbind()
    const r = dbRef(db, `users/${uid}/wishlist`)
    const unsub = onValue(r, (snap) => {
      const val = snap.val() || {}
      ids.value = new Set(Object.keys(val))
    })
    rtdbUnsub = () => unsub()
  }
  function unbind() {
    if (rtdbUnsub) {
      rtdbUnsub()
      rtdbUnsub = null
    }
  }

  // ===== sync guest -> user on login =====
  async function syncGuestToUser(uid: string) {
    const arr = Array.from(ids.value)
    if (!arr.length) return
    const updates: Record<string, any> = {}
    for (const id of arr) {
      updates[`users/${uid}/wishlist/${id}`] = true
    }
    // одним батчем
    await update(dbRef(db), updates)
    clearGuest()
  }

  // ===== public computed & helpers =====
  const listIds = computed(() => Array.from(ids.value))
  function isIn(id: string) {
    return ids.value.has(id)
  }

  // ===== actions =====
  async function toggle(id: string) {
    if (isGuest.value) {
      if (ids.value.has(id)) ids.value.delete(id)
      else ids.value.add(id)
      saveGuest()
    } else {
      const uid = auth.currentUser!.uid
      const node = dbRef(db, `users/${uid}/wishlist/${id}`)
      if (ids.value.has(id)) {
        await remove(node)
      } else {
        await set(node, true)
      }
      // RTDB onValue сам обновит ids
    }
  }

  function start() {
    // первичный режим
    isGuest.value = !auth.currentUser
    if (isGuest.value) loadGuest()
    else bindUser(auth.currentUser!.uid)

    onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (isGuest.value) await syncGuestToUser(u.uid)
        isGuest.value = false
        bindUser(u.uid)
      } else {
        unbind()
        isGuest.value = true
        loadGuest()
      }
    })
  }

  return { ids, listIds, isGuest, isIn, toggle, start }
})
