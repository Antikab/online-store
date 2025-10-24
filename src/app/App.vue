<!-- src/app/App.vue -->
<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'

import { UserHeader } from '@widgets/user'
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <UserHeader />
    <main class="mx-auto w-full max-w-6xl px-4 py-6">
      <RouterView />
    </main>
    <Toaster position="top-right" richColors />
  </div>
</template>
