// Single source of truth for the product data contract.
//
// Plain ESM (.mjs) on purpose: the same module is imported by the site code
// (src/utils/products.ts, bundled by Vite), by `npm run validate:data`
// (scripts/validate-data.mjs, plain Node) and by the tests, so the rules are
// never duplicated between the build and the standalone checks.
import { z } from 'zod';

/** Safe URL slug: lowercase latin, digits, single dashes between segments. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  category: nonEmptyString.optional(),
  material: nonEmptyString.optional(),
  leadTime: nonEmptyString.optional(),
  variantSummary: nonEmptyString.optional(),
  variants: z
    .array(productVariantSchema)
    .min(1, 'variants, when present, must not be empty')
    .optional(),
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
 * (unique slugs, unique titles). Every error message starts with the source
 * name (file path) so failures are easy to locate.
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
