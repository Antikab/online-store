// stores/coupons.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/supabase'

type CouponRow = { code: string; active: boolean; percent: number }

const STORAGE_KEY = 'guest_coupon_v1'

export const useCouponsStore = defineStore('coupons', () => {
  const code = ref<string>('') // введённый код (нормализованный)
  const valid = ref<boolean>(false) // валиден ли купон
  const percent = ref<number>(0) // скидка в процентах (0..100)

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
      if (c)
        void apply(c) // пере-валидируем с сервером
      else resetLocal()
    } catch {
      resetLocal()
    }
  }

  /** Применить купон: валидируем в БД и сохраняем локально */
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

  // коэффициент скидки 0..1
  const discount = computed(() => (valid.value && percent.value > 0 ? percent.value / 100 : 0))

  /** вызывать один раз в main.ts — просто подгружает из LocalStorage */
  function start() {
    loadFromStorage()
  }

  return { code, valid, percent, discount, start, apply, reset }
})
