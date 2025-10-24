<template>
  <div class="min-h-screen bg-slate-50 text-gray-900">
    <AppHeader />
    <main class="pb-16">
      <RouterView />
    </main>
    <AppToaster />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { AppHeader } from '@widgets/user'
</script>

<style scoped>
main {
  min-height: calc(100vh - 120px);
}
</style>
