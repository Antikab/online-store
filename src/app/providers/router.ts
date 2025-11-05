import type { App } from 'vue'
import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes, ROUTE_NAMES } from '@shared/config'
import { useSessionStore } from '@entities/session'
import { supabaseClient } from '@shared/api'

export function setupRouter(app: App) {
  const router = createRouter({
    history: createWebHistory(),
    routes
  })

  router.beforeEach(async (to) => {
    const auth = useSessionStore()

    // ждем готовность стора
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

    if (to.meta.requiresAuth && !auth.isAuthed)
      return { name: ROUTE_NAMES.AUTH_LOGIN, query: { redirect: to.fullPath } }

    if (to.meta.guestOnly && auth.isAuthed) {
      if (to.meta.allowRecovery) {
        try {
          const { data } = await supabaseClient.auth.getSession()
          const recoverySentAt = data.session?.user?.recovery_sent_at
          if (recoverySentAt) return true
        } catch {}
      }
      return { name: ROUTE_NAMES.HOME }
    }

    return true
  })

  app.use(router)
  return router
}
