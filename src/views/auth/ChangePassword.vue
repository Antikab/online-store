<!-- views/auth/ChangePassword.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { AuthError } from '@supabase/supabase-js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const recoveryCode = ref<string | null>(null)
const stage = ref<'checking' | 'ok' | 'done' | 'error'>('checking')
const err = ref<string | null>(null)
const busy = ref(false)

const pw = ref('')
const pw2 = ref('')

function msg(e: unknown) {
  if (e instanceof AuthError) {
    const text = e.message?.toLowerCase() ?? ''
    if (text.includes('expired')) return 'Ссылка устарела. Запросите письмо ещё раз.'
    if (text.includes('invalid') || text.includes('code'))
      return 'Ссылка некорректна или уже использована.'
    if (text.includes('weak password')) return 'Слишком простой пароль.'
    return e.message || 'Ошибка восстановления пароля'
  }
  if (e instanceof Error) return e.message
  return String(e)
}

onMounted(async () => {
  const params = new URLSearchParams(location.search)
  const codeParam = (route.query.code as string) ?? params.get('code')
  const typeParam = (route.query.type as string) ?? params.get('type')

  try {
    if (typeParam !== 'recovery') throw new Error('Некорректная ссылка')
    if (!codeParam) throw new Error('Отсутствует код подтверждения')
    await auth.verifyResetCode(codeParam)
    recoveryCode.value = codeParam
    // аккуратно убираем параметры из URL
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('type')
    url.searchParams.delete('access_token')
    url.searchParams.delete('refresh_token')
    url.searchParams.delete('token_type')
    url.searchParams.delete('expires_in')
    url.searchParams.delete('lang')
    window.history.replaceState({}, '', url.toString())
    stage.value = 'ok'
  } catch (e) {
    err.value = msg(e)
    stage.value = 'error'
  }
})

const canSubmit = () => !busy.value && pw.value.length >= 8 && pw.value === pw2.value

async function submit() {
  if (!recoveryCode.value || !canSubmit()) return
  busy.value = true
  err.value = null
  try {
    await auth.confirmResetPassword(recoveryCode.value, pw.value)
    stage.value = 'done'
    setTimeout(() => router.push('/login'), 1200)
  } catch (e) {
    err.value = msg(e)
  } finally {
    busy.value = false
  }
}

// UX: при вводе любой ошибки очищаем подсказку
watch([pw, pw2], () => {
  if (err.value) err.value = null
})
</script>

<template>
  <h1>Create New Password</h1>

  <p v-if="stage === 'checking'">Checking link…</p>

  <form v-else-if="stage === 'ok'" @submit.prevent="submit" novalidate>
    <label for="pw1">Password</label>
    <input
      id="pw1"
      type="password"
      v-model="pw"
      minlength="8"
      autocomplete="new-password"
      required
      aria-describedby="pw-hint"
      :aria-invalid="!!err || (!!pw && pw.length < 8)"
    />
    <small id="pw-hint">Must be at least 8 characters.</small>

    <label for="pw2">Confirm Password</label>
    <input
      id="pw2"
      type="password"
      v-model="pw2"
      autocomplete="new-password"
      required
      :aria-invalid="!!pw2 && pw !== pw2"
    />
    <p v-if="pw2 && pw !== pw2" style="color: red">Passwords do not match</p>

    <button type="submit" :disabled="!canSubmit()">
      {{ busy ? 'Saving…' : 'Reset Password' }}
    </button>

    <p v-if="err" style="color: red">{{ err }}</p>
  </form>

  <p v-else-if="stage === 'done'" style="color: green">Password updated. Redirecting…</p>
  <p v-else-if="stage === 'error'" style="color: red">{{ err }}</p>
</template>
