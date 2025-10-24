<!-- src/pages/user/ui/AuthChangePasswordPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@shared/api/supabase'
import { handleAuthError } from '@features/user'

const router = useRouter()
const stage = ref<'checking' | 'ok' | 'done' | 'error'>('checking')
const err = ref<string | null>(null)
const busy = ref(false)

const pw = ref('')
const pw2 = ref('')

const cleanUrl = () => {
  const url = new URL(window.location.href)
  url.hash = ''
  history.replaceState({}, '', url.toString())
}

onMounted(async () => {
  const url = new URL(window.location.href)
  const params = new URLSearchParams(url.hash.substring(1))
  const errorDescription = params.get('error_description')
  if (errorDescription) {
    stage.value = 'error'
    err.value = decodeURIComponent(errorDescription)
    return
  }

  if (!/[?#].*type=recovery/.test(location.href)) {
    stage.value = 'error'
    err.value = 'Invalid recovery link'
    return
  }

  const { data } = await supabase.auth.getSession()
  if (data.session) {
    cleanUrl()
    stage.value = 'ok'
    return
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
      cleanUrl()
      stage.value = 'ok'
    }
  })
})

const canSubmit = () => !busy.value && pw.value.length >= 6 && pw.value === pw2.value

const onSubmit = async () => {
  if (!canSubmit()) return
  busy.value = true
  err.value = null
  try {
    const { error } = await supabase.auth.updateUser({ password: pw.value })
    if (error) throw error

    await supabase.auth.signOut()
    stage.value = 'done'
    setTimeout(() => router.push('/login'), 1200)
  } catch (e) {
    err.value = handleAuthError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="max-w-sm mx-auto mt-20 p-6 bg-white rounded-xl shadow-sm ring-1 ring-gray-200 space-y-6">
    <h1 class="text-2xl font-semibold text-center text-gray-800">Create new password</h1>

    <p v-if="stage === 'checking'" class="text-gray-500 text-center">Checking recovery link…</p>

    <form v-else-if="stage === 'ok'" @submit.prevent="onSubmit" class="flex flex-col gap-4">
      <input
        v-model="pw"
        type="password"
        minlength="6"
        required
        placeholder="New password"
        class="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <input
        v-model="pw2"
        type="password"
        minlength="6"
        required
        placeholder="Confirm password"
        class="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />

      <button
        type="submit"
        :disabled="!canSubmit() || busy"
        class="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {{ busy ? 'Saving…' : 'Update password' }}
      </button>

      <p v-if="err" class="text-sm text-red-500 text-center">{{ err }}</p>
    </form>

    <p v-else-if="stage === 'done'" class="text-green-600 text-center text-sm">
      Password updated. Redirecting…
    </p>

    <p v-else-if="stage === 'error'" class="text-red-500 text-center text-sm">
      {{ err }}
      <br />
      <RouterLink to="/reset-password" class="text-blue-600 hover:underline">Send new link</RouterLink>
    </p>
  </section>
</template>
