// src/app/bootstrap.ts
import './styles/global.css'
import 'vue-sonner/style.css'
import { createApp } from 'vue'
import App from './entrypoint/App.vue'
import { setupRouter, setupPinia } from './providers'
import { initAppProcesses } from './setup'

export async function bootstrap() {
  const app = createApp(App)
  const pinia = setupPinia(app)
  const router = setupRouter(app)

  await initAppProcesses()

  app.mount('#app')

  return { app, pinia, router }
}
