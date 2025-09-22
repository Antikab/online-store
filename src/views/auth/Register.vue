<!-- views/auth/Register.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

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
    /* error уже в сторе */
  }
}
</script>

<template>
  <h1>Register</h1>
  <form @submit.prevent="onSubmit" novalidate>
    <input v-model.trim="email" type="email" autocomplete="email" required />
    <input v-model="password" type="password" minlength="6" autocomplete="new-password" required />
    <button :disabled="loading">Create</button>
    <p v-if="error" style="color: red">{{ error }}</p>
  </form>
</template>
