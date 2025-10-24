# Архитектура проекта по Feature-Sliced Design (2025)

## Общая модель

Проект следует вертикальной декомпозиции **Layers → Slices → Segments**.
Каждый слой содержит доменные _slices_ (`user`, `category`, `product`, `post`).
Внутри каждого slice код разделён на _segments_ (`ui`, `model`, `api`, `lib`, `config`) и
объединён публичными API `index.ts`.

```
src/
├── app/           # точка входа, провайдеры, глобальные стили и bootstrap
├── pages/         # страницы (router level)
├── widgets/       # композиционные блоки с UI и состоянием уровня страницы
├── features/      # бизнес-сценарии/интеракции
├── entities/      # доменные модели и хранилища
└── shared/        # переиспользуемая инфраструктура (ui, lib, api, types)
```

## Роли слоёв

- **app/** — создание приложения, глобальные провайдеры (router, pinia, toast, i18n), стили и функция `setupApp`.
- **pages/** — конечные маршруты. Каждый slice представляет группу страниц по домену (например `product/ui/ProductDetailsPage.vue`).
- **widgets/** — композиционные блоки интерфейса (например, `user/ui/Header`).
- **features/** — прикладные сценарии (корзина, желания, купоны, аутентификация). Slice определяется доменом, сегменты разделяют UI/модели/инфраструктуру.
- **entities/** — хранилища и модели данных (`useAuthStore`, `useProductsStore`). Slice соответствует бизнес-сущности.
- **shared/** — общие компоненты, утилиты, типы, провайдеры API.

## Примеры slices и segments

- `features/product/model/cart.store.ts` — логика корзины (segment `model`).
- `pages/user/ui/LoginPage.vue` — страница входа (segment `ui`).
- `widgets/user/ui/Header/Header.vue` — виджет шапки.
- `entities/product/model/products.store.ts` — данные каталога.

Каждый segment имеет свой `index.ts`, чтобы экспортировать только публичные сущности.

## Правила импортов

- Используем алиасы (`@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`).
- Слой может зависеть только от слоёв «ниже»: `app → pages → widgets → features → entities → shared`.
- Запрещены обратные ссылки (например, `entities` не импортирует код из `features`).
- Внутри одного слоя импортируются только public API соседних slices (`index.ts`).

## Public API

- **Slices**: `src/<layer>/<slice>/index.ts` объединяет экспорты сегментов.
- **Segments**: `ui/index.ts`, `model/index.ts`, `api/index.ts`, `lib/index.ts`.
- **Layers**: `src/<layer>/index.ts` агрегирует все slice. Например `@features/product` экспортирует `model/index.ts` (cart, wishlist и т.д.).
- **Пример**: `import { useCartStore } from '@features/product'` получает store из `model/index.ts`.

## Типы

- Локальные типы (узко применяемые) живут в своих slices, рядом с реализацией (`model/types.ts`).
- Глобальные типы — в `src/shared/types`. Файл `domain.ts` экспортирует `Product`, `CartItem`, `DeliveryForm` и т.д. Публичный экспорт — через `src/shared/types/index.ts`.
- Использование: `import type { Product } from '@shared/types'`.

## Миграция существующего кода

1. **Перенос файлов**: компоненты, стора и страницы перемещены в слои FSD. Старые каталоги (`components`, `stores`, `views`, `composables`, `supabase.ts`, `types.ts`) удалены.
2. **Актуализация импортов**: все пути обновлены на алиасы слоя/среза. Созданы barrel-файлы `index.ts` во всех сегментах.
3. **Провайдеры**: router, pinia, toast, i18n оформлены в `app/providers`. Bootstrap логика вынесена в `setup/setupApp.ts`.
4. **Shared слой**: базовые UI (`BaseButton`, `BaseInput`, `BaseLoader`), supabase-клиент, утилиты и глобальные типы перенесены в `shared`.
5. **Документация**: текущее описание архитектуры и правила импорта сохранены в `STRUCTURE.md`.

## Поддержка и развитие

- При добавлении новой функциональности создавайте slice или segment внутри соответствующего слоя, экспортируйте через `index.ts`.
- Следите за зависимостями: shared не импортирует из entities, а entities не знают о features.
- Для общих типов и утилит используйте `@shared`. Локальные типы/хелперы держите в slice.
- Перед добавлением нового alias обновляйте `vite.config.ts` и `tsconfig.app.json`.
- Обновляйте документ `STRUCTURE.md` при введении новых слоёв/срезов.
