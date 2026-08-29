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

/** @type {GuideDefinition[]} */
export const GUIDES = [
  {
    slug: '10-inch-vs-19-inch-rack',
    title: '10 чи 19 дюймів: яку серверну стійку обрати для дому',
    heading: '10-дюймова чи 19-дюймова стійка: що обрати для дому',
    description:
      'Порівняння 10- і 19-дюймових серверних стійок: ширина, глибина, шум, ціна та сумісність обладнання. Коли для HomeLab достатньо 10 дюймів, а коли потрібні 19.',
    summary:
      'Для дому в переважній більшості випадків достатньо 10-дюймової стійки: вона розрахована на компактні роутери, комутатори, mini-PC і одноплатні компʼютери, займає приблизно вдвічі менше місця в ширину й не потребує глибокої шафи. 19-дюймова стійка потрібна тоді, коли у вас уже є обладнання серверного форм-фактора — сервер із монтажними вушками, ДБЖ, комутатор із фронтальною панеллю 19 дюймів.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    topics: ['10-дюймова серверна стійка', '19-дюймова стійка', 'HomeLab', 'mini rack', 'EIA-310'],
    faq: [
      {
        question: 'Чи однакова висота юніта в 10- і 19-дюймових стійках?',
        answer:
          'Так. Rack Unit (1U) — це 44,45 мм (1,75 дюйма) в обох форматах. Відрізняється тільки монтажна ширина фронтальної панелі, тому 2U-модуль займає 88,9 мм висоти і в 10-дюймовій, і в 19-дюймовій стійці.',
      },
      {
        question: 'Чи можна поставити 19-дюймове обладнання в 10-дюймову стійку?',
        answer:
          'Ні. Фронтальна панель 19-дюймового пристрою фізично ширша за монтажну ширину 10-дюймової стійки. Зворотний варіант можливий: 10-дюймове обладнання ставлять у 19-дюймову шафу через перехідну панель або полицю.',
      },
      {
        question: 'Чи є 10-дюймовий формат офіційним стандартом?',
        answer:
          'Ні, на відміну від 19 дюймів, які описані стандартом EIA-310. Формат 10 дюймів склався на практиці, тому конкретні розміри монтажних отворів і глибина відрізняються у різних виробників. Перед покупкою кріплень варто звіряти розміри саме вашої стійки.',
      },
      {
        question: 'Що дешевше в перерахунку на одиницю обладнання?',
        answer:
          'Для домашнього набору (роутер, комутатор, один-два mini-PC, диски) 10-дюймова стійка зазвичай виходить дешевшою: менше матеріалу, менше місця, не потрібні глибокі напрямні. 19 дюймів починають виправдовуватися тоді, коли обладнання вже серверне й іншого варіанта немає.',
      },
    ],
    relatedCategories: ['10-inch-server-rack', 'rack-shelves-and-panels'],
    relatedGuides: ['rack-units-1u-2u-3u', 'what-fits-in-10-inch-rack', 'homelab-starter-rack'],
  },
  {
    slug: 'rack-units-1u-2u-3u',
    title: 'Rack Unit: що таке 1U, 2U, 3U і скільки це в міліметрах',
    heading: 'Розміри Rack Unit: 1U, 2U, 3U, 4U і 5U у міліметрах',
    description:
      'Що таке рековий юніт (U) і скільки це в міліметрах: 1U = 44,45 мм. Таблиця висот 1U–10U, різниця між 10- і 19-дюймовими стійками, як рахувати висоту стійки.',
    summary:
      'Rack Unit (позначається U або RU) — стандартна одиниця висоти обладнання в стійці. 1U дорівнює 44,45 мм (1,75 дюйма) — це визначено стандартом EIA-310 і однаково для 19- та 10-дюймових стійок. Висота обладнання рахується множенням: 2U = 88,9 мм, 3U = 133,35 мм, 4U = 177,8 мм, 5U = 222,25 мм.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    topics: ['Rack Unit', '1U', '2U', '3U', 'EIA-310', 'розміри серверної стійки'],
    faq: [
      {
        question: 'Скільки міліметрів у 1U?',
        answer:
          '1U = 44,45 мм (1,75 дюйма). Це значення закріплене стандартом EIA-310 і не залежить від того, 10- чи 19-дюймова у вас стійка.',
      },
      {
        question: 'Скільки міліметрів у 2U, 3U і 4U?',
        answer:
          '2U = 88,9 мм, 3U = 133,35 мм, 4U = 177,8 мм. Кожен наступний юніт додає рівно 44,45 мм.',
      },
      {
        question: 'Чому реальне обладнання трохи нижче за свій юніт?',
        answer:
          'Виробники залишають технологічний зазор, щоб сусідні пристрої не тиснули один на одного і їх можна було вийняти. Тому пристрій на 1U має висоту трохи меншу за 44,45 мм — це нормально й передбачено стандартом.',
      },
      {
        question: 'Що таке 1/2U?',
        answer:
          'Половина юніта — приблизно 22 мм. Такий формат використовують для невисоких панелей, наприклад патч-панелі на кілька кейстоунів, щоб не витрачати цілий юніт у малій стійці.',
      },
      {
        question: 'Як порахувати потрібну висоту стійки?',
        answer:
          'Складіть висоти всіх пристроїв у юнітах і додайте запас 1–2U на кабельні органайзери та майбутні доповнення. Наприклад: патч-панель 1U + комутатор 1U + mini-PC 1U + дисковий модуль 2U = 5U.',
      },
    ],
    relatedCategories: ['10-inch-server-rack', 'hdd-modules', 'rack-shelves-and-panels'],
    relatedGuides: ['10-inch-vs-19-inch-rack', 'what-fits-in-10-inch-rack'],
  },
  {
    slug: 'what-fits-in-10-inch-rack',
    title: 'Що поміщається в 10-дюймову серверну стійку',
    heading: 'Що поміщається в 10-дюймову серверну стійку',
    description:
      'Яке обладнання ставлять у 10-дюймову стійку: MikroTik і TP-Link, Raspberry Pi, mini-PC Lenovo Tiny, Dell Micro, HP Mini, дискові модулі, патч-панелі та блоки живлення.',
    summary:
      'У 10-дюймову стійку ставлять компактне мережеве обладнання (роутери й комутатори MikroTik, TP-Link), одноплатні компʼютери Raspberry Pi, mini-PC літрового формату (Lenovo ThinkCentre Tiny, Dell OptiPlex Micro, HP EliteDesk Mini), дискові модулі, патч-панелі на кейстоуни, полиці та блоки живлення. Пристрої без власних монтажних вушок кріпляться через друковані адаптери під конкретну модель.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
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
          'Так, через спеціальне друковане кріплення. У каталозі є два варіанти для цієї моделі: звичайне кріплення та варіант із чотирма гніздами під кейстоуни в тому ж юніті.',
      },
      {
        question: 'Чи можна поставити комутатор TP-Link у 10-дюймову стійку?',
        answer:
          'Так. У каталозі є кріплення під TL-SG108 і TL-SG108PE, TL-SF1006P, а також під TL-SG1005P і TL-SG105. Для моделей, яких немає в списку, підійде параметричне кріплення, що підлаштовується під розміри корпусу.',
      },
      {
        question: 'Чи стане в 10-дюймову стійку звичайний ПК?',
        answer:
          'Повнорозмірний ATX-корпус — ні. Але mini-PC літрового формату (Lenovo ThinkCentre Tiny, Dell OptiPlex Micro, HP EliteDesk Mini) ставляться через відповідні кріплення, а плати Mini-ITX використовуються в окремих NAS-корпусах.',
      },
      {
        question: 'Скільки жорстких дисків можна поставити в 10-дюймову стійку?',
        answer:
          'Залежить від модуля. У каталозі є 2U-модуль на 5 накопичувачів 2.5 дюйма та 3 накопичувачі 3.5 дюйма, а також 3U-корпус на 12 місць. Конкретна кількість завжди вказана в назві товару.',
      },
    ],
    relatedCategories: [
      'network-rack-mounts',
      'mini-pc-rack-mounts',
      'raspberry-pi-rack',
      'hdd-modules',
    ],
    relatedGuides: ['rack-units-1u-2u-3u', 'homelab-starter-rack', '10-inch-vs-19-inch-rack'],
  },
  {
    slug: 'homelab-starter-rack',
    title: 'Як зібрати компактний HomeLab у 10-дюймовій стійці',
    heading: 'Як зібрати компактний HomeLab у 10-дюймовій стійці',
    description:
      'Покроково: як спланувати домашню лабораторію в 10-дюймовій стійці — вибір висоти, порядок юнітів, мережа, обчислення, сховище, живлення та кабелі.',
    summary:
      'Компактний HomeLab збирається за чотири кроки: порахувати потрібну висоту в юнітах, обрати каркас 10-дюймової стійки, додати кріплення під наявне обладнання (роутер, комутатор, mini-PC, Raspberry Pi) і закласти окремі юніти під сховище, живлення та кабельний органайзер. Типовий стартовий набір вкладається в 5U.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    topics: ['HomeLab', '10-дюймова стійка', 'mini rack', 'домашній сервер', 'NAS'],
    faq: [
      {
        question: 'З якої висоти стійки почати?',
        answer:
          'Для першої збірки зазвичай достатньо 5U: юніт під патч-панель, юніт під комутатор або роутер, юніт під mini-PC і два юніти під сховище чи живлення. Модульні стійки в каталозі дозволяють нарощувати висоту пізніше.',
      },
      {
        question: 'У якому порядку розміщувати обладнання?',
        answer:
          'Зверху зазвичай ставлять патч-панель і мережу, щоб кабелі йшли коротким шляхом, посередині — обчислювальні вузли, знизу — важчі дискові модулі та блок живлення. Нижче розташований центр ваги робить стійку стійкішою.',
      },
      {
        question: 'Скільки місця залишити на майбутнє?',
        answer:
          'Практичне правило — один-два вільні юніти. HomeLab майже завжди росте, а переносити всю збірку у вищу стійку дорожче, ніж закласти запас одразу.',
      },
      {
        question: 'Чи потрібне активне охолодження?',
        answer:
          'Для роутера, комутатора й одного mini-PC — зазвичай ні: відкрита 10-дюймова стійка провітрюється краще за закриту шафу. Вентилятор стає потрібним, коли додаються жорсткі диски: у NAS-корпусах каталогу охолодження вже передбачене конструкцією.',
      },
    ],
    relatedCategories: [
      '10-inch-server-rack',
      'network-rack-mounts',
      'rack-shelves-and-panels',
      'rack-power-and-workshop',
    ],
    relatedGuides: ['what-fits-in-10-inch-rack', 'rack-units-1u-2u-3u', 'diy-nas-case-guide'],
  },
  {
    slug: 'diy-nas-case-guide',
    title: 'Як обрати корпус для домашнього NAS',
    heading: 'Як обрати корпус для домашнього NAS',
    description:
      'Як обрати корпус для домашнього NAS: скільки дисків потрібно, корпус навколо mini-PC чи під Mini-ITX, охолодження, живлення та які комплектуючі доведеться докупити.',
    summary:
      'Вибір починається з кількості дисків і того, на чому будується система. Якщо є mini-PC (Lenovo ThinkCentre Tiny, Intel NUC, Dell Wyse) — беріть корпус, спроєктований саме під нього: він компактніший і не потребує нової материнської плати. Якщо потрібно 6–8 дисків і слоти розширення — беріть корпус під плату Mini-ITX. У будь-якому разі надрукований корпус — це тільки механіка: контролер, кабелі, вентилятор і блок живлення купуються окремо.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    topics: ['NAS', 'DIY NAS', 'Mini-ITX', 'Lenovo ThinkCentre', 'Intel NUC', 'TrueNAS', 'Proxmox'],
    faq: [
      {
        question: 'Скільки дисків потрібно для домашнього NAS?',
        answer:
          'Для більшості домашніх задач вистачає чотирьох дисків: цього достатньо для надлишковості й розширення. Шість-вісім місць беруть тоді, коли сховище планується як основне, або коли диски вже є й вони невеликого обʼєму.',
      },
      {
        question: 'Корпус під mini-PC чи під Mini-ITX?',
        answer:
          'Під mini-PC — якщо він у вас уже є: це найдешевший шлях, корпус виходить компактнішим. Під Mini-ITX — якщо потрібно більше дисків, більше памʼяті або слот розширення під контролер і мережеву карту.',
      },
      {
        question: 'Чи потрібен окремий SATA-контролер?',
        answer:
          'Так, майже завжди при роботі з mini-PC: у них немає потрібної кількості SATA-портів. Конкретні вимоги — модель контролера, riser, backplane — вказані в описі кожного корпусу в каталозі.',
      },
      {
        question: 'Який матеріал друку обрати для NAS-корпусу?',
        answer:
          'PETG. Жорсткі диски й блок живлення гріються, корпус працює цілодобово, а PLA починає розмʼякшуватися за нижчої температури, ніж PETG.',
      },
      {
        question: 'Чи підійде такий корпус для TrueNAS або Proxmox?',
        answer:
          'Корпус визначає лише механічну сумісність і не залежить від операційної системи. Моделі на базі Lenovo ThinkCentre та Intel NUC у каталозі описані як придатні для сценаріїв TrueNAS, Proxmox і XCP-ng.',
      },
    ],
    relatedCategories: ['nas-cases', 'hdd-modules', 'mini-pc-rack-mounts'],
    relatedGuides: ['petg-vs-pla-for-racks', 'homelab-starter-rack', 'rack-units-1u-2u-3u'],
  },
  {
    slug: 'petg-vs-pla-for-racks',
    title: 'PETG чи PLA для серверної стійки та кріплень',
    heading: 'PETG чи PLA: який пластик обрати для стійки й кріплень',
    description:
      'Порівняння PETG і PLA для 3D-друкованих серверних стійок, кріплень і NAS-корпусів: термостійкість, жорсткість, повзучість під навантаженням і коли PLA все ж достатньо.',
    summary:
      'Для стійок, кріплень і NAS-корпусів обирайте PETG. Обладнання працює цілодобово й нагріває деталі, а PLA за підвищеної температури поступово деформується під постійним навантаженням. PLA виправданий лише для ненавантажених деталей, що не стоять біля джерел тепла: заглушок, декоративних панелей, органайзерів.',
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    topics: ['PETG', 'PLA', 'FDM 3D-друк', 'серверна стійка', 'матеріали друку'],
    faq: [
      {
        question: 'Чому саме PETG для стійки?',
        answer:
          'PETG зберігає форму за вищих температур, ніж PLA, і краще переносить постійне навантаження. У стійці деталі одночасно нагріваються від обладнання і тримають вагу — це якраз той випадок, де різниця між матеріалами помітна.',
      },
      {
        question: 'Що станеться з PLA у стійці з дисками?',
        answer:
          'Під постійним навантаженням і теплом PLA схильний до повільної деформації (повзучості): кріплення може поступово провиснути. Це не миттєва поломка, а поступова зміна геометрії, тому її часто помічають пізно.',
      },
      {
        question: 'Коли PLA все-таки підійде?',
        answer:
          'Для деталей без навантаження й далеко від джерел тепла: заглушок, декоративних панелей, шухляд, органайзерів на столі. Для таких виробів PLA простіший у друці й дає акуратнішу поверхню.',
      },
      {
        question: 'Чи можна обрати колір?',
        answer:
          'Так, колір узгоджується перед друком. Доступність конкретного кольору й можливість комбінування уточнюються при замовленні — це вказано в описах товарів, де такі варіанти передбачені.',
      },
    ],
    relatedCategories: ['10-inch-server-rack', 'nas-cases', 'custom-rack-parts'],
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
