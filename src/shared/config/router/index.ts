// Настройки и фабрика роутера приложения (чистый слой shared)
import { createRouter, createWebHistory } from 'vue-router'

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: []
  })
}
