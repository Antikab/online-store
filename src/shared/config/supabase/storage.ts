export const SUPABASE_STORAGE_BUCKETS = {
  productImages: 'product-images'
} as const

type BucketName = (typeof SUPABASE_STORAGE_BUCKETS)[keyof typeof SUPABASE_STORAGE_BUCKETS]

export function normalizeStoragePath(path: string | null | undefined) {
  if (!path) return ''
  return path.replace(/^\/+/, '')
}

export function isExternalUrl(path: string) {
  return /^https?:\/\//i.test(path)
}

export type SupabaseBucket = BucketName
