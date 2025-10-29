import { watch } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { supabase } from '@/shared/api/supabase/client'
import { useSessionStore } from '@/entities/session'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/pages/home/ui/HomePage.vue') },

  // --- AUTH ---
  { path: '/login', component: () => import('@/pages/auth/ui/LoginPage.vue'), meta: { guestOnly: true } },
  {
    path: '/register',
    component: () => import('@/pages/auth/ui/RegisterPage.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/reset-password',
    component: () => import('@/pages/auth/ui/ResetPasswordPage.vue'),
    meta: { guestOnly: true }
  },
  {
    // Установка нового пароля по ссылке из письма (Supabase recovery)
    path: '/change-password',
    component: () => import('@/pages/auth/ui/RecoveryChangePasswordPage.vue'),
    meta: { guestOnly: true, allowRecovery: true }
  },

  // --- ACCOUNT ---
  {
    path: '/account/change-password',
    component: () => import('@/pages/account/ui/AccountChangePasswordPage.vue'),
    meta: { requiresAuth: true }
  },

  // --- SHOP ---
  { path: '/catalog/:gender(men|women)', component: () => import('@/pages/catalog/ui/CatalogPage.vue') },
  { path: '/product/:id', component: () => import('@/pages/catalog/ui/ProductPage.vue') },
  { path: '/cart', component: () => import('@/pages/cart/ui/CartPage.vue') },
  { path: '/wishlist', component: () => import('@/pages/wishlist/ui/WishlistPage.vue') },

  { path: '/orders', component: () => import('@/pages/orders/ui/OrdersPage.vue'), meta: { requiresAuth: true } },
  {
    path: '/checkout',
    component: () => import('@/pages/cart/ui/CheckoutPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/success',
    component: () => import('@/pages/cart/ui/SuccessPage.vue'),
    meta: { requiresAuth: true }
  },

  // --- 404 ---
  { path: '/:pathMatch(.*)*', component: () => import('@/pages/not-found/ui/NotFoundPage.vue') }
]

export function createAppRouter() {
  const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })

  router.beforeEach(async (to) => {
    const auth = useSessionStore()

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

    if (to.meta.requiresAuth && !auth.isAuthed)
      return { path: '/login', query: { redirect: to.fullPath } }

    if (to.meta.guestOnly && auth.isAuthed) {
      if (to.meta.allowRecovery) {
        try {
          const { data } = await supabase.auth.getSession()
          const recoverySentAt = data.session?.user?.recovery_sent_at
          if (recoverySentAt) return true
        } catch {
          // ignore and fallback below
        }
      }
      return { path: '/' }
    }

    return true
  })

  return router
}
