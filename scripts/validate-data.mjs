#!/usr/bin/env node
// Validates every product JSON file against the shared schema
// (src/data/product.schema.mjs). Exits non-zero on the first problem set and
// prints `file: field — message` lines so failures are easy to locate.
//
// Usage: npm run validate:data
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { validateProductCollection } from '../src/data/product.schema.mjs';

const productsDir = fileURLToPath(new URL('../src/data/products/', import.meta.url));

const fileNames = (await readdir(productsDir))
  .filter((name) => name.endsWith('.json'))
  .sort();

if (fileNames.length === 0) {
  console.error(`No product JSON files found in ${productsDir}`);
  process.exit(1);
}

const errors = [];
const entries = [];

for (const fileName of fileNames) {
  const filePath = path.join(productsDir, fileName);
  const relativePath = path.relative(process.cwd(), filePath);

  let data;
  try {
    data = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    errors.push(
      `${relativePath}: (file) — invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
    continue;
  }

  entries.push({ source: relativePath, data });
}

const result = validateProductCollection(entries);
errors.push(...result.errors);

if (errors.length > 0) {
  console.error(`Product data validation failed (${errors.length} error(s)):\n`);
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  process.exit(1);
}

console.log(
  `OK: ${result.products.length} product file(s) passed schema and uniqueness checks.`,
);
