// Tests for the SEO <title> builder (src/utils/seo.mjs): reasonable length,
// no mid-word cuts, and uniqueness across the real product data.
// Runner: built-in node:test (`npm test`).
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildProductTitle, TITLE_SUFFIX } from '../src/utils/seo.mjs';

const productsDir = fileURLToPath(new URL('../src/data/products/', import.meta.url));

async function loadTitles() {
  const fileNames = (await readdir(productsDir))
    .filter((name) => name.endsWith('.json'))
    .sort();

  return Promise.all(
    fileNames.map(async (fileName) => {
      const data = JSON.parse(await readFile(path.join(productsDir, fileName), 'utf8'));
      return { source: fileName, title: String(data.title) };
    }),
  );
}

test('every real product gets a unique SEO title', async () => {
  const entries = await loadTitles();
  const seoTitles = entries.map(({ title }) => buildProductTitle(title));

  assert.equal(
    new Set(seoTitles).size,
    seoTitles.length,
    `duplicate SEO titles: ${seoTitles.join(' | ')}`,
  );
});

test('SEO titles keep a reasonable length and always carry the brand', async () => {
  for (const { source, title } of await loadTitles()) {
    const seoTitle = buildProductTitle(title);

    assert.ok(seoTitle.endsWith(TITLE_SUFFIX), `${source}: missing brand suffix`);
    assert.ok(
      seoTitle.length <= 70,
      `${source}: title too long (${seoTitle.length}): ${seoTitle}`,
    );
    assert.ok(seoTitle.length > TITLE_SUFFIX.length, `${source}: empty name part`);
  }
});

test('clipping never cuts inside a word of the source title', async () => {
  for (const { source, title } of await loadTitles()) {
    const namePart = buildProductTitle(title).slice(0, -TITLE_SUFFIX.length);

    if (namePart === title.trim()) continue; // not clipped

    // A clean clip means the source continues with a separator right after
    // the clipped fragment (space or punctuation), never a letter/digit.
    const index = title.indexOf(namePart);
    assert.ok(index === 0, `${source}: clipped name is not a prefix: ${namePart}`);
    const nextChar = title[namePart.length];
    assert.ok(
      nextChar !== undefined && !/[\p{L}\p{N}]/u.test(nextChar),
      `${source}: cut lands mid-word before "${nextChar}": ${namePart}`,
    );
  }
});

test('short titles are used as-is; parentheses stay balanced', () => {
  assert.equal(buildProductTitle('Коротка назва'), `Коротка назва${TITLE_SUFFIX}`);

  const clipped = buildProductTitle(
    'Дуже довга назва виробу з дужками (Raspberry Pi / mini-PC / мережа) та хвостом',
  );
  const opens = (clipped.match(/\(/g) ?? []).length;
  const closes = (clipped.match(/\)/g) ?? []).length;
  assert.equal(opens, closes, `unbalanced parentheses: ${clipped}`);
});
