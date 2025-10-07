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

async function onSubmit() {
  if (!canSubmit.value) return
  error.value = ''
  ok.value = false
  try {
    await auth.changePasswordWithReauth(currentPassword.value, newPassword.value)
    ok.value = true
    currentPassword.value = ''
    newPassword.value = ''
  } catch {
    // ошибка уже в сторе
  }
}

// скрываем “успешно” при изменении полей
watch([currentPassword, newPassword], () => {
  ok.value = false
})
</script>

<template>
  <section class="max-w-md mx-auto px-4 py-10">
    <h1 class="text-2xl font-semibold mb-6 text-center">Change Password</h1>

    <form
      @submit.prevent="onSubmit"
      novalidate
      class="flex flex-col gap-5 bg-white p-6 rounded-xl shadow-sm ring-1 ring-gray-200"
    >
      <div>
        <label for="email" class="block text-sm font-medium mb-1">Email</label>
        <input
          id="email"
          :value="email || ''"
          type="email"
          readonly
          class="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
        />
      </div>

      <div>
        <label for="cur" class="block text-sm font-medium mb-1">Current Password</label>
        <input
          id="cur"
          v-model="currentPassword"
          type="password"
          autocomplete="current-password"
          required
          :aria-invalid="!!error"
          class="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-100"
        />
      </div>

      <div>
        <label for="new" class="block text-sm font-medium mb-1">New Password</label>
        <input
          id="new"
          v-model="newPassword"
          type="password"
          minlength="8"
          autocomplete="new-password"
          required
          aria-describedby="pw-hint"
          :aria-invalid="!!newPassword && newPassword.length < 8"
          class="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-100"
        />
        <small id="pw-hint" class="text-gray-500 text-xs">Minimum 8 characters.</small>
      </div>

      <button
        type="submit"
        :disabled="!canSubmit || loading"
        class="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Saving…' : 'Update Password' }}
      </button>

      <p v-if="ok" class="text-green-600 text-center text-sm">Password updated</p>
      <p v-if="error" class="text-red-500 text-center text-sm">{{ error }}</p>
    </form>
  </section>
</template>
