import { setupApp } from '@app'

const { app, router } = await setupApp()

await router.isReady()
app.mount('#app')
