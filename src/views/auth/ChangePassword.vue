<!-- views/auth/ChangePassword.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authErrorMessage as msg } from '@/utils/authError'
import { supabase } from '@/supabase'

const router = useRouter()
const auth = useAuthStore()

const stage = ref<'checking' | 'ok' | 'done' | 'error'>('checking')
const err = ref<string | null>(null)
const busy = ref(false)

const pw = ref('')
const pw2 = ref('')

function cleanUrl() {
  const url = new URL(window.location.href)
  ;['code', 'type', 'access_token', 'refresh_token', 'token_type', 'expires_in', 'lang'].forEach(
    (k) => url.searchParams.delete(k)
  )
  url.hash = ''
  history.replaceState({}, '', url.toString())
}

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  // опционально: проверка, что это recovery-ссылка
  if (!/[?#].*type=recovery/.test(location.href)) {
    stage.value = 'error'
    err.value = 'Некорректная ссылка для восстановления'
    return
  }

  // если сессия уже есть — сразу даём форму
  const {
    data: { session }
  } = await supabase.auth.getSession()
  if (session) {
    cleanUrl()
    stage.value = 'ok'
  }

  // дальше — «как в доке»: ждём событие и показываем форму
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
      cleanUrl()
      stage.value = 'ok'
    }
  })
  unsubscribe = () => subscription.unsubscribe()
})

onUnmounted(() => unsubscribe?.())

const canSubmit = () => !busy.value && pw.value.length >= 8 && pw.value === pw2.value

async function onSubmit() {
  if (!canSubmit()) return
  busy.value = true
  err.value = null
  try {
    // сессия уже есть → просто обновляем пароль
    await auth.confirmResetPassword(pw.value) // внутри: supabase.auth.updateUser({ password })
    stage.value = 'done'
    setTimeout(() => router.push('/login'), 1200)
  } catch (e) {
    err.value = msg(e)
  } finally {
    busy.value = false
  }
}

watch([pw, pw2], () => {
  if (err.value) err.value = null
})
</script>

<template>
  <section class="max-w-md mx-auto px-4 py-10">
    <h1 class="text-2xl font-semibold mb-6 text-center">Create New Password</h1>

    <p v-if="stage === 'checking'" class="text-gray-500 text-center">Checking link…</p>

    <form
      v-else-if="stage === 'ok'"
      @submit.prevent="onSubmit"
      novalidate
      class="flex flex-col gap-4"
    >
      <div>
        <label for="pw1" class="block text-sm font-medium mb-1">Password</label>
        <input
          id="pw1"
          type="password"
          v-model="pw"
          minlength="8"
          autocomplete="new-password"
          required
          aria-describedby="pw-hint"
          :aria-invalid="!!err || (!!pw && pw.length < 8)"
          :disabled="busy"
          class="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-100"
        />
        <small id="pw-hint" class="text-gray-500 text-xs">Must be at least 8 characters.</small>
      </div>

      <div>
        <label for="pw2" class="block text-sm font-medium mb-1">Confirm Password</label>
        <input
          id="pw2"
          type="password"
          v-model="pw2"
          autocomplete="new-password"
          required
          :aria-invalid="!!pw2 && pw !== pw2"
          :disabled="busy"
          class="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-100"
        />
        <p v-if="pw2 && pw !== pw2" class="text-red-500 text-sm mt-1">Passwords do not match</p>
      </div>

      <button
        type="submit"
        :disabled="!canSubmit() || busy"
        class="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {{ busy ? 'Saving…' : 'Reset Password' }}
      </button>

      <p v-if="err" class="text-red-500 text-center text-sm">{{ err }}</p>
    </form>

    <p v-else-if="stage === 'done'" class="text-green-600 text-center">
      Password updated. Redirecting…
    </p>
    <p v-else-if="stage === 'error'" class="text-red-500 text-center">{{ err }}</p>
  </section>
</template>
