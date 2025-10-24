<template>
  <div class="flex w-full flex-col gap-1">
    <label v-if="label" :for="id" class="text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    <div class="relative">
      <input
        :id="id"
        v-bind="attrs"
        :type="type"
        class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100"
      />
      <slot name="icon" />
    </div>
    <p v-if="hint" class="text-xs text-gray-500">{{ hint }}</p>
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

interface Props {
  label?: string
  hint?: string
  error?: string
  type?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  id: undefined,
  label: undefined,
  hint: undefined,
  error: undefined
})

const attrs = useAttrs()
const id = computed(() => props.id ?? (attrs.id as string | undefined))
</script>
