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
