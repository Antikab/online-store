// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import { AuthError, type User } from '@supabase/supabase-js'

type PublicUser = { uid: string; email: string | null }

type MaybeWithMessage = { message?: string }

function toErrorMessage(e: unknown): string {
  if (e instanceof AuthError) {
    const msg = e.message?.toLowerCase() ?? ''
    if (msg.includes('invalid login') || msg.includes('invalid email or password'))
      return 'Неверный e-mail или пароль'
    if (msg.includes('email not confirmed')) return 'Подтвердите e-mail, чтобы войти'
    if (msg.includes('password should be at least')) return 'Слишком простой пароль'
    if (msg.includes('already registered')) return 'E-mail уже используется'
    if (msg.includes('invalid email')) return 'Некорректный e-mail'
    return e.message || 'Ошибка авторизации'
  }
  if (typeof e === 'object' && e && 'message' in e)
    return String((e as MaybeWithMessage).message || '')
  if (e instanceof Error) return e.message
  return String(e)
}

const RESET_REDIRECT_URL = import.meta.env.DEV
  ? 'http://localhost:5173/change-password'
  : `${window.location.origin}/change-password`

export const useAuthStore = defineStore('auth', () => {
  const user = ref<PublicUser | null>(null)
  const loading = ref(false)
  const error = ref('')
  const ready = ref(false)

  let unsub: (() => void) | null = null

  const isAuthed = computed(() => !!user.value)
  const uid = computed(() => user.value?.uid ?? null)
  const email = computed(() => user.value?.email ?? null)

  function setFromSupabase(u: User | null) {
    user.value = u ? { uid: u.id, email: u.email ?? null } : null
  }

  async function initAuthWatcher() {
    if (unsub) return

    try {
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      setFromSupabase(data.session?.user ?? null)
    } catch (e) {
      console.error('Failed to restore session', e)
    } finally {
      ready.value = true
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setFromSupabase(session?.user ?? null)
      ready.value = true
    })

    unsub = () => {
      listener.subscription.unsubscribe()
      unsub = null
    }
  }

  function disposeAuthWatcher() {
    if (unsub) {
      unsub()
      unsub = null
    }
  }

  async function register(rawEmail: string, password: string) {
    loading.value = true
    error.value = ''
    try {
      const normEmail = rawEmail.trim().toLowerCase()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normEmail,
        password
      })
      if (signUpError) throw signUpError
      const signedUser = data.user
      if (signedUser) {
        setFromSupabase(signedUser)
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: signedUser.id,
            email: normEmail,
            created_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        )
        if (profileError) throw profileError
      }
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function login(rawEmail: string, password: string) {
    loading.value = true
    error.value = ''
    try {
      const normEmail = rawEmail.trim().toLowerCase()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normEmail,
        password
      })
      if (signInError) throw signInError
      setFromSupabase(data.user ?? null)
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(rawEmail: string) {
    loading.value = true
    error.value = ''
    try {
      const normEmail = rawEmail.trim().toLowerCase()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normEmail, {
        redirectTo: RESET_REDIRECT_URL
      })
      if (resetError) throw resetError
    } catch (e) {
      error.value = toErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  async function changePasswordWithReauth(currentPassword: string, newPassword: string) {
    if (!email.value) throw new Error('Not authenticated')

    loading.value = true
    error.value = ''
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: currentPassword
      })
      if (reauthError) throw reauthError

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      if (uid.value) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: uid.value,
            password_updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        )
        if (profileError) throw profileError
      }
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function verifyResetCode(code: string) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) throw exchangeError
      setFromSupabase(data.user ?? null)
      return data.user?.email ?? null
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  async function confirmResetPassword(_code: string, newPassword: string) {
    loading.value = true
    error.value = ''
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      if (uid.value) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: uid.value,
            password_updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        )
        if (profileError) throw profileError
      }
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout(opts?: { clearGuest?: boolean }) {
    try {
      await supabase.auth.signOut()
      setFromSupabase(null)
      if (opts?.clearGuest) {
        localStorage.removeItem('guest_cart_v1')
        localStorage.removeItem('guest_wishlist_v1')
        localStorage.removeItem('guest_coupon_v1')
      }
    } catch (e) {
      console.error('Logout error', e)
    }
  }

  return {
    user,
    loading,
    error,
    ready,
    isAuthed,
    uid,
    email,
    initAuthWatcher,
    disposeAuthWatcher,
    register,
    login,
    resetPassword,
    changePasswordWithReauth,
    verifyResetCode,
    confirmResetPassword,
    logout
  }
})
