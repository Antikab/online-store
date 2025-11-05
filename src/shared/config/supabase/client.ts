const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_PUB_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!SUPABASE_URL || !SUPABASE_PUB_KEY) {
  throw new Error('Missing Supabase environment variables')
}

export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_PUB_KEY
}
