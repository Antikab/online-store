<!-- src/pages/product/ui/CheckoutPage.vue -->
<script setup lang="ts">
import { onMounted, reactive, computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@entities/user'
import { useCartStore, useCouponsStore } from '@features/product'
import { useOrdersStore } from '@features/user'
import type { DeliveryForm } from '@features/product'
import { BaseInput, BaseButton } from '@shared/ui'

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const coupons = useCouponsStore()
const orders = useOrdersStore()

onMounted(() => {
  if (!cart.list.length) router.replace('/cart')
})

watch(
  () => auth.isAuthed,
  (ok) => {
    if (!ok) router.replace({ path: '/login', query: { redirect: '/checkout' } })
  },
  { immediate: true }
)

const form = reactive<DeliveryForm>({
  fullName: '',
  phone: '',
  city: '',
  address: '',
  zip: ''
})

function validPhone(p: string) {
  return /^(\+?\d{10,15})$/.test(p)
}

const isValidForm = computed(() => !!form.fullName && !!form.city && !!form.address && validPhone(form.phone))

const discountRate = computed(() => coupons.discount ?? 0)
const discountSum = computed(() => cart.subtotal * discountRate.value)
const total = computed(() => Math.max(0, cart.subtotal - discountSum.value))

const placing = ref(false)

async function submit() {
  if (placing.value) return
  if (!auth.isAuthed) {
    router.push({ path: '/login', query: { redirect: '/checkout' } })
    return
  }
  if (!cart.list.length) {
    router.replace('/cart')
    return
  }
  if (!isValidForm.value) {
    alert('Проверьте обязательные поля и номер телефона')
    return
  }

  placing.value = true
  try {
    await orders.placeOrder({
      delivery: { ...form },
      items: cart.list,
      amounts: {
        subtotal: cart.subtotal,
        discount: discountSum.value,
        total: total.value
      },
      coupon: coupons.valid ? coupons.code : null,
      createdAt: Date.now()
    })

    await cart.clear()
    coupons.reset()
    router.push('/success')
  } finally {
    placing.value = false
  }
}
</script>

<template>
  <section class="max-w-5xl mx-auto px-4 py-10">
    <h1 class="text-3xl font-semibold mb-8">Checkout</h1>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form @submit.prevent="submit" class="space-y-4" novalidate>
        <BaseInput v-model="form.fullName" label="Full name" placeholder="John Doe" required />
        <BaseInput v-model="form.phone" label="Phone" placeholder="+1234567890" required />
        <BaseInput v-model="form.city" label="City" placeholder="San Francisco" required />
        <BaseInput v-model="form.address" label="Address" placeholder="123 Market St" required />
        <BaseInput v-model="form.zip" label="ZIP" placeholder="94105" />

        <BaseButton type="submit" :disabled="placing || !isValidForm || !cart.list.length">
          {{ placing ? 'Processing…' : 'Continue to delivery' }}
        </BaseButton>
      </form>

      <aside class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
        <h3 class="text-lg font-semibold">Order summary</h3>
        <p class="text-sm text-gray-600">Items: {{ cart.list.length }}</p>
        <p class="text-sm text-gray-600">Subtotal: {{ cart.subtotal.toFixed(2) }} $</p>
        <p v-if="discountRate > 0" class="text-sm text-green-600">Discount: −{{ discountSum.toFixed(2) }} $</p>
        <h4 class="text-xl font-semibold">Total: {{ total.toFixed(2) }} $</h4>
      </aside>
    </div>
  </section>
</template>
