# 3D Друкарня — 10-дюймові серверні стійки та HomeLab

Статичний сайт-каталог 3D-друкованих деталей для домашньої серверної
інфраструктури: 10-дюймові серверні стійки (mini rack), корпуси для домашнього
NAS, дискові модулі, кріплення для мережевого обладнання, mini-PC і Raspberry
Pi, полиці, патч-панелі та кабельні органайзери. Побудований на
[Astro](https://astro.build/), публікується на GitHub Pages за адресою
`https://4245877.github.io/3D-Drukarnya/`.

SEO, structured data й доступність для пошукових та AI-систем описані окремо:
**[SEO-AI-SEARCH-SETUP.md](SEO-AI-SEARCH-SETUP.md)**.

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
| `npm run indexnow:dry-run` | Показує, які URL буде надіслано в IndexNow (нічого не надсилає)    |
| `npm run indexnow:submit`  | Ручна відправка URL із `dist/sitemap.xml` в IndexNow               |

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
7. Якщо каталог свідомо розширюється понад P1–P38, оновіть зафіксовані SKU,
   slug і очікуваний порядок у `tests/product-data.test.mjs`.
8. Запустіть `npm run validate:data` і `npm test` — помилки вкажуть файл і поле.
9. Сторінка товару, каталог і `sitemap.xml` оновляться автоматично.

### Runtime-валідація

`src/utils/products.ts` проганяє всі JSON-файли через схему **під час збірки**
(і в dev-режимі). Будь-яке порушення схеми чи унікальності зупиняє
`astro build` з переліком помилок формату `файл: поле — повідомлення`. Тобто
некоректні дані не можуть потрапити в продакшн ані локально, ані через CI.

## Структура сайту

| Маршрут | Кількість | Джерело |
| --- | --- | --- |
| `/` | 1 | [`src/pages/index.astro`](src/pages/index.astro) |
| `/catalog/` | 1 | [`src/pages/catalog/index.astro`](src/pages/catalog/index.astro) |
| `/catalog/<slug>/` | 9 | [`src/pages/catalog/[category].astro`](src/pages/catalog/[category].astro) з [`src/data/categories.mjs`](src/data/categories.mjs) |
| `/guides/` | 1 | [`src/pages/guides/index.astro`](src/pages/guides/index.astro) |
| `/guides/<slug>/` | 6 | сторінки в [`src/pages/guides/`](src/pages/guides/) + [`src/layouts/GuideLayout.astro`](src/layouts/GuideLayout.astro) |
| `/about/` | 1 | [`src/pages/about.astro`](src/pages/about.astro) |
| `/en/` | 1 | [`src/pages/en/index.astro`](src/pages/en/index.astro) |
| `/products/<slug>/` | 38 | [`src/pages/products/[slug].astro`](src/pages/products/[slug].astro) з JSON товарів |

### Модулі даних

| Файл | За що відповідає |
| --- | --- |
| [`src/data/site.config.mjs`](src/data/site.config.mjs) | **Єдине** джерело хоста, base path, назви бренду, зовнішніх профілів і ключа IndexNow. Його імпортує навіть `astro.config.mjs`, тож переїзд на власний домен — це правка двох рядків. |
| [`src/data/categories.mjs`](src/data/categories.mjs) | Опис 9 категорій: URL-slug, заголовки, тексти, FAQ, перелінковка. Поле `name` має збігатися з `CATALOG_CATEGORIES` у схемі товарів. |
| [`src/data/guides.mjs`](src/data/guides.mjs) | Метадані 6 гайдів: `<title>`, опис, коротка відповідь, дати, теми, FAQ, перелінковка. Проза кожного гайда — у його сторінці. |
| [`src/data/routes.mjs`](src/data/routes.mjs) | Таблиця нетоварних маршрутів. З неї будується `sitemap.xml`, її ж перевіряють `check:build` і тести. |
| [`src/data/i18n.mjs`](src/data/i18n.mjs) | Набір `hreflang` для сторінок, у яких є переклад (зараз `/` ↔ `/en/`). |
| [`src/utils/schema.mjs`](src/utils/schema.mjs) | Генератори вузлів JSON-LD зі стабільними `@id`, спільними для всіх сторінок. |
| [`src/utils/urls.ts`](src/utils/urls.ts) | `href()` для внутрішніх посилань і `absoluteUrl()` для canonical/JSON-LD/sitemap. |

### Як додати категорію або гайд

Категорія: додайте назву в `CATALOG_CATEGORIES`
([`src/data/product.schema.mjs`](src/data/product.schema.mjs)) **і** запис у
`CATEGORIES` ([`src/data/categories.mjs`](src/data/categories.mjs)). Сторінка,
sitemap, футер і хлібні крихти зʼявляться автоматично; `npm run validate:data`
падає, якщо категорія існує лише в одному з двох місць.

Гайд: додайте запис у `GUIDES` ([`src/data/guides.mjs`](src/data/guides.mjs)) і
створіть `src/pages/guides/<slug>.astro`, який рендерить `<GuideLayout
slug="<slug>">` з прозою всередині. Посилання на товари ставте через
`<ProductLink sku="P12" />` — компонент резолвить SKU у справжній slug і назву,
тож зламане посилання зупиняє збірку.

Будь-яке перехресне посилання на неіснуючу категорію чи гайд — помилка збірки,
а не тихо порожній блок.

## Тести

`npm test` запускає вбудований раннер Node.js (`node --test`, без додаткових
залежностей):

- `tests/product-data.test.mjs` — реальні дані відповідають схемі; набір
  P1–P38, slug/URL, категорії, сімейства й merchandising-порядок зафіксовані;
  ціни та зображення коректні; свідомо зіпсований товар
  (порожній slug, `javascript:`-зображення, одруківки в ключах тощо)
  відхиляється.
- `tests/description.test.mjs` — парсер описів: абзаци, марковані списки
  (включно з реальним текстом `product-2`), українські символи, відсутність
  HTML-инʼєкцій.
- `tests/seo-title.test.mjs` — SEO-`<title>` товарних сторінок: унікальність
  на реальних даних, розумна довжина, відсутність обрізань посеред слова.
- `tests/content-architecture.test.mjs` — контентна архітектура без збірки:
  одна посадкова сторінка на кожну категорію каталогу й жодних «сиріт» у
  жодному напрямку, безпечні та унікальні slug, повнота й унікальність
  метаданих (довжина description, наявність FAQ і короткої відповіді),
  відмова резолверів на невідомих slug, повнота таблиці маршрутів і те, що
  `lastmod` публікується лише там, де є справжня дата зміни.
- `tests/build-output.test.mjs` — виконує справжній production build і
  перевіряє порядок карток, перші вісім товарів, сторінку кожного товару,
  кожної категорії та кожного гайда; що `sitemap.xml` точно збігається з
  набором індексованих маршрутів і не містить неканонічних URL; що
  `robots.txt` і файл ключа IndexNow опубліковані; що набір `hreflang`
  взаємний; що в HTML немає inline-обробників подій. Після цього проганяє
  повний набір перевірок артефакту (`scripts/check-build.mjs`, він же
  `npm run check:build`): рівно один `<h1>` на сторінку, canonical, що
  вказує на власний URL сторінки, збіг `og:url` із canonical, коректний
  `noindex` лише на 404, унікальність `<title>`/canonical/description,
  валідність усіх JSON-LD, збіг `FAQPage` і `BreadcrumbList` із видимим
  вмістом, відповідність видимої ціни/наявності structured data, внутрішні
  посилання та якорі, наявність fallback для зображень, збереження логотипа
  й OG-зображення, відсутність небезпечних URL-схем і порожніх файлів.

## Деплой на GitHub Pages

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
Запускається при push у `main`, щотижня за розкладом (ціни SKUFNYA та дата
`priceValidUntil` запікаються під час збірки) та вручну.

Job `build` (тільки `contents: read`): `npm ci` → `npm audit
--audit-level=high` → `npm run validate:data` → `npm run check` → `npm test` →
`npm run build` → `npm run check:build` → завантаження артефакту Pages. Падіння будь-якого кроку
зупиняє деплой. Job `deploy` — єдиний із правами `pages: write` +
`id-token: write`. Job `indexnow` виконується після успішного деплою й надсилає
URL зі згенерованого sitemap у IndexNow (Bing, Yandex, Seznam, Naver, Yep);
на щотижневому cron він пропускається, а помилка відправки не валить уже
живий деплой — деталі в [SEO-AI-SEARCH-SETUP.md](SEO-AI-SEARCH-SETUP.md).
Усі сторонні actions закріплені за повними commit SHA;
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
