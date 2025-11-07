import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch, type WatchStopHandle } from 'vue'

import { useSessionStore } from '@entities/session'
import type { Product } from '@shared/model'
import type { CartItem, CartItemKey } from '@shared/model'
import { supabaseClient } from '@shared/api'

const GUEST_KEY = 'guest_cart_v1'
const cidOf = (k: CartItemKey) => `${k.productId}_${k.color}_${k.size}`

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
  const loading = ref(true)
  let stopAuthWatch: WatchStopHandle | null = null

  const session = useSessionStore()
  const { uid } = storeToRefs(session)

  function cid(productId: string, color: string, size: string) {
    return cidOf({ productId, color, size })
  }

  function loadGuest() {
    try {
      const raw = localStorage.getItem(GUEST_KEY)
      items.value = raw ? JSON.parse(raw) : {}
    } catch {
      items.value = {}
    } finally {
      loading.value = false
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
    loading.value = true
    const { data, error } = await supabaseClient
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
    loading.value = false
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
    const { error } = await supabaseClient
      .from('cart_items')
      .upsert(rows, { onConflict: 'user_id,product_id,color,size' })
    if (error) throw error
    clearGuest()
    await refresh(uid)
  }

  async function add(product: Product, color: string, size: string, quantity = 1) {
    const cid = cidOf({ productId: product.id, color, size })
    const base: CartItem = {
      productId: product.id,
      color,
      size,
      quantity,
      addedAt: Date.now(),
      price: product.price,
      title: product.title,
      image: product.imageUrls?.[0] || ''
    }

    if (isGuest.value) {
      const existing = items.value[cid]
      items.value[cid] = existing ? { ...existing, quantity: existing.quantity + quantity } : base
      saveGuest()
      return
    }

    const uid = session.uid
    if (!uid) throw new Error('auth required')

    const existing = items.value[cid]
    const newQty = existing ? existing.quantity + quantity : quantity
    items.value[cid] = { ...(existing || base), quantity: newQty }

    const { error } = await supabaseClient.from('cart_items').upsert(
      {
        user_id: uid,
        product_id: product.id,
        color,
        size,
        quantity: newQty,
        added_at: new Date(existing?.addedAt ?? base.addedAt).toISOString(),
        price: product.price,
        title: product.title,
        image: product.imageUrls?.[0] || ''
      },
      { onConflict: 'user_id,product_id,color,size' }
    )
    if (error) throw error
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

    const uid = session.uid
    if (!uid) throw new Error('auth required')

    const prev = items.value[cid]
    if (!prev) return
    items.value[cid] = { ...prev, quantity }

    const { error } = await supabaseClient
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

    const uid = session.uid
    if (!uid) throw new Error('auth required')

    const snapshot = items.value[cid]
    if (!snapshot) return
    delete items.value[cid]

    const { error } = await supabaseClient
      .from('cart_items')
      .delete()
      .eq('user_id', uid)
      .eq('product_id', snapshot.productId)
      .eq('color', snapshot.color)
      .eq('size', snapshot.size)
    if (error) throw error
  }

  async function clear() {
    if (isGuest.value) {
      clearGuest()
      return
    }

    const uid = session.uid
    if (!uid) throw new Error('auth required')

    const snapshot = { ...items.value }
    items.value = {}

    const { error } = await supabaseClient.from('cart_items').delete().eq('user_id', uid)
    if (error) {
      items.value = snapshot
      throw error
    }
  }

  function start() {
    if (stopAuthWatch) return

    stopAuthWatch = watch(
      () => session.uid,
      async (uid) => {
        if (uid) {
          isGuest.value = false
          await syncGuestToUser(uid)
          await refresh(uid)
        } else {
          if (!isGuest.value) {
            clearGuest()
          }
          isGuest.value = true
          loadGuest()
        }
      },
      { immediate: true }
    )
  }

  function stop() {
    stopAuthWatch?.()
    stopAuthWatch = null
  }

  const list = computed(() => Object.values(items.value))
  const subtotal = computed(() =>
    list.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  return {
    items,
    list,
    loading,
    subtotal,
    isGuest,
    start,
    stop,
    add,
    setQty,
    removeItem,
    clear,
    cid
  }
})
