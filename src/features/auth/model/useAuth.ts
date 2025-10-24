import { supabase } from '@/shared/api/supabaseClient'
import { useRequest } from '@/shared/lib/composables/useRequest'

export function useAuth(context = 'Auth') {
  const { loading, errorMessage, handleRequest } = useRequest(context)

  const signUp = (email: string, password: string) =>
    handleRequest(async () => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return data
    })

  const signIn = (email: string, password: string) =>
    handleRequest(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    })

  const signOut = () =>
    handleRequest(async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    })

  const resetPassword = (email: string) =>
    handleRequest(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/change-password`
      })
      if (error) throw error
    })

  const updatePassword = (newPassword: string) =>
    handleRequest(async () => {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    })

  return { signUp, signIn, signOut, resetPassword, updatePassword, loading, errorMessage }
}
