<!-- views/account/ChangePassword.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const auth = useAuthStore()
const { loading, error, email } = storeToRefs(auth)

const currentPassword = ref('')
const newPassword = ref('')
const ok = ref(false)

const canSubmit = computed(
  () => !loading.value && !!currentPassword.value && newPassword.value.length >= 8
)

const onSubmit = async () => {
  if (!canSubmit.value) return
  // сбросим видимое сообщение об ошибке и успех
  error.value = ''
  ok.value = false
  try {
    await auth.changePasswordWithReauth(currentPassword.value, newPassword.value)
    ok.value = true
    currentPassword.value = ''
    newPassword.value = ''
  } catch {
    // error уже в сторе
  }
}

// при вводе нового пароля/текущего — скрываем прошлый «успех»
watch([currentPassword, newPassword], () => {
  ok.value = false
})
</script>

<template>
  <h1>Change password (account)</h1>

  <form @submit.prevent="onSubmit" novalidate>
    <label for="email">Email</label>
    <input id="email" :value="email || ''" type="email" readonly />

    <label for="cur">Current password</label>
    <input
      id="cur"
      v-model="currentPassword"
      type="password"
      autocomplete="current-password"
      required
      :aria-invalid="!!error"
    />

    <label for="new">New password</label>
    <input
      id="new"
      v-model="newPassword"
      type="password"
      minlength="8"
      autocomplete="new-password"
      required
      aria-describedby="pw-hint"
      :aria-invalid="!!newPassword && newPassword.length < 8"
    />
    <small id="pw-hint">Minimum 8 characters.</small>

    <button type="submit" :disabled="!canSubmit || loading">
      {{ loading ? 'Saving…' : 'Update' }}
    </button>
  </form>

  <p v-if="ok" style="color: green">Password updated</p>
  <p v-if="error" style="color: red">{{ error }}</p>
</template>
