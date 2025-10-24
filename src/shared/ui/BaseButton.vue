<template>
  <button
    class="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 disabled:cursor-not-allowed disabled:bg-gray-300"
    v-bind="attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'

const attrs = useAttrs()
</script>
