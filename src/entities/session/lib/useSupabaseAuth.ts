// src/entities/session/lib/useSupabaseAuth.ts
import { supabaseClient } from '@shared/api'
import { useRequest } from '@shared/lib/hooks'

export function useSupabaseAuth(context = 'Auth') {
  const { loading, errorMessage, handleRequest } = useRequest(context)

  const signUp = async (email: string, password: string, firstname: string) => {
    return await handleRequest(async () => {
      const { data, error } = await supabaseClient.auth.signUp({ email, password })
      await supabaseClient
        .from('users')
        .insert({ id: data.user?.id, firstname, email: data.user?.email })

      if (error) throw error
      return data
    })
  }

  const signIn = (email: string, password: string) =>
    handleRequest(async () => {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    })

  const signOut = () =>
    handleRequest(async () => {
      const { error } = await supabaseClient.auth.signOut()
      if (error) throw error
    })

  const resetPassword = (email: string) =>
    handleRequest(async () => {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/change-password`
      })
      if (error) throw error
    })

  const updatePassword = (newPassword: string) =>
    handleRequest(async () => {
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword })
      if (error) throw error
    })

  return { signUp, signIn, signOut, resetPassword, updatePassword, loading, errorMessage }
}
