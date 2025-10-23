// shared/lib/notifier/useNotifier.ts
import { toast } from 'vue-sonner'

export function useNotifier(context = 'App') {
  const log = (type: string, msg: string) => {
    console[type === 'error' ? 'error' : 'log'](`[${context}] ${msg}`)
  }

  const success = (msg: string) => {
    toast.success(msg, { duration: 2000 })
    log('log', msg)
  }

  const info = (msg: string) => {
    toast(msg, { duration: 2500 })
    log('log', msg)
  }

  const error = (msg: string) => {
    toast.error(msg, { duration: 3000 })
    log('error', msg)
  }

  return { success, info, error }
}
