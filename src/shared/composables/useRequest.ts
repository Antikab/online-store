import { ref } from 'vue'

import { handleAuthError } from '@/shared/lib/errors/authError'

/**
 * Универсальный composable для обёртки любых асинхронных запросов.
 * Обрабатывает loading, ошибки Supabase и возвращает сообщение для UI.
 */
export function useRequest(context = 'Request') {
  const loading = ref(false)
  const errorMessage = ref('')

  async function handleRequest<T>(fn: () => Promise<T>): Promise<T | null> {
    loading.value = true
    errorMessage.value = ''

    try {
      return await fn()
    } catch (error: unknown) {
      // 🔒 Централизованная обработка ошибок (логи делает handleAuthError)
      errorMessage.value = handleAuthError(error, context)
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, errorMessage, handleRequest }
}
