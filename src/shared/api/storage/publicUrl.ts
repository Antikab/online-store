import { supabase } from '@/shared/api/supabase/client'
import { normalizeStoragePath, isExternalUrl, type SupabaseBucket } from '@/shared/config/supabase/storage'

export function createStoragePublicUrl(bucket: SupabaseBucket, path: string) {
  const normalized = normalizeStoragePath(path)
  if (!normalized) return ''
  if (isExternalUrl(normalized)) return normalized
  const { data } = supabase.storage.from(bucket).getPublicUrl(normalized)
  return data.publicUrl ?? ''
}

export function createStoragePublicUrls(bucket: SupabaseBucket, paths: string[]) {
  return paths.map((path) => createStoragePublicUrl(bucket, path)).filter(Boolean)
}
