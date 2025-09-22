// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, db } from '@/firebase'
import { FirebaseError } from 'firebase/app'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  type User,
  type Unsubscribe,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth'
import { ref as dbRef, set, update } from 'firebase/database'

type PublicUser = { uid: string; email: string | null }

function toErrorMessage(e: unknown): string {
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'auth/invalid-email':
        return 'Некорректный e-mail'
      case 'auth/user-not-found':
        return 'Пользователь не найден'
      case 'auth/email-already-in-use':
        return 'E-mail уже используется'
      case 'auth/wrong-password':
        return 'Неверный пароль'
      case 'auth/too-many-requests':
        return 'Слишком много попыток. Повторите позже'
      default:
        return e.message || e.code
    }
  }
  if (e instanceof Error) return e.message
  return String(e)
}

const RESET_REDIRECT_URL = import.meta.env.DEV
  ? 'http://localhost:5173/change-password'
  : `${window.location.origin}/change-password`

export const useAuthStore = defineStore('auth', () => {
  // state
  const user = ref<PublicUser | null>(null)
  const loading = ref(false)
  const error = ref('') // последнее сообщение об ошибке
  const ready = ref(false)
  let unsub: Unsubscribe | null = null

  // getters
  const isAuthed = computed(() => !!user.value)
  const uid = computed(() => user.value?.uid ?? null)
  const email = computed(() => user.value?.email ?? null)

  // internal
  function setFromFirebase(u: User | null) {
    user.value = u ? { uid: u.uid, email: u.email } : null
  }

  function initAuthWatcher() {
    if (unsub) return
    unsub = onAuthStateChanged(auth, (u) => {
      setFromFirebase(u)
      ready.value = true
    })
  }
  function disposeAuthWatcher() {
    if (unsub) {
      unsub()
      unsub = null
    }
  }

  // actions
  async function register(rawEmail: string, password: string) {
    loading.value = true
    error.value = ''
    try {
      const normEmail = rawEmail.trim().toLowerCase()
      const res = await createUserWithEmailAndPassword(auth, normEmail, password)
      await set(dbRef(db, `users/${res.user.uid}/profile`), {
        email: normEmail,
        createdAt: Date.now()
      })
      setFromFirebase(res.user)
    } catch (e: unknown) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function login(rawEmail: string, password: string) {
    loading.value = true
    error.value = ''
    try {
      const normEmail = rawEmail.trim().toLowerCase()
      const res = await signInWithEmailAndPassword(auth, normEmail, password)
      setFromFirebase(res.user)
    } catch (e: unknown) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /** Отправка письма сброса. В UI показываем «письмо отправлено» независимо от результата. */
  async function resetPassword(rawEmail: string) {
    loading.value = true
    error.value = ''
    try {
      auth.languageCode = 'ru'
      const normEmail = rawEmail.trim().toLowerCase()
      await sendPasswordResetEmail(auth, normEmail, {
        url: RESET_REDIRECT_URL,
        handleCodeInApp: true
      })
    } catch (e: unknown) {
      error.value = toErrorMessage(e) // лог
    } finally {
      loading.value = false
    }
  }

  /** Смена пароля для залогиненного пользователя (reauth). */
  async function changePasswordWithReauth(currentPassword: string, newPassword: string) {
    if (!auth.currentUser || !auth.currentUser.email) throw new Error('Not authenticated')

    loading.value = true
    error.value = ''
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, cred)
      await updatePassword(auth.currentUser, newPassword)
      await update(dbRef(db, `users/${auth.currentUser.uid}/profile`), {
        passwordUpdatedAt: Date.now()
      })
    } catch (e: unknown) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /** Проверка кода из письма (вернёт email, если нужно). */
  async function verifyResetCode(oobCode: string) {
    try {
      return await verifyPasswordResetCode(auth, oobCode)
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  /** Подтверждение нового пароля по коду из письма. */
  async function confirmResetPassword(oobCode: string, newPassword: string) {
    loading.value = true
    error.value = ''
    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout(opts?: { clearGuest?: boolean }) {
    try {
      await signOut(auth)
      setFromFirebase(null)
      if (opts?.clearGuest) {
        localStorage.removeItem('guest_cart_v1')
        localStorage.removeItem('guest_wishlist_v1')
      }
    } catch (e) {
      console.error('Logout error', e)
    }
  }

  return {
    // state
    user,
    loading,
    error,
    ready,
    // getters
    isAuthed,
    uid,
    email,
    // lifecycle
    initAuthWatcher,
    disposeAuthWatcher,
    // actions
    register,
    login,
    resetPassword,
    changePasswordWithReauth,
    verifyResetCode,
    confirmResetPassword,
    logout
  }
})
