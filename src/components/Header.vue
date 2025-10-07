<template>
  <header class="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
    <nav class="flex gap-3 text-sm">
      <RouterLink class="hover:underline" to="/">Главная</RouterLink>
      <RouterLink class="hover:underline" to="/catalog/men">Men</RouterLink>
      <RouterLink class="hover:underline" to="/catalog/women">Women</RouterLink>
      <RouterLink class="hover:underline" to="/wishlist">Wishlist</RouterLink>
      <RouterLink v-if="isAuthed" class="hover:underline" to="/orders">Orders</RouterLink>
      <RouterLink class="hover:underline" to="/cart">Cart</RouterLink>
    </nav>

    <div class="flex-1" />

    <template v-if="isAuthed">
      <span class="text-gray-600 mr-2 truncate max-w-[24ch]">{{ email }}</span>
      <button
        @click="onLogout"
        class="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Выйти
      </button>
    </template>
    <template v-else>
      <RouterLink
        class="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        to="/login"
        >Войти</RouterLink
      >
      <RouterLink
        class="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 ml-2"
        to="/register"
        >Регистрация</RouterLink
      >
    </template>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
const auth = useAuthStore()
const { isAuthed, email } = storeToRefs(auth)
async function onLogout() {
  await auth.logout({ clearGuest: true })
}
</script>
