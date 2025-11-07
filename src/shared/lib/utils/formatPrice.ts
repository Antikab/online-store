const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
})

export function formatPrice(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(amount)) return formatter.format(0)
  return formatter.format(amount)
}
