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
