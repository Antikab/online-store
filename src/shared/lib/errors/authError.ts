// shared/lib/errors/authError.ts
import type { AuthError } from '@supabase/supabase-js'

/**
 * 🔒 Реальные коды ошибок Supabase Auth,
 * которые могут встречаться в сценариях:
 * - регистрация
 * - вход
 * - выход
 * - восстановление / смена пароля
 */
export type SupabaseAuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'weak_password'
  | 'user_already_exists'
  | 'email_exists'
  | 'email_address_invalid'
  | 'otp_expired'
  | 'over_email_send_rate_limit'
  | 'user_banned'
  | 'signup_disabled'
  | 'same_password'
  | 'session_expired'
  | 'unknown_error'

/**
 * 🧠 Сообщения для пользователя (UI)
 */
export const AUTH_ERROR_MESSAGES = {
  invalid_credentials: 'Неверный e-mail или пароль',
  email_not_confirmed: 'Подтвердите e-mail, чтобы войти',
  weak_password: 'Слишком простой пароль',
  user_already_exists: 'Пользователь с таким e-mail уже существует',
  email_exists: 'E-mail уже используется',
  email_address_invalid: 'Некорректный e-mail',
  otp_expired: 'Ссылка устарела. Запросите письмо ещё раз',
  over_email_send_rate_limit: 'Слишком много запросов. Подождите немного',
  user_banned: 'Пользователь заблокирован',
  signup_disabled: 'Регистрация временно отключена',
  same_password: 'Новый пароль совпадает со старым',
  session_expired: 'Сессия истекла. Войдите снова',
  unknown_error: 'Неизвестная ошибка авторизации'
} satisfies Record<SupabaseAuthErrorCode, string>

/**
 * 🧩 Возвращает безопасное сообщение для пользователя
 * и подробный лог в консоль для разработчика.
 */
export function handleAuthError(error: unknown, context = 'Auth'): string {
  if (isSupabaseAuthError(error)) {
    const code = (error.code as SupabaseAuthErrorCode) ?? 'unknown_error'

    console.group(`[${context}] Supabase AuthError`)
    console.error('Code:', code)
    console.error('Name:', error.name)
    console.error('Message:', error.message)
    console.error('Status:', error.status)
    console.groupEnd()

    return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.unknown_error
  }

  if (error instanceof Error) {
    console.error(`[${context}]`, error)
    return error.message
  }

  console.error(`[${context}] Неизвестная ошибка:`, error)
  return AUTH_ERROR_MESSAGES.unknown_error
}

/**
 * 🧱 Type Guard — проверяет, что это именно AuthError Supabase
 */
function isSupabaseAuthError(e: unknown): e is AuthError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    'message' in e &&
    'name' in e &&
    'status' in e
  )
}
