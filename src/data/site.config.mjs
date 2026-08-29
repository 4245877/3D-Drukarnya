// Single source of truth for everything that changes when the site moves to
// its own domain. Plain ESM (.mjs) so the Astro build, the standalone Node
// scripts (scripts/*.mjs) and the tests all read the exact same values.
//
// ── Moving to a custom domain ────────────────────────────────────────────
// 1. Change SITE_ORIGIN below (e.g. 'https://3d-drukarnya.com.ua').
// 2. Change BASE_PATH to '/' (a custom apex/sub domain has no subpath).
// 3. Mirror both in astro.config.mjs (`site` / `base`).
// 4. Add public/CNAME with the bare hostname.
// 5. Regenerate the IndexNow key file name only if the key itself changes —
//    the key file has to live under the new BASE_PATH too.
// Nothing else in the codebase hardcodes the host or the subpath.

/** Origin the production site is served from (scheme + host, no path). */
export const SITE_ORIGIN = 'https://4245877.github.io';

/** Path prefix of the deployment. Always starts and ends with '/'. */
export const BASE_PATH = '/3D-Drukarnya/';

/** Absolute base URL of the production site, with a trailing slash. */
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

/** Brand name, used in <title> suffixes, JSON-LD and visible chrome. */
export const SITE_NAME = '3D Друкарня';

/** Primary content language of the site (BCP 47). */
export const SITE_LANG = 'uk';

/** OG locale matching SITE_LANG. */
export const SITE_LOCALE = 'uk_UA';

/** Seller profile on the marketplace all orders currently go through. */
export const OLX_URL = 'https://www.olx.ua/uk/list/user/15L7LS/';

/** Related project of the same owner, linked in the footer and `sameAs`. */
export const SKUFNYA_URL = 'https://www.skufnya.com/';

/**
 * Public IndexNow key. IndexNow keys are verification tokens, not secrets:
 * the protocol requires the very same value to be served as a plain text file
 * at a public URL, so keeping it in the repository changes nothing about its
 * exposure. See SEO-AI-SEARCH-SETUP.md.
 */
export const INDEXNOW_KEY = '7b1c4f0a9e2d48c3ab56d90f13e874a2';

/** Where that key file is published (must sit under BASE_PATH). */
export const INDEXNOW_KEY_LOCATION = `${SITE_URL}${INDEXNOW_KEY}.txt`;

/**
 * Joins a site-relative path onto the absolute site base.
 *
 * @param {string} [path] path with or without a leading slash
 * @returns {string} absolute https URL
 */
export function absoluteUrl(path = '') {
  return new URL(String(path).replace(/^\/+/, ''), SITE_URL).toString();
}
