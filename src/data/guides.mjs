// Registry of the informational guides under /guides/.
//
// Metadata only: <title>, description, the short "direct answer" summary,
// the FAQ (rendered visibly AND as FAQPage JSON-LD from this one array) and
// the cross-links. The prose of each guide lives in its own page under
// src/pages/guides/ — this module keeps the routing, the sitemap, the
// structured data and the internal-link graph in a single place.
//
// Rules for the content of these guides:
//  * Product facts (dimensions, compatibility, contents of a kit) come from
//    the product JSON files and are linked, never restated as new claims.
//  * General reference data is labelled as such and attributed to the
//    standard it comes from (EIA-310 for rack units, for example).
//  * Nothing about the shop, its customers or its history is invented.

import { CATEGORY_BY_SLUG } from './categories.mjs';

/**
 * @typedef {object} GuideFaq
 * @property {string} question
 * @property {string} answer
 */

/**
 * @typedef {object} GuideDefinition
 * @property {string} slug           URL segment under /guides/.
 * @property {string} title          <title> without the brand suffix.
 * @property {string} heading        Visible <h1>.
 * @property {string} description    <meta name="description">.
 * @property {string} summary        The direct answer, shown first on the page.
 * @property {string} datePublished  ISO date (YYYY-MM-DD).
 * @property {string} dateModified   ISO date (YYYY-MM-DD).
 * @property {string[]} topics       `about` keywords for the Article node.
 * @property {GuideFaq[]} faq        Questions answered on the page itself.
 * @property {string[]} relatedCategories  Category slugs to link to.
 * @property {string[]} relatedGuides      Sibling guide slugs.
 */

/**
 * Publication date of the guide set. The guides are written from the catalog
 * as it stands, so a single honest date beats nine invented ones.
 */
const PUBLISHED = '2026-08-29';
const REVISED = '2026-10-07';

/** @type {GuideDefinition[]} */
export const GUIDES = [
  {
    slug: '10-inch-vs-19-inch-rack',
    title: '10 чи 19 дюймів: яку серверну стійку обрати для дому',
    heading: '10-дюймова чи 19-дюймова стійка: що обрати для дому',
    description:
      '10- чи 19-дюймова стійка для HomeLab: монтажна ширина, висота, глибина та сумісність. Як обрати формат під свою техніку й перевірити кріплення.',
    summary:
      'Почни з формату своєї техніки. Для компактного роутера, комутатора, mini-PC чи Raspberry Pi можна обрати 10-дюймову стійку, якщо підходять кріплення й глибина. Її монтажна ширина приблизно вдвічі менша за 19 дюймів. Серверу, ДБЖ або комутатору з 19-дюймовою панеллю потрібен відповідний формат. Я раджу звірити ці розміри до замовлення — так каркас відповідатиме саме твоїй збірці.',
    datePublished: PUBLISHED,
    dateModified: REVISED,
    topics: ['10-дюймова серверна стійка', '19-дюймова стійка', 'HomeLab', 'mini rack', 'EIA-310'],
    faq: [
      {
        question: 'Чи однакова висота юніта в 10- і 19-дюймових стійках?',
        answer:
          'Обидва формати використовують крок 1U = 44,45 мм (1,75 дюйма), тому 2U відповідає 88,9 мм. Проте однакова висота не підтверджує сумісність за шириною, глибиною чи монтажними отворами — їх перевір окремо.',
      },
      {
        question: 'Чи можна поставити 19-дюймове обладнання в 10-дюймову стійку?',
        answer:
          'Ні: його фронтальна панель фізично ширша за 10-дюймовий формат. Компактне обладнання можна розмістити в 19-дюймовій шафі через відповідну перехідну панель або полицю; її розміри й навантаження також потрібно звірити.',
      },
      {
        question: 'Чи є 10-дюймовий формат офіційним стандартом?',
        answer:
          'EIA-310 описує 19-дюймовий формат. Окремого стандарту для 10 дюймів тут немає: формат склався на практиці, а геометрія різних стійок може відрізнятися. Перед покупкою кріплення звір отвори й глибину саме своєї стійки.',
      },
      {
        question: 'Що дешевше в перерахунку на одиницю обладнання?',
        answer:
          'Для компактного домашнього набору 10-дюймовий каркас може бути економнішим, але до ціни додай потрібні кріплення, полиці й метизи. Порівнюй вартість повної збірки. Якщо техніка має 19-дюймову панель, ширина визначає вибір незалежно від ціни каркаса.',
      },
    ],
    relatedCategories: ['10-inch-server-rack', 'rack-accessories'],
    relatedGuides: ['rack-units-1u-2u-3u', 'what-fits-in-10-inch-rack', 'homelab-starter-rack'],
  },
  {
    slug: 'rack-units-1u-2u-3u',
    title: 'Rack Unit: що таке 1U, 2U, 3U і скільки це в міліметрах',
    heading: 'Розміри Rack Unit: 1U, 2U, 3U, 4U і 5U у міліметрах',
    description:
      'Rack Unit у міліметрах: 1U = 44,45 мм, таблиця висот від 1U до 12U. Як порахувати місце для техніки, залишити запас і перевірити інші розміри стійки.',
    summary:
      'Rack Unit, або U, вимірює висоту: 1U = 44,45 мм (1,75 дюйма), 2U = 88,9 мм, 3U = 133,35 мм, 4U = 177,8 мм, 5U = 222,25 мм. EIA-310 визначає цей крок для 19-дюймових стійок; його використовують і в 10-дюймових. Склади висоти потрібних модулів і окремо додай запас. Ширину й глибину звір за характеристиками — число юнітів їх не описує.',
    datePublished: PUBLISHED,
    dateModified: REVISED,
    topics: ['Rack Unit', '1U', '2U', '3U', 'EIA-310', 'розміри серверної стійки'],
    faq: [
      {
        question: 'Скільки міліметрів у 1U?',
        answer:
          '1U = 44,45 мм, або 1,75 дюйма. Це крок EIA-310 для 19-дюймових стійок, який використовують і виробники 10-дюймових. Для сумісності кріплення звір також монтажну ширину й отвори.',
      },
      {
        question: 'Скільки міліметрів у 2U, 3U і 4U?',
        answer:
          '2U = 88,9 мм, 3U = 133,35 мм, 4U = 177,8 мм. Для розрахунку помнож кількість юнітів на 44,45 мм; це номінальна висота місця під модуль.',
      },
      {
        question: 'Чому реальне обладнання трохи нижче за свій юніт?',
        answer:
          'Між пристроями залишають зазор для встановлення й виймання. Тому висота 1U-пристрою трохи менша за 44,45 мм сама собою не означає дефекту. Розмір корпуса й монтажний крок — різні величини.',
      },
      {
        question: 'Що таке 1/2U?',
        answer:
          'Це половина юніта, приблизно 22 мм. Невисокі панелі, зокрема під Keystone-модулі, можуть займати 1/2U й залишати більше простору. Перевір, чи відповідає їхній монтаж отворам твоєї стійки.',
      },
      {
        question: 'Як порахувати потрібну висоту стійки?',
        answer:
          'Склади висоти пристроїв разом із кріпленнями. Наприклад, патч-панель 1U + комутатор 1U + mini-PC 1U + дисковий модуль 2U = 5U. До цього набору окремо додай 1–2U, якщо хочеш залишити місце для кабелів і доповнень.',
      },
    ],
    relatedCategories: ['10-inch-server-rack', 'cases-and-storage', 'rack-accessories'],
    relatedGuides: ['10-inch-vs-19-inch-rack', 'what-fits-in-10-inch-rack'],
  },
  {
    slug: 'what-fits-in-10-inch-rack',
    title: 'Що поміщається в 10-дюймову серверну стійку',
    heading: 'Що поміщається в 10-дюймову серверну стійку',
    description:
      'Техніка для 10-дюймової стійки: MikroTik, TP-Link, Raspberry Pi, Lenovo Tiny, Dell Micro та HP Mini. Кріплення, дискові модулі й перевірка сумісності.',
    summary:
      'Для 10-дюймової стійки в каталозі є кріплення окремих моделей MikroTik, TP-Link, Raspberry Pi, Lenovo ThinkCentre Tiny, Dell OptiPlex Micro та HP EliteDesk Mini. Збірку можна доповнити дисковими модулями, Keystone-панелями й полицями. Почни з точної моделі пристрою, потім звір його виконання, глибину та спосіб монтажу. Компактний вигляд сам по собі не гарантує посадку.',
    datePublished: PUBLISHED,
    dateModified: REVISED,
    topics: [
      '10-дюймова стійка',
      'rack mount',
      'MikroTik',
      'TP-Link',
      'Raspberry Pi',
      'Lenovo ThinkCentre Tiny',
      'HomeLab',
    ],
    faq: [
      {
        question: 'Чи поміститься MikroTik hAP ac² у 10-дюймову стійку?',
        answer:
          'Для MikroTik hAP ac² є спеціальне кріплення та виконання з чотирма місцями під Keystone-модулі. Звір модель роутера й потрібний варіант у картці; сам пристрій і Keystone до пластикової панелі не входять.',
      },
      {
        question: 'Чи можна поставити комутатор TP-Link у 10-дюймову стійку?',
        answer:
          'Є кріплення для TL-SG108, TL-SG108PE, TL-SF1006P, SG1005P і SG105 та інших моделей, зазначених у відповідних картках. Звір повне позначення й апаратну версію. Для іншого пристрою можна погодити параметричне кріплення за розмірами; його сумісність потрібно перевірити.',
      },
      {
        question: 'Чи стане в 10-дюймову стійку звичайний ПК?',
        answer:
          'Повнорозмірний ATX-корпус для цього формату не підходить. Для окремих Lenovo Tiny, Dell Micro та HP Mini є відповідні кріплення. Корпуси під Mini-ITX мають власні габарити: перевір розміри всього корпуса, перш ніж планувати встановлення в стійку.',
      },
      {
        question: 'Скільки жорстких дисків можна поставити в 10-дюймову стійку?',
        answer:
          '10-дюймовий 2U-модуль має місця для 5 накопичувачів 2.5 дюйма та 3 дисків 3.5 дюйма. Також у каталозі є 3U-корпус на 12 місць, але його монтажну ширину й габарити потрібно звірити окремо. Висота 3U не підтверджує 10-дюймовий формат.',
      },
    ],
    relatedCategories: ['equipment-mounts', 'cases-and-storage'],
    relatedGuides: ['rack-units-1u-2u-3u', 'homelab-starter-rack', '10-inch-vs-19-inch-rack'],
  },
  {
    slug: 'homelab-starter-rack',
    title: 'Як зібрати компактний HomeLab у 10-дюймовій стійці',
    heading: 'Як зібрати компактний HomeLab у 10-дюймовій стійці',
    description:
      'Планування HomeLab у 10-дюймовій стійці: розрахунок юнітів, каркас, кріплення, сховище, живлення й кабелі. Приклад 5U та окремий запас для доповнень.',
    summary:
      'Зручна HomeLab-збірка починається з переліку твоєї техніки. Порахуй її висоту разом із кріпленнями, обери каркас і передбач місце для сховища, живлення та кабелів. Приклад із патч-панеллю 1U, мережею 1U, mini-PC 1U й дисковим модулем 2U займає 5U. Запас 1–2U додається окремо. Твій набір може бути іншим — підлаштуй розрахунок під нього.',
    datePublished: PUBLISHED,
    dateModified: REVISED,
    topics: ['HomeLab', '10-дюймова стійка', 'mini rack', 'домашній сервер', 'NAS'],
    faq: [
      {
        question: 'З якої висоти стійки почати?',
        answer:
          'Почни з суми висот своїх модулів. Патч-панель 1U, мережа 1U, mini-PC 1U і сховище 2U разом займають 5U без запасу. Якщо потрібні доповнення, передбач їх окремо. Можливість нарощування перевір за обраною модульною стійкою.',
      },
      {
        question: 'У якому порядку розміщувати обладнання?',
        answer:
          'Зручний початок — патч-панель і мережа зверху, обчислювальні вузли посередині, важчі дискові модулі й блок живлення знизу. Нижчий центр ваги сприяє стійкості. Водночас залиш доступ до портів і не перекривай вентиляцію пристроїв.',
      },
      {
        question: 'Скільки місця залишити на майбутнє?',
        answer:
          'Один-два вільні юніти — зручний орієнтир, якщо плануєш доповнення. Вони можуть знадобитися для органайзера або ще одного модуля. Якщо твій набір уже визначений, обирай запас за власним планом, а не лише за загальною порадою.',
      },
      {
        question: 'Чи потрібне активне охолодження?',
        answer:
          'Це залежить від пристроїв, навантаження й місця встановлення. Відкрита стійка сприяє руху повітря, але не замінює охолодження самої техніки. Для дискових корпусів перевір передбачені вентилятори й типорозміри; вони купуються окремо.',
      },
    ],
    relatedCategories: ['10-inch-server-rack', 'equipment-mounts', 'rack-accessories'],
    relatedGuides: ['what-fits-in-10-inch-rack', 'rack-units-1u-2u-3u', 'diy-nas-case-guide'],
  },
  {
    slug: 'diy-nas-case-guide',
    title: 'Як обрати корпус для домашнього NAS',
    heading: 'Як обрати корпус для домашнього NAS',
    description:
      'Корпус для домашнього NAS: mini-PC чи Mini-ITX, кількість дисків, підключення, охолодження й живлення. Що входить у пластиковий комплект і що підібрати окремо.',
    summary:
      'Спочатку визнач основу NAS і потрібні накопичувачі. Для Lenovo ThinkCentre Tiny, Intel NUC чи Dell Wyse обирай корпус під конкретну модель; для окремої плати — сумісний Mini-ITX-корпус. Порівняй кількість дисків, підключення, місця для охолодження й живлення. Корпус складається з пластикових деталей. Контролер, кабелі, вентилятори та блок живлення потрібно підібрати окремо — хочу, щоб ти міг врахувати всю збірку до покупки.',
    datePublished: PUBLISHED,
    dateModified: REVISED,
    topics: ['NAS', 'DIY NAS', 'Mini-ITX', 'Lenovo ThinkCentre', 'Intel NUC', 'TrueNAS', 'Proxmox'],
    faq: [
      {
        question: 'Скільки дисків потрібно для домашнього NAS?',
        answer:
          'Чотири місця можуть бути зручним початком, а шість-вісім — для більшого обсягу або кількох наявних дисків. Потрібна кількість залежить від місткості й способу організації даних. Самі місця в корпусі не забезпечують надлишковості.',
      },
      {
        question: 'Корпус під mini-PC чи під Mini-ITX?',
        answer:
          'Корпус під наявний mini-PC дає змогу використати готовий компʼютер. Mini-ITX — варіант для окремого підбору плати, памʼяті й розширення. Порівняй усі потрібні компоненти: ціна й кількість портів залежать від конкретної збірки.',
      },
      {
        question: 'Чи потрібен окремий SATA-контролер?',
        answer:
          'Він потрібен, якщо наявних портів недостатньо для вибраних дисків. Для mini-PC можуть також знадобитися riser і backplane або перехідники. Перевір вимоги конкретного корпуса й компʼютера; відсутні дані уточни перед замовленням.',
      },
      {
        question: 'Який матеріал друку обрати для NAS-корпусу?',
        answer:
          'PETG часто доречний для корпусів із постійним теплом і навантаженням. PLA має нижчу теплостійкість. Матеріал обраної моделі дивись у характеристиках; інше виконання потрібно погодити з урахуванням її конструкції й умов роботи.',
      },
      {
        question: 'Чи підійде такий корпус для TrueNAS або Proxmox?',
        answer:
          'Пластиковий корпус визначає механічну сумісність. Lenovo ThinkCentre та Intel NUC у каталозі описані для сценаріїв TrueNAS, Proxmox і XCP-ng, але підтримку платформи перевір за своїм компʼютером і контролером, а не за корпусом.',
      },
    ],
    relatedCategories: ['cases-and-storage', 'equipment-mounts'],
    relatedGuides: ['petg-vs-pla-for-racks', 'homelab-starter-rack', 'rack-units-1u-2u-3u'],
  },
  {
    slug: 'petg-vs-pla-for-racks',
    title: 'PETG чи PLA для серверної стійки та кріплень',
    heading: 'PETG чи PLA: який пластик обрати для стійки й кріплень',
    description:
      'PETG і PLA для стійок, кріплень та NAS-корпусів: тепло, тривале навантаження, поверхня й повзучість. Як перевірити матеріал конкретного виробу перед замовленням.',
    summary:
      'Для деталей під постійною вагою й теплом PETG часто доречніший за PLA. PLA можна розглядати для заглушок, декоративних панелей або органайзерів без значного нагрівання й навантаження. Проте матеріал сам по собі не визначає міцність готового виробу. У каталозі є також ABS і ASA: звір характеристики саме своєї моделі й погодь зміни до виготовлення.',
    datePublished: PUBLISHED,
    dateModified: REVISED,
    topics: ['PETG', 'PLA', 'FDM 3D-друк', 'серверна стійка', 'матеріали друку'],
    faq: [
      {
        question: 'Чому саме PETG для стійки?',
        answer:
          'PETG має вищу теплостійкість за PLA, тому його часто обирають для деталей біля теплого обладнання. Але допустиме навантаження залежить також від конструкції та друку. Перевір матеріал і умови використання конкретної стійки.',
      },
      {
        question: 'Що станеться з PLA у стійці з дисками?',
        answer:
          'За постійного тепла й навантаження PLA може поступово деформуватися: кріплення провисає або змінює посадку. Це повзучість. Зміна не завжди помітна одразу, тому перевіряй форму навантажених деталей під час обслуговування.',
      },
      {
        question: 'Коли PLA все-таки підійде?',
        answer:
          'Для заглушок, декоративних панелей, шухляд і настільних органайзерів за невеликого навантаження й без значного нагрівання. PLA зазвичай простіший у друці й дає акуратну поверхню. Умови обраного виробу все одно звір із карткою.',
      },
      {
        question: 'Чи можна обрати колір?',
        answer:
          'Так, бажаний колір можна погодити перед друком. Доступність відтінку й можливість поєднання кольорів залежать від виконання. Якщо комбінування передбачене для моделі, подробиці є в її описі.',
      },
    ],
    relatedCategories: ['10-inch-server-rack', 'cases-and-storage', 'rack-accessories'],
    relatedGuides: ['diy-nas-case-guide', 'homelab-starter-rack'],
  },
];

/**
 * Resolves guide slugs to their definitions. Throws on an unknown slug, so a
 * dangling cross-link fails the build instead of rendering an empty block —
 * and callers get a non-optional array back.
 *
 * @param {readonly string[]} slugs
 * @returns {GuideDefinition[]}
 */
export function resolveGuides(slugs) {
  return slugs.map((slug) => {
    const guide = GUIDE_BY_SLUG.get(slug);
    if (!guide) throw new Error(`Unknown guide slug "${slug}" (see src/data/guides.mjs)`);
    return guide;
  });
}

/** Guides keyed by their URL slug. */
export const GUIDE_BY_SLUG = new Map(GUIDES.map((guide) => [guide.slug, guide]));

/**
 * Guards the internal-link graph: unique slugs, and every cross-link resolves
 * to a real category or guide. Called from the tests and `validate:data`.
 *
 * @returns {string[]} error messages (empty = consistent)
 */
export function validateGuideDefinitions() {
  /** @type {string[]} */
  const errors = [];

  if (GUIDE_BY_SLUG.size !== GUIDES.length) {
    errors.push('guides.mjs contains duplicate slugs');
  }

  for (const guide of GUIDES) {
    for (const slug of guide.relatedCategories) {
      if (!CATEGORY_BY_SLUG.has(slug)) {
        errors.push(`guide "${guide.slug}" links to unknown category "${slug}"`);
      }
    }
    for (const slug of guide.relatedGuides) {
      if (!GUIDE_BY_SLUG.has(slug)) {
        errors.push(`guide "${guide.slug}" links to unknown guide "${slug}"`);
      }
      if (slug === guide.slug) {
        errors.push(`guide "${guide.slug}" lists itself as a related guide`);
      }
    }
    if (guide.faq.length === 0) {
      errors.push(`guide "${guide.slug}" has an empty FAQ`);
    }
  }

  // Every category's relatedGuides must resolve too — checked here rather
  // than in categories.mjs to keep that module free of a circular import.
  for (const [slug, category] of CATEGORY_BY_SLUG) {
    for (const guideSlug of category.relatedGuides) {
      if (!GUIDE_BY_SLUG.has(guideSlug)) {
        errors.push(`category "${slug}" links to unknown guide "${guideSlug}"`);
      }
    }
  }

  return errors;
}
