// router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { watch } from 'vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/Home.vue') },

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
    path: '/change-password',
    component: () => import('@/views/auth/ChangePassword.vue'),
    meta: { requiresAuth: true }
  },

  {
    path: '/catalog/:gender(men|women)',
    component: () => import('@/views/Catalog.vue')
  },
  {
    path: '/product/:id',
    component: () => import('@/views/Product.vue')
  },
  {
    path: '/cart',
    component: () => import('@/views/Cart.vue')
  },
  {
    path: '/wishlist',
    component: () => import('@/views/Wishlist.vue')
  },
  {
    path: '/orders',
    component: () => import('@/views/Orders.vue'),
    meta: { requiresAuth: true }
  },
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
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/NotFound.vue')
  }
]

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

  if (to.meta.requiresAuth && !auth.isAuthed)
    return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.guestOnly && auth.isAuthed) return { path: '/' }
  return true
})

export default router
