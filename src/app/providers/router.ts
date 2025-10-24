import { watch } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { supabase } from '@/shared/api/supabaseClient'
import { useAuthStore } from '@/entities/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/pages/home/ui/HomePage.vue') },

  // --- AUTH ---
  { path: '/login', component: () => import('@/pages/auth/login/ui/LoginPage.vue'), meta: { guestOnly: true } },
  {
    path: '/register',
    component: () => import('@/pages/auth/register/ui/RegisterPage.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/reset-password',
    component: () => import('@/pages/auth/reset-password/ui/ResetPasswordPage.vue'),
    meta: { guestOnly: true }
  },
  {
    // Установка нового пароля по ссылке из письма (Supabase recovery)
    path: '/change-password',
    component: () => import('@/pages/auth/change-password/ui/AuthChangePasswordPage.vue'),
    meta: { guestOnly: true, allowRecovery: true }
  },

  // --- ACCOUNT ---
  {
    path: '/account/change-password',
    component: () => import('@/pages/account/change-password/ui/AccountChangePasswordPage.vue'),
    meta: { requiresAuth: true }
  },

  // --- SHOP ---
  {
    path: '/catalog/:gender(men|women)',
    component: () => import('@/pages/catalog/catalog/ui/CatalogPage.vue')
  },
  { path: '/product/:id', component: () => import('@/pages/catalog/product/ui/ProductPage.vue') },
  { path: '/cart', component: () => import('@/pages/cart/cart/ui/CartPage.vue') },
  { path: '/wishlist', component: () => import('@/pages/wishlist/ui/WishlistPage.vue') },

  { path: '/orders', component: () => import('@/pages/orders/ui/OrdersPage.vue'), meta: { requiresAuth: true } },
  {
    path: '/checkout',
    component: () => import('@/pages/cart/checkout/ui/CheckoutPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/success',
    component: () => import('@/pages/cart/success/ui/SuccessPage.vue'),
    meta: { requiresAuth: true }
  },

  // --- 404 ---
  { path: '/:pathMatch(.*)*', component: () => import('@/pages/not-found/ui/NotFoundPage.vue') }
]

export function createAppRouter() {
  const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })

  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (!auth.ready) {
      await new Promise<void>((resolve) => {
        const stop = watch(
          () => auth.ready,
          (isReady) => {
            if (isReady) {
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
          // ignore
        }
      }

      return { path: '/' }
    }

    return true
  })

  return router
}
