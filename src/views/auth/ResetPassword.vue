<!-- views/auth/ResetPassword.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = computed(() => auth.loading)

const email = ref('')
const sent = ref(false)

/** Важно: UX всегда показывает «письмо отправлено», чтобы не палить наличие e-mail. */
async function onSubmit() {
  try {
    await auth.resetPassword(email.value)
  } catch {
    // игнорируем для UX; ошибка сохранится в сторе для логов
  } finally {
    sent.value = true
  }
}
</script>

<template>
  <h1>Reset Password</h1>
  <form @submit.prevent="onSubmit" novalidate>
    <input v-model.trim="email" type="email" autocomplete="email" required />
    <button :disabled="loading">Send link</button>
  </form>
  <p v-if="sent" style="color: green">
    Если адрес существует, письмо со ссылкой отправлено. Проверьте почту (включая «Спам»).
  </p>
</template>
