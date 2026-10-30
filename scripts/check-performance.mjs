// Production-build animation benchmark. Uses an existing Playwright/browser;
// installs nothing and never contacts the production site.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const engine = process.env.TANMEK_BROWSER || 'chromium';
assert.ok(['chromium', 'firefox'].includes(engine));
assert.ok(engine === 'chromium' || process.argv.includes('--visual-only'), 'Use check:performance:gecko for Gecko timing; CDP metrics require Chromium.');
const browserType = require(process.env.TANMEK_PLAYWRIGHT_MODULE || 'playwright')[engine];
const executablePath = process.env.TANMEK_BROWSER_PATH || (engine === 'chromium' ? [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(existsSync) : undefined);
const label = process.argv.find((arg) => arg.startsWith('--label='))?.slice(8) || 'after';
assert.match(label, /^[a-z0-9-]+$/);
const dist = path.resolve(process.argv.find((arg) => arg.startsWith('--dist='))?.slice(7) || 'dist');
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
const output = path.resolve('.performance-qa.tmp', label);
await mkdir(output, { recursive: true });
if (label === 'before' && !existsSync('.performance-qa.tmp/before-dist')) await cp(dist, path.resolve('.performance-qa.tmp/before-dist'), { recursive: true });
let browser;
try {
  browser = await browserType.launch({ executablePath, headless: true });
} catch (error) {
  server.close();
  throw error;
}
const errors = [];
const results = [];
const profiles = [
  { name: 'desktop', width: 1440, height: 900, cpu: 1 },
  { name: 'desktop-cpu6', width: 1440, height: 900, cpu: 6 },
  { name: 'mobile-cpu6', width: 390, height: 844, cpu: 6, mobile: true },
];
const quick = process.argv.includes('--quick');

async function metrics(cdp) {
  return Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]));
}

async function measure(page, cdp, name, run) {
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
  const before = await metrics(cdp);
  await page.evaluate(() => {
    window['__tanmekFrames'] = [];
    window['__recordFrames'] = true;
    let previous = performance.now();
    function frame(now) {
      if (!window['__recordFrames']) return;
      window['__tanmekFrames'].push(now - previous);
      previous = now;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  await run();
  const frames = await page.evaluate(() => { window['__recordFrames'] = false; return window['__tanmekFrames'].slice(1); });
  const after = await metrics(cdp);
  const completion = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.end');
  const { stream } = await completion;
  let trace = '';
  for (;;) {
    const chunk = await cdp.send('IO.read', { handle: stream });
    trace += chunk.data;
    if (chunk.eof) break;
  }
  await cdp.send('IO.close', { handle: stream });
  const events = JSON.parse(trace).traceEvents;
  if (process.argv.includes('--trace')) await writeFile(path.join(output, `${name.replaceAll('/', '-')}.json`), trace);
  const totals = {};
  for (const event of events) {
    if (event.ph !== 'X' || !['Paint', 'RasterTask', 'Layout', 'UpdateLayoutTree', 'FunctionCall'].includes(event.name)) continue;
    const item = totals[event.name] ||= { count: 0, ms: 0 };
    item.count++;
    item.ms += (event.dur || 0) / 1000;
  }
  const sorted = [...frames].sort((a, b) => a - b);
  const result = {
    scenario: name,
    taskMs: (after.TaskDuration - before.TaskDuration) * 1000,
    scriptMs: (after.ScriptDuration - before.ScriptDuration) * 1000,
    styleMs: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000,
    layoutMs: (after.LayoutDuration - before.LayoutDuration) * 1000,
    styleCount: after.RecalcStyleCount - before.RecalcStyleCount,
    layoutCount: after.LayoutCount - before.LayoutCount,
    frames: frames.length,
    rafP95Ms: sorted[Math.floor(sorted.length * 0.95)] || 0,
    rafOver34ms: frames.filter((dt) => dt > 34).length,
    rendering: totals,
  };
  console.log(`${name}: task ${result.taskMs.toFixed(1)}ms; style ${result.styleCount}; paints ${totals.Paint?.count || 0}; rAF p95 ${result.rafP95Ms.toFixed(1)}ms`);
  return result;
}

async function go(page, route = '') {
  await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1600);
}

try {
  for (const profile of process.argv.includes('--visual-only') ? [] : profiles) {
    const selected = process.argv.find((arg) => arg.startsWith('--profile='))?.slice(10);
    if (selected && selected !== profile.name) continue;
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, hasTouch: !!profile.mobile, isMobile: !!profile.mobile, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
    await go(page);
    // Phones start with the rack below the fold. Measure it while visible.
    if (profile.mobile) {
      await page.locator('.catalog-hero__rack').scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
    }
    const samples = [];
    for (let repeat = 0; repeat < (quick ? 1 : 3); repeat++) {
      await page.locator('.catalog-hero').evaluate((el) => {
        for (const animation of el.getAnimations({ subtree: true })) {
          if (animation.effect.getTiming().iterations === Infinity) animation.currentTime = 2000;
        }
      });
      samples.push(await measure(page, cdp, `${profile.name}/hero/${repeat}`, () => page.waitForTimeout(2200)));
    }
    if (process.argv.includes('--hero-only')) {
      results.push({ profile, samples });
      await context.close();
      continue;
    }
    if (!profile.mobile) {
      samples.push(await measure(page, cdp, `${profile.name}/pointer`, () => page.evaluate(() => new Promise((resolve) => {
        const scene = document.querySelector('[data-parallax]');
        let count = 0;
        const timer = setInterval(() => {
          for (let i = 0; i < 8; i++) scene.dispatchEvent(new PointerEvent('pointermove', { clientX: 300 + ((count + i) % 800), clientY: 150 + ((count + i) % 400) }));
          count += 8;
          if (count >= 960) { clearInterval(timer); resolve(); }
        }, 8);
      }))));
    }
    await page.evaluate(() => scrollTo({ top: 2000, behavior: 'instant' }));
    await page.waitForTimeout(1700);
    samples.push(await measure(page, cdp, `${profile.name}/offscreen`, () => page.waitForTimeout(2200)));
    const loops = await page.locator('.catalog-hero').evaluate((scene) => scene.getAnimations({ subtree: true }).filter((animation) => animation.effect.getTiming().iterations === Infinity).map((animation) => ({ name: animation.animationName, state: animation.playState })));
    await page.evaluate(() => scrollTo({ top: 800, behavior: 'instant' }));
    await page.waitForTimeout(1200);
    samples.push(await measure(page, cdp, `${profile.name}/filter`, async () => {
      if (profile.mobile) await page.locator('[data-catalog-sidebar-open]').click();
      await page.locator('[data-catalog-filter="featured"]').click();
      await page.waitForTimeout(1100);
    }));
    const entering = await page.locator('.is-entering').count();
    await page.locator('[data-sla-mechanism]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    samples.push(await measure(page, cdp, `${profile.name}/sla`, () => page.waitForTimeout(2200)));
    await go(page, '404.html');
    samples.push(await measure(page, cdp, `${profile.name}/portrait`, () => page.waitForTimeout(2200)));
    if (process.argv.includes('--verify')) {
      assert.ok(loops.length > 0 && loops.every((animation) => animation.state === 'paused'), 'offscreen loops must pause');
      const offscreen = samples.find((sample) => sample.scenario.includes('/offscreen'));
      assert.equal(offscreen.rendering.Paint?.count || 0, 0, 'offscreen paint');
      assert.equal(offscreen.styleCount, 0, 'offscreen style recalculation');
      for (const sample of samples.filter((sample) => sample.scenario.includes('/hero/'))) assert.equal(sample.layoutCount, 0, 'hero animation layout');
      assert.equal(samples.find((sample) => sample.scenario.endsWith('/sla')).rendering.Paint?.count || 0, 0, 'mechanism animation paint');
      assert.equal(entering, 0, 'completed filter animations must release their classes');
    }
    results.push({ profile, samples, offscreenLoops: loops, enteringAfterCompletion: entering });
    await context.close();
  }

  // Stable frames for a pixel comparison, including the animated illustration.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  for (const width of process.argv.includes('--no-visual') ? [] : [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['', '404.html', 'sla/']) {
      await go(page, route);
      if (width === 390 && !route) await page.locator('.catalog-hero__rack').scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        for (const animation of document.getAnimations()) {
          if (typeof animation.currentTime !== 'number' || animation.effect?.pseudoElement === '::after') continue; // reading progress has its own scroll phase
          animation.pause(); animation.currentTime = 4000;
        }
      });
      await page.screenshot({ path: path.join(output, `${route.replace(/[^a-z0-9]/g, '') || 'home'}-${width}.png`) });
      if (route === '') {
        for (const phase of [1800, 3000, 5000]) {
          await page.locator('.catalog-hero').evaluate((el, phase) => {
            for (const animation of el.getAnimations({ subtree: true })) {
              if (animation.effect.getTiming().iterations === Infinity) { animation.pause(); animation.currentTime = phase; }
            }
          }, phase);
          await page.screenshot({ path: path.join(output, `home-phase-${phase}-${width}.png`) });
        }
        await page.locator('[data-sla-mechanism]').scrollIntoViewIfNeeded();
        await page.waitForTimeout(900); // let its below-fold reveal finish
        await page.evaluate(() => {
          for (const animation of document.getAnimations()) {
            if (typeof animation.currentTime === 'number' && animation.effect?.pseudoElement !== '::after') { animation.pause(); animation.currentTime = 4000; }
          }
        });
        await page.screenshot({ path: path.join(output, `mechanism-${width}.png`) });
      }
    }
  }
  await context.close();
  assert.deepEqual(errors, [], 'browser errors');
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ engine, browser: browser.version(), label, quick, verification: process.argv.includes('--verify'), profiles: results, errors }, null, 2));
  await browser.close();
  server.close();
}
