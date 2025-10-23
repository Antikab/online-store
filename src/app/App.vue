<!-- app/App.vue -->
<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'

import { AppHeader } from '@/widgets/app-header'
</script>

<template>
  <div class="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <Toaster position="top-right" richColors />
  </div>
</template>
