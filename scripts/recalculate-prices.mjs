#!/usr/bin/env node
// Recomputes prices using the shared weight/benchmark policy. Edit the rate,
// weight or pricingProfile, run this script, then review the diff. Reviewed
// products without a weight participate too; only unreviewed legacy prices
// remain pending. No writes happen until the entire candidate catalog validates.
//
// Usage:
//   npm run prices:recalculate          rewrite stale prices
//   npm run prices:recalculate -- --check   report them, change nothing (CI)
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  PRICE_PER_GRAM_UAH,
  computeCatalogPrice,
  getPricingProfile,
} from '../src/data/pricing.config.mjs';
import { validateProductCollection } from '../src/data/product.schema.mjs';

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
/** @type {Array<{ source: string, data: unknown }>} */
const entries = [];

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

  entries.push({ source: fileName, data });
  let expected;
  try {
    expected = computeCatalogPrice(data);
  } catch (error) {
    problems.push(`${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }

  if (expected === undefined) {
    pending.push(`${fileName} (${data.sku}): no weight or reviewed profile, ${data.publicationStatus === 'draft' ? 'draft guide' : 'legacy'} price ${data.price} ₴ retained`);
    continue;
  }
  if (data.price === expected) {
    continue;
  }

  const profile = data.pricingProfile === undefined ? undefined : getPricingProfile(data.pricingProfile);
  const basis = data.weightGrams === undefined
    ? `benchmark ${profile.reference.sku}, ${data.pricingProfile}`
    : `${data.weightGrams} g × ${PRICE_PER_GRAM_UAH}`;
  changes.push(
    `${fileName} (${data.sku}): ${data.price} → ${expected} ₴  [${basis}` +
      `${profile?.extraWorkUah ? ` + ${profile.extraWorkUah} ₴ extra work` : ''}]`,
  );

  // JSON.parse preserves key order, so rewriting the parsed object keeps
  // `price` where it already sits in the file. Queued rather than written
  // now: nothing touches disk until the whole catalog has been checked.
  data.price = expected;
  writes.push({ filePath, data });
}

if (problems.length === 0) {
  problems.push(...validateProductCollection(entries).errors);
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
${pending.length} product(s) still awaiting a weight and pricing review:`);
  for (const item of pending) {
    console.log(`  ${item}`);
  }
  console.log('');
}

const priced = fileNames.length - pending.length;

if (changes.length === 0) {
  console.log(`OK: all ${priced} calculated product price(s) match the weight/benchmark policy.`);
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
