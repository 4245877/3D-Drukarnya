// Single source of truth for the product data contract.
//
// Plain ESM (.mjs) on purpose: the same module is imported by the site code
// (src/utils/products.ts, bundled by Vite), by `npm run validate:data`
// (scripts/validate-data.mjs, plain Node) and by the tests, so the rules are
// never duplicated between the build and the standalone checks.
import { z } from 'zod';

import {
  PRICING_PROFILE_IDS,
  REVIEWED_PRICING_SKUS,
  computeCatalogPrice,
  getPricingProfile,
} from './pricing.config.mjs';

/** Safe URL slug: lowercase latin, digits, single dashes between segments. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Stable catalog SKU: uppercase P followed by a positive integer. */
export const PRODUCT_SKU_PATTERN = /^P[1-9]\d*$/;

/** Buyer-facing catalog sections, in navigation order. */
export const CATALOG_CATEGORIES = /** @type {const} */ ([
  'Стійки та основи',
  'Корпуси та дискові модулі',
  'Кріплення для обладнання',
  'Аксесуари для стійок',
]);

/**
 * Informational rights-review states. They never control catalog visibility
 * or merchandising order; those concerns are intentionally independent.
 */
export const RIGHTS_STATUSES = /** @type {const} */ ([
  'review_required',
  'attribution_required',
  'permission_required',
  'approved',
]);

/**
 * Strips surrounding whitespace and slashes. Used both to sanity-check our
 * own slugs and to sanitize slugs coming from external APIs before they are
 * put into URLs. May return an empty string — callers must check.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeSlug(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^\/+|\/+$/g, '');
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export function isSafeSlug(value) {
  return typeof value === 'string' && SLUG_PATTERN.test(value);
}

const nonEmptyString = z.string().trim().min(1, 'must be a non-empty string');

/**
 * Absolute public reference used for model sources and licence pages.
 * Unlike `orderUrl`, these links are not tied to a marketplace allow-list.
 *
 * @param {string} fieldName
 */
const absoluteHttpsUrl = (fieldName) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} must not be empty`)
    .superRefine((value, ctx) => {
      let url;
      try {
        url = new URL(value);
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: `${fieldName} is not a valid absolute URL: "${value}"`,
        });
        return;
      }

      if (url.protocol !== 'https:') {
        ctx.addIssue({
          code: 'custom',
          message: `${fieldName} must use https:, got "${url.protocol}"`,
        });
      }
    });

/**
 * Image reference: either an absolute https:// URL or a site-local path
 * (resolved against the configured base at render time). Everything else —
 * other schemes (http:, javascript:, data:), protocol-relative URLs and
 * paths with `..` segments — is rejected.
 */
const imageReference = z
  .string()
  .trim()
  .min(1, 'image reference must not be empty')
  .superRefine((value, ctx) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      let url;
      try {
        url = new URL(value);
      } catch {
        ctx.addIssue({ code: 'custom', message: `not a valid URL: "${value}"` });
        return;
      }
      if (url.protocol !== 'https:') {
        ctx.addIssue({
          code: 'custom',
          message: `image URLs must use https:, got "${url.protocol}"`,
        });
      }
      return;
    }

    const isSafeLocalPath =
      /^\/?[\w.@~-]+(?:\/[\w.@~-]+)*$/.test(value) && !value.includes('..');
    if (!isSafeLocalPath) {
      ctx.addIssue({
        code: 'custom',
        message: `not an https:// URL or a safe site-local path: "${value}"`,
      });
    }
  });

/**
 * SKUs whose printed weight is not published anywhere we can cite yet.
 *
 * Until the selected kit has a validated shop slicing profile or a measured
 * print weight, reviewed rack parts use a provisional pricingProfile benchmark.
 * Other entries retain their catalog price. P40–P49 retain the owner's initial
 * guides after explicit approval to publish; no target weight is invented.
 *
 * Removing a SKU from this set without adding `weightGrams` fails validation,
 * so the list can only ever shrink deliberately.
 */
export const WEIGHT_PENDING_SKUS = new Set([
  'P7',  // Synology DS920+ front plate — original page publishes no weight
  'P10', // 10" rack 2U hot-swap 5×2.5" + 3×3.5" — model page not identified
  'P14', // Lab Rax drawers — published profiles cover other configurations
  'P16', // MODCASE MASS — only the "full incl. optional parts" profile is published
  'P21', // Printables 1188439 — no weight published
  'P22', // Printables 1155360 — no weight published
  'P23', // Printables — no weight published
  'P26', // Printables 1040412 — no weight published
  'P28', // Printables 980541 — no weight published
  'P29', // Printables — no weight published
  'P32', // Printables — no weight published
  'P35', // Printables — no weight published
  'P36', // Printables 1247474 — no weight published
  'P37', // Printables 1369947 — no weight published
  'P38', // Printables 150719 — no weight published
  'P39', // Printables 883453 — no weight published
  'P40', 'P41', 'P42', 'P43', 'P44', 'P45', 'P46', 'P47', 'P48', 'P49',
]);

export const productVariantSchema = z.strictObject({
  name: nonEmptyString,
  description: nonEmptyString,
  badge: nonEmptyString.optional(),
});

/**
 * Pricing model of the visible price and the JSON-LD offer.
 * - `exact` — the number is the final price (rendered as "Ціна",
 *   published as an Offer with `price`).
 * - `from`  — the number is a confirmed minimum ("Ціна від"; published as an
 *   AggregateOffer with `lowPrice` only — no invented upper bound).
 */
export const PRICE_TYPES = /** @type {const} */ (['exact', 'from']);

/**
 * Confirmed availability status. Maps to schema.org ItemAvailability:
 * - `in_stock`      → https://schema.org/InStock
 * - `made_to_order` → https://schema.org/MadeToOrder
 * - `unavailable`   → https://schema.org/OutOfStock
 * - `unconfirmed`   → the JSON-LD offer is published WITHOUT `availability`
 *   (never guess InStock for a product whose status is not confirmed).
 */
export const AVAILABILITY_STATUSES = /** @type {const} */ ([
  'in_stock',
  'made_to_order',
  'unavailable',
  'unconfirmed',
]);

/** Warning severity levels for `safetyWarnings`. */
export const WARNING_LEVELS = /** @type {const} */ (['notice', 'critical']);

/**
 * Hosts allowed in `orderUrl` (exact match or subdomain). Keep deliberately
 * short: order links must point at the seller's own marketplace profile.
 */
export const ALLOWED_ORDER_URL_HOSTS = ['olx.ua'];

/**
 * Optional per-product order link. Only absolute https:// URLs on an
 * allowed marketplace host pass; javascript:, data:, http: and unknown
 * hosts are rejected.
 */
const orderUrlSchema = z
  .string()
  .trim()
  .min(1, 'orderUrl must not be empty')
  .superRefine((value, ctx) => {
    let url;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({ code: 'custom', message: `orderUrl is not a valid absolute URL: "${value}"` });
      return;
    }
    if (url.protocol !== 'https:') {
      ctx.addIssue({
        code: 'custom',
        message: `orderUrl must use https:, got "${url.protocol}"`,
      });
      return;
    }
    const allowed = ALLOWED_ORDER_URL_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
    if (!allowed) {
      ctx.addIssue({
        code: 'custom',
        message: `orderUrl host "${url.hostname}" is not in the allowed list (${ALLOWED_ORDER_URL_HOSTS.join(', ')})`,
      });
    }
  });

/**
 * Structured safety warning shown as a highlighted block on the product
 * page. `critical` warnings are always rendered outside of any accordion.
 */
export const safetyWarningSchema = z.strictObject({
  level: z.enum(WARNING_LEVELS),
  title: nonEmptyString.optional(),
  text: nonEmptyString,
});

// strictObject: unknown keys (typos such as "pirce" or "image") fail
// validation instead of being silently ignored.
export const productSchema = z.strictObject({
  sku: z
    .string()
    .regex(PRODUCT_SKU_PATTERN, 'sku must be P followed by a positive integer'),
  slug: z
    .string()
    .min(1, 'slug must not be empty')
    .regex(
      SLUG_PATTERN,
      'slug must match [a-z0-9]+(-[a-z0-9]+)* (lowercase latin, digits, dashes)',
    ),
  title: nonEmptyString,
  shortDescription: nonEmptyString,
  description: nonEmptyString,
  // Higher values appear earlier in the catalog. Rights metadata and
  // `featured` are deliberately not part of the ordering contract.
  merchandisingPriority: z.number().int().nonnegative(),
  featured: z.boolean().default(false),
  // Drafts are retained in the same data collection but never shipped by a
  // production build. Rights metadata remains independent of merchandising.
  publicationStatus: z.enum(['published', 'draft']).default('published'),
  draftReasons: z.array(nonEmptyString).min(1).optional(),
  imageNotice: nonEmptyString.optional(),
  familyId: z
    .string()
    .regex(
      SLUG_PATTERN,
      'familyId must match [a-z0-9]+(-[a-z0-9]+)* (lowercase latin, digits, dashes)',
    )
    .optional(),
  commercialRightsStatus: z.enum(RIGHTS_STATUSES).default('review_required'),
  photoRightsStatus: z.enum(RIGHTS_STATUSES).default('review_required'),
  author: nonEmptyString.optional(),
  sourceUrl: absoluteHttpsUrl('sourceUrl').optional(),
  license: nonEmptyString.optional(),
  licenseUrl: absoluteHttpsUrl('licenseUrl').optional(),
  attributionRequired: z.boolean().default(false),
  // Printed weight of this product in grams, taken from the original
  // model page. Required for every product except the SKUs listed in
  // WEIGHT_PENDING_SKUS below; never estimated here.
  weightGrams: z
    .number('weightGrams must be a number')
    .refine((value) => Number.isFinite(value) && value > 0, {
      message: 'weightGrams must be a finite positive number',
    })
    .optional(),
  // Reviewed manufacturing class; without a known weight this selects a
  // provisional catalog benchmark. It does not invent a physical weight.
  pricingProfile: z.enum(PRICING_PROFILE_IDS).optional(),
  // Derived from the shared pricing policy and cross-checked below — edit
  // the weight, profile or rate, then run
  // `npm run prices:recalculate`; never edit this number directly.
  // Also rendered in JSON-LD (Offer.price for `exact`, AggregateOffer.lowPrice
  // for `from`), so it must stay a plain number.
  price: z
    .number('price must be a number')
    .refine((value) => Number.isFinite(value) && value > 0, {
      message: 'price must be a finite positive number',
    }),
  // Single source of truth for the "Ціна" / "Ціна від" label on the card,
  // the product page and the JSON-LD offer shape. Defaults to `exact`.
  priceType: z.enum(PRICE_TYPES).default('exact'),
  // Confirmed availability; defaults to `unconfirmed`, which keeps the
  // `availability` property out of the published offer entirely.
  availability: z.enum(AVAILABILITY_STATUSES).default('unconfirmed'),
  // Escape hatch: set to false to keep the whole Offer/AggregateOffer out of
  // JSON-LD until the commercial details are confirmed.
  publishOffer: z.boolean().default(true),
  priceNote: nonEmptyString.optional(),
  orderUrl: orderUrlSchema.optional(),
  safetyWarnings: z
    .array(safetyWarningSchema)
    .min(1, 'safetyWarnings, when present, must not be empty')
    .optional(),
  images: z.array(imageReference).min(1, 'images must contain at least one entry'),
  category: z.enum(CATALOG_CATEGORIES),
  material: nonEmptyString.optional(),
  leadTime: nonEmptyString.optional(),
  variantSummary: nonEmptyString.optional(),
  variants: z
    .array(productVariantSchema)
    .min(1, 'variants, when present, must not be empty')
    .optional(),
}).superRefine((product, ctx) => {
  if (product.publicationStatus === 'draft') {
    if (!product.draftReasons?.length) {
      ctx.addIssue({ code: 'custom', path: ['draftReasons'], message: 'drafts require publication blockers' });
    }
    if (product.publishOffer || product.availability !== 'unconfirmed' || product.orderUrl) {
      ctx.addIssue({
        code: 'custom', path: ['publicationStatus'],
        message: 'drafts require publishOffer=false, availability=unconfirmed and no orderUrl',
      });
    }
  }
  if (product.weightGrams === undefined) {
    // Unknown physical weights remain explicit, even when benchmark pricing
    // makes it possible to calculate a provisional starting price.
    if (product.publicationStatus !== 'draft' && !WEIGHT_PENDING_SKUS.has(product.sku)) {
      ctx.addIssue({
        code: 'custom',
        path: ['weightGrams'],
        message:
          'weightGrams is required; add the weight published on the original ' +
          `model page, or list ${product.sku} in WEIGHT_PENDING_SKUS while it is unknown`,
      });
    }
    if (product.pricingProfile !== undefined && product.priceType !== 'from') {
      ctx.addIssue({
        code: 'custom',
        path: ['priceType'],
        message: 'benchmark pricing without a known weight requires priceType=from',
      });
    }
    if (REVIEWED_PRICING_SKUS.has(product.sku) && product.pricingProfile === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['pricingProfile'],
        message: 'reviewed products require a pricingProfile until their weight is known',
      });
    }
  }

  if (product.pricingProfile !== undefined) {
    const profile = getPricingProfile(product.pricingProfile);
    if (product.category !== profile.category) {
      ctx.addIssue({
        code: 'custom',
        path: ['pricingProfile'],
        message: `pricingProfile ${product.pricingProfile} requires category ${profile.category}`,
      });
    }
  }

  // Both measured and benchmark prices must match the shared calculator.
  // Legacy pending products outside this review have no computed price yet.
  // A failed numeric refinement has already recorded its error; do not let
  // the calculator throw out of safeParse for that same invalid input.
  if (product.weightGrams !== undefined &&
      (!Number.isFinite(product.weightGrams) || product.weightGrams <= 0)) return;
  const expected = computeCatalogPrice(product);
  if (expected !== undefined && product.price !== expected) {
    ctx.addIssue({
      code: 'custom',
      path: ['price'],
      message:
        `price ${product.price} does not match the pricing policy (${expected} ₴); ` +
        'run `npm run prices:recalculate`',
    });
  }
});

/**
 * @param {ReadonlyArray<string | number | symbol>} path
 * @returns {string}
 */
function formatIssuePath(path) {
  if (path.length === 0) return '(root)';
  return path
    .map((segment, index) =>
      typeof segment === 'number'
        ? `[${segment}]`
        : `${index === 0 ? '' : '.'}${String(segment)}`,
    )
    .join('');
}

/**
 * Validates a set of product documents plus the collection-level rules
 * (unique SKUs, slugs and titles). Every error message starts with the
 * source name (file path) so failures are easy to locate.
 *
 * @param {ReadonlyArray<{ source: string, data: unknown }>} entries
 * @returns {{ products: Array<z.infer<typeof productSchema>>, errors: string[] }}
 */
export function validateProductCollection(entries) {
  /** @type {string[]} */
  const errors = [];
  /** @type {Array<z.infer<typeof productSchema>>} */
  const products = [];
  /** @type {Map<string, string>} */
  const skuSources = new Map();
  /** @type {Map<string, string>} */
  const slugSources = new Map();
  /** @type {Map<string, string>} */
  const titleSources = new Map();

  for (const { source, data } of entries) {
    const result = productSchema.safeParse(data);

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${source}: ${formatIssuePath(issue.path)} — ${issue.message}`);
      }
      continue;
    }

    const product = result.data;

    const existingSkuSource = skuSources.get(product.sku);
    if (existingSkuSource) {
      errors.push(
        `${source}: sku — "${product.sku}" is already used by ${existingSkuSource}`,
      );
    } else {
      skuSources.set(product.sku, source);
    }

    // The schema regex already forbids slashes, but assert the invariant the
    // URL builders rely on: a normalized slug is never empty.
    if (normalizeSlug(product.slug) === '') {
      errors.push(`${source}: slug — becomes empty after normalization`);
      continue;
    }

    const existingSlugSource = slugSources.get(product.slug);
    if (existingSlugSource) {
      errors.push(
        `${source}: slug — "${product.slug}" is already used by ${existingSlugSource}`,
      );
    } else {
      slugSources.set(product.slug, source);
    }

    const titleKey = product.title.toLowerCase();
    const existingTitleSource = titleSources.get(titleKey);
    if (existingTitleSource) {
      errors.push(
        `${source}: title — "${product.title}" is already used by ${existingTitleSource}`,
      );
    } else {
      titleSources.set(titleKey, source);
    }

    products.push(product);
  }

  return { products, errors };
}
