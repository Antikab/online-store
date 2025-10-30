// src/app/providers/router.ts
import type { App } from 'vue'
import { watch } from 'vue'
import type { RouteRecordRaw, Router } from 'vue-router'

import { useSessionStore } from '@entities/session'
import { createAppRouter } from '@shared/config'
import { supabaseClient } from '@shared/api'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@pages/home').then((m) => m.HomePage) },

  // --- AUTH ---
  {
    path: '/login',
    component: () => import('@pages/auth').then((m) => m.LoginPage),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    component: () => import('@pages/auth').then((m) => m.RegisterPage),
    meta: { guestOnly: true }
  },
  {
    path: '/reset-password',
    component: () => import('@pages/auth').then((m) => m.ResetPasswordPage),
    meta: { guestOnly: true }
  },
  {
    // Установка нового пароля по ссылке из письма (Supabase recovery)
    path: '/change-password',
    component: () => import('@pages/auth').then((m) => m.RecoveryChangePasswordPage),
    meta: { guestOnly: true, allowRecovery: true }
  },

  // --- ACCOUNT ---
  {
    path: '/account/change-password',
    component: () => import('@pages/account').then((m) => m.AccountChangePasswordPage),
    meta: { requiresAuth: true }
  },

  // --- SHOP ---
  {
    path: '/catalog/:gender(men|women)',
    component: () => import('@pages/catalog').then((m) => m.CatalogPage)
  },
  { path: '/product/:id', component: () => import('@pages/catalog').then((m) => m.ProductPage) },
  { path: '/cart', component: () => import('@pages/cart').then((m) => m.CartPage) },
  { path: '/wishlist', component: () => import('@pages/wishlist').then((m) => m.WishlistPage) },

  {
    path: '/orders',
    component: () => import('@pages/orders').then((m) => m.OrdersPage),
    meta: { requiresAuth: true }
  },
  {
    path: '/checkout',
    component: () => import('@pages/cart').then((m) => m.CheckoutPage),
    meta: { requiresAuth: true }
  },
  {
    path: '/success',
    component: () => import('@pages/cart').then((m) => m.SuccessPage),
    meta: { requiresAuth: true }
  },

  // --- 404 ---
  { path: '/:pathMatch(.*)*', component: () => import('@pages/not-found').then((m) => m.NotFoundPage) }
]

export function setupRouter(app: App): Router {
  const router = createAppRouter()

  routes.forEach((route) => router.addRoute(route))

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
          const { data } = await supabaseClient.auth.getSession()
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

  app.use(router)
  return router
}
