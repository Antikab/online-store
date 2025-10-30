<template>
  <button
    class="add-to-cart"
    type="button"
    :disabled="isDisabled"
    @click="handleClick"
  >
    <slot>{{ pending ? 'Adding…' : label }}</slot>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import type { Product } from '@shared/model'

import { useCartStore } from '../model/cart.store'

const props = withDefaults(
  defineProps<{
    product: Product | null
    color?: string | null
    size?: string | null
    quantity?: number
    label?: string
    disabled?: boolean
  }>(),
  {
    quantity: 1,
    label: 'Add to cart'
  }
)

const emit = defineEmits<{
  added: []
  error: [unknown]
}>()

const cart = useCartStore()
const pending = ref(false)

const canAdd = computed(
  () => !!props.product && !!props.color && !!props.size && (props.quantity ?? 1) > 0
)

const isDisabled = computed(() => props.disabled || pending.value || !canAdd.value)

async function handleClick() {
  if (!canAdd.value || !props.product) return
  if (pending.value) return

  pending.value = true
  try {
    await cart.add(props.product, props.color!, props.size!, props.quantity ?? 1)
    emit('added')
  } catch (error) {
    emit('error', error)
  } finally {
    pending.value = false
  }
}
</script>

<style scoped>
.add-to-cart {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  border: none;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 10px 20px -12px rgba(37, 99, 235, 0.9);
}

.add-to-cart:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 18px 30px -18px rgba(37, 99, 235, 0.8);
}

.add-to-cart:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
