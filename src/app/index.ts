import { createApp as createVueApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { createAppRouter } from './providers/router'
import { initializeDomainStores } from './setup/initializeDomainStores'

export async function bootstrapApp() {
  const app = createVueApp(App)
  const pinia = createPinia()
  app.use(pinia)

  const router = createAppRouter()
  app.use(router)

  await initializeDomainStores(pinia)

  app.mount('#app')
}
