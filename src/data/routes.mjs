// Every indexable route that is NOT a product page, in one place.
//
// Consumed by src/pages/sitemap.xml.ts (which adds the product pages from the
// product JSON files), by scripts/check-build.mjs (which asserts each route
// was actually built) and by the tests. Product routes deliberately stay out
// of this list: they are derived from the data, not declared by hand.

import { CATEGORIES } from './categories.mjs';
import { GUIDES } from './guides.mjs';

/**
 * @typedef {object} SiteRoute
 * @property {string} path      Site-relative path, no leading slash, trailing
 *                              slash included ('' means the home page).
 * @property {string} [lastmod] ISO date, only where a real modification date
 *                              exists. Never a build timestamp: a sitemap in
 *                              which every URL shares one made-up lastmod is
 *                              worth less than one with no lastmod at all.
 */

/** @type {SiteRoute[]} */
export const STATIC_ROUTES = [
  { path: '' },
  { path: 'catalog/' },
  ...CATEGORIES.map((category) => ({ path: `catalog/${category.slug}/` })),
  { path: 'guides/' },
  ...GUIDES.map((guide) => ({ path: `guides/${guide.slug}/`, lastmod: guide.dateModified })),
  { path: 'about/' },
  { path: 'en/' },
];

/** Paths only, for the callers that do not care about lastmod. */
export const STATIC_ROUTE_PATHS = STATIC_ROUTES.map((route) => route.path);
