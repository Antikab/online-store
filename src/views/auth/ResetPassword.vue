<!-- views/auth/ResetPassword.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const email = ref('')
const sent = ref(false)

async function onSubmit() {
  try {
    await auth.resetPassword(email.value.trim())
  } finally {
    sent.value = true
  }
}
</script>

<template>
  <section class="max-w-sm mx-auto mt-20 p-6 bg-white rounded-xl shadow-sm ring-1 ring-gray-200">
    <h1 class="text-2xl font-semibold mb-6 text-center text-gray-800">Reset password</h1>

    <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
      <input
        v-model.trim="email"
        type="email"
        required
        placeholder="Enter your email"
        class="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <button
        type="submit"
        :disabled="auth.loading"
        class="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {{ auth.loading ? 'Sending...' : 'Send reset link' }}
      </button>

      <p v-if="sent" class="text-green-600 text-sm text-center mt-2">
        If this email exists, a reset link has been sent.<br />
        Please check your inbox.
      </p>
    </form>

    <div class="text-center text-sm text-gray-500 mt-6">
      <RouterLink to="/login" class="text-blue-600 hover:underline">Back to login</RouterLink>
    </div>
  </section>
</template>
