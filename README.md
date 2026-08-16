# 3D Друкарня — каталог FDM 3D-друку

Статичний сайт-каталог прикладів FDM 3D-друку (Київ): корпуси для електроніки,
стійки для HomeLab, кріплення, прототипи. Побудований на [Astro](https://astro.build/),
публікується на GitHub Pages за адресою
`https://4245877.github.io/3D-Drukarnya/`.

## Вимоги

- **Node.js ≥ 22.12** (рекомендовано актуальний LTS 22.x; зафіксовано в
  `engines` у `package.json`). Astro 7 не працює на старіших версіях.
- npm (постачається разом із Node.js).

## Команди

| Команда                 | Що робить                                                            |
| ----------------------- | -------------------------------------------------------------------- |
| `npm ci`                | Чиста відтворювана установка залежностей із `package-lock.json`      |
| `npm run dev`           | Dev-сервер із живим перезавантаженням                                 |
| `npm run validate:data` | Перевірка всіх JSON-файлів товарів за схемою (ненульовий код при помилці) |
| `npm run check`         | Перевірка типів та діагностика Astro (`astro check`)                  |
| `npm test`              | Тести (`node --test`): схема даних + реальний production build        |
| `npm run build`         | Production-збірка у `dist/`                                           |
| `npm run check:build`   | Перевірки готового артефакту в `dist/` (метадані, JSON-LD, посилання) |
| `npm run preview`       | Локальний перегляд зібраного сайту                                    |
| `npm audit`             | Перевірка залежностей на відомі вразливості                           |

## Дані товарів

Кожен товар — окремий JSON-файл у [`src/data/products/`](src/data/products/).
Контракт даних описаний **однією** схемою (Zod) у
[`src/data/product.schema.mjs`](src/data/product.schema.mjs) — її використовують
і сайт під час збірки, і `npm run validate:data`, і тести. Правила не
дублюються.

Поля:

| Поле               | Тип        | Обовʼязкове | Обмеження                                                     |
| ------------------ | ---------- | ----------- | ------------------------------------------------------------- |
| `sku`              | string     | так         | `P` + додатне число (`P1`…); унікальний серед усіх товарів     |
| `slug`             | string     | так         | `[a-z0-9]+(-[a-z0-9]+)*`, унікальний серед усіх товарів        |
| `title`            | string     | так         | непорожній, унікальний (без урахування регістру)               |
| `shortDescription` | string     | так         | непорожній                                                     |
| `description`      | string     | так         | непорожній; абзаци розділяються `\n\n`                         |
| `merchandisingPriority` | integer | так       | невідʼємне число; більше значення піднімає товар у каталозі     |
| `featured`         | boolean    | ні (`false`) | додає товар до фільтра «Популярне / почати звідси»             |
| `familyId`         | string     | ні          | спільний slug-подібний ID для споріднених товарів/варіантів     |
| `price`            | number     | так         | скінченне додатне число (грн); `Offer.price` при `exact`, `AggregateOffer.lowPrice` при `from` |
| `priceType`        | enum       | ні (`exact`) | `exact` \| `from`; керує написом «Ціна» / «Ціна від» на картці, сторінці й формою JSON-LD |
| `availability`     | enum       | ні (`unconfirmed`) | `in_stock` \| `made_to_order` \| `unavailable` \| `unconfirmed`; при `unconfirmed` `availability` не публікується в JSON-LD |
| `publishOffer`     | boolean    | ні (`true`) | `false` повністю прибирає `Offer`/`AggregateOffer` із JSON-LD, поки торгові параметри не підтверджені |
| `images`           | string[]   | так         | непорожній масив; лише `https://`-URL або безпечний локальний шлях |
| `category`         | enum       | так         | одна з категорій `CATALOG_CATEGORIES` у схемі                  |
| `material`         | string     | ні          | непорожній                                                     |
| `leadTime`         | string     | ні          | непорожній                                                     |
| `priceNote`        | string     | ні          | непорожній                                                     |
| `orderUrl`         | string     | ні          | абсолютний `https://`-URL на дозволеному хості (`olx.ua` і піддомени); інші схеми/хости — помилка |
| `commercialRightsStatus` | enum | ні (`review_required`) | інформаційний статус прав; не керує сортуванням або видимістю |
| `photoRightsStatus` | enum      | ні (`review_required`) | окремий інформаційний статус прав на фото; не ховає зображення |
| `author`           | string     | ні          | автор вихідної моделі для атрибуції                            |
| `sourceUrl`        | string     | ні          | абсолютне `https://`-посилання на оригінальну публікацію       |
| `license`          | string     | ні          | назва ліцензії                                                 |
| `licenseUrl`       | string     | ні          | абсолютне `https://`-посилання на текст ліцензії               |
| `attributionRequired` | boolean | ні (`false`) | явна ознака необхідності атрибуції                             |
| `variantSummary`   | string     | ні          | непорожній                                                     |
| `variants`         | object[]   | ні          | непорожній масив `{ name, description, badge? }`               |
| `safetyWarnings`   | object[]   | ні          | непорожній масив `{ level: 'notice'|'critical', title?, text }`; показується помітним блоком на сторінці товару |

Невідомі ключі (наприклад, одруківка `pirce` замість `price`) — **помилка
валідації**, а не попередження.

Порядок каталогу визначається лише `merchandisingPriority` за спаданням;
при однаковому значенні використовується числова частина `sku`. Поля
`featured`, `commercialRightsStatus` і `photoRightsStatus` порядок не змінюють.
`featured` визначає лише належність до однойменного фільтра; статуси прав не
впливають ані на загальний каталог, ані на видимість товару.

Опис (`description`) підтримує прості марковані списки: рядки, що починаються
з `- `, рендеряться як `<ul>` (парсер — `src/utils/description.mjs`, без
`set:html`).

### Як додати новий товар

1. Створіть `src/data/products/product-N.json` за структурою вище.
2. Додайте унікальний `sku` формату `P<number>` і не змінюйте його після публікації.
3. Придумайте унікальний `slug` — він стане URL сторінки
   (`/3D-Drukarnya/products/<slug>/`).
4. Оберіть `category` і задайте `merchandisingPriority`; залишайте проміжок між
   пріоритетами, щоб товар можна було переставити без зміни всього каталогу.
5. Додайте щонайменше одне зображення: `https://`-URL або файл у
   `public/images/products/...` та локальний шлях до нього.
6. Заповніть відомі поля автора/джерела/ліцензії та окремі статуси прав на
   модель і фото; непідтверджені права залишайте `review_required`.
7. Якщо каталог свідомо розширюється понад P1–P37, оновіть зафіксовані SKU,
   slug і очікуваний порядок у `tests/product-data.test.mjs`.
8. Запустіть `npm run validate:data` і `npm test` — помилки вкажуть файл і поле.
9. Сторінка товару, каталог і `sitemap.xml` оновляться автоматично.

### Runtime-валідація

`src/utils/products.ts` проганяє всі JSON-файли через схему **під час збірки**
(і в dev-режимі). Будь-яке порушення схеми чи унікальності зупиняє
`astro build` з переліком помилок формату `файл: поле — повідомлення`. Тобто
некоректні дані не можуть потрапити в продакшн ані локально, ані через CI.

## Тести

`npm test` запускає вбудований раннер Node.js (`node --test`, без додаткових
залежностей):

- `tests/product-data.test.mjs` — реальні дані відповідають схемі; набір
  P1–P37, slug/URL, категорії, сімейства й merchandising-порядок зафіксовані;
  ціни та зображення коректні; свідомо зіпсований товар
  (порожній slug, `javascript:`-зображення, одруківки в ключах тощо)
  відхиляється.
- `tests/description.test.mjs` — парсер описів: абзаци, марковані списки
  (включно з реальним текстом `product-2`), українські символи, відсутність
  HTML-инʼєкцій.
- `tests/seo-title.test.mjs` — SEO-`<title>` товарних сторінок: унікальність
  на реальних даних, розумна довжина, відсутність обрізань посеред слова.
- `tests/build-output.test.mjs` — виконує справжній production build і
  перевіряє порядок карток, перші вісім товарів, сторінку кожного товару та
  те, що `sitemap.xml` містить
  усі очікувані URL і що в HTML немає inline-обробників подій; після цього
  проганяє повний набір перевірок артефакту (`scripts/check-build.mjs`, він же
  `npm run check:build`): унікальність `<title>`/canonical/description,
  валідність усіх JSON-LD, відповідність видимої ціни/наявності/FAQ
  structured data, внутрішні посилання та якорі, наявність fallback для
  зображень, збереження логотипа й OG-зображення, відсутність небезпечних
  URL-схем і порожніх файлів.

## Деплой на GitHub Pages

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
Запускається при push у `main`, щотижня за розкладом (ціни SKUFNYA та дата
`priceValidUntil` запікаються під час збірки) та вручну.

Job `build` (тільки `contents: read`): `npm ci` → `npm audit
--audit-level=high` → `npm run validate:data` → `npm run check` → `npm test` →
`npm run build` → `npm run check:build` → завантаження артефакту Pages. Падіння будь-якого кроку
зупиняє деплой. Job `deploy` — єдиний із правами `pages: write` +
`id-token: write`. Усі сторонні actions закріплені за повними commit SHA;
`concurrency` скасовує застарілий незавершений запуск. Оскільки всі залежності
проєкту — build-time (сайт статичний), аудит блокує деплой лише на
high/critical.

### Локальне відтворення CI

```sh
npm ci
npm audit --audit-level=high
npm run validate:data
npm run check
npm test
npm run build
```

## Обмеження GitHub Pages: HTTP-заголовки

GitHub Pages **не дозволяє налаштовувати власні HTTP-заголовки відповіді**.
Тому:

- `Content-Security-Policy`, `X-Frame-Options`, `Permissions-Policy`,
  `Strict-Transport-Security` встановити неможливо. Ми свідомо **не** додаємо
  їхні `<meta>`-«еквіваленти», які браузери не підтримують (це створювало б
  хибне відчуття захисту).
- Єдина політика зі стандартизованою in-document формою —
  `<meta name="referrer" content="strict-origin-when-cross-origin">` — додана
  в `Layout.astro`.
- Сайт підготовлений до строгої CSP на майбутнє: inline-обробників подій немає
  (`onerror` замінено на JS-обробник), скрипти та стилі виносяться в зовнішні
  файли (`inlineStylesheets: 'never'`, `assetsInlineLimit: 0`). Єдиний
  inline-`<script>` — JSON-LD (`application/ld+json`), який не виконується і
  екранується через `toJsonLd`. Якщо сайт переїде на хостинг із підтримкою
  заголовків (Cloudflare Pages, Netlify), строгу CSP можна буде ввімкнути
  без переробки розмітки.

## Commit-повідомлення

- Коротка тема (до ~65 символів) у наказовому способі: *що* робить commit —
  наприклад, `Add product data validation`, `Pin GitHub Actions to commit SHA`.
- За потреби — порожній рядок і тіло з поясненням, *чому* зміна потрібна.
- Один commit — одна логічна зміна. Не використовуйте беззмістовні
  повідомлення на кшталт `123` або `fix`.
