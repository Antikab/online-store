import { watch } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { supabase } from '@/supabase'

import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/Home.vue') },

  // --- AUTH ---
  { path: '/login', component: () => import('@/views/auth/Login.vue'), meta: { guestOnly: true } },
  {
    path: '/register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/reset-password',
    component: () => import('@/views/auth/ResetPassword.vue'),
    meta: { guestOnly: true }
  },
  {
    // Установка нового пароля по ссылке из письма (Supabase recovery)
    path: '/change-password',
    component: () => import('@/views/auth/ChangePassword.vue'),
    meta: { guestOnly: true, allowRecovery: true } // 👈 добавляем метку
  },

  // --- ACCOUNT ---
  {
    path: '/account/change-password',
    component: () => import('@/views/account/ChangePassword.vue'),
    meta: { requiresAuth: true }
  },

  // --- SHOP ---
  { path: '/catalog/:gender(men|women)', component: () => import('@/views/Catalog.vue') },
  { path: '/product/:id', component: () => import('@/views/Product.vue') },
  { path: '/cart', component: () => import('@/views/Cart.vue') },
  { path: '/wishlist', component: () => import('@/views/Wishlist.vue') },

  { path: '/orders', component: () => import('@/views/Orders.vue'), meta: { requiresAuth: true } },
  {
    path: '/checkout',
    component: () => import('@/views/Checkout.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/success',
    component: () => import('@/views/Success.vue'),
    meta: { requiresAuth: true }
  },

  // --- 404 ---
  { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // дождаться инициализации auth watcher
  if (!auth.ready) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        () => auth.ready,
        (v) => {
          if (v) {
            stop()
            resolve()
          }
        },
        { immediate: true }
      )
    })
  }

  // ---------------------
  // 🔐 1. Проверка requiresAuth
  // ---------------------
  if (to.meta.requiresAuth && !auth.isAuthed)
    return { path: '/login', query: { redirect: to.fullPath } }

  // ---------------------
  // 🚫 2. Проверка guestOnly
  // ---------------------
  if (to.meta.guestOnly && auth.isAuthed) {
    // ✅ Разрешаем доступ к странице восстановления пароля (recovery session)
    if (to.meta.allowRecovery) {
      try {
        const { data } = await supabase.auth.getSession()
        const recoverySentAt = data.session?.user?.recovery_sent_at
        if (recoverySentAt) return true // это реальная recovery-сессия
      } catch {
        // если supabase не вернул сессию, fallback
      }
    }
    // для всех остальных guestOnly — редирект домой
    return { path: '/' }
  }

  return true
})

export default router
