import assert from 'node:assert/strict';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const before = path.resolve(process.argv[2] || '.performance-qa.tmp/reference');
const after = path.resolve(process.argv[3] || '.performance-qa.tmp/after');
const output = path.resolve('.performance-qa.tmp/diff');
await mkdir(output, { recursive: true });
const results = [];
for (const file of (await readdir(before)).filter((name) => name.endsWith('.png'))) {
  const a = await sharp(path.join(before, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(path.join(after, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual(a.info, b.info, `dimensions: ${file}`);
  const pixels = a.info.width * a.info.height;
  const diff = Buffer.alloc(a.data.length);
  let changed = 0, substantial = 0, total = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const delta = Math.max(...[0, 1, 2].map((channel) => Math.abs(a.data[i + channel] - b.data[i + channel])));
    if (delta) changed++;
    if (delta > 16) substantial++;
    total += delta;
    diff[i] = delta; diff[i + 1] = 0; diff[i + 2] = delta; diff[i + 3] = 255;
  }
  await sharp(diff, { raw: a.info }).png().toFile(path.join(output, file));
  const result = { file, changed, substantial, substantialPercent: substantial / pixels * 100, meanDelta: total / pixels };
  results.push(result);
  console.log(result);
}
await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
// Allow subpixel SVG rasterization changes between a painted group and a
// composited layer, while catching geometry, colour and content regressions.
assert.ok(results.length >= 8, 'include the home, portrait, SLA and mechanism frames at both widths');
for (const result of results) {
  assert.ok(result.substantialPercent <= 0.6 && result.meanDelta <= 0.75, `visual regression: ${result.file}`);
}
