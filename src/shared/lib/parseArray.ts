export function parseArray<T = string>(val: unknown): T[] {
  if (!val) return []
  if (Array.isArray(val)) return val as T[]
  if (typeof val === 'string' && !val.trim()) return []
  try {
    const parsed = JSON.parse(val as string)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}
