import './styles/global.css'
import 'vue-sonner/style.css'

import { createApp } from 'vue'
import type { App as VueApp } from 'vue'
import type { Router } from 'vue-router'
import type { Pinia } from 'pinia'

import App from './App.vue'
import { setupRouter } from './providers/router'
import { setupPinia } from './providers/pinia'
import { initAppProcesses } from '@/processes/app-init'

export async function bootstrap() {
  const app = createApp(App)
  const pinia = setupPinia(app)
  const router = setupRouter(app)

  await initAppProcesses()

  app.mount('#app')

  return { app, pinia, router } satisfies {
    app: VueApp
    pinia: Pinia
    router: Router
  }
}
