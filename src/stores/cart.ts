// stores/cart.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, db } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { ref as dbRef, onValue, set, update, remove, get } from 'firebase/database'
import type { Product, CartItem, CartItemKey } from '@/types'

const GUEST_KEY = 'guest_cart_v1'
function keyOf(k: CartItemKey) {
  return `${k.productId}_${k.color}_${k.size}`
}

export const useCartStore = defineStore('cart', () => {
  // единый источник правды для UI
  const items = ref<Record<string, CartItem>>({})
  const isGuest = ref(true)
  let rtdbUnsub: (() => void) | null = null

  // ===== Helpers: guest storage =====
  function loadGuest() {
    try {
      const raw = localStorage.getItem(GUEST_KEY)
      items.value = raw ? JSON.parse(raw) : {}
    } catch {
      items.value = {}
    }
  }
  function saveGuest() {
    localStorage.setItem(GUEST_KEY, JSON.stringify(items.value))
  }
  function clearGuest() {
    localStorage.removeItem(GUEST_KEY)
    items.value = {}
  }

  // ===== Helpers: firebase (per-user cart under users/{uid}/cart) =====
  function bindUserCart(uid: string) {
    unbind()
    const r = dbRef(db, `users/${uid}/cart`)
    const unsub = onValue(r, (snap) => {
      items.value = snap.val() || {}
    })
    rtdbUnsub = () => unsub()
  }
  function unbind() {
    if (rtdbUnsub) {
      rtdbUnsub()
      rtdbUnsub = null
    }
  }

  // ===== Public computed =====
  const list = computed(() => Object.values(items.value))
  const subtotal = computed(() => list.value.reduce((s, i) => s + i.price * i.qty, 0))

  // ===== Sync guest -> user on login =====
  async function syncGuestToUser(uid: string) {
    // слить guest items в RTDB, увеличивая qty если совпал ключ
    const guest = { ...items.value } // items сейчас = guest, т.к. isGuest=true
    if (!Object.keys(guest).length) return

    // пройдёмся по всем позициям
    for (const [id, it] of Object.entries(guest)) {
      const pathRef = dbRef(db, `users/${uid}/cart/${id}`)

      // читаем текущее состояние товара в пользовательской корзине
      const snap = await get(pathRef)
      if (snap.exists()) {
        const server = snap.val() as CartItem
        // суммируем qty
        await update(pathRef, { qty: (server.qty ?? 0) + (it.qty ?? 0) })
      } else {
        // если нет — просто устанавливаем позицию
        await set(pathRef, {
          productId: it.productId,
          color: it.color,
          size: it.size,
          qty: it.qty ?? 0,
          addedAt: it.addedAt ?? Date.now(),
          price: it.price,
          title: it.title,
          image: it.image
        })
      }
    }

    clearGuest()
  }

  // ===== Public actions =====
  async function add(p: Product, color: string, size: string, qty = 1) {
    const id = keyOf({ productId: p.id, color, size })
    const base: CartItem = {
      productId: p.id,
      color,
      size,
      qty,
      addedAt: Date.now(),
      price: p.price,
      title: p.title,
      image: p.imageUrls?.[0] || ''
    }

    if (isGuest.value) {
      const existing = items.value[id]
      items.value[id] = existing ? { ...existing, qty: existing.qty + qty } : base
      saveGuest()
    } else {
      const uid = auth.currentUser!.uid
      const path = `users/${uid}/cart/${id}`
      const existing = items.value[id]
      await set(dbRef(db, path), existing ? { ...existing, qty: existing.qty + qty } : base)
    }
  }

  async function setQty(id: string, qty: number) {
    if (qty <= 0) return removeItem(id)
    if (isGuest.value) {
      const existing = items.value[id]
      if (!existing) return
      items.value[id] = { ...existing, qty }
      saveGuest()
    } else {
      const uid = auth.currentUser!.uid
      await update(dbRef(db, `users/${uid}/cart/${id}`), { qty })
    }
  }

  async function removeItem(id: string) {
    if (isGuest.value) {
      delete items.value[id]
      saveGuest()
    } else {
      const uid = auth.currentUser!.uid
      await remove(dbRef(db, `users/${uid}/cart/${id}`))
    }
  }

  async function clear() {
    if (isGuest.value) {
      clearGuest()
    } else {
      const uid = auth.currentUser!.uid
      await set(dbRef(db, `users/${uid}/cart`), null)
    }
  }

  // ===== Init / auth watcher =====
  function start() {
    // первичный режим — гость
    isGuest.value = !auth.currentUser
    if (isGuest.value) loadGuest()
    else bindUserCart(auth.currentUser!.uid)

    onAuthStateChanged(auth, async (u) => {
      if (u) {
        // переход гость -> пользователь: слить guest в RTDB, затем подписаться на RTDB
        if (isGuest.value) await syncGuestToUser(u.uid)
        isGuest.value = false
        bindUserCart(u.uid)
      } else {
        // пользователь -> гость
        unbind()
        isGuest.value = true
        loadGuest()
      }
    })
  }

  // удобный id-комбайнер для UI
  function compoundId(productId: string, color: string, size: string) {
    return keyOf({ productId, color, size })
  }

  return {
    // state
    items,
    list,
    subtotal,
    isGuest,
    // actions
    start,
    add,
    setQty,
    removeItem,
    clear,
    compoundId
  }
})
