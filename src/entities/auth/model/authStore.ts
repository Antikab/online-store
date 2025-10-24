import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'

import { supabase } from '@/shared/api/supabaseClient'
import { useAuth } from '@/features/auth/model/useAuth'

type PublicUser = { uid: string; email: string | null }

export const useAuthStore = defineStore('auth', () => {
  const { signIn, signUp, signOut, resetPassword, updatePassword, loading, errorMessage } =
    useAuth('Auth')

  const user = ref<PublicUser | null>(null)
  const ready = ref(false)

  const isAuthed = computed(() => !!user.value)
  const uid = computed(() => user.value?.uid ?? null)
  const email = computed(() => user.value?.email ?? null)

  function setFromSupabase(u: User | null) {
    user.value = u ? { uid: u.id, email: u.email ?? null } : null
  }

  async function initAuthWatcher() {
    const { data, error } = await supabase.auth.getSession()
    if (error) console.error('[Auth] getSession error:', error)
    if (data.session) setFromSupabase(data.session.user)

    supabase.auth.onAuthStateChange((_event, session) => {
      setFromSupabase(session?.user ?? null)
      ready.value = true
    })

    ready.value = true
  }

  async function login(email: string, password: string) {
    const data = await signIn(email, password)
    if (data?.user) setFromSupabase(data.user)
  }

  async function register(email: string, password: string) {
    const data = await signUp(email, password)
    if (data?.user) setFromSupabase(data.user)
  }

  async function logout() {
    await signOut()
    user.value = null
  }

  async function requestPasswordReset(email: string) {
    await resetPassword(email)
  }

  async function changePassword(newPassword: string) {
    await updatePassword(newPassword)
  }

  async function changePasswordWithReauth(currentPassword: string, newPassword: string) {
    const currentEmail = email.value
    if (!currentEmail) throw new Error('User email is not available')

    const result = await signIn(currentEmail, currentPassword)
    if (!result?.user) {
      throw new Error(errorMessage.value || 'Не удалось подтвердить текущий пароль')
    }

    await changePassword(newPassword)
  }

  return {
    user,
    ready,
    isAuthed,
    uid,
    email,
    loading,
    errorMessage,
    initAuthWatcher,
    login,
    register,
    logout,
    requestPasswordReset,
    changePassword,
    changePasswordWithReauth
  }
})
