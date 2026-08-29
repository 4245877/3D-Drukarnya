// URL helpers shared by every page. Absolute URLs come from the single
// site-config source (src/data/site.config.mjs) rather than from
// `Astro.site` + `import.meta.env.BASE_URL` recomputed per page, so canonical
// links, JSON-LD `@id`s, Open Graph URLs and the sitemap can never disagree.
import { BASE_PATH, SITE_URL, absoluteUrl } from '../data/site.config.mjs';

export { BASE_PATH, SITE_URL, absoluteUrl };

/**
 * Site-relative href for an internal link (`/3D-Drukarnya/guides/`).
 * Accepts paths with or without a leading slash; '' and '/' both mean home.
 */
export function href(path = ''): string {
  return `${BASE_PATH}${String(path).replace(/^\/+/, '')}`;
}

/**
 * Turns a possibly-relative asset or page reference into an absolute https
 * URL. Already-absolute URLs pass through; protocol-relative URLs get https.
 */
export function toAbsoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return `https:${value}`;
  return absoluteUrl(value);
}
