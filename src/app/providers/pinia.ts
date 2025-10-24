import { createPinia } from 'pinia'

/**
 * Создаёт экземпляр Pinia для всего приложения.
 * Держим в провайдере, чтобы при необходимости
 * легко настраивать плагины или middleware.
 */
export function createAppPinia() {
  return createPinia()
}
