// shared/lib/utils/parseArray.ts — shared helper
function parseArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  try {
    return JSON.parse(val)
  } catch {
    return []
  }
}
export { parseArray }
