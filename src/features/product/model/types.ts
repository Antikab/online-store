import type { Product } from '@entities/product'

export interface CartItemKey {
  productId: string
  color: string
  size: string
}

export interface CartItem extends CartItemKey {
  quantity: number
  addedAt: number
  price: number
  title: string
  image: string
}

export interface DeliveryForm {
  fullName: string
  phone: string
  city: string
  address: string
  zip?: string
}

export type CartCompatibleProduct = Pick<Product, 'id' | 'price' | 'title' | 'imageUrls'>
