#!/usr/bin/env node
// Recomputes every product's `price` from its `weightGrams` and the catalog
// rate in src/data/pricing.config.mjs (price = weight × rate).
//
// This is the only supported way to change catalog prices: edit
// PRICE_PER_GRAM_UAH (or a product's weight), run this script, review the
// diff. The schema rejects any product whose stored price no longer matches
// the formula, so a forgotten run fails the build rather than shipping.
//
// Usage:
//   npm run prices:recalculate          rewrite stale prices
//   npm run prices:recalculate -- --check   report them, change nothing (CI)
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { PRICE_PER_GRAM_UAH, computePriceFromWeight } from '../src/data/pricing.config.mjs';
import { WEIGHT_PENDING_SKUS } from '../src/data/product.schema.mjs';

const productsDir = fileURLToPath(new URL('../src/data/products/', import.meta.url));
const checkOnly = process.argv.includes('--check');

const fileNames = (await readdir(productsDir))
  .filter((name) => name.endsWith('.json'))
  .sort((a, b) => {
    const aNumber = Number.parseInt(a.match(/\d+/)?.[0] ?? '', 10);
    const bNumber = Number.parseInt(b.match(/\d+/)?.[0] ?? '', 10);
    return aNumber - bNumber;
  });

if (fileNames.length === 0) {
  console.error(`No product JSON files found in ${productsDir}`);
  process.exit(1);
}

/** @type {string[]} */
const problems = [];
/** @type {string[]} */
const changes = [];
/** @type {string[]} */
const pending = [];
/** @type {Array<{ filePath: string, data: Record<string, unknown> }>} */
const writes = [];

for (const fileName of fileNames) {
  const filePath = path.join(productsDir, fileName);
  const raw = await readFile(filePath, 'utf8');

  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    problems.push(
      `${fileName}: invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
    continue;
  }

  if (data.weightGrams === undefined) {
    // Known-unknown weights are a backlog item, not a failure: the SKU must be
    // declared in WEIGHT_PENDING_SKUS, and its price is left untouched.
    if (WEIGHT_PENDING_SKUS.has(data.sku)) {
      pending.push(`${fileName} (${data.sku}): no source weight yet, price ${data.price} ₴ left as is`);
      continue;
    }
    problems.push(`${fileName} (${data.sku}): weightGrams is missing`);
    continue;
  }

  if (typeof data.weightGrams !== 'number' || !Number.isFinite(data.weightGrams) || data.weightGrams <= 0) {
    problems.push(
      `${fileName}: weightGrams is not a positive number (got ${JSON.stringify(data.weightGrams)})`,
    );
    continue;
  }

  const expected = computePriceFromWeight(data.weightGrams);
  if (data.price === expected) {
    continue;
  }

  changes.push(
    `${fileName} (${data.sku}): ${data.price} → ${expected} ₴  [${data.weightGrams} g × ${PRICE_PER_GRAM_UAH}]`,
  );

  // JSON.parse preserves key order, so rewriting the parsed object keeps
  // `price` where it already sits in the file. Queued rather than written
  // now: nothing touches disk until the whole catalog has been checked.
  data.price = expected;
  writes.push({ filePath, data });
}

if (problems.length > 0) {
  console.error(`Cannot recalculate prices (${problems.length} problem(s)):\n`);
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  console.error('\nNo file was modified.');
  process.exit(1);
}

// Nothing is written until every product has been checked: a half-recalculated
// catalog is worse than an untouched one.
if (!checkOnly) {
  for (const { filePath, data } of writes) {
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }
}

console.log(`Rate: ${PRICE_PER_GRAM_UAH} ₴ per gram (src/data/pricing.config.mjs)`);

if (pending.length > 0) {
  console.log(`
${pending.length} product(s) still awaiting a source weight:`);
  for (const item of pending) {
    console.log(`  ${item}`);
  }
  console.log('');
}

const priced = fileNames.length - pending.length;

if (changes.length === 0) {
  console.log(`OK: all ${priced} weighted product price(s) already match weight × rate.`);
  process.exit(0);
}

for (const change of changes) {
  console.log(`  ${change}`);
}

if (checkOnly) {
  console.error(
    `\n${changes.length} product price(s) are stale. Run \`npm run prices:recalculate\`.`,
  );
  process.exit(1);
}

console.log(`\nUpdated ${changes.length} product price(s).`);
