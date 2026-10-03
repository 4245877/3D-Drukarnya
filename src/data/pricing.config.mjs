// Shared catalog pricing policy. Known weights use the shop's print rate.
// Reviewed rack parts without a weight use a comparable catalog part plus
// a fixed allowance for extra work. These are provisional starting prices,
// not measured production costs. See PRICING-AUDIT.md for the comparison.
// JSON imports read the reference weights directly; neither a copied weight
// nor the reference's stored (possibly stale) price drives recalculation.
import psuMount from './products/product-20.json' with { type: 'json' };
import switchMount from './products/product-25.json' with { type: 'json' };
import miniPcMount from './products/product-27.json' with { type: 'json' };
import patchPanel from './products/product-33.json' with { type: 'json' };

/**
 * Catalog-wide print rate, in UAH per gram of finished product.
 * This is the only place the number lives.
 */
export const PRICE_PER_GRAM_UAH = 2.5;

/** Currency of PRICE_PER_GRAM_UAH and of every computed price. */
export const PRICE_CURRENCY = 'UAH';

// Allowances are commercial starting-price policy, not claims about measured
// labour costs. Empty Keystone sockets carry no separate surcharge. A known
// weight replaces the benchmark automatically, while extra work still applies.
export const PRICING_PROFILES = {
  'mini-pc-mount': {
    reference: miniPcMount,
    extraWorkUah: 0,
    category: 'Кріплення для обладнання',
    reason: 'Одна стандартна PETG-панель для mini-PC, без комплектуючих.',
  },
  'compact-abs-mount': {
    reference: switchMount,
    extraWorkUah: 50,
    category: 'Кріплення для обладнання',
    reason: 'Компактне кріплення; 50 грн за підготовку друку з ABS.',
  },
  'parametric-mount': {
    reference: miniPcMount,
    extraWorkUah: 100,
    category: 'Кріплення для обладнання',
    reason: '100 грн за налаштування трьох габаритів і перевірку геометрії.',
  },
  'sbc-panel': {
    reference: patchPanel,
    extraWorkUah: 50,
    category: 'Кріплення для обладнання',
    reason: 'Панель; 50 грн за перевірку посадки плати, TFT і кнопки.',
  },
  'psu-mount': {
    reference: psuMount,
    extraWorkUah: 50,
    category: 'Кріплення для обладнання',
    reason: 'Тримач БЖ; 50 грн за підготовку PETG і перевірку посадкових місць.',
  },
  'modular-cable-guide': {
    reference: patchPanel,
    extraWorkUah: 50,
    category: 'Аксесуари для стійок',
    reason: 'Планка з трьома гачками; 50 грн за підготовку кількох деталей.',
  },
  'cable-panel': {
    reference: patchPanel,
    extraWorkUah: 0,
    category: 'Аксесуари для стійок',
    reason: 'Одна проста PETG-панель без комплектуючих.',
  },
};

export const PRICING_PROFILE_IDS = /** @type {Array<keyof typeof PRICING_PROFILES>} */ (
  Object.keys(PRICING_PROFILES)
);

// An audited SKU must not silently fall back to its old hand-set price if
// someone removes its profile before a physical weight becomes available.
export const REVIEWED_PRICING_SKUS = new Set([
  'P21', 'P22', 'P23', 'P26', 'P28', 'P29', 'P32', 'P35', 'P36', 'P37',
]);

/** @param {string} profileId */
export function getPricingProfile(profileId) {
  if (!Object.hasOwn(PRICING_PROFILES, profileId)) {
    throw new Error(`Unknown pricingProfile: ${profileId}`);
  }
  return PRICING_PROFILES[/** @type {keyof typeof PRICING_PROFILES} */ (profileId)];
}

/**
 * The catalog price of a product: weight × rate.
 *
 * Rounded to whole hryvnia on purpose. Prices are rendered with
 * `Intl.NumberFormat('uk-UA')` and republished as a JSON-LD offer, and
 * scripts/check-build.mjs compares the digits of the rendered price against
 * the stored number — keeping prices integral keeps all three in agreement.
 *
 * @param {number} weightGrams Printed weight of the product, in grams.
 * @param {number} [pricePerGram] Rate override; defaults to the catalog rate.
 * @returns {number} Price in UAH, rounded to the nearest hryvnia.
 */
export function computePriceFromWeight(weightGrams, pricePerGram = PRICE_PER_GRAM_UAH) {
  return Math.round(weightGrams * pricePerGram);
}

/**
 * Returns undefined only for legacy products still awaiting a pricing review.
 * Benchmark weights are calculation inputs, never the target product's weight.
 * @param {{ weightGrams?: number, pricingProfile?: string }} product
 * @param {number} [pricePerGram]
 */
export function computeCatalogPrice(product, pricePerGram = PRICE_PER_GRAM_UAH) {
  const profile = product.pricingProfile === undefined
    ? undefined
    : getPricingProfile(product.pricingProfile);
  const basisWeight = product.weightGrams ?? profile?.reference.weightGrams;
  if (basisWeight === undefined) return undefined;
  if (!Number.isFinite(basisWeight) || basisWeight <= 0) {
    throw new Error('Pricing requires a finite positive weight');
  }
  return computePriceFromWeight(basisWeight, pricePerGram) + (profile?.extraWorkUah ?? 0);
}
