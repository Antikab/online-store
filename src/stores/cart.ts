// stores/cart.ts
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch, type WatchStopHandle } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Product, CartItem, CartItemKey } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

type CartRow = {
  id: string
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

function keyOf(k: CartItemKey) {
  return `${k.productId}_${k.color}_${k.size}`
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

  let channel: RealtimeChannel | null = null
  let stopAuthWatch: WatchStopHandle | null = null

  // ---------- Guest logic ----------
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

  // ---------- Supabase logic ----------
  async function refresh(uid: string) {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', uid)
      .order('added_at', { ascending: true })
    if (error) throw error
    const rows = (data as CartRow[] | null) ?? []
    const next: Record<string, CartItem> = {}
    for (const row of rows) next[row.id] = mapRow(row)
    items.value = next
  }

  async function bindUserCart(uid: string) {
    await refresh(uid)

    // Отписка от предыдущего канала
    if (channel) {
      await channel.unsubscribe()
      channel = null
    }

    channel = supabase
      .channel(`cart:${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${uid}` },
        async (payload) => {
          try {
            const event = payload.eventType
            const row = payload.new as CartRow | null

            if (event === 'DELETE') {
              const id = (payload.old as CartRow | null)?.id
              if (id) delete items.value[id]
              return
            }

            if (event === 'UPDATE' || event === 'INSERT') {
              if (row) items.value[row.id] = mapRow(row)
            }
          } catch (e) {
            console.error('Cart realtime update failed', e)
          }
        }
      )
      .subscribe((status) => {
        console.log('[cart realtime]', status)
      })
  }

  async function unbind() {
    if (channel) {
      await channel.unsubscribe()
      channel = null
    }
  }

  // ---------- Guest sync ----------
  async function syncGuestToUser(uid: string) {
    const guest = { ...items.value }
    if (!Object.keys(guest).length) return

    const rows = Object.entries(guest).map(([id, it]) => ({
      id,
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
  }

  // ---------- Core actions ----------
  async function add(p: Product, color: string, size: string, quantity = 1) {
    const id = keyOf({ productId: p.id, color, size })
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
      const existing = items.value[id]
      items.value[id] = existing ? { ...existing, quantity: existing.quantity + quantity } : base
      saveGuest()
    } else {
      const auth = useAuthStore()
      const uid = auth.uid
      if (!uid) throw new Error('auth required')

      const existing = items.value[id]
      const newQty = existing ? existing.quantity + quantity : quantity

      const payload = {
        id,
        user_id: uid,
        product_id: p.id,
        color,
        size,
        quantity: newQty,
        added_at: new Date(existing?.addedAt ?? base.addedAt).toISOString(),
        price: p.price,
        title: p.title,
        image: p.imageUrls?.[0] || ''
      }

      const { error } = await supabase
        .from('cart_items')
        .upsert(payload, { onConflict: 'user_id,product_id,color,size' })
      if (error) throw error
    }
  }

  async function setQty(id: string, quantity: number) {
    if (quantity <= 0) return removeItem(id)
    if (isGuest.value) {
      const existing = items.value[id]
      if (!existing) return
      items.value[id] = { ...existing, quantity }
      saveGuest()
    } else {
      const auth = useAuthStore()
      const uid = auth.uid
      if (!uid) throw new Error('auth required')
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', uid)
        .eq('id', id)
      if (error) throw error
    }
  }

  async function removeItem(id: string) {
    if (isGuest.value) {
      delete items.value[id]
      saveGuest()
    } else {
      const auth = useAuthStore()
      const uid = auth.uid
      if (!uid) throw new Error('auth required')
      const { error } = await supabase.from('cart_items').delete().eq('user_id', uid).eq('id', id)
      if (error) throw error
    }
  }

  async function clear() {
    if (isGuest.value) {
      clearGuest()
    } else {
      const auth = useAuthStore()
      const uid = auth.uid
      if (!uid) throw new Error('auth required')
      const { error } = await supabase.from('cart_items').delete().eq('user_id', uid)
      if (error) throw error
    }
  }

  // ---------- State ----------
  const list = computed(() => Object.values(items.value))
  const subtotal = computed(() => list.value.reduce((s, i) => s + i.price * i.quantity, 0))

  // ---------- Auth watcher ----------
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
          }
          isGuest.value = false
          await unbind()
          try {
            await bindUserCart(newUid)
          } catch (e) {
            console.error('Failed to bind user cart', e)
          }
        } else {
          await unbind()
          isGuest.value = true
          loadGuest()
        }
      },
      { immediate: true }
    )
  }

  function compoundId(productId: string, color: string, size: string) {
    return keyOf({ productId, color, size })
  }

  return {
    items,
    list,
    subtotal,
    isGuest,
    start,
    add,
    setQty,
    removeItem,
    clear,
    compoundId
  }
})
