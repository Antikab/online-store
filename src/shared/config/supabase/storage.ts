export const SUPABASE_STORAGE_BUCKETS = {
  productImages: 'product-images'
}

export function normalizeStoragePath(path: string | null | undefined) {
  if (!path) return ''
  return path.replace(/^\/+/, '')
}

export function isExternalUrl(path: string) {
  return /^https?:\/\//i.test(path)
}
