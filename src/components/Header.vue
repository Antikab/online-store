<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const auth = useAuthStore()
const { isAuthed, email } = storeToRefs(auth)

async function onLogout() {
  await auth.logout({ clearGuest: true })
}
</script>

<template>
  <header class="app-header">
    <nav class="links">
      <RouterLink to="/">Главная</RouterLink>
      <RouterLink to="/catalog/men">Men</RouterLink>
      <RouterLink to="/catalog/women">Women</RouterLink>
      <RouterLink to="/wishlist">Wishlist</RouterLink>
      <RouterLink v-if="isAuthed" to="/orders">Orders</RouterLink>
      <RouterLink to="/cart">Cart</RouterLink>
    </nav>

    <div class="spacer" />

    <template v-if="isAuthed">
      <span class="email">{{ email }}</span>
      <button @click="onLogout">Выйти</button>
    </template>
    <template v-else>
      <RouterLink to="/login">Войти</RouterLink>
      <RouterLink to="/register">Регистрация</RouterLink>
    </template>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
}
.links {
  display: flex;
  gap: 12px;
}
.spacer {
  flex: 1;
}
.email {
  opacity: 0.7;
}
button {
  border: 1px solid #ddd;
  background: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
