// Language versions of the site.
//
// Only pages that genuinely exist in more than one language declare hreflang
// alternates — a self-referencing alternate on a page with no counterpart is
// noise, not a signal. Today that is exactly one pair: the Ukrainian home
// page and its English overview.
//
// ── Adding a language (phase 2) ──────────────────────────────────────────
// The plan documented in SEO-AI-SEARCH-SETUP.md is a `/ru/` branch mirroring
// the catalog and the guides. When those pages exist:
//   1. add their entry here;
//   2. pass LANGUAGE_ALTERNATES (or a per-page subset) to <Layout>;
//   3. set `lang` and `ogLocale` on the translated pages.
// Nothing else in the codebase needs to change — Layout already renders the
// <link rel="alternate" hreflang> set it is given.

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
  { hreflang: 'x-default', path: '/' },
];
