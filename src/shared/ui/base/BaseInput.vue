<template>
  <label class="block text-sm font-medium text-gray-700">
    <span v-if="label" class="mb-1 block">{{ label }}</span>
    <div class="relative">
      <input
        :value="modelValue"
        @input="onInput"
        :type="type"
        v-bind="restAttrs"
        class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-color-3 focus:outline-none focus:ring-2 focus:ring-primary-color-3/40"
      />
      <slot name="suffix" />
    </div>
    <p v-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </label>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineProps<{
  modelValue?: string | number
  label?: string
  hint?: string
  type?: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const attrs = useAttrs()
const restAttrs = computed(() => ({ ...attrs, modelValue: undefined }))

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>
