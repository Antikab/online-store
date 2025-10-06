// types.ts
export type Gender = 'men' | 'women'

export interface Product {
  id: string
  title: string
  gender: Gender
  category: string
  price: number
  colors: string[]
  sizes: string[]
  imageUrls: string[]
  description: string
  extra?: Record<string, string>
  videoUrl?: string
  createdAt: number
}

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
