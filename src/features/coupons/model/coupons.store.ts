import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { supabase } from '@/shared/api/supabase/client'

type CouponRow = { code: string; active: boolean; percent: number }

const STORAGE_KEY = 'guest_coupon_v1'

export const useCouponsStore = defineStore('coupons', () => {
  const code = ref<string>('')
  const valid = ref<boolean>(false)
  const percent = ref<number>(0)

  function resetLocal() {
    code.value = ''
    valid.value = false
    percent.value = 0
  }

  async function fetchCoupon(c: string) {
    const { data, error } = await supabase
      .from('coupons')
      .select('code, active, percent')
      .eq('code', c)
      .maybeSingle()
    if (error) throw error
    return (data as CouponRow | null) ?? null
  }

  function saveToStorage() {
    if (valid.value && code.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(code.value))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const c = raw ? (JSON.parse(raw) as string) : ''
      if (c) void apply(c)
      else resetLocal()
    } catch {
      resetLocal()
    }
  }

  async function apply(input: string) {
    const normalized = input.trim().toUpperCase()
    if (!normalized) {
      resetLocal()
      saveToStorage()
      return false
    }

    const row = await fetchCoupon(normalized)
    const ok = !!row && !!row.active
    code.value = normalized
    valid.value = ok
    percent.value = ok ? Number(row?.percent ?? 0) : 0
    saveToStorage()
    return ok
  }

  function reset() {
    resetLocal()
    saveToStorage()
  }

  const discount = computed(() => (valid.value && percent.value > 0 ? percent.value / 100 : 0))

  function start() {
    loadFromStorage()
  }

  return { code, valid, percent, discount, start, apply, reset }
})
