import type { App } from 'vue'

/**
 * Возвращает i18n-инстанс, если локализация подключена.
 * Сейчас проект не использует vue-i18n, поэтому
 * провайдер отдаёт заглушку для будущей интеграции.
 */
export type AppI18n = {
  install(app: App): void
} | null

export function createI18nInstance(): AppI18n {
  return null
}
