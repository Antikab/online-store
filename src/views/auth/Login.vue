<!-- views/auth/Login.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const auth = useAuthStore()
const { loading, error } = storeToRefs(auth)

const email = ref('')
const password = ref('')

const router = useRouter()
const route = useRoute()

async function onSubmit() {
  if (loading.value) return
  try {
    await auth.login(email.value, password.value)
    router.push((route.query.redirect as string) || '/')
  } catch {
    /* error уже в сторе */
  }
}
</script>

<template>
  <h1>Login</h1>
  <form @submit.prevent="onSubmit" novalidate>
    <input v-model.trim="email" type="email" autocomplete="email" required />
    <input v-model="password" type="password" autocomplete="current-password" required />
    <button :disabled="loading">Login</button>
    <p v-if="error" style="color: red">{{ error }}</p>
  </form>
  <RouterLink to="/reset-password">Forgot?</RouterLink> ·
  <RouterLink to="/register">Register</RouterLink>
</template>
