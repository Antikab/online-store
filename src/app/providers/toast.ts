import type { App } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

export function registerToast(app: App) {
  app.component('AppToaster', Toaster)
}
