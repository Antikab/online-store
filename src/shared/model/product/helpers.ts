import type { Product } from './types'

export function createEmptyProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '',
    title: '',
    gender: 'men',
    category: '',
    price: 0,
    colors: [],
    sizes: [],
    imageUrls: [],
    description: '',
    extra: undefined,
    videoUrl: undefined,
    createdAt: Date.now(),
    ...overrides
  }
}
