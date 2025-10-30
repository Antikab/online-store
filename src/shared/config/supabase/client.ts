const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim()
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

export const SUPABASE_CONFIG = Object.freeze({
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
})

export type SupabaseConfig = typeof SUPABASE_CONFIG
