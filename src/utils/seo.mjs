// SEO title rules for product pages. Plain ESM (.mjs) so both the Astro page
// and the node:test suite import the exact same implementation.
//
// The visible <h1> always keeps the FULL product title; only the <title> is
// shortened. Names are clipped at natural separators (" — ", " (", " для "…)
// or, failing that, at a word boundary — never mid-word.

/** Brand suffix; "3D Друкарня" is the site name used across the project. */
export const TITLE_SUFFIX = ' | 3D Друкарня';

/** Soft budget for the product-name part of the <title>. */
const MAX_NAME_LENGTH = 48;

/** Minimum acceptable clipped-name length before falling back to word cuts. */
const MIN_NAME_LENGTH = 20;

/** Natural clipping points, tried before any word-boundary cut. */
const SEPARATORS = [' — ', ' – ', ' (', ' для ', ' на ', ' / ', ', ', ': '];

/**
 * A clip can land inside a "(…)" group and leave a dangling "(fragment";
 * drop the unclosed group and any punctuation left hanging before it.
 *
 * @param {string} value
 * @returns {string}
 */
function dropUnclosedParenthetical(value) {
  const opens = (value.match(/\(/g) ?? []).length;
  const closes = (value.match(/\)/g) ?? []).length;
  if (opens <= closes) return value;
  return value
    .slice(0, value.lastIndexOf('('))
    .replace(/[\s,;:—–/-]+$/u, '')
    .trim();
}

/**
 * @param {string} name
 * @param {number} max
 * @returns {string}
 */
function clipName(name, max) {
  if (name.length <= max) return name;

  // Prefer the LONGEST candidate that still fits: it keeps the most
  // distinguishing detail (e.g. "…на 6 дисків" vs "…на 4 диски").
  let best = '';
  for (const separator of SEPARATORS) {
    let index = name.indexOf(separator);
    while (index !== -1) {
      const candidate = name.slice(0, index).trim();
      if (candidate.length <= max && candidate.length > best.length) {
        best = candidate;
      }
      index = name.indexOf(separator, index + 1);
    }
  }
  best = dropUnclosedParenthetical(best);
  if (best.length >= MIN_NAME_LENGTH) return best;

  // Fall back: cut at the last word boundary within the budget, then strip
  // any dangling punctuation. Never cuts inside a word.
  const slice = name.slice(0, max + 1);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice.slice(0, max);
  return dropUnclosedParenthetical(cut.replace(/[\s,;:—–/-]+$/u, '').trim());
}

/**
 * Builds the SEO <title> for a product page: clipped product name + brand.
 *
 * @param {string} productTitle
 * @returns {string}
 */
export function buildProductTitle(productTitle) {
  return `${clipName(productTitle.trim(), MAX_NAME_LENGTH)}${TITLE_SUFFIX}`;
}
