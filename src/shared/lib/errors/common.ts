/**
 * Унифицированная обработка неизвестных ошибок для UI.
 */
export function getErrorMessage(error: unknown, fallback = 'Неизвестная ошибка'): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message || fallback
  try {
    return JSON.stringify(error)
  } catch {
    return fallback
  }
}
