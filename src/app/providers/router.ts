import { watch } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { supabase } from '@shared/api/supabase'
import { useAuthStore } from '@entities/user'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@pages/product/ui/HomePage.vue') },

  // --- AUTH ---
  { path: '/login', component: () => import('@pages/user/ui/LoginPage.vue'), meta: { guestOnly: true } },
  { path: '/register', component: () => import('@pages/user/ui/RegisterPage.vue'), meta: { guestOnly: true } },
  { path: '/reset-password', component: () => import('@pages/user/ui/ResetPasswordPage.vue'), meta: { guestOnly: true } },
  {
    path: '/change-password',
    component: () => import('@pages/user/ui/RecoveryChangePasswordPage.vue'),
    meta: { guestOnly: true, allowRecovery: true }
  },

  // --- ACCOUNT ---
  {
    path: '/account/change-password',
    component: () => import('@pages/user/ui/AccountChangePasswordPage.vue'),
    meta: { requiresAuth: true }
  },

  // --- SHOP ---
  { path: '/catalog/:gender(men|women)', component: () => import('@pages/product/ui/CatalogPage.vue') },
  { path: '/product/:id', component: () => import('@pages/product/ui/ProductDetailsPage.vue') },
  { path: '/cart', component: () => import('@pages/product/ui/CartPage.vue') },
  { path: '/wishlist', component: () => import('@pages/user/ui/WishlistPage.vue') },
  { path: '/orders', component: () => import('@pages/user/ui/OrdersPage.vue'), meta: { requiresAuth: true } },
  { path: '/checkout', component: () => import('@pages/product/ui/CheckoutPage.vue'), meta: { requiresAuth: true } },
  { path: '/success', component: () => import('@pages/product/ui/CheckoutSuccessPage.vue'), meta: { requiresAuth: true } },

  // --- 404 ---
  { path: '/:pathMatch(.*)*', component: () => import('@pages/post/ui/NotFoundPage.vue') }
]

export function createAppRouter() {
  const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })

  router.beforeEach(async (to) => {
    const auth = useAuthStore()

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

    if (to.meta.requiresAuth && !auth.isAuthed) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    if (to.meta.guestOnly && auth.isAuthed) {
      if (to.meta.allowRecovery) {
        try {
          const { data } = await supabase.auth.getSession()
          const recoverySentAt = data.session?.user?.recovery_sent_at
          if (recoverySentAt) return true
        } catch {
          // ignore: fallback ниже
        }
      }
      return { path: '/' }
    }

    return true
  })

  return router
}
