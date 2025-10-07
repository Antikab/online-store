// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import { type User } from '@supabase/supabase-js'
import { authErrorMessage } from '@/utils/authError'

type PublicUser = { uid: string; email: string | null }

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
      const {
        data: { session }
      } = await supabase.auth.getSession()
      setFromSupabase(session?.user ?? null)
    } catch (e) {
      console.error('Failed to restore session', e)
    } finally {
      ready.value = true
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setFromSupabase(session?.user ?? null)
      ready.value = true
    })

    unsub = () => {
      subscription.unsubscribe()
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
      if (signedUser) setFromSupabase(signedUser)
    } catch (e) {
      error.value = authErrorMessage(e)
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
      error.value = authErrorMessage(e)
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
      error.value = authErrorMessage(e)
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
    } catch (e) {
      error.value = authErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function confirmResetPassword(newPassword: string) {
    loading.value = true
    error.value = ''
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
    } catch (e) {
      error.value = authErrorMessage(e)
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
    confirmResetPassword,
    logout
  }
})
