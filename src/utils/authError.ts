// src/utils/authError.ts
import { AuthError } from '@supabase/supabase-js'

/** Единый человекочитаемый маппер ошибок Supabase Auth */
export function authErrorMessage(e: unknown): string {
  if (e instanceof AuthError) {
    const msg = (e.message ?? '').toLowerCase()
    if (msg.includes('invalid login') || msg.includes('invalid email or password'))
      return 'Неверный e-mail или пароль'
    if (msg.includes('email not confirmed')) return 'Подтвердите e-mail, чтобы войти'
    if (msg.includes('password should be at least') || msg.includes('weak'))
      return 'Слишком простой пароль'
    if (msg.includes('already registered')) return 'E-mail уже используется'
    if (msg.includes('invalid email')) return 'Некорректный e-mail'
    if (msg.includes('expired')) return 'Ссылка устарела. Запросите письмо ещё раз.'
    if (msg.includes('invalid') && msg.includes('code'))
      return 'Ссылка некорректна или уже использована.'
    return e.message || 'Ошибка авторизации'
  }
  if (typeof e === 'object' && e && 'message' in (e as any)) return String((e as any).message || '')
  if (e instanceof Error) return e.message
  return String(e)
}
