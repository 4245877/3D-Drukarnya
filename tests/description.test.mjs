// Tests for the pure description parser (src/utils/description.mjs),
// including the REAL text of product-2, whose "Особливості:" block with
// "\n- " lines used to collapse into one paragraph.
// Runner: built-in node:test (`npm test`).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { parseDescription } from '../src/utils/description.mjs';

test('plain paragraphs stay separate paragraphs', () => {
  const blocks = parseDescription('Перший абзац.\n\nДругий абзац.');

  assert.deepEqual(blocks, [
    { type: 'paragraph', text: 'Перший абзац.' },
    { type: 'paragraph', text: 'Другий абзац.' },
  ]);
});

test('consecutive "- " lines become one list', () => {
  const blocks = parseDescription('Особливості:\n- перший пункт;\n- другий пункт.');

  assert.deepEqual(blocks, [
    { type: 'paragraph', text: 'Особливості:' },
    { type: 'list', items: ['перший пункт;', 'другий пункт.'] },
  ]);
});

test('a list ends when a normal paragraph line starts', () => {
  const blocks = parseDescription('- один\n- два\nЗвичайний текст після списку.');

  assert.deepEqual(blocks, [
    { type: 'list', items: ['один', 'два'] },
    { type: 'paragraph', text: 'Звичайний текст після списку.' },
  ]);
});

test('multiple separate lists are kept separate', () => {
  const blocks = parseDescription('- a\n- b\n\nАбзац.\n\n- c');

  assert.deepEqual(blocks, [
    { type: 'list', items: ['a', 'b'] },
    { type: 'paragraph', text: 'Абзац.' },
    { type: 'list', items: ['c'] },
  ]);
});

test('non-string and empty input produce no blocks', () => {
  assert.deepEqual(parseDescription(undefined), []);
  assert.deepEqual(parseDescription(42), []);
  assert.deepEqual(parseDescription(''), []);
  assert.deepEqual(parseDescription('\n\n\n'), []);
});

test('ukrainian text passes through unchanged (no mangling, no HTML)', () => {
  const text = 'Ґанок, їжак, євро — «лапки» та символ ₴.';
  const blocks = parseDescription(text);

  assert.deepEqual(blocks, [{ type: 'paragraph', text }]);
});

test('the parser never produces HTML — raw markup stays plain text', () => {
  const blocks = parseDescription('Текст із <script>alert(1)</script> тегом.');

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'paragraph');
  // The dangerous substring is preserved as DATA; escaping is Astro's job
  // (the component interpolates it, never set:html).
  assert.ok(blocks[0].text.includes('<script>'));
});

test('the actual product-2 description parses into paragraphs plus a 6-item list', async () => {
  const raw = JSON.parse(
    await readFile(new URL('../src/data/products/product-2.json', import.meta.url), 'utf8'),
  );

  const blocks = parseDescription(raw.description);
  const lists = blocks.filter((block) => block.type === 'list');
  const paragraphs = blocks.filter((block) => block.type === 'paragraph');

  assert.equal(lists.length, 1, 'product-2 must contain exactly one list');
  assert.equal(lists[0].items.length, 6, 'the "Особливості:" list has six items');
  assert.ok(
    lists[0].items[0].startsWith('формат 10" rack'),
    `first item unexpected: ${lists[0].items[0]}`,
  );
  assert.ok(
    paragraphs.some((block) => block.text.startsWith('Особливості:')),
    'the "Особливості:" lead-in stays a paragraph before the list',
  );
  // Every character of the source text (minus markers/whitespace) survives.
  assert.ok(
    paragraphs[0].text.startsWith('Модульна 10" серверна стійка'),
    'intro paragraph is preserved',
  );
});
