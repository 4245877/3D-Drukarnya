// Shared JSON-LD node builders.
//
// Every page emits one <script type="application/ld+json"> holding a single
// "@graph". The nodes below keep the stable @id values that the rest of the
// site references (product pages point their Offer.seller at
// `<site>#local-business`, breadcrumbs point at `<site>#website`), so the
// graph joins up across pages instead of repeating disconnected islands.
//
// Only entities that are actually present on the page may be added to its
// graph — see the per-page callers.

import { OLX_URL, SITE_NAME, SITE_URL, SKUFNYA_URL, absoluteUrl } from '../data/site.config.mjs';

/** Stable @id of the site-wide WebSite node. */
export const WEBSITE_ID = `${SITE_URL}#website`;

/** Stable @id of the site-wide business node (also the Offer seller). */
export const BUSINESS_ID = `${SITE_URL}#local-business`;

const LOGO_URL = absoluteUrl('apple-touch-icon.png');
const OG_IMAGE_URL = absoluteUrl('OGimage.png');

const BUSINESS_DESCRIPTION =
  'Майстерня 3D-друку з Києва: 10-дюймові серверні стійки, NAS-корпуси, ' +
  'кріплення та аксесуари для HomeLab, друковані з PLA та PETG на замовлення.';

/**
 * The site itself. Emitted once per page so that any page can be the entry
 * point a crawler or an assistant lands on.
 *
 * @returns {Record<string, unknown>}
 */
export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    alternateName: ['3D Drukarnya', '10-дюймові серверні стійки — 3D Друкарня'],
    url: SITE_URL,
    inLanguage: 'uk-UA',
    description: BUSINESS_DESCRIPTION,
    publisher: { '@id': BUSINESS_ID },
  };
}

/**
 * The workshop behind the catalog. LocalBusiness rather than a bare
 * Organization because pickup in Kyiv is a real, published service; the node
 * carries only facts the site states elsewhere (city, country, channels).
 * No street address, phone, rating or founding date is invented.
 *
 * @returns {Record<string, unknown>}
 */
export function businessNode() {
  return {
    '@type': 'LocalBusiness',
    '@id': BUSINESS_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: BUSINESS_DESCRIPTION,
    image: OG_IMAGE_URL,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
      width: 180,
      height: 180,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Київ',
      addressCountry: 'UA',
    },
    areaServed: [
      { '@type': 'City', name: 'Київ' },
      { '@type': 'Country', name: 'Україна' },
    ],
    currenciesAccepted: 'UAH',
    priceRange: '₴₴',
    sameAs: [OLX_URL, SKUFNYA_URL],
    knowsAbout: [
      '10-дюймова серверна стійка',
      'mini rack',
      'HomeLab',
      'NAS',
      'rack mount',
      'Raspberry Pi',
      'Mini-PC',
      'патч-панелі',
      'FDM 3D-друк',
      'PETG',
      'PLA',
    ],
  };
}

/**
 * WebPage node for a page inside the site.
 *
 * @param {object} options
 * @param {string} options.url       Absolute canonical URL of the page.
 * @param {string} options.name      Page name (usually the <h1>).
 * @param {string} options.description
 * @param {string} [options.type]    A WebPage subtype (CollectionPage…).
 * @param {string} [options.breadcrumbId]
 * @returns {Record<string, unknown>}
 */
export function webPageNode({ url, name, description, type = 'WebPage', breadcrumbId }) {
  return {
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: 'uk-UA',
    isPartOf: { '@id': WEBSITE_ID },
    ...(breadcrumbId ? { breadcrumb: { '@id': breadcrumbId } } : {}),
  };
}

/**
 * BreadcrumbList built from the same array the visible <nav> renders, so the
 * markup can never describe a trail the page does not show.
 *
 * @param {string} pageUrl Absolute canonical URL of the current page.
 * @param {Array<{ name: string, url?: string }>} items Ordered, current page last.
 * @returns {Record<string, unknown>}
 */
export function breadcrumbNode(pageUrl, items) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumbs`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

/**
 * FAQPage node. Google retired FAQ rich results in 2025, but the markup is
 * still valid schema.org, is still consumed by Bing and by assistants that
 * parse JSON-LD, and costs nothing — as long as every question here is also
 * rendered visibly on the page, which the build checks enforce.
 *
 * @param {string} pageUrl
 * @param {Array<{ question: string, answer: string }>} items
 * @returns {Record<string, unknown>}
 */
export function faqNode(pageUrl, items) {
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * ItemList of products shown on a listing page. Uses `url` entries rather
 * than nested Product objects: the full product markup lives on each product
 * page, and duplicating it here would restate prices in a second place.
 *
 * @param {string} pageUrl
 * @param {Array<{ name: string, url: string }>} entries
 * @param {string} [name] Human-readable list name.
 * @returns {Record<string, unknown>}
 */
export function itemListNode(pageUrl, entries, name) {
  return {
    '@type': 'ItemList',
    '@id': `${pageUrl}#items`,
    ...(name ? { name } : {}),
    numberOfItems: entries.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      url: entry.url,
    })),
  };
}

/**
 * Wraps a set of nodes into the document-level graph every page emits.
 *
 * @param {Array<Record<string, unknown> | undefined | null>} nodes
 * @returns {Record<string, unknown>}
 */
export function graph(nodes) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  };
}
