// stores/orders.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase'
import { ref as dbRef, push, set, onValue } from 'firebase/database'
import { useAuthStore } from './auth'
import type { DeliveryForm } from '@/types'

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

export const useOrdersStore = defineStore('orders', () => {
  const list = ref<OrderEntity[]>([])
  const loading = ref(false)

  let unsub: (() => void) | null = null

  function unbind() {
    if (unsub) {
      unsub()
      unsub = null
    }
  }

  function init() {
    const auth = useAuthStore()

    // снять старую подписку, если была
    unbind()

    // нет пользователя — очищаем и выходим
    if (!auth.user) {
      list.value = []
      loading.value = false
      return
    }

    loading.value = true
    const r = dbRef(db, `orders/${auth.user.uid}`)

    unsub = onValue(r, (snap) => {
      const v = snap.val() || {}
      const arr: OrderEntity[] = Object.entries(v).map(([id, o]: any) => ({
        id,
        ...(o as OrderPayload)
      }))
      arr.sort((a, b) => b.createdAt - a.createdAt)
      list.value = arr
      loading.value = false
    })
  }

  async function placeOrder(order: OrderPayload) {
    const auth = useAuthStore()
    if (!auth.user) throw new Error('auth required')
    if (!order.items?.length) throw new Error('empty order')
    if (order.amounts.total < 0) throw new Error('invalid total')

    const orderRef = push(dbRef(db, `orders/${auth.user.uid}`))
    await set(orderRef, order)
    return orderRef.key as string
  }

  return { list, loading, init, unbind, placeOrder }
})
