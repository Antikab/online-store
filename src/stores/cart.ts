// stores/cart.ts
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch, type WatchStopHandle } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Product, CartItem, CartItemKey } from '@/types'

type CartRow = {
  user_id: string
  product_id: string
  color: string
  size: string
  quantity: number
  added_at: string | number | null
  price: number
  title: string
  image: string | null
}

const GUEST_KEY = 'guest_cart_v1'

const cidOf = (k: CartItemKey) => `${k.productId}_${k.color}_${k.size}`

function mapRow(row: CartRow): CartItem {
  const addedAt =
    typeof row.added_at === 'string' ? Date.parse(row.added_at) : Number(row.added_at ?? Date.now())
  return {
    productId: row.product_id,
    color: row.color,
    size: row.size,
    quantity: Number(row.quantity ?? 0),
    addedAt: Number.isFinite(addedAt) ? addedAt : Date.now(),
    price: Number(row.price ?? 0),
    title: row.title,
    image: row.image ?? ''
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<Record<string, CartItem>>({})
  const isGuest = ref(true)
  let stopAuthWatch: WatchStopHandle | null = null

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

  async function refresh(uid: string) {
    const { data, error } = await supabase
      .from('cart_items')
      .select('user_id,product_id,color,size,quantity,added_at,price,title,image')
      .eq('user_id', uid)
      .order('added_at', { ascending: true })
    if (error) throw error
    const rows = (data as CartRow[] | null) ?? []
    const next: Record<string, CartItem> = {}
    for (const row of rows) {
      const cid = cidOf({ productId: row.product_id, color: row.color, size: row.size })
      next[cid] = mapRow(row)
    }
    items.value = next
  }

  async function syncGuestToUser(uid: string) {
    const guest = { ...items.value }
    if (!Object.keys(guest).length) return

    const rows = Object.values(guest).map((it) => ({
      user_id: uid,
      product_id: it.productId,
      color: it.color,
      size: it.size,
      quantity: it.quantity,
      added_at: new Date(it.addedAt).toISOString(),
      price: it.price,
      title: it.title,
      image: it.image
    }))
    const { error } = await supabase
      .from('cart_items')
      .upsert(rows, { onConflict: 'user_id,product_id,color,size' })
    if (error) throw error

    clearGuest()
    await refresh(uid)
  }

  async function add(p: Product, color: string, size: string, quantity = 1) {
    const cid = cidOf({ productId: p.id, color, size })
    const base: CartItem = {
      productId: p.id,
      color,
      size,
      quantity,
      addedAt: Date.now(),
      price: p.price,
      title: p.title,
      image: p.imageUrls?.[0] || ''
    }

    if (isGuest.value) {
      const existing = items.value[cid]
      items.value[cid] = existing ? { ...existing, quantity: existing.quantity + quantity } : base
      saveGuest()
      return
    }

    const auth = useAuthStore()
    const uid = auth.uid
    if (!uid) throw new Error('auth required')

    const existing = items.value[cid]
    const newQty = existing ? existing.quantity + quantity : quantity
    items.value[cid] = { ...(existing || base), quantity: newQty }

    const { error } = await supabase.from('cart_items').upsert(
      {
        user_id: uid,
        product_id: p.id,
        color,
        size,
        quantity: newQty,
        added_at: new Date(existing?.addedAt ?? base.addedAt).toISOString(),
        price: p.price,
        title: p.title,
        image: p.imageUrls?.[0] || ''
      },
      { onConflict: 'user_id,product_id,color,size' }
    )

    if (error) {
      if (existing) items.value[cid] = existing
      else delete items.value[cid]
      throw error
    }
  }

  async function setQty(cid: string, quantity: number) {
    if (quantity <= 0) return removeItem(cid)
    if (isGuest.value) {
      const existing = items.value[cid]
      if (!existing) return
      items.value[cid] = { ...existing, quantity }
      saveGuest()
      return
    }

    const auth = useAuthStore()
    const uid = auth.uid
    if (!uid) throw new Error('auth required')

    const prev = items.value[cid]
    if (!prev) return
    items.value[cid] = { ...prev, quantity }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', uid)
      .eq('product_id', prev.productId)
      .eq('color', prev.color)
      .eq('size', prev.size)

    if (error) {
      items.value[cid] = prev
      throw error
    }
  }

  async function removeItem(cid: string) {
    if (isGuest.value) {
      delete items.value[cid]
      saveGuest()
      return
    }

    const auth = useAuthStore()
    const uid = auth.uid
    if (!uid) throw new Error('auth required')

    const snapshot = items.value[cid]
    if (!snapshot) return
    delete items.value[cid]

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', uid)
      .eq('product_id', snapshot.productId)
      .eq('color', snapshot.color)
      .eq('size', snapshot.size)

    if (error) {
      items.value[cid] = snapshot
      throw error
    }
  }

  async function clear() {
    if (isGuest.value) {
      clearGuest()
      return
    }
    const auth = useAuthStore()
    const uid = auth.uid
    if (!uid) throw new Error('auth required')

    const snapshot = { ...items.value }
    items.value = {}
    const { error } = await supabase.from('cart_items').delete().eq('user_id', uid)
    if (error) {
      items.value = snapshot
      throw error
    }
  }

  const list = computed(() => Object.values(items.value))
  const subtotal = computed(() => list.value.reduce((s, i) => s + i.price * i.quantity, 0))

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
              console.error('Failed to merge guest cart', e)
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

  const cid = (p: string, c: string, s: string) => cidOf({ productId: p, color: c, size: s })

  return { items, list, subtotal, isGuest, start, add, setQty, removeItem, clear, cid }
})
