<template>
  <button
    v-bind="attrs"
    class="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 bg-primary-color-3 text-white hover:bg-primary-color-2"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'

const attrs = useAttrs()
</script>
