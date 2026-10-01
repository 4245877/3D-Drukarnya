// Four buyer-facing sections, shared by navigation, landing pages and SEO.
// Category names must match the product schema; product specifications live
// in their JSON files. Retired URLs are defined in category-redirects.mjs.
import { CATALOG_CATEGORIES } from './product.schema.mjs';

/**
 * @typedef {object} CategoryDefinition
 * @property {string} name
 * @property {string} slug
 * @property {string} shortLabel
 * @property {string} title
 * @property {string} heading
 * @property {string} description
 * @property {string} lead
 * @property {string[]} body
 * @property {string[]} highlights
 * @property {{question: string, answer: string}[]} faq
 * @property {string[]} relatedCategories
 * @property {string[]} relatedGuides
 */

/** @type {CategoryDefinition[]} */
export const CATEGORIES = [
  {
    "name": "Стійки та основи",
    "slug": "10-inch-server-rack",
    "shortLabel": "Стійки та основи",
    "title": "Серверні стійки та основи для HomeLab — 10-дюймові каркаси",
    "heading": "Стійки та основи",
    "description": "Модульні 10-дюймові стійки для HomeLab, посилені каркаси та комплект поперечок Lab Rax для 19-дюймового формату. 3D-друк на замовлення в Києві.",
    "lead": "Оберіть каркас для домашньої лабораторії: компактну модульну 10-дюймову стійку, посилену KWS Rack v.2 або поперечки Lab Rax для переходу до 19-дюймового формату.",
    "body": [
      "Почніть із розмірів обладнання та потрібної висоти стійки. У картках товарів зазначені доступні конфігурації, матеріал і особливості складання.",
      "Кріплення під конкретні пристрої зібрані в розділі «Кріплення для обладнання». Полиці, шухляди, патч-панелі та кабельні органайзери — в «Аксесуарах для стійок»."
    ],
    "highlights": [
      "Модульні 10-дюймові каркаси для HomeLab",
      "Посилена стійка KWS Rack v.2",
      "Поперечки Lab Rax для 19-дюймової стійки"
    ],
    "faq": [
      {
        "question": "З чого почати вибір стійки?",
        "answer": "Визначте ширину, глибину та висоту пристроїв, які плануєте встановити. Зіставте їх із характеристиками каркаса, а потім підберіть кріплення або полицю під обладнання."
      },
      {
        "question": "Чи входять кріплення для пристроїв у комплект?",
        "answer": "Склад комплекту зазначений на сторінці конкретної стійки. Кріплення для роутерів, mini-PC, Raspberry Pi та блоків живлення можна обрати окремо в розділі «Кріплення для обладнання»."
      }
    ],
    "relatedCategories": [
      "equipment-mounts",
      "rack-accessories"
    ],
    "relatedGuides": [
      "10-inch-vs-19-inch-rack",
      "rack-units-1u-2u-3u",
      "homelab-starter-rack"
    ]
  },
  {
    "name": "Корпуси та дискові модулі",
    "slug": "cases-and-storage",
    "shortLabel": "Корпуси та дискові модулі",
    "title": "Корпуси для NAS і ПК, дискові модулі та адаптери HDD",
    "heading": "Корпуси та дискові модулі",
    "description": "Корпуси для домашнього NAS, відкритий корпус ПК, корпус лабораторного блока живлення, HDD-модулі, кошики та адаптери для дисків. 3D-друк на замовлення.",
    "lead": "Тут зібрані корпуси для NAS, ПК і лабораторного блока живлення, а також модулі, кошики та адаптери для накопичувачів. Обирайте за платою, моделлю mini-PC та кількістю дисків.",
    "body": [
      "Для NAS на базі mini-PC є корпуси під Lenovo ThinkCentre Tiny, Intel NUC і Dell Wyse 5070. Для збірки на окремій платі — корпуси Mini-ITX; для ПК — відкритий корпус із підтримкою ATX, mATX та Mini-ITX.",
      "Якщо корпус уже є, перегляньте дискові модулі, тримачі HDD та адаптер 3.5-дюймового диска у 5.25-дюймовий відсік. Формат дисків, кількість місць і спосіб монтажу вказані на сторінках товарів.",
      "Корпус лабораторного блока живлення призначений для збірки на базі ATX. Тримачі готових блоків живлення для стійки розміщені в розділі «Кріплення для обладнання»."
    ],
    "highlights": [
      "NAS-корпуси під mini-PC та Mini-ITX",
      "Дискові модулі, кошики й тримачі HDD/SSD",
      "Адаптер диска 3.5\" у відсік 5.25\"",
      "Відкритий корпус ПК і корпус лабораторного блока живлення"
    ],
    "faq": [
      {
        "question": "Коли потрібен корпус, а коли дисковий модуль?",
        "answer": "Корпус обирають для збірки системи з платою або mini-PC, дисками та охолодженням. Окремий дисковий модуль, тримач або адаптер потрібен, коли треба розмістити накопичувачі в наявній збірці."
      },
      {
        "question": "Як перевірити сумісність із дисками та платою?",
        "answer": "Перегляньте характеристики конкретного товару: формат і кількість дисків, сумісну плату або модель mini-PC, блок живлення та охолодження. Ці параметри відрізняються між корпусами й модулями."
      }
    ],
    "relatedCategories": [
      "10-inch-server-rack",
      "equipment-mounts"
    ],
    "relatedGuides": [
      "diy-nas-case-guide",
      "petg-vs-pla-for-racks"
    ]
  },
  {
    "name": "Кріплення для обладнання",
    "slug": "equipment-mounts",
    "shortLabel": "Кріплення для обладнання",
    "title": "Кріплення для обладнання — mini-PC, Raspberry Pi, мережа та живлення",
    "heading": "Кріплення для обладнання",
    "description": "Кріплення для роутерів, комутаторів, mini-PC, Raspberry Pi та блоків живлення; тримач мережевого фільтра і кріплення Starlink Gen 3. 3D-друк на замовлення.",
    "lead": "Оберіть кріплення під конкретний пристрій: роутер, комутатор, mini-PC, Raspberry Pi або блок живлення. Тут також є тримач мережевого фільтра під стіл і кріплення Starlink Gen 3 на трубу.",
    "body": [
      "Модель обладнання вказана в назві товару. Для 10-дюймової стійки є кріплення MikroTik, TP-Link, Lenovo ThinkCentre Tiny, Dell OptiPlex Micro, HP EliteDesk Mini та Raspberry Pi, а також параметричне кріплення під індивідуальні розміри.",
      "Кріплення блоків живлення ATX і Mean Well теж зібрані тут. Тримач мережевого фільтра та кріплення Starlink мають інший спосіб монтажу — під стіл і на трубу відповідно; перевіряйте призначення на сторінці товару."
    ],
    "highlights": [
      "Кріплення роутерів і комутаторів MikroTik та TP-Link",
      "Кріплення mini-PC Lenovo, Dell і HP",
      "Панелі для Raspberry Pi",
      "Кріплення блоків живлення та мережевого фільтра",
      "Кріплення Starlink Gen 3 на трубу"
    ],
    "faq": [
      {
        "question": "Як знайти кріплення під свій пристрій?",
        "answer": "Знайдіть модель обладнання в назві картки та перевірте список сумісності на сторінці товару. Для пристрою без готового кріплення є параметрична модель під індивідуальні ширину, висоту й глибину."
      },
      {
        "question": "Чи всі кріплення підходять для 10-дюймової стійки?",
        "answer": "Більшість моделей призначена для 10-дюймової стійки, але тримач мережевого фільтра монтується під стіл, а Starlink Gen 3 — на трубу. Спосіб монтажу завжди вказаний у картці товару."
      }
    ],
    "relatedCategories": [
      "10-inch-server-rack",
      "rack-accessories",
      "cases-and-storage"
    ],
    "relatedGuides": [
      "what-fits-in-10-inch-rack",
      "homelab-starter-rack",
      "petg-vs-pla-for-racks"
    ]
  },
  {
    "name": "Аксесуари для стійок",
    "slug": "rack-accessories",
    "shortLabel": "Аксесуари для стійок",
    "title": "Аксесуари для стійок — полиці, панелі, шухляди та органайзери",
    "heading": "Аксесуари для стійок",
    "description": "Полиці, шухляди Gridfinity, Keystone-патч-панелі, кабельні органайзери для 10-дюймових стійок і фронтальна панель Synology DS920+. 3D-друк на замовлення.",
    "lead": "Доповніть стійку полицею, шухлядою, патч-панеллю або кабельним органайзером. У цьому розділі також є фронтальна панель Synology DS920+ для кастомної стійки чи полиці.",
    "body": [
      "Універсальна полиця допомагає розмістити обладнання, а шухляди Gridfinity для Lab Rax — дрібні деталі. Патч-панелі на 8 або 10 Keystone-модулів і кабельні напрямні впорядковують підключення.",
      "Перевіряйте висоту в юнітах, глибину й сумісність: шухляди призначені для повноглибинної Lab Rax, а фронтальна панель Synology DS920+ — для відповідної кастомної збірки. Кріплення під конкретні пристрої зібрані в окремому розділі."
    ],
    "highlights": [
      "Універсальна полиця і шухляди Gridfinity",
      "Keystone-патч-панелі на 8 і 10 портів",
      "Кабельні панелі та органайзери",
      "Фронтальна панель Synology DS920+"
    ],
    "faq": [
      {
        "question": "Чи сумісні аксесуари з будь-якою стійкою?",
        "answer": "Сумісність залежить від моделі: полиця та патч-панелі розраховані на 10-дюймовий формат, шухляди — на повноглибинну Lab Rax, а панель Synology — на кастомну збірку. Звірте розміри на сторінці товару."
      },
      {
        "question": "Чи входять Keystone-модулі в патч-панель?",
        "answer": "Перевірте склад комплекту на сторінці обраної панелі: друкована деталь задає посадкові місця під Keystone. Самі роз’єми, кабелі та монтажні метизи потрібно узгодити при замовленні."
      }
    ],
    "relatedCategories": [
      "10-inch-server-rack",
      "equipment-mounts"
    ],
    "relatedGuides": [
      "homelab-starter-rack",
      "rack-units-1u-2u-3u"
    ]
  }
];

/** Categories keyed by their URL slug. */
export const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

/** Categories keyed by their data-layer name (the product `category` value). */
export const CATEGORY_BY_NAME = new Map(CATEGORIES.map((c) => [c.name, c]));

/**
 * Resolves category slugs to their definitions. Throws on an unknown slug so
 * a dangling cross-link fails the build, and returns a non-optional array.
 *
 * @param {readonly string[]} slugs
 * @returns {CategoryDefinition[]}
 */
export function resolveCategories(slugs) {
  return slugs.map((slug) => {
    const category = CATEGORY_BY_SLUG.get(slug);
    if (!category) throw new Error(`Unknown category slug "${slug}" (see src/data/categories.mjs)`);
    return category;
  });
}

/**
 * @param {string} name
 * @returns {CategoryDefinition | undefined}
 */
export function getCategoryByName(name) {
  return CATEGORY_BY_NAME.get(name);
}

/**
 * Guards the invariant this module depends on: exactly one landing page per
 * catalog category, no orphans in either direction, unique slugs, and no
 * dangling cross-links. Called from the tests and from `validate:data`.
 *
 * @returns {string[]} error messages (empty = consistent)
 */
export function validateCategoryDefinitions() {
  /** @type {string[]} */
  const errors = [];

  for (const name of CATALOG_CATEGORIES) {
    if (!CATEGORY_BY_NAME.has(name)) {
      errors.push(`category "${name}" has no landing page definition in categories.mjs`);
    }
  }
  for (const category of CATEGORIES) {
    if (!CATALOG_CATEGORIES.includes(category.name)) {
      errors.push(`categories.mjs defines "${category.name}", which is not a catalog category`);
    }
  }
  if (CATEGORY_BY_SLUG.size !== CATEGORIES.length) {
    errors.push('categories.mjs contains duplicate slugs');
  }
  for (const category of CATEGORIES) {
    for (const slug of category.relatedCategories) {
      if (!CATEGORY_BY_SLUG.has(slug)) {
        errors.push(`category "${category.slug}" links to unknown category "${slug}"`);
      }
      if (slug === category.slug) {
        errors.push(`category "${category.slug}" lists itself as a related category`);
      }
    }
  }

  return errors;
}
