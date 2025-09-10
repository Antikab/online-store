<!-- views/auth/ResetPassword.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
const email = ref('')
const sent = ref(false)
const auth = useAuthStore()
async function onSubmit() {
  await auth.resetPassword(email.value)
  sent.value = true
}
</script>
<template>
  <h1>Reset Password</h1>
  <form @submit.prevent="onSubmit">
    <input v-model="email" type="email" required />
    <button>Send link</button>
  </form>
  <p v-if="sent" style="color: green">Check your email.</p>
</template>
