<!-- views/auth/ChangePassword.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { authErrorMessage as msg } from '@/utils/authError'

const router = useRouter()
const stage = ref<'checking' | 'ok' | 'done' | 'error'>('checking')
const err = ref<string | null>(null)
const busy = ref(false)

const pw = ref('')
const pw2 = ref('')

/** Очистка URL от временных токенов */
const cleanUrl = () => {
  const url = new URL(window.location.href)
  url.hash = ''
  history.replaceState({}, '', url.toString())
}

onMounted(async () => {
  const url = new URL(window.location.href)
  const params = new URLSearchParams(url.hash.substring(1))
  const error = params.get('error_description')
  if (error) {
    stage.value = 'error'
    err.value = decodeURIComponent(error)
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

/** Обновление пароля и выход из сессии */
const onSubmit = async () => {
  if (!canSubmit()) return
  busy.value = true
  err.value = null
  try {
    const { error } = await supabase.auth.updateUser({ password: pw.value })
    if (error) throw error

    await supabase.auth.signOut({ scope: 'global' })
    stage.value = 'done'
    setTimeout(() => router.push('/login'), 1000)
  } catch (e) {
    err.value = msg(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="max-w-sm mx-auto mt-20 p-6 bg-white rounded-xl shadow-sm ring-1 ring-gray-200">
    <h1 class="text-2xl font-semibold mb-6 text-center">Create New Password</h1>

    <p v-if="stage === 'checking'" class="text-gray-500 text-center">Checking link…</p>

    <form v-else-if="stage === 'ok'" @submit.prevent="onSubmit" class="flex flex-col gap-4">
      <input
        v-model="pw"
        type="password"
        minlength="6"
        required
        placeholder="New password"
        class="border rounded-lg px-3 py-2 focus:ring focus:ring-blue-100"
      />
      <input
        v-model="pw2"
        type="password"
        minlength="6"
        required
        placeholder="Confirm password"
        class="border rounded-lg px-3 py-2 focus:ring focus:ring-blue-100"
      />

      <button
        type="submit"
        :disabled="!canSubmit() || busy"
        class="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {{ busy ? 'Saving…' : 'Update Password' }}
      </button>

      <p v-if="err" class="text-red-500 text-center text-sm">{{ err }}</p>
    </form>

    <p v-else-if="stage === 'done'" class="text-green-600 text-center">
      Password updated. Redirecting…
    </p>

    <p v-else-if="stage === 'error'" class="text-red-500 text-center">
      {{ err }}
      <br />
      <router-link to="/reset-password" class="underline text-blue-600">
        Send new link
      </router-link>
    </p>
  </section>
</template>
