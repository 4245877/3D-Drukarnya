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
    "description": "Модульні 10-дюймові стійки для HomeLab, посилена KWS Rack v.2 та поперечки Lab Rax для 19-дюймового формату. Розміри й конфігурації в картках.",
    "lead": "Мені подобається, коли в домашній лабораторії кожен пристрій має своє місце. Тут можна обрати модульну 10-дюймову стійку, посилену KWS Rack v.2 або поперечки Lab Rax для переходу до 19-дюймового формату.",
    "body": [
      "Почни з ширини, глибини й висоти обладнання. Залиши місце для кабелів і доступу до роз’ємів: каркас має вмістити всю збірку, а не лише її лицьову частину. У картках зазначені конфігурації, матеріал та особливості складання.",
      "Коли визначишся з основою, переглянь «Кріплення для обладнання». Полиці, шухляди, патч-панелі та кабельні органайзери зібрані в «Аксесуарах для стійок». Не поспішай купувати все одразу — спочатку звір сумісність потрібних деталей."
    ],
    "highlights": [
      "Модульні 10-дюймові каркаси для HomeLab",
      "Посилена стійка KWS Rack v.2",
      "Поперечки Lab Rax для 19-дюймової стійки"
    ],
    "faq": [
      {
        "question": "З чого почати вибір стійки?",
        "answer": "Виміряй пристрої та зістав ширину, глибину й висоту з характеристиками каркаса. Потім обери кріплення або полицю. Важливо врахувати й кабелі: підключена техніка потребує більше місця."
      },
      {
        "question": "Чи входять кріплення для пристроїв у комплект?",
        "answer": "Звір склад комплекту на сторінці обраної стійки. Кріплення для роутерів, mini-PC, Raspberry Pi та блоків живлення є окремо в розділі «Кріплення для обладнання». Зображення з технікою саме по собі не означає, що вона входить у комплект."
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
    "description": "NAS-корпуси під mini-PC та Mini-ITX, корпуси Raspberry Pi, відкритий корпус ПК, корпус блока живлення, HDD/SSD-модулі й адаптери. Сумісність у картках.",
    "lead": "Корпус варто обирати навколо твоєї техніки. Тут є вироби для NAS, ПК, Raspberry Pi й лабораторного блока живлення, а також кошики та адаптери для дисків. Я раджу спочатку звірити плату, охолодження й накопичувачі — від них залежить виконання.",
    "body": [
      "Для NAS на базі mini-PC є корпуси під Lenovo ThinkCentre Tiny, Intel NUC і Dell Wyse 5070. Для окремої плати — Mini-ITX; для ПК — відкритий корпус із підтримкою ATX, mATX та Mini-ITX. Корпуси Raspberry Pi відрізняються моделлю плати, кулером, NVMe-адаптером і способом кріплення. Збігу лише назви Raspberry Pi недостатньо.",
      "Якщо основа вже є, переглянь дискові модулі, тримачі HDD й адаптери 2.5/3.5/5.25 дюйма. У картках зазначені формат дисків, кількість місць і монтаж. Окремо перевір підключення: місце для накопичувача ще не забезпечує потрібні порти.",
      "Корпус лабораторного блока живлення розрахований на збірку на базі ATX. Це корпус, а не готове джерело живлення. Тримачі готових блоків для стійки є в «Кріпленнях для обладнання»."
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
        "answer": "Для системи з платою або mini-PC, дисками й охолодженням потрібен корпус. Якщо треба додати накопичувачі до наявної збірки, почни з модуля, тримача або адаптера. Так можна обрати лише ту деталь, якої бракує."
      },
      {
        "question": "Як перевірити сумісність із дисками та платою?",
        "answer": "Звір формат і кількість дисків, модель плати або mini-PC, блок живлення та охолодження в конкретній картці. Якщо потрібного параметра немає, уточни його в магазині на OLX до замовлення. Я не хочу, щоб неперевірений розмір став для тебе неприємною несподіванкою."
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
    "description": "Кріплення MikroTik, TP-Link, mini-PC, Raspberry Pi та блоків живлення; настінні тримачі SMLIGHT і Home Assistant Voice PE, тримач фільтра та Starlink Gen 3.",
    "lead": "Добре кріплення починається з точної моделі пристрою. Тут є панелі для стійки, настінні тримачі SMLIGHT і Home Assistant Voice PE, тримач мережевого фільтра під стіл та Starlink Gen 3 на трубу. Будь ласка, звір позначення техніки й спосіб монтажу — я хочу вберегти тебе від невдалої посадки.",
    "body": [
      "Шукай позначення обладнання в назві та списку сумісності. Для 10-дюймової стійки є кріплення MikroTik, TP-Link, Lenovo ThinkCentre Tiny, Dell OptiPlex Micro, HP EliteDesk Mini й Raspberry Pi. Параметричне кріплення дозволяє узгодити індивідуальні розміри; готову сумісність із будь-яким пристроєм воно не обіцяє.",
      "Кріплення ATX і Mean Well теж у цьому розділі. Для настінних моделей звір корпус пристрою та потрібний доступ до роз’ємів. Мережевий фільтр монтується під стіл, Starlink — на трубу. Спосіб установлення в картці важливіший за спільну назву категорії."
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
        "answer": "Знайди точну модель у назві й перевір список сумісності. Якщо готового кріплення немає, переглянь параметричну модель під індивідуальні ширину, висоту й глибину. Розміри та конфігурацію потрібно узгодити з магазином перед виготовленням."
      },
      {
        "question": "Чи всі кріплення підходять для 10-дюймової стійки?",
        "answer": "Ні. Тут є й настінні тримачі, тримач мережевого фільтра під стіл та Starlink Gen 3 на трубу. Для стійки обирай модель із відповідним призначенням у картці."
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
    "description": "Полиці, Gridfinity-шухляди, Keystone-панелі й кабельні напрямні для стійок, панель Synology DS920+, настінний комплект HSW і настільний органайзер.",
    "lead": "Маленькі деталі часто роблять збірку зручнішою щодня: кабель залишається на своєму місці, а потрібний інструмент легко знайти. Тут є полиці, шухляди, Keystone-панелі й напрямні для стійки, а також настінний HSW та настільний органайзер. Обери те, що буде корисним саме тобі.",
    "body": [
      "Полиця дає місце для обладнання, шухляди Gridfinity для Lab Rax — для дрібних деталей. Патч-панелі на 8 або 10 Keystone-модулів і кабельні напрямні впорядковують підключення. Подумай про доступ до кабелів після складання, а не лише про вигляд лицьової панелі.",
      "Звір висоту в юнітах, глибину й сумісність: шухляди розраховані на повноглибинну Lab Rax, фронтальна панель Synology DS920+ — на відповідну кастомну збірку. HSW і настільний органайзер призначені для робочого місця. Кріплення конкретних пристроїв є в окремому розділі."
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
        "answer": "Ні, сумісність залежить від моделі. Полиці й патч-панелі призначені для 10-дюймового формату, шухляди — для повноглибинної Lab Rax, панель Synology — для кастомної збірки. Звір розміри в картці; HSW і настільний органайзер узагалі не потребують стійки."
      },
      {
        "question": "Чи входять Keystone-модулі в патч-панель?",
        "answer": "У друкованій панелі є посадкові місця під Keystone. Роз’єми, кабелі та монтажні метизи не входять у комплект і узгоджуються окремо. Переглянь картку обраної панелі, щоб підготувати потрібну кількість модулів."
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
