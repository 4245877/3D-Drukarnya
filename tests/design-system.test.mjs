// Source-level guards for the design system: each one pins a defect that really
// happened, so it cannot return unnoticed. No build here (node --test runs files
// in parallel and build-output.test.mjs owns dist/); see docs/RAPHTALIA-DESIGN.md.
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (file) => readFile(path.join(root, file), 'utf8');

async function sourceFiles(dir, extensions) {
  const entries = await readdir(path.join(root, dir), { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && extensions.some((extension) => entry.name.endsWith(extension)))
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)));
}

test('keyboard focus keeps each element its own shape', async () => {
  const css = await read('src/styles/base.css');
  const rule = css.match(/:focus-visible\s*\{[^}]*\}/)?.[0] ?? '';
  assert.ok(rule, 'global focus rule is missing');
  assert.ok(!rule.includes('border-radius'), 'a radius here squares off every pill and card on focus');
});

test('grid tracks never demand more width than a 320px phone has', async () => {
  for (const file of await sourceFiles('src/styles', ['.css'])) {
    const css = await read(file);
    for (const [track, size] of css.matchAll(/minmax\((\d+(?:\.\d+)?)rem,\s*1fr\)/g)) {
      assert.ok(Number(size) * 16 <= 288, `${file}: ${track} overflows a 320px screen; wrap it in min(100%, …)`);
    }
  }
});

test('a scroll timeline is never written next to the animation shorthand', async () => {
  // The CSS minifier folds the pair into a shorthand Chromium rejects as a whole,
  // and the animation silently disappears.
  for (const file of await sourceFiles('src/styles', ['.css'])) {
    const css = await read(file);
    for (const [rule] of css.matchAll(/[^{}]*\{[^{}]*animation-timeline[^{}]*\}/g)) {
      assert.ok(!/\banimation\s*:/.test(rule), `${file}: use longhands beside animation-timeline`);
    }
  }
});

test('the catalog drawer never gains a transformed ancestor', async () => {
  const motion = await read('src/scripts/motion.ts');
  const selectors = motion.match(/REVEAL_SELECTOR = \[([\s\S]*?)\]/)?.[1] ?? '';
  assert.ok(selectors.includes('.catalog-grid__item'), 'cards are the part of the catalog that moves');
  for (const ancestor of ['.catalog-page', '.catalog-main', '.catalog-layout']) {
    assert.ok(!selectors.includes(`'${ancestor}'`), `${ancestor} must not animate: the drawer is position: fixed inside it`);
  }
});

test('the character is shown, never voiced', async () => {
  const portrait = await read('src/components/RaphtaliaPortrait.astro');
  const markup = portrait.split('---').slice(2).join('---');
  const text = markup.replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '').trim();
  assert.equal(text, '', 'the portrait has no speech of its own');

  // docs/RAPHTALIA-VOICE.md: the shop speaks, not a person introducing herself.
  // Letter lookarounds, not \b: in JavaScript \b does not see Cyrillic at all.
  const firstPerson = /(?<!\p{L})(Допоможу|допоможу|підкажу|раджу|рекомендую|мене|мій контакт|мені)(?!\p{L})/u;
  const files = (await sourceFiles('src/components', ['.astro'])).filter((file) => /Contact|SiteFooter|SiteHeader/.test(file));
  for (const file of [...files, 'src/pages/products/[slug].astro']) {
    const source = (await read(file)).replace(/\/\/.*$|\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}/gm, '');
    assert.ok(!source.match(firstPerson), `${file}: first person in the shop's voice`);
  }
});

test('brand layers are small enough for the first screen', async () => {
  const limits = {
    'public/images/brand/raphtalia-920.webp': 140,
    'public/images/brand/raphtalia-560.webp': 70,
    'public/images/brand/raphtalia-ear-left.webp': 14,
    'public/images/brand/raphtalia-ear-right.webp': 14,
    'public/images/brand/raphtalia-blink.webp': 12,
    'src/assets/brand/ear-left.webp': 12,
    'src/assets/brand/ear-right.webp': 12,
  };
  for (const [file, kilobytes] of Object.entries(limits)) {
    const { size } = await stat(path.join(root, file));
    assert.ok(size > 0 && size <= kilobytes * 1024, `${file}: ${Math.round(size / 1024)} KB, limit ${kilobytes} KB`);
  }
});

test('pages stay ready for a strict CSP: no style attributes in templates', async () => {
  for (const file of await sourceFiles('src', ['.astro'])) {
    const source = (await read(file)).replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    assert.ok(!/<[a-z][^>]*\sstyle=["{]/i.test(source), `${file}: move the style attribute to a stylesheet`);
  }
});
