<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

import { useAuthStore } from '@/stores/auth'

// 🧱 Pinia store
const auth = useAuthStore()
const { loading, error } = storeToRefs(auth)
const router = useRouter()
const route = useRoute()

// 🧩 Zod схема
const schema = z.object({
  email: z.email({ message: 'Введите корректный email' }).trim().toLowerCase(),
  password: z.string().trim().min(6, { message: 'Должно быть минимум 6 символов' })
})

// ⚙️ vee-validate
const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(schema)
})
// 🧠 Поля формы
const { value: email, errorMessage: emailError, meta: emailMeta } = useField('email')

const { value: password, errorMessage: passwordError, meta: passwordMeta } = useField('password')

// 🚀 Сабмит
const onSubmit = handleSubmit(async (values) => {
  try {
    await auth.login(values.email, values.password)
    router.push((route.query.redirect as string) || '/')
  } catch {
    // ошибка уже в сторе
  }
})
</script>

<template>
  <section class="max-w-sm mx-auto mt-20 p-6 bg-white rounded-xl shadow ring-1 ring-gray-200">
    <h1 class="text-2xl font-semibold text-center text-gray-800 mb-6">Sign in</h1>

    <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
      <!-- Email -->
      <div class="flex flex-col">
        <input
          @blur="emailMeta.touched = true"
          v-model="email"
          type="email"
          placeholder="Email"
          autocomplete="email"
          class="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-200"
          :class="{ 'ring-red-300': emailMeta.touched && emailError }"
        />
        <p v-if="emailMeta.touched && emailError" class="text-sm text-red-500 mt-1">
          {{ emailError }}
        </p>
      </div>

      <!-- Password -->
      <div class="flex flex-col">
        <input
          @blur="passwordMeta.touched = true"
          v-model="password"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          class="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-200"
          :class="{ 'ring-red-300': passwordMeta.touched && passwordError }"
        />
        <p v-if="passwordMeta.touched && passwordError" class="text-sm text-red-500 mt-1">
          {{ passwordError }}
        </p>
      </div>

      <!-- Button -->
      <button
        type="submit"
        :disabled="loading"
        class="bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>

      <!-- Ошибка от сервера -->
      <p v-if="error" class="text-sm text-red-500 text-center mt-2">{{ error }}</p>
    </form>

    <div class="text-center text-sm text-gray-500 mt-6">
      <RouterLink to="/reset-password" class="hover:text-blue-600">Forgot?</RouterLink>
      <span class="mx-2 text-gray-300">|</span>
      <RouterLink to="/register" class="hover:text-blue-600">Register</RouterLink>
    </div>
  </section>
</template>
