<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useSessionStore } from '@entities/session'
import { useNotifier } from '@shared/lib/notifications'

const auth = useSessionStore()
const { loading, errorMessage, isAuthed } = storeToRefs(auth)
const notify = useNotifier('Login')
const router = useRouter()
const route = useRoute()

// 📘 Схема валидации
const schema = z.object({
  email: z.email('Введите корректный e-mail').trim().toLowerCase(),
  password: z.string().min(6, 'Минимум 6 символов').trim()
})

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    email: '',
    password: ''
  }
})

// 🧩 Поля формы
const { value: email, errorMessage: emailError, meta: emailMeta } = useField('email')
const { value: password, errorMessage: passwordError, meta: passwordMeta } = useField('password')

// 🚀 Сабмит
const onSubmit = handleSubmit(async (values) => {
  await auth.login(values.email, values.password)

  if (isAuthed.value) {
    notify.success('Добро пожаловать 👋')
    router.push((route.query.redirect as string) || '/')
  } else if (errorMessage.value) {
    notify.error(errorMessage.value)
  }
})
</script>

<template>
  <section class="max-w-sm mx-auto mt-20 p-6 bg-white rounded-xl shadow ring-1 ring-gray-200">
    <h1 class="text-2xl font-semibold text-center mb-6">Sign in</h1>

    <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
      <!-- Email -->
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        @blur="emailMeta.touched = true"
        class="border rounded-lg px-3 py-2"
        :class="{ 'ring-red-300': emailMeta.touched && emailError }"
      />
      <p v-if="emailMeta.touched && emailError" class="text-sm text-red-500">{{ emailError }}</p>

      <!-- Password -->
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        @blur="passwordMeta.touched = true"
        class="border rounded-lg px-3 py-2"
        :class="{ 'ring-red-300': passwordMeta.touched && passwordError }"
      />
      <p v-if="passwordMeta.touched && passwordError" class="text-sm text-red-500">
        {{ passwordError }}
      </p>

      <button
        :disabled="loading"
        class="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>

      <p v-if="errorMessage" class="text-sm text-center text-red-500">
        {{ errorMessage }}
      </p>
    </form>
  </section>
</template>
