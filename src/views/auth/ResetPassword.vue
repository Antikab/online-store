<!-- views/auth/ResetPassword.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const email = ref('')
const sent = ref(false)

/** Отправка ссылки восстановления */
const onSubmit = async () => {
  try {
    await auth.resetPassword(email.value.trim())
  } finally {
    // даже при ошибке показываем "отправлено" — не раскрываем существование e-mail
    sent.value = true
  }
}
</script>

<template>
  <section class="max-w-sm mx-auto mt-20 p-6 bg-white rounded-xl shadow-sm ring-1 ring-gray-200">
    <h1 class="text-2xl font-semibold mb-6 text-center">Reset Password</h1>

    <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
      <input
        v-model.trim="email"
        type="email"
        required
        autocomplete="email"
        placeholder="Enter your email"
        class="border rounded-lg px-3 py-2 focus:ring focus:ring-blue-100"
      />

      <button
        type="submit"
        :disabled="auth.loading"
        class="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {{ auth.loading ? 'Sending...' : 'Send reset link' }}
      </button>

      <p v-if="sent" class="text-green-600 text-sm text-center">
        If the email exists, a reset link has been sent.
        <br />Check your inbox and spam folder.
      </p>
    </form>
  </section>
</template>
