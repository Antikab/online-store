import { watch } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { supabase } from '@shared/api/supabase'
import { useAuthStore } from '@entities/user'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@pages/post').then((m) => m.HomePage) },

  { path: '/login', component: () => import('@pages/user').then((m) => m.LoginPage), meta: { guestOnly: true } },
  { path: '/register', component: () => import('@pages/user').then((m) => m.RegisterPage), meta: { guestOnly: true } },
  { path: '/reset-password', component: () => import('@pages/user').then((m) => m.ResetPasswordPage), meta: { guestOnly: true } },
  {
    path: '/change-password',
    component: () => import('@pages/user').then((m) => m.AuthChangePasswordPage),
    meta: { guestOnly: true, allowRecovery: true }
  },

  {
    path: '/account/change-password',
    component: () => import('@pages/user').then((m) => m.ChangePasswordPage),
    meta: { requiresAuth: true }
  },

  { path: '/catalog/:gender(men|women)', component: () => import('@pages/category').then((m) => m.CatalogPage) },
  { path: '/product/:id', component: () => import('@pages/product').then((m) => m.ProductDetailsPage) },
  { path: '/cart', component: () => import('@pages/product').then((m) => m.CartPage) },
  { path: '/wishlist', component: () => import('@pages/product').then((m) => m.WishlistPage) },
  { path: '/orders', component: () => import('@pages/user').then((m) => m.OrdersPage), meta: { requiresAuth: true } },
  { path: '/checkout', component: () => import('@pages/product').then((m) => m.CheckoutPage), meta: { requiresAuth: true } },
  { path: '/success', component: () => import('@pages/product').then((m) => m.CheckoutSuccessPage), meta: { requiresAuth: true } },

  { path: '/:pathMatch(.*)*', component: () => import('@pages/post').then((m) => m.NotFoundPage) }
]

export function createAppRouter() {
  const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })

  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (!auth.ready) {
      await new Promise<void>((resolve) => {
        const stop = watch(
          () => auth.ready,
          (ready) => {
            if (ready) {
              stop()
              resolve()
            }
          },
          { immediate: true }
        )
      })
    }

    if (to.meta.requiresAuth && !auth.isAuthed) return { path: '/login', query: { redirect: to.fullPath } }

    if (to.meta.guestOnly && auth.isAuthed) {
      if (to.meta.allowRecovery) {
        try {
          const { data } = await supabase.auth.getSession()
          const recoverySentAt = data.session?.user?.recovery_sent_at
          if (recoverySentAt) return true
        } catch {
          /* ignore */
        }
      }
      return { path: '/' }
    }

    return true
  })

  return router
}
