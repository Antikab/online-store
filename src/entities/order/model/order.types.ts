export interface DeliveryForm {
  fullName: string
  phone: string
  city: string
  address: string
  zip?: string
}

export interface OrderItem {
  productId: string
  title: string
  price: number
  color: string
  size: string
  quantity: number
  image?: string
}

export interface OrderAmounts {
  subtotal: number
  discount: number
  total: number
}

export interface OrderPayload {
  delivery: DeliveryForm
  items: OrderItem[]
  amounts: OrderAmounts
  coupon: string | null
  createdAt: number
}

export interface OrderEntity extends OrderPayload {
  id: string
}
