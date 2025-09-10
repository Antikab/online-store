// stores/coupons.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, db } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { ref as dbRef, get, set, remove, onValue } from 'firebase/database'

const GUEST_COUPON_KEY = 'guest_coupon_v1'

export const useCouponsStore = defineStore('coupons', () => {
  const code = ref<string>('') // текущий код (например "WELCOME")
  const valid = ref<boolean>(false) // активен ли купон
  const percent = ref<number>(0) // процент скидки (например 15)
  const isGuest = ref(true)

  let rtdbUnsub: (() => void) | null = null

  // ---------- helpers: guest persist ----------
  function loadGuest() {
    try {
      const raw = localStorage.getItem(GUEST_COUPON_KEY)
      const c = raw ? (JSON.parse(raw) as string) : ''
      if (c)
        void apply(c) // провалидируем и подтянем percent из БД
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

  // ---------- helpers: RTDB bind/unbind ----------
  function bindUser(uid: string) {
    unbind()
    const r = dbRef(db, `users/${uid}/coupon`)
    const off = onValue(r, async (snap) => {
      if (!snap.exists()) {
        // у пользователя нет купона в БД — локально чистим
        resetLocal()
        return
      }
      const c = (snap.val() as string | null) ?? ''
      // если код тот же — ничего не делаем, чтобы не гонять apply лишний раз
      if (c && c !== code.value) {
        await apply(c) // валидируем и выставим state + percent
      }
    })
    rtdbUnsub = () => off()
  }
  function unbind() {
    if (rtdbUnsub) {
      rtdbUnsub()
      rtdbUnsub = null
    }
  }

  // ---------- перенос купона гостя при логине ----------
  async function syncGuestToUser(uid: string) {
    if (valid.value && code.value) {
      await set(dbRef(db, `users/${uid}/coupon`), code.value)
      clearGuest()
    }
  }

  // ---------- публичные методы ----------
  /** Валидирует купон по /coupons/:code и выставляет локальный state. */
  async function apply(c: string) {
    const normalized = c.trim().toUpperCase()
    const snap = await get(dbRef(db, `coupons/${normalized}`))
    const v = snap.val()
    const ok = !!v && !!v.active

    code.value = normalized
    valid.value = ok
    percent.value = ok ? Number(v.percent || 0) : 0

    if (isGuest.value) {
      // сохранить в localStorage только валидный купон
      saveGuest()
    } else if (auth.currentUser) {
      const node = dbRef(db, `users/${auth.currentUser.uid}/coupon`)
      if (ok) {
        // пишем код, если его ещё нет в БД (или он отличается)
        // (без доп. чтения: set идемпотентен и дешёв)
        await set(node, normalized)
      } else {
        // если невалидный — удаляем ключ (лучше, чем писать null)
        await remove(node)
      }
    }
    return ok
  }

  /** Полный сброс купона. */
  async function reset() {
    resetLocal()
    if (isGuest.value) {
      clearGuest()
    } else if (auth.currentUser) {
      await remove(dbRef(db, `users/${auth.currentUser.uid}/coupon`))
    }
  }

  function resetLocal() {
    code.value = ''
    valid.value = false
    percent.value = 0
  }

  // 0..1
  const discount = computed(() => (valid.value && percent.value > 0 ? percent.value / 100 : 0))

  /** Старт: определить режим, поднять купон и подписаться на смену auth. */
  function start() {
    isGuest.value = !auth.currentUser
    if (isGuest.value) {
      loadGuest()
    } else {
      bindUser(auth.currentUser!.uid)
    }

    onAuthStateChanged(auth, async (u) => {
      if (u) {
        // гость -> пользователь
        if (isGuest.value) await syncGuestToUser(u.uid)
        isGuest.value = false
        bindUser(u.uid)
      } else {
        // пользователь -> гость
        unbind()
        isGuest.value = true
        // по требованию: при выходе купон должен исчезать
        clearGuest()
        resetLocal()
      }
    })
  }

  return { code, valid, percent, discount, isGuest, start, apply, reset }
})
