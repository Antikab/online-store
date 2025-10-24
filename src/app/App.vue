<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'

import SiteHeader from '@/widgets/site-header/ui/SiteHeader.vue'
</script>

<template>
  <SiteHeader />
  <RouterView />
  <Toaster position="top-right" richColors />
</template>
