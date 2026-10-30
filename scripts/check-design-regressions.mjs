// Run the source guards against deliberately broken copies, never the checkout.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixture = await mkdtemp(path.join(tmpdir(), 'tanmek-design-mutations-'));
const guards = {
  focus: 'keyboard focus keeps each element its own shape',
  grid: 'grid tracks never demand more width than a 320px phone has',
  timeline: 'a scroll timeline is never written next to the animation shorthand',
  drawer: 'the catalog drawer never gains a transformed ancestor',
  voice: 'the character is shown, never voiced',
  assets: 'brand layers are small enough for the first screen',
  csp: 'pages stay ready for a strict CSP: no style attributes in templates',
};
const mutations = [
  { name: 'focus radius', file: 'src/styles/base.css', guard: guards.focus,
    change: (s) => replaceOne(s, /^:focus-visible\s*\{/m, '$&\n  border-radius: 0;') },
  { name: 'oversized rem grid', file: 'src/styles/base.css', guard: guards.grid,
    change: (s) => `${s}\n.broken-grid { grid-template-columns: minmax(20rem, 1fr); }` },
  { name: 'oversized px grid', file: 'src/styles/base.css', guard: guards.grid,
    change: (s) => `${s}\n.broken-grid { grid-template-columns: minmax(320px, 1fr); }` },
  { name: 'scroll timeline shorthand', file: 'src/styles/layout.css', guard: guards.timeline,
    change: (s) => replaceOne(s, 'animation-timeline: scroll(root block);', 'animation: headerProgress linear both;\n    animation-timeline: scroll(root block);') },
  ...["'.catalog-page'", '".catalog-main"', "'.catalog-layout'"].map((selector) => ({
    name: `transformed drawer ancestor ${selector}`, file: 'src/scripts/motion.ts', guard: guards.drawer,
    change: (s) => replaceOne(s, 'const REVEAL_SELECTOR = [', `const REVEAL_SELECTOR = [\n  ${selector},`),
  })),
  { name: 'portrait speech', file: 'src/components/RaphtaliaPortrait.astro', guard: guards.voice,
    change: (s) => `${s}\n<p>Вітаю!</p>` },
  ...['раджу', 'РАДЖУ', '<a href="https://example.com/">підкажу</a>'].map((text) => ({
    name: `Cyrillic voice: ${text}`, file: 'src/components/ContactPanel.astro', guard: guards.voice,
    change: (s) => `${s}\n<p>${text}</p>`,
  })),
  { name: 'oversized portrait asset', file: 'public/images/brand/raphtalia-920.webp', guard: guards.assets,
    change: () => Buffer.alloc(141 * 1024) },
  ...['"color:red"', "'color:red'", '{"color:red"}'].map((value) => ({
    name: `inline style ${value}`, file: 'src/components/ContactPanel.astro', guard: guards.csp,
    change: (s) => `${s}\n<p style=${value}>Text</p>`,
  })),
];

function replaceOne(source, pattern, replacement) {
  assert.ok(typeof pattern === 'string' ? source.includes(pattern) : pattern.test(source), 'mutation anchor not found');
  const changed = source.replace(pattern, replacement);
  assert.notEqual(changed, source, 'mutation did not change its fixture');
  return changed;
}

function run() {
  const result = spawnSync(process.execPath, ['--test', '--experimental-test-isolation=none', 'tests/design-system.test.mjs'], {
    cwd: fixture, encoding: 'utf8', timeout: 30000,
  });
  if (result.error) throw result.error;
  return { status: result.status, output: result.stdout + result.stderr };
}

try {
  await cp(path.join(root, 'src'), path.join(fixture, 'src'), { recursive: true });
  await cp(path.join(root, 'public/images/brand'), path.join(fixture, 'public/images/brand'), { recursive: true });
  await mkdir(path.join(fixture, 'tests'));
  await cp(path.join(root, 'tests/design-system.test.mjs'), path.join(fixture, 'tests/design-system.test.mjs'));
  const baseline = run();
  assert.equal(baseline.status, 0, `unmodified design guards failed:\n${baseline.output}`);

  const missed = [];
  for (const mutation of mutations) {
    const target = path.join(fixture, mutation.file);
    const original = await readFile(target);
    try {
      await writeFile(target, mutation.change(original.toString('utf8')));
      const result = run();
      const failures = [...result.output.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1]);
      if (result.status !== 0 && failures.includes(mutation.guard)) {
        console.log(`DETECTED: ${mutation.name}`);
      } else {
        missed.push(mutation.name);
        console.error(`MISSED: ${mutation.name}\n${result.output}`);
      }
    } finally {
      await writeFile(target, original);
    }
  }
  assert.equal(run().status, 0, 'fixture was not restored');
  assert.deepEqual(missed, [], 'some defects escaped their intended guard');
  console.log(`OK: baseline + ${mutations.length} detected mutations + restored baseline. Checkout untouched.`);
} finally {
  // This path is created by mkdtemp above; it can never name the checkout.
  await rm(fixture, { recursive: true, force: true });
}
