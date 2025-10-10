// src/utils — чтобы не повторять
function parseArray(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  try {
    return JSON.parse(val)
  } catch {
    return []
  }
}
export { parseArray }
