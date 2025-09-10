// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, db } from '@/firebase'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  type User
} from 'firebase/auth'
import { ref as dbRef, set, update } from 'firebase/database'

type PublicUser = { uid: string; email: string | null }

export const useAuthStore = defineStore('auth', () => {
  const user = ref<PublicUser | null>(null)
  const loading = ref(false)
  const error = ref('')
  const ready = ref(false)

  const isAuthed = computed(() => !!user.value)
  const uid = computed(() => user.value?.uid ?? null)

  function setFromFirebase(u: User | null) {
    user.value = u ? { uid: u.uid, email: u.email } : null
  }

  // вызывать один раз в main.ts
  function initAuthWatcher() {
    if (ready.value) return
    onAuthStateChanged(auth, (u) => {
      setFromFirebase(u)
      ready.value = true
    })
  }

  async function register(email: string, password: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)
      await set(dbRef(db, `users/${res.user.uid}/profile`), { email, createdAt: Date.now() })
      setFromFirebase(res.user)
    } catch (e: any) {
      error.value = e?.message ?? 'Registration failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await signInWithEmailAndPassword(auth, email, password)
      setFromFirebase(res.user)
    } catch (e: any) {
      error.value = e?.message ?? 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  async function changePassword(
    currentEmail: string,
    currentPassword: string,
    newPassword: string
  ) {
    if (!auth.currentUser) throw new Error('Not authenticated')
    const cred = EmailAuthProvider.credential(currentEmail, currentPassword)
    await reauthenticateWithCredential(auth.currentUser, cred)
    await updatePassword(auth.currentUser, newPassword)
    await update(dbRef(db, `users/${auth.currentUser.uid}/profile`), {
      passwordUpdatedAt: Date.now()
    })
  }

  /** корректный выход: разлогинить Firebase + дать сторам переключиться в guest-режим */
  async function logout(opts?: { clearGuest?: boolean }) {
    try {
      await signOut(auth) // <-- ВАЖНО: закрывает сессию в IndexedDB/LocalStorage Firebase
      setFromFirebase(null)

      // По умолчанию гостевые cart/wishlist сохраняем.
      // Если нужно чистить — передай { clearGuest: true }.
      if (opts?.clearGuest) {
        localStorage.removeItem('guest_cart_v1')
        localStorage.removeItem('guest_wishlist_v1')
      }
      // cart/wishlist сами отреагируют на onAuthStateChanged и перейдут в guest.
    } catch (e) {
      console.error('Logout error', e)
    }
  }

  return {
    user,
    loading,
    error,
    ready,
    isAuthed,
    uid,
    initAuthWatcher,
    register,
    login,
    resetPassword,
    changePassword,
    logout
  }
})
