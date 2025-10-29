import { defineStore, storeToRefs } from 'pinia'
import { ref, watch } from 'vue'

import { supabase } from '@/shared/api/supabase/client'
import type { DeliveryForm } from '@/shared/model/forms/delivery'
import { useSessionStore } from '@/entities/session'

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
  const loading = ref(true)
  const session = useSessionStore()
  const { uid } = storeToRefs(session)

  async function refresh(userId: string) {
    loading.value = true
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = (data as OrderRow[] | null) ?? []
    list.value = rows.map(mapRow)
    loading.value = false
  }

  async function init() {
    if (!session.uid) {
      list.value = []
      loading.value = false
      return
    }
    await refresh(session.uid)
  }

  watch(
    uid,
    async (newUid) => {
      if (newUid) {
        await refresh(newUid)
      } else {
        list.value = []
      }
    },
    { immediate: true }
  )

  async function placeOrder(order: OrderPayload) {
    if (!session.uid) throw new Error('auth required')
    if (!order.items?.length) throw new Error('empty order')

    const row = {
      user_id: session.uid,
      delivery: order.delivery,
      items: order.items,
      amounts: order.amounts,
      coupon: order.coupon,
      created_at: new Date(order.createdAt).toISOString()
    }

    const { data, error } = await supabase.from('orders').insert(row).select('id').single()
    if (error) throw error
    list.value.unshift({ id: data!.id as string, ...order })
    return data!.id as string
  }

  return { list, loading, init, refresh, placeOrder }
})
