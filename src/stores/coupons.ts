// stores/coupons.ts
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch, type WatchStopHandle } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/auth'
import type { RealtimeChannel } from '@supabase/supabase-js'

type CouponRow = {
  code: string
  active: boolean
  percent: number
}

type UserCouponRow = {
  user_id: string
  coupon_code: string | null
  updated_at: string | null
}

const GUEST_COUPON_KEY = 'guest_coupon_v1'

export const useCouponsStore = defineStore('coupons', () => {
  const code = ref<string>('')
  const valid = ref<boolean>(false)
  const percent = ref<number>(0)
  const isGuest = ref(true)

  let channel: RealtimeChannel | null = null
  let stopAuthWatch: WatchStopHandle | null = null

  function resetLocal() {
    code.value = ''
    valid.value = false
    percent.value = 0
  }

  async function fetchCoupon(c: string) {
    const { data, error } = await supabase.from('coupons').select('*').eq('code', c).maybeSingle()
    if (error) throw error
    return (data as CouponRow | null) ?? null
  }

  async function apply(c: string) {
    const normalized = c.trim().toUpperCase()
    if (!normalized) {
      resetLocal()
      if (isGuest.value) clearGuest()
      else void removeUserCoupon()
      return false
    }

    const row = await fetchCoupon(normalized)
    const ok = !!row && !!row.active

    code.value = normalized
    valid.value = ok
    percent.value = ok ? Number(row?.percent ?? 0) : 0

    if (isGuest.value) {
      saveGuest()
    } else {
      await upsertUserCoupon(ok ? normalized : null)
    }

    return ok
  }

  function loadGuest() {
    try {
      const raw = localStorage.getItem(GUEST_COUPON_KEY)
      const c = raw ? (JSON.parse(raw) as string) : ''
      if (c) void apply(c)
      else resetLocal()
    } catch {
      resetLocal()
    }
  }

  function saveGuest() {
    if (valid.value && code.value) {
      localStorage.setItem(GUEST_COUPON_KEY, JSON.stringify(code.value))
    } else {
      localStorage.removeItem(GUEST_COUPON_KEY)
    }
  }

  function clearGuest() {
    localStorage.removeItem(GUEST_COUPON_KEY)
  }

  async function upsertUserCoupon(c: string | null) {
    const auth = useAuthStore()
    const uid = auth.uid
    if (!uid) return
    if (c) {
      const { error } = await supabase
        .from('user_coupons')
        .upsert(
          { user_id: uid, coupon_code: c, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
      if (error) throw error
    } else {
      await removeUserCoupon()
    }
  }

  async function removeUserCoupon() {
    const auth = useAuthStore()
    const uid = auth.uid
    if (!uid) return
    const { error } = await supabase.from('user_coupons').delete().eq('user_id', uid)
    if (error) throw error
  }

  async function refresh(uid: string) {
    const { data, error } = await supabase
      .from('user_coupons')
      .select('coupon_code')
      .eq('user_id', uid)
      .maybeSingle()
    if (error) throw error
    const row = (data as UserCouponRow | null) ?? null
    const c = row?.coupon_code ?? ''
    if (c) {
      await apply(c)
    } else {
      resetLocal()
    }
  }

  async function bindUser(uid: string) {
    await refresh(uid)
    channel = supabase
      .channel(`user_coupons:${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_coupons', filter: `user_id=eq.${uid}` },
        async () => {
          try {
            await refresh(uid)
          } catch (e) {
            console.error('Failed to sync coupon from Supabase', e)
          }
        }
      )
      .subscribe()
  }

  async function unbind() {
    if (channel) {
      await channel.unsubscribe()
      channel = null
    }
  }

  async function syncGuestToUser(uid: string) {
    if (valid.value && code.value) {
      const { error } = await supabase
        .from('user_coupons')
        .upsert(
          { user_id: uid, coupon_code: code.value, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
      if (error) throw error
      clearGuest()
    }
  }

  async function reset() {
    resetLocal()
    if (isGuest.value) {
      clearGuest()
    } else {
      await removeUserCoupon()
    }
  }

  const discount = computed(() => (valid.value && percent.value > 0 ? percent.value / 100 : 0))

  function start() {
    if (stopAuthWatch) return
    const auth = useAuthStore()
    const { uid } = storeToRefs(auth)

    stopAuthWatch = watch(
      uid,
      async (newUid, oldUid) => {
        if (newUid) {
          if (!oldUid && isGuest.value) {
            try {
              await syncGuestToUser(newUid)
            } catch (e) {
              console.error('Failed to merge guest coupon', e)
            }
          }
          isGuest.value = false
          await unbind()
          try {
            await bindUser(newUid)
          } catch (e) {
            console.error('Failed to bind coupon', e)
          }
        } else {
          await unbind()
          isGuest.value = true
          if (oldUid) {
            clearGuest()
            resetLocal()
          } else {
            loadGuest()
          }
        }
      },
      { immediate: true }
    )
  }

  return { code, valid, percent, discount, isGuest, start, apply, reset }
})
