import { ref } from 'vue'

export function useRequest(
  context = 'Request',
  onError?: (error: unknown, context: string) => string
) {
  const loading = ref(false)
  const errorMessage = ref('')

  async function handleRequest<T>(fn: () => Promise<T>): Promise<T | null> {
    loading.value = true
    errorMessage.value = ''

    try {
      return await fn()
    } catch (error: unknown) {
      if (onError) {
        errorMessage.value = onError(error, context)
      } else if (error instanceof Error) {
        errorMessage.value = error.message
        console.error(`[${context}]`, error)
      } else {
        errorMessage.value = String(error)
        console.error(`[${context}]`, error)
      }
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, errorMessage, handleRequest }
}
