// stores/orders.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from './auth'
import type { DeliveryForm } from '@/types'

type OrderItem = {
  productId: string
  title: string
  price: number
  color: string
  size: string
  quantity: number
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
  const createdAt = row.created_at ? Date.parse(row.created_at) : Date.now()
  return {
    id: row.id,
    delivery: row.delivery,
    items: row.items ?? [],
    amounts: row.amounts,
    coupon: row.coupon,
    createdAt
  }
}

export const useOrdersStore = defineStore('orders', () => {
  const list = ref<OrderEntity[]>([])
  const loading = ref(false)

  async function refresh(uid: string) {
    loading.value = true
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

  async function init() {
    const auth = useAuthStore()
    if (!auth.uid) {
      list.value = []
      loading.value = false
      return
    }
    await refresh(auth.uid)
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

    // добавим в список локально, чтобы сразу показывалось
    list.value.unshift({ id: data!.id as string, ...order })
    return data!.id as string
  }

  return { list, loading, init, refresh, placeOrder }
})
