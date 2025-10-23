// src/main.ts
import '@/app/styles/main.css'
import 'vue-sonner/style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from '@/app/App.vue'
import router from '@/app/router'
import { bootstrapDomain } from '@/app/providers/bootstrap'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

await bootstrapDomain(pinia)

app.mount('#app')
