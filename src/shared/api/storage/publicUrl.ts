import { supabaseClient } from '../supabase'
import { normalizeStoragePath, isExternalUrl, type SupabaseBucket } from '../../config/supabase'

export function getPublicUrl(bucket: SupabaseBucket, path: string) {
  const normalized = normalizeStoragePath(path)
  if (!normalized) return ''
  if (isExternalUrl(normalized)) return normalized
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(normalized)
  return data.publicUrl ?? ''
}

export function getPublicUrls(bucket: SupabaseBucket, paths: string[]) {
  return paths.map((path) => getPublicUrl(bucket, path)).filter(Boolean)
}
