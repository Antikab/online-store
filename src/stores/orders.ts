// stores/orders.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from './auth'
import type { DeliveryForm } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

type OrderItem = {
  productId: string
  title: string
  price: number
  color: string
  size: string
  qty: number
  image?: string
}

type OrderAmounts = { subtotal: number; discount: number; total: number }

export type OrderPayload = {
  delivery: DeliveryForm
  items: OrderItem[]
  amounts: OrderAmounts
  coupon: string | null
  createdAt: number
}

type OrderEntity = OrderPayload & { id: string }

type OrderRow = {
  id: string
  user_id: string
  delivery: DeliveryForm
  items: OrderItem[]
  amounts: OrderAmounts
  coupon: string | null
  created_at: string | null
}

function mapRow(row: OrderRow): OrderEntity {
  const createdAt = row.created_at ? Date.parse(row.created_at) : NaN
  return {
    id: row.id,
    delivery: row.delivery,
    items: row.items ?? [],
    amounts: row.amounts,
    coupon: row.coupon,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now()
  }
}

export const useOrdersStore = defineStore('orders', () => {
  const list = ref<OrderEntity[]>([])
  const loading = ref(false)

  let channel: RealtimeChannel | null = null

  async function refresh(uid: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = (data as OrderRow[] | null) ?? []
    list.value = rows.map(mapRow)
    loading.value = false
  }

  async function bind(uid: string) {
    loading.value = true
    await refresh(uid)
    channel = supabase
      .channel(`orders:${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${uid}` },
        async () => {
          try {
            await refresh(uid)
          } catch (e) {
            console.error('Failed to refresh orders', e)
          }
        }
      )
      .subscribe()
  }

  async function unbind() {
    if (channel) {
      await channel.unsubscribe()
      channel = null
    }
  }

  async function init() {
    const auth = useAuthStore()
    await unbind()
    if (!auth.uid) {
      list.value = []
      loading.value = false
      return
    }
    await bind(auth.uid)
  }

  async function placeOrder(order: OrderPayload) {
    const auth = useAuthStore()
    if (!auth.uid) throw new Error('auth required')
    if (!order.items?.length) throw new Error('empty order')
    if (order.amounts.total < 0) throw new Error('invalid total')

    const row = {
      user_id: auth.uid,
      delivery: order.delivery,
      items: order.items,
      amounts: order.amounts,
      coupon: order.coupon,
      created_at: new Date(order.createdAt).toISOString()
    }

    const { data, error } = await supabase.from('orders').insert(row).select('id').single()
    if (error) throw error
    return data?.id as string
  }

  return { list, loading, init, placeOrder }
})
