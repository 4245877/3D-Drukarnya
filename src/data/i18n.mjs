import { SITE_NAME } from './site.config.mjs';
import { CATEGORIES } from './categories.mjs';

// Language versions of the site.
//
// Only genuine counterparts declare hreflang. Guides and the SLA service
// remain Ukrainian; the English page remains an overview.

/**
 * @typedef {object} LanguageAlternate
 * @property {string} hreflang BCP 47 code, or 'x-default'.
 * @property {string} path     Site-relative path of that version.
 */

/**
 * hreflang set for the pages that have a translated counterpart. The set is
 * reciprocal and self-referencing, as the specification requires: every
 * listed page links to every other one, itself included.
 *
 * @type {LanguageAlternate[]}
 */
export const LANGUAGE_ALTERNATES = [
  { hreflang: 'uk', path: '/' },
  { hreflang: 'en', path: '/en/' },
  { hreflang: 'ru', path: '/ru/' },
  { hreflang: 'x-default', path: '/' },
];

const catalogPaths = new Set(['/catalog/', ...CATEGORIES.map((c) => `/catalog/${c.slug}/`)]);

/**
 * @param {string} path Site-relative canonical path (without BASE_PATH).
 * @returns {LanguageAlternate[]}
 */
export function getPageAlternates(path) {
  if (['/', '/en/', '/ru/'].includes(path)) return LANGUAGE_ALTERNATES;
  const ukrainianPath = path.replace(/^\/ru\//, '/');
  if (!catalogPaths.has(ukrainianPath) && !/^\/products\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(ukrainianPath)) return [];
  return [
    { hreflang: 'uk', path: ukrainianPath },
    { hreflang: 'ru', path: `/ru${ukrainianPath}` },
    { hreflang: 'x-default', path: ukrainianPath },
  ];
}

// Shared interface copy for the three existing language versions.
export const SITE_COPY = {
  uk: {
    catalog: 'Каталог', sla: 'SLA-друк', olx: 'На OLX',
    olxLabel: 'Відкрити профіль продавця на OLX',
    homeLabel: `${SITE_NAME} — на головну`, navigation: 'Головна навігація',
    mobileNavigation: 'Мобільна навігація', openMenu: 'Відкрити меню', closeMenu: 'Закрити меню',
    allCategories: 'Усі категорії', information: 'Інформація',
    ordering: 'Замовлення та доставка', sitemap: 'Мапа сайту',
    footer: 'Вироби для HomeLab і робочого місця · Київ · OLX Доставка за її умовами',
    olxProfile: 'Профіль продавця на OLX',
    categoryLabels: ['Стійки та основи', 'Корпуси та дискові модулі', 'Кріплення для обладнання', 'Аксесуари для стійок'],
  },
  en: {
    catalog: 'Catalogue', sla: 'SLA printing', olx: 'OLX',
    olxLabel: 'Open the seller profile on OLX',
    homeLabel: `${SITE_NAME} — home`, navigation: 'Main navigation',
    mobileNavigation: 'Mobile navigation', openMenu: 'Open menu', closeMenu: 'Close menu',
    allCategories: 'All categories', information: 'Information',
    ordering: 'Ordering and delivery', sitemap: 'Site navigation',
    footer: 'Parts for your HomeLab and workspace · Kyiv · OLX Delivery subject to its conditions',
    olxProfile: 'Seller profile on OLX',
    categoryLabels: ['Racks and frames', 'Cases and drive modules', 'Equipment mounts', 'Rack accessories'],
  },
  ru: {
    catalog: 'Каталог', sla: 'SLA-печать (українською)', olx: 'На OLX',
    olxLabel: 'Открыть профиль продавца на OLX',
    homeLabel: `${SITE_NAME} — на главную`, navigation: 'Главная навигация',
    mobileNavigation: 'Мобильная навигация', openMenu: 'Открыть меню', closeMenu: 'Закрыть меню',
    allCategories: 'Все категории', information: 'Информация',
    ordering: 'Заказ и доставка', sitemap: 'Навигация по сайту',
    footer: 'Детали для HomeLab и рабочего места · Киев · OLX Доставка по её условиям',
    olxProfile: 'Профиль продавца на OLX',
    categoryLabels: ['Стойки и основания', 'Корпуса и дисковые модули', 'Крепления оборудования', 'Аксессуары для стоек'],
  },
};
