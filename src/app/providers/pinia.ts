import type { App } from 'vue'
import { createPinia } from 'pinia'
import type { Pinia } from 'pinia'

export function setupPinia(app: App): Pinia {
  const pinia = createPinia()
  app.use(pinia)
  return pinia
}
