<!-- views/auth/Register.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const auth = useAuthStore()
const { loading, error } = storeToRefs(auth)

const email = ref('')
const password = ref('')
const router = useRouter()

async function onSubmit() {
  if (loading.value) return
  try {
    await auth.register(email.value, password.value)
    router.push('/')
  } catch {
    // ошибка уже в сторе
  }
}
</script>

<template>
  <section class="max-w-sm mx-auto mt-20 p-6 bg-white rounded-xl shadow-sm ring-1 ring-gray-200">
    <h1 class="text-2xl font-semibold mb-6 text-center text-gray-800">Create account</h1>

    <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
      <input
        v-model.trim="email"
        type="email"
        required
        placeholder="Email"
        autocomplete="email"
        class="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <input
        v-model="password"
        type="password"
        required
        minlength="6"
        placeholder="Password (min 6 chars)"
        autocomplete="new-password"
        class="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <button
        type="submit"
        :disabled="loading"
        class="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {{ loading ? 'Creating...' : 'Register' }}
      </button>

      <p v-if="error" class="text-sm text-red-500 text-center">{{ error }}</p>
    </form>

    <div class="text-center text-sm text-gray-500 mt-6">
      Already have an account?
      <RouterLink to="/login" class="text-blue-600 hover:underline">Sign in</RouterLink>
    </div>
  </section>
</template>
