<!-- views/auth/Register.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
const email = ref('')
const password = ref('')
const auth = useAuthStore()
const router = useRouter()
async function onSubmit() {
  await auth.register(email.value, password.value)
  router.push('/')
}
</script>
<template>
  <h1>Register</h1>
  <form @submit.prevent="onSubmit">
    <input v-model="email" type="email" required />
    <input v-model="password" type="password" required minlength="6" />
    <button :disabled="auth.loading">Create</button>
    <p v-if="auth.error" style="color: red">{{ auth.error }}</p>
  </form>
</template>
