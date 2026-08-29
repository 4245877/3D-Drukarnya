// Data-contract tests: the real product JSON files must satisfy the shared
// schema, and the schema must actually reject broken input.
// Runner: built-in node:test (`npm test`), no extra dependencies.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  CATALOG_CATEGORIES,
  PRODUCT_SKU_PATTERN,
  RIGHTS_STATUSES,
  SLUG_PATTERN,
  isSafeSlug,
  normalizeSlug,
  WEIGHT_PENDING_SKUS,
  productSchema,
  validateProductCollection,
} from '../src/data/product.schema.mjs';
import {
  PRICE_PER_GRAM_UAH,
  computePriceFromWeight,
} from '../src/data/pricing.config.mjs';

const productsDir = fileURLToPath(new URL('../src/data/products/', import.meta.url));

// Curated commercial sequence from the brief first; products outside that
// sequence follow their relative order in the supplied full ranking.
const EXPECTED_SKUS_IN_CATALOG_ORDER = [
  'P1', 'P3', 'P9', 'P21', 'P2', 'P10', 'P5', 'P12',
  'P4', 'P23', 'P26', 'P6', 'P22', 'P11', 'P15', 'P8',
  'P14', 'P13', 'P7', 'P25', 'P34', 'P17', 'P19', 'P24',
  'P35', 'P31', 'P36', 'P20', 'P28', 'P16', 'P18', 'P29',
  'P33', 'P30', 'P27', 'P32', 'P37', 'P38',
];

const EXPECTED_SLUGS_BY_SKU = {
  P1: 'modulna-mini-stiika-dlia-homelab-raspberry-pi-mini-pc-merezha',
  P2: 'modulna-10-serverna-stiika-mini-rack-1u-4u-dlia-homelab-merezhevoho',
  P3: 'korpus-dlia-nas-servera-na-8-dyskiv-mini-itx-analoh-jonsbo-n2',
  P4: 'thinknas-6x-korpus-dlia-nas-na-6-dyskiv-dlia-lenovo-m920q',
  P5: 'thinknas-4x-korpus-dlia-nas-na-4-dysky-dlia-lenovo-m920q',
  P6: 'nuc-nas-korpus-dlia-nas-na-bazi-intel-nuc',
  P7: 'synology-ds920-front-plate-dlia-kastomnoi-stiiky',
  P8: 'thinkbox-v2-korpus-dlia-nas-na-4-dysky-dlia-lenovo-m720q-m920q',
  P9: 'kws-rack-v2-posylena-10-diuimova-stiika-dlia-homelab',
  P10: '10-inch-rack-2u-5x-2-5-3x-3-5-hdd-hot-swap',
  P11: '12-trays-hdd-enclosure-3u-rack-mountable',
  P12: '3-5-hdd-rack-caddy-holder-na-6-dyskiv',
  P13: 'lab-rax-19-komplekt-poperechok-dlia-servernoi-stiiky',
  P14: 'shukhliady-dlia-10-inch-lab-rax-rack-gridfinity-1u-2u',
  P15: 'nas5070-korpus-dlia-dell-wyse-5070-na-6-dyskiv-2-5',
  P16: 'modcase-mass-modulnyi-nas-korpus-mini-itx',
  P17: 'open-frame-pc-case-atx-vidkrytyi-korpus',
  P18: 'atx-bench-power-supply-laboratornyi-blok-zhyvlennia',
  P19: 'power-strip-holder-trymach-merezhevoho-filtra-pid-stil',
  P20: '10-inch-rack-2u-atx-psu-trymach-bloka-zhyvlennia',
  P21: 'parametric-10-inch-server-rack-mount',
  P22: 'mikrotik-hap-ac2-10-inch-rackmount',
  P23: 'mikrotik-hap-ac2-10-inch-rackmount-4x-keystone',
  P24: 'tp-link-sg1005p-sg105-10-inch-rack-mount',
  P25: 'tp-link-tl-sg108pe-sf1006p-10-inch-rack-mount',
  P26: 'lenovo-thinkcentre-tiny-10-inch-rack-mount-keystone',
  P27: 'lenovo-thinkcentre-m70q-m80q-10-inch-rackmount',
  P28: 'dell-optiplex-7060-micropc-10-inch-rack-mount',
  P29: 'hp-elitedesk-800-g3-g4-g5-10-inch-rack-bracket',
  P30: '10-inch-rack-shelf-universal-universalna-polytsia',
  P31: 'raspberry-pi-2b-3b-4b-5b-10-inch-rack-mount',
  P32: 'raspberry-pi-10-inch-rack-mount-ips-tft-12mm-switch',
  P33: '10-inch-keystone-patchpanel-10-portiv',
  P34: '10-inch-half-u-keystone-patchpanel-8-portiv',
  P35: '10-inch-rack-cable-guide-modularni-hachky',
  P36: '10-inch-server-rack-cable-management-plate',
  P37: '10-inch-rack-meanwell-lrs-100-12-psu-mount',
  P38: '35-hard-drive-to-525-drive-bay-adapter',
};

async function loadEntries() {
  const fileNames = (await readdir(productsDir))
    .filter((name) => name.endsWith('.json'))
    .sort();

  return Promise.all(
    fileNames.map(async (fileName) => ({
      source: fileName,
      data: JSON.parse(await readFile(path.join(productsDir, fileName), 'utf8')),
    })),
  );
}

/** A minimal product that passes the schema; tests override single fields. */
const validProduct = {
  sku: 'P999',
  slug: 'test-product',
  title: 'Test product',
  shortDescription: 'Short description.',
  description: 'Long description.',
  merchandisingPriority: 10,
  // 40 g × 2.5 ₴/g = 100 ₴ — kept in sync through computePriceFromWeight so
  // the fixture survives a rate change.
  weightGrams: 40,
  price: computePriceFromWeight(40),
  category: CATALOG_CATEGORIES[0],
  images: ['https://example.com/image.webp'],
};

test('every product JSON file passes the schema and collection rules', async () => {
  const entries = await loadEntries();

  assert.equal(entries.length, 38, 'the catalog must keep all 38 product files');

  const { products, errors } = validateProductCollection(entries);

  assert.deepEqual(errors, []);
  assert.equal(products.length, entries.length);
});

test('P1-P38 filenames, SKUs and published slugs remain stable', async () => {
  const entries = await loadEntries();
  const expectedFiles = Array.from({ length: 38 }, (_, index) => `product-${index + 1}.json`);

  assert.deepEqual(
    entries.map(({ source }) => source).sort((a, b) => {
      const aNumber = Number.parseInt(a.match(/\d+/)?.[0] ?? '', 10);
      const bNumber = Number.parseInt(b.match(/\d+/)?.[0] ?? '', 10);
      return aNumber - bNumber;
    }),
    expectedFiles,
  );

  for (const { source, data } of entries) {
    const number = Number.parseInt(source.match(/\d+/)?.[0] ?? '', 10);
    const expectedSku = `P${number}`;
    assert.equal(data.sku, expectedSku, `${source}: SKU no longer matches its P-number`);
    assert.equal(
      data.slug,
      EXPECTED_SLUGS_BY_SKU[expectedSku],
      `${source}: published product slug changed`,
    );
  }
});

test('merchandising priorities produce the curated catalog order', async () => {
  const entries = await loadEntries();

  for (const { source, data } of entries) {
    assert.match(data.sku, PRODUCT_SKU_PATTERN, `${source}: invalid SKU`);
    assert.ok(
      Number.isInteger(data.merchandisingPriority) && data.merchandisingPriority >= 0,
      `${source}: merchandisingPriority must be a non-negative integer`,
    );
  }

  const actualOrder = entries
    .map(({ data }) => data)
    .sort(
      (a, b) =>
        b.merchandisingPriority - a.merchandisingPriority ||
        Number.parseInt(a.sku.slice(1), 10) - Number.parseInt(b.sku.slice(1), 10),
    )
    .map(({ sku }) => sku);

  assert.deepEqual(actualOrder, EXPECTED_SKUS_IN_CATALOG_ORDER);
  assert.deepEqual(
    entries.filter(({ data }) => data.featured).map(({ data }) => data.sku).sort(),
    ['P1', 'P10', 'P12', 'P2', 'P21', 'P3', 'P5', 'P9'],
  );
});

test('categories, rights metadata and requested product families are structured', async () => {
  const entries = await loadEntries();
  const products = entries.map(({ data }) => data);
  const skusWithStatus = (status) =>
    products
      .filter((product) => product.commercialRightsStatus === status)
      .map(({ sku }) => sku)
      .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

  assert.deepEqual(
    new Set(products.map(({ category }) => category)),
    new Set(CATALOG_CATEGORIES),
  );

  for (const product of products) {
    assert.ok(RIGHTS_STATUSES.includes(product.commercialRightsStatus));
    assert.ok(RIGHTS_STATUSES.includes(product.photoRightsStatus));
  }

  assert.deepEqual(
    skusWithStatus('review_required'),
    Array.from({ length: 15 }, (_, index) => `P${index + 1}`),
  );
  assert.deepEqual(
    skusWithStatus('attribution_required'),
    ['P21', 'P22', 'P23', 'P26'],
  );
  assert.deepEqual(
    skusWithStatus('permission_required'),
    [
      'P16', 'P17', 'P18', 'P19', 'P20', 'P24', 'P25', 'P27', 'P28', 'P29',
      'P30', 'P31', 'P32', 'P33', 'P34', 'P35', 'P36', 'P37', 'P38',
    ],
  );
  assert.ok(
    products.every((product) => product.photoRightsStatus === 'review_required'),
    'photo rights must remain explicitly pending review without hiding images',
  );

  const expectedFamilies = {
    thinknas: ['P4', 'P5'],
    'mikrotik-hap-ac2-rackmount': ['P22', 'P23'],
    'lenovo-thinkcentre-tiny-rackmount': ['P26', 'P27'],
    'keystone-patchpanel': ['P33', 'P34'],
    'cable-management': ['P35', 'P36'],
  };

  for (const [familyId, expectedSkus] of Object.entries(expectedFamilies)) {
    const actualSkus = products
      .filter((product) => product.familyId === familyId)
      .map(({ sku }) => sku)
      .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    assert.deepEqual(actualSkus, expectedSkus, `${familyId}: unexpected family members`);
  }
});

test('slugs are unique and never become empty after normalization', async () => {
  const entries = await loadEntries();
  const slugs = entries.map(({ data }) => data.slug);

  assert.equal(new Set(slugs).size, slugs.length, 'duplicate slugs found');

  for (const slug of slugs) {
    const normalized = normalizeSlug(slug);
    assert.notEqual(normalized, '', `slug "${slug}" normalizes to an empty string`);
    assert.ok(isSafeSlug(normalized), `slug "${slug}" fails ${SLUG_PATTERN}`);
  }
});

test('titles are unique', async () => {
  const entries = await loadEntries();
  const titles = entries.map(({ data }) => String(data.title).toLowerCase());

  assert.equal(new Set(titles).size, titles.length, 'duplicate titles found');
});

test('prices are finite positive numbers', async () => {
  for (const { source, data } of await loadEntries()) {
    assert.equal(typeof data.price, 'number', `${source}: price is not a number`);
    assert.ok(
      Number.isFinite(data.price) && data.price > 0,
      `${source}: price ${data.price} is not a finite positive number`,
    );
  }
});

test('every product stores a positive weight unless its SKU is pending', async () => {
  for (const { source, data } of await loadEntries()) {
    if (data.weightGrams === undefined) {
      assert.ok(
        WEIGHT_PENDING_SKUS.has(data.sku),
        `${source}: no weightGrams and ${data.sku} is not listed in WEIGHT_PENDING_SKUS`,
      );
      continue;
    }

    assert.equal(
      typeof data.weightGrams,
      'number',
      `${source}: weightGrams is not a number`,
    );
    assert.ok(
      Number.isFinite(data.weightGrams) && data.weightGrams > 0,
      `${source}: weightGrams ${data.weightGrams} is not a finite positive number`,
    );
  }
});

test('every weighted price equals weightGrams x the catalog rate', async () => {
  for (const { source, data } of await loadEntries()) {
    if (data.weightGrams === undefined) continue;
    assert.equal(
      data.price,
      computePriceFromWeight(data.weightGrams),
      `${source}: price ${data.price} != ${data.weightGrams} g x ${PRICE_PER_GRAM_UAH} ₴/g` +
        ' — run `npm run prices:recalculate`',
    );
  }
});

test('WEIGHT_PENDING_SKUS names only real products that really lack a weight', async () => {
  const entries = await loadEntries();
  const bySku = new Map(entries.map(({ data }) => [data.sku, data]));

  for (const sku of WEIGHT_PENDING_SKUS) {
    const product = bySku.get(sku);
    assert.ok(product, `WEIGHT_PENDING_SKUS lists ${sku}, which is not a catalog SKU`);
    assert.equal(
      product.weightGrams,
      undefined,
      `${sku} has a weight now — remove it from WEIGHT_PENDING_SKUS and recalculate`,
    );
  }
});

test('changing the rate changes every computed price by the same factor', () => {
  // Guards the "switch 2.5 -> 3 ₴/g and recalculate" workflow: the rate is a
  // parameter of the formula, never baked into individual products.
  for (const weightGrams of [1, 40, 120, 153, 2486]) {
    assert.equal(computePriceFromWeight(weightGrams, 3), Math.round(weightGrams * 3));
    assert.equal(computePriceFromWeight(weightGrams, 2.5), Math.round(weightGrams * 2.5));
  }

  assert.equal(computePriceFromWeight(120), Math.round(120 * PRICE_PER_GRAM_UAH));
});

test('every product has a non-empty image list within URL restrictions', async () => {
  for (const { source, data } of await loadEntries()) {
    assert.ok(Array.isArray(data.images), `${source}: images is not an array`);
    assert.ok(data.images.length > 0, `${source}: images array is empty`);

    for (const image of data.images) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(image)) {
        const url = new URL(image); // throws on malformed URLs
        assert.equal(url.protocol, 'https:', `${source}: non-https image ${image}`);
      } else {
        assert.ok(!image.includes('..'), `${source}: unsafe local path ${image}`);
      }
    }
  }
});

test('the schema rejects broken products', () => {
  const rejects = (patch, field) => {
    const result = productSchema.safeParse({ ...validProduct, ...patch });
    assert.equal(result.success, false, `expected rejection for ${field}`);
  };

  rejects({ sku: 'p1' }, 'lowercase SKU');
  rejects({ sku: 'P0' }, 'zero SKU');
  rejects({ merchandisingPriority: -1 }, 'negative merchandising priority');
  rejects({ merchandisingPriority: 1.5 }, 'fractional merchandising priority');
  rejects({ category: 'Unknown category' }, 'unknown catalog category');
  rejects({ commercialRightsStatus: 'hidden' }, 'unknown commercial-rights status');
  rejects({ photoRightsStatus: 'hidden' }, 'unknown photo-rights status');
  rejects({ sourceUrl: 'http://example.com/model' }, 'plain-http source URL');
  rejects({ licenseUrl: 'javascript:alert(1)' }, 'unsafe license URL');
  rejects({ orderUrl: 'http://www.olx.ua/item' }, 'plain-http order URL');
  rejects({ orderUrl: 'https://example.com/item' }, 'non-OLX order URL');
  rejects({ slug: '' }, 'empty slug');
  rejects({ slug: '///' }, 'slug of slashes only');
  rejects({ slug: 'UPPER-Case' }, 'uppercase slug');
  rejects({ slug: 'a b' }, 'slug with spaces');
  rejects({ title: '   ' }, 'blank title');
  rejects({ shortDescription: '' }, 'empty shortDescription');
  rejects({ description: undefined }, 'missing description');
  rejects({ price: 0 }, 'zero price');
  rejects({ price: -10 }, 'negative price');
  rejects({ price: Number.POSITIVE_INFINITY }, 'infinite price');
  rejects({ price: '100' }, 'string price');
  rejects({ price: computePriceFromWeight(40) + 1 }, 'price that ignores the weight formula');
  rejects({ weightGrams: undefined }, 'missing weightGrams');
  rejects({ weightGrams: 0 }, 'zero weightGrams');
  rejects({ weightGrams: -5 }, 'negative weightGrams');
  rejects({ weightGrams: '40' }, 'string weightGrams');
  rejects({ weightGrams: Number.NaN }, 'NaN weightGrams');
  rejects({ images: [] }, 'empty images array');
  rejects({ images: ['javascript:alert(1)'] }, 'javascript: image');
  rejects({ images: ['data:image/png;base64,AAAA'] }, 'data: image');
  rejects({ images: ['http://example.com/i.png'] }, 'plain-http image');
  rejects({ images: ['../secret.png'] }, 'path traversal image');
  rejects({ pirce: 100 }, 'unknown key (typo of price)');
  rejects({ variants: [] }, 'empty variants array');
  rejects({ variants: [{ name: 'A' }] }, 'variant without description');
  rejects({ variants: [{ name: 'A', description: 'B', extra: true }] }, 'variant with unknown key');
});

test('the schema accepts a per-product OLX order URL without requiring one', () => {
  assert.equal(productSchema.safeParse(validProduct).success, true);
  assert.equal(
    productSchema.safeParse({
      ...validProduct,
      orderUrl: 'https://www.olx.ua/d/uk/obyavlenie/example-product-ID123.html',
    }).success,
    true,
  );
});

test('the collection check rejects duplicate SKUs, slugs and titles', () => {
  const { errors } = validateProductCollection([
    { source: 'one.json', data: { ...validProduct } },
    { source: 'two.json', data: { ...validProduct, title: 'Other title' } },
    {
      source: 'three.json',
      data: { ...validProduct, sku: 'P1000', slug: 'other-slug' },
    },
  ]);

  assert.ok(
    errors.some((error) => error.includes('two.json') && error.includes('sku')),
    `expected a duplicate-SKU error, got: ${errors.join('; ')}`,
  );
  assert.ok(
    errors.some((error) => error.includes('two.json') && error.includes('slug')),
    `expected a duplicate-slug error, got: ${errors.join('; ')}`,
  );
  assert.ok(
    errors.some((error) => error.includes('three.json') && error.includes('title')),
    `expected a duplicate-title error, got: ${errors.join('; ')}`,
  );
});

test('normalizeSlug flattens slash padding, isSafeSlug rejects the leftovers', () => {
  assert.equal(normalizeSlug('///'), '');
  assert.equal(normalizeSlug('  /product-slug/  '), 'product-slug');
  assert.equal(normalizeSlug(42), '');
  assert.equal(isSafeSlug(''), false);
  assert.equal(isSafeSlug('product-slug'), true);
  assert.equal(isSafeSlug('a/../b'), false);
});
