<!-- views/auth/ChangePassword.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const currentEmail = ref(auth.user?.email ?? '')
const currentPassword = ref('')
const newPassword = ref('')
const ok = ref(false)
async function onSubmit() {
  await auth.changePassword(currentEmail.value, currentPassword.value, newPassword.value)
  ok.value = true
}
</script>
<template>
  <h1>Change Password</h1>
  <form @submit.prevent="onSubmit">
    <input v-model="currentEmail" type="email" required />
    <input v-model="currentPassword" type="password" required />
    <input v-model="newPassword" type="password" required minlength="6" />
    <button>Update</button>
  </form>
  <p v-if="ok" style="color: green">Updated</p>
</template>
