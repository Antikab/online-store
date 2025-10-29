<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'

import { SiteHeader } from '@/widgets/site-header'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white text-gray-900">
    <SiteHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <Toaster position="top-right" richColors />
  </div>
</template>
