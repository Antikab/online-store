// src/app/providers/router.ts
import type { App } from 'vue'
import type { Router } from 'vue-router'

import { createAppRouter } from '@/shared/config/router'

export function setupRouter(app: App): Router {
  const router = createAppRouter()
  app.use(router)
  return router
}
