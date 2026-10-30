// Optional real-Gecko benchmark. No browser/runtime dependency is added to the
// site. Compare two production artifacts using the same installed Playwright.
import assert from 'node:assert/strict';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { firefox } = require(process.env.TANMEK_PLAYWRIGHT_MODULE || 'playwright');
const option = (name, fallback) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
const label = option('label', 'after');
assert.match(label, /^[a-z0-9-]+$/);
const dist = path.resolve(option('dist', 'dist'));
const output = path.resolve('.firefox-qa.tmp', label);
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/3D-Drukarnya\/?/, '');
    let file = path.resolve(dist, pathname || 'index.html');
    const relative = path.relative(dist, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/3D-Drukarnya/`;
const product = JSON.parse(await readFile(new URL('../src/data/products/product-1.json', import.meta.url), 'utf8'));
const results = [];
const errors = [];
let capabilities;
let browser;
async function sample(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const frames = [];
    let first, previous;
    function frame(now) {
      first ??= now;
      if (previous !== undefined) frames.push(now - previous);
      previous = now;
      if (now - first < 2200) { requestAnimationFrame(frame); return; }
      const sorted = [...frames].sort((a, b) => a - b);
      resolve({ frames: frames.length, rafMedianMs: sorted[Math.floor(sorted.length / 2)], rafP95Ms: sorted[Math.floor(sorted.length * 0.95)], rafOver34ms: frames.filter((t) => t > 34).length });
    }
    requestAnimationFrame(frame);
  }));
}
const loops = (page) => page.locator('.catalog-hero').evaluate((el) => el.getAnimations({ subtree: true })
  .filter((a) => a.effect.getTiming().iterations === Infinity)
  .map((a) => ({ name: a.animationName, time: a.currentTime, state: a.playState })));
try {
  browser = await firefox.launch({ headless: true, executablePath: process.env.TANMEK_BROWSER_PATH });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: viewport.width === 390, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    capabilities ??= await page.evaluate(() => ({
      scrollTimeline: CSS.supports('animation-timeline: scroll(root block)'),
      interpolateSize: CSS.supports('interpolate-size: allow-keywords'),
      detailsContent: CSS.supports('selector(::details-content)'),
      prettyWrap: CSS.supports('text-wrap: pretty'),
      crossDocumentViewTransitions: 'CSSViewTransitionRule' in window,
    }));
    if (viewport.width === 390) await page.locator('.catalog-hero__rack').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const visible = [];
    for (let repeat = 0; repeat < 3; repeat++) {
      await page.locator('.catalog-hero').evaluate((el) => {
        for (const a of el.getAnimations({ subtree: true })) {
          if (a.effect.getTiming().iterations === Infinity) a.currentTime = 2000;
        }
      });
      visible.push(await sample(page));
    }
    assert.equal((await loops(page)).filter((a) => a.state === 'running').length, 9);
    await page.evaluate(() => scrollTo({ top: 2400, behavior: 'instant' }));
    await page.waitForFunction(() => !document.querySelector('.catalog-hero').classList.contains('is-live'));
    const paused = await loops(page);
    const offscreen = await sample(page);
    const afterPause = await loops(page);
    assert.ok(afterPause.every((a, i) => a.state === 'paused' && a.time === paused[i].time));
    await page.goto(new URL(`products/${product.slug}/`, base).href, { waitUntil: 'networkidle' });
    const queuedPhotoAnimations = await page.locator('[data-product-gallery]').evaluate((gallery) => {
      const thumbs = gallery.querySelectorAll('[data-gallery-thumb]');
      for (let i = 0; i < 30; i++) thumbs[i % thumbs.length].click();
      return gallery.querySelector('[data-gallery-main-image]').getAnimations().filter((a) => a.playState !== 'finished').length;
    });
    if (process.argv.includes('--verify')) assert.ok(queuedPhotoAnimations <= 1);
    results.push({ viewport, visible, offscreen, pausedLoops: afterPause.length, queuedPhotoAnimations });
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ browser: browser.version(), results }, null, 2));
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ label, browser: browser?.version(), capabilities, results, errors,
    limitations: 'Headless rAF timing measures scheduling, not physical display FPS, CPU/GPU utilization or Android hardware. No CPU throttling is claimed for Gecko.' }, null, 2));
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
