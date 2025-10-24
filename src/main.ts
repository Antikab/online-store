import { createApp } from 'vue'
import { App, setupApp } from '@app'
import '@app/styles/main.css'

const app = createApp(App)
await setupApp(app)
app.mount('#app')
