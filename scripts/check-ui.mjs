// Optional browser QA. Use an existing Playwright installation; no runtime
// dependencies are added to the shop. See docs/FINAL-QA-2026-10-30.md.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
let browserType;
const engine = process.env.TANMEK_BROWSER || 'chromium';
assert.ok(['chromium', 'firefox'].includes(engine), 'TANMEK_BROWSER must be chromium or firefox');
try {
  browserType = require(process.env.TANMEK_PLAYWRIGHT_MODULE || 'playwright')[engine];
} catch {
  console.error('Playwright is optional. Set TANMEK_PLAYWRIGHT_MODULE to an existing installation; see docs/FINAL-QA-2026-10-30.md.');
  process.exit(1);
}
const executablePath = process.env.TANMEK_BROWSER_PATH || (engine === 'chromium' ? [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(existsSync) : undefined);
const base = process.env.TANMEK_PREVIEW_URL || 'http://127.0.0.1:4321/3D-Drukarnya/';
const output = path.resolve(process.env.TANMEK_UI_OUTPUT || `.contact-qa.tmp/${engine}`);
await mkdir(output, { recursive: true });
const product = JSON.parse(await readFile(new URL('../src/data/products/product-1.json', import.meta.url), 'utf8'));
const { CATEGORIES } = await import('../src/data/categories.mjs');
const productRoute = `products/${product.slug}/`;
const categoryRoute = `catalog/${CATEGORIES[0].slug}/`;
const routes = ['', 'catalog/', categoryRoute, productRoute, 'sla/', '404.html', 'guides/10-inch-vs-19-inch-rack/'];
const widths = [320, 360, 390, 600, 768, 844, 1024, 1280, 1440, 1920, 2560];
const results = [];
const pageErrors = [];
const consoleErrors = [];
const failedRequests = [];
const cancelledFontRequests = [];
const noScriptPages = new WeakSet();
let passed = false;
const browser = await browserType.launch({
  executablePath, headless: true,
  // Test-only permission bypass: Firefox does not accept Chromium's clipboard
  // permission names. Keep exercising the real Clipboard API on both engines.
  ...(engine === 'firefox' ? { firefoxUserPrefs: { 'dom.events.testing.asyncClipboard': true } } : {}),
});

function observe(page) {
  page.on('pageerror', (e) => pageErrors.push({ url: page.url(), message: e.message }));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const entry = { url: page.url(), message: m.text() };
    // Gecko also logs NS_BINDING_ABORTED (0x804b0002) for font requests
    // cancelled by navigation/context close. Preserve these diagnostics, but
    // do not mistake a cancellation for a font, network or application error.
    if (/downloadable font: download failed.*status=2152398850/.test(entry.message)) cancelledFontRequests.push(entry);
    else consoleErrors.push(entry);
  });
  page.on('requestfailed', (r) => { if (!['net::ERR_ABORTED', 'NS_BINDING_ABORTED'].includes(r.failure()?.errorText)) failedRequests.push({ url: r.url(), error: r.failure()?.errorText }); });
  return page;
}
async function scenario(name, run) {
  await run();
  results.push(name);
  console.log(`OK: ${name}`);
}
async function go(page, route = '') {
  const response = await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
  assert.ok([200, 304].includes(response.status()), `HTTP ${response.status()}: ${route}`);
  // Gecko cannot settle page-evaluated promises when scripting is disabled.
  // Network-idle still waits for the browser's stylesheet/font requests.
  if (!noScriptPages.has(page)) await page.evaluate(() => document.fonts.ready);
}
async function noOverflow(page, label) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow: ${label}`);
}
async function shot(page, name) { await page.screenshot({ path: path.join(output, `${name}.png`) }); }
function luminance(color) {
  const [r, g, b] = color.match(/[\d.]+/g).slice(0, 3).map((n) => Number(n) / 255).map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
async function scrollToElement(page, selector) {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(650);
  await target.evaluate((el) => Promise.all(el.getAnimations()
    .filter((a) => a.effect.getTiming().iterations !== Infinity && a.playState === 'running')
    .map((a) => a.finished.catch(() => {}))));
}

try {
  const context = await browser.newContext({ ...(engine === 'chromium' ? { permissions: ['clipboard-read', 'clipboard-write'] } : {}), reducedMotion: 'reduce' });
  const page = observe(await context.newPage());
  if (!process.argv.includes('--functional-only')) await scenario('responsive layout: 7 pages × 11 widths (320–2560px)', async () => {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await go(page, route);
        await noOverflow(page, `${width}px ${route}`);
        const controls = await page.locator('.site-header a:visible, .site-header button:visible').evaluateAll((els) => els.map((el) => {
          const r = el.getBoundingClientRect(); return { left: r.left, right: r.right };
        }));
        assert.ok(controls.every((r) => r.left >= -1 && r.right <= width + 1), `header bounds: ${width} ${route}`);
        const buttons = await page.locator('.contact-button').evaluateAll((els) => els.filter((el) => el.getClientRects().length).map((el) => {
          const r = el.getBoundingClientRect();
          const label = el.querySelector('.contact-button__label').getBoundingClientRect();
          return { left: r.left, right: r.right, height: r.height, fits: label.right <= r.right && label.left >= r.left };
        }));
        assert.ok(buttons.every((r) => r.left >= -1 && r.right <= width + 1 && r.height >= 44 && r.fits), `messenger bounds: ${width} ${route}`);
        if (route === '') {
          assert.equal(await page.locator('.portrait').count(), 0, 'the portrait belongs on 404');
          const scene = await page.locator('.catalog-hero__aside').evaluate((el) => {
            const area = el.getBoundingClientRect();
            const rack = el.querySelector('.catalog-hero__rack').getBoundingClientRect();
            const style = getComputedStyle(el);
            return {
              dx: rack.x + rack.width / 2 - (area.x + area.width / 2),
              dy: rack.y + rack.height / 2 - (area.y + parseFloat(style.paddingTop) + (area.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) / 2),
              ratio: rack.width / area.width,
              fits: rack.left >= area.left - 1 && rack.right <= area.right + 1 && rack.top >= area.top && rack.bottom <= area.bottom,
            };
          });
          assert.ok(Math.abs(scene.dx) < 1 && Math.abs(scene.dy) < 1 && scene.ratio >= 0.7 && scene.fits, `rack composition ${width}: ${JSON.stringify(scene)}`);
        }
        if ([320, 390, 1440].includes(width)) {
          const slug = route === '' ? 'home' : route === productRoute ? 'product' : route === categoryRoute ? 'category' : route.replaceAll('/', '-').replace('.html', '');
          await shot(page, `${slug}-${width}`);
          if (route === productRoute) {
            await page.locator('.site-header__contact').click();
            assert.equal(await page.evaluate(() => document.activeElement.id), 'product-contact');
            await shot(page, `contacts-${width}`);
          }
        }
      }
    }
  });

  if (!process.argv.includes('--functional-only')) await scenario('all 49 product pages load with working contact drafts', async () => {
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(new URL('../src/data/products/', import.meta.url));
    for (const file of files.filter((f) => f.endsWith('.json'))) {
      const item = JSON.parse(await readFile(new URL(`../src/data/products/${file}`, import.meta.url), 'utf8'));
      const response = await context.request.get(new URL(`products/${item.slug}/`, base).href);
      assert.equal(response.status(), 200);
      const html = await response.text();
      assert.ok(html.includes('data-telegram-link') && html.includes('data-viber-link') && html.includes(`артикул ${item.sku}`), item.slug);
    }
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await go(page);
  await scenario('mobile menu: keyboard, Escape, outside click', async () => {
    const burger = page.locator('.site-header__burger');
    await burger.focus(); await page.keyboard.press('Enter');
    assert.equal(await burger.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('site-header__drawer-link')), true);
    await page.keyboard.press('Escape');
    assert.equal(await burger.getAttribute('aria-expanded'), 'false');
    assert.equal(await burger.evaluate((el) => el === document.activeElement), true);
    await burger.click();
    await page.mouse.click(8, 800);
    assert.equal(await burger.getAttribute('aria-expanded'), 'false');
  });

  await scenario('catalog drawer after deep scroll: viewport bounds, focus trap, filters, Escape', async () => {
    await page.evaluate(() => scrollTo(0, 3200));
    const trigger = page.locator('[data-catalog-sidebar-open]');
    await trigger.click();
    const drawer = page.locator('[data-catalog-sidebar]');
    // Even a reduced-motion transition needs a rendering frame. Measure the
    // open panel, rather than racing its first style update after the click.
    await page.waitForFunction(() => document.querySelector('[data-catalog-sidebar]').getBoundingClientRect().left >= -1);
    const box = await drawer.boundingBox();
    assert.ok(Math.abs(box.y) < 2 && box.height >= 840 && box.x >= -1, JSON.stringify(box));
    assert.equal(await drawer.getAttribute('aria-modal'), 'true');
    const last = drawer.locator('a').last();
    await last.focus(); await page.keyboard.press('Tab');
    assert.equal(await drawer.evaluate((el) => el.contains(document.activeElement)), true);
    await drawer.locator('[data-catalog-filter="featured"]').click();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    const featured = await page.locator('[data-catalog-item]:not([hidden])').count();
    assert.ok(featured > 0 && featured < 49);
    assert.equal(await page.locator('[data-catalog-item]:not([hidden])[data-catalog-featured="false"]').count(), 0);
    await trigger.click();
    await drawer.locator('[data-catalog-filter="category"]').first().click();
    const categories = await page.locator('[data-catalog-item]:not([hidden])').evaluateAll((els) => [...new Set(els.map((el) => el.dataset.catalogCategory))]);
    assert.equal(categories.length, 1);
    await trigger.click(); await drawer.locator('[data-catalog-filter="all"]').click();
    assert.equal(await page.locator('[data-catalog-item]:not([hidden])').count(), 49);
    await trigger.click(); await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.body.classList.contains('catalog-drawer-open')), false);
    assert.equal(await trigger.evaluate((el) => el === document.activeElement), true);
  });

  await go(page, productRoute);
  await scenario('gallery: thumbnails, dialog, keyboard arrows/Home/End, Escape and focus return', async () => {
    const thumbs = page.locator('[data-gallery-thumb]');
    assert.ok(await thumbs.count() > 1);
    await thumbs.nth(1).click();
    assert.equal(await thumbs.nth(1).getAttribute('aria-current'), 'true');
    const open = page.locator('[data-gallery-open]');
    await open.click();
    assert.equal(await page.locator('[data-gallery-dialog]').evaluate((el) => el.open), true);
    await page.keyboard.press('Home'); assert.equal(await page.locator('[data-gallery-current]').textContent(), '1');
    await page.keyboard.press('ArrowRight'); assert.equal(await page.locator('[data-gallery-current]').textContent(), '2');
    await page.keyboard.press('End'); assert.equal(await page.locator('[data-gallery-current]').textContent(), String(await thumbs.count()));
    await shot(page, 'gallery-mobile');
    await page.keyboard.press('Escape');
    assert.equal(await open.evaluate((el) => el === document.activeElement), true);
  });

  await scenario('Telegram: seller, Unicode product draft, canonical URL, browser fallback and new tab', async () => {
    const link = page.locator('#product-contact [data-telegram-link]');
    const url = new URL(await link.getAttribute('href'));
    assert.equal(url.href.startsWith('https://t.me/M4245877?'), true);
    const text = url.searchParams.get('text');
    assert.ok(text.includes(product.title) && text.includes(`артикул ${product.sku}`) && text.includes('https://4245877.github.io/3D-Drukarnya/products/'));
    await context.route('https://t.me/**', (route) => route.fulfill({ contentType: 'text/plain', body: 'QA navigation intercepted; no message sent.' }));
    const popupPromise = page.waitForEvent('popup'); await link.click();
    const popup = await popupPromise; await popup.waitForLoadState();
    assert.equal(new URL(popup.url()).searchParams.get('text'), text); await popup.close();
    assert.equal(await page.locator('#product-contact .contact-browser').getAttribute('href'), 'https://web.telegram.org/k/#@M4245877');
  });

  await scenario('product copy: complete inquiry, clipboard and visible success', async () => {
    const button = page.locator('#product-contact [data-contact-copy]');
    await button.click();
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'), await button.getAttribute('data-contact-copy'));
    assert.match(await page.locator('#product-contact [data-contact-status]').textContent(), /Скопійовано/);
  });

  await scenario('Viber: encoded native URI, help, keyboard focus, phone copy, Escape and close', async () => {
    const link = page.locator('#product-contact [data-viber-link]');
    assert.equal(await link.getAttribute('href'), 'viber://chat?number=%2B380989073072');
    // Only intercept OS navigation in QA; the site's listener must still run.
    await link.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
    await link.focus(); await page.keyboard.press('Enter');
    const panel = page.locator('[data-viber-support]');
    assert.equal(await panel.isVisible(), true);
    assert.equal(await panel.evaluate((el) => el === document.activeElement), true);
    await panel.locator('[data-contact-copy]').click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '+380989073072');
    await shot(page, 'viber-mobile');
    await page.keyboard.press('Escape'); assert.equal(await panel.isVisible(), false);
    assert.equal(await link.evaluate((el) => el === document.activeElement), true);
    await link.click(); await panel.locator('[data-viber-close]').click();
    assert.equal(await panel.isVisible(), false);
  });

  await scenario('mobile buy bar: appears after inquiry, returns to contact and yields to footer', async () => {
    await page.evaluate(() => { const cta = document.querySelector('[data-order-cta]'); scrollTo(0, cta.getBoundingClientRect().bottom + scrollY + 100); });
    await page.waitForFunction(() => document.querySelector('[data-buybar]').classList.contains('is-visible'));
    await shot(page, 'buybar-mobile');
    await page.locator('.product-buybar__button').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'product-contact');
    await scrollToElement(page, '#contacts');
    await page.waitForFunction(() => !document.querySelector('[data-buybar]').classList.contains('is-visible'));
    await shot(page, 'footer-mobile');
  });

  await go(page, 'sla/');
  await scenario('SLA form: editable draft, Unicode, copy and native validation', async () => {
    await page.locator('#sla-model').fill('https://example.com/miniature?x=1&y=2');
    await page.locator('#sla-size').fill('Висота 50 мм');
    await page.locator('#sla-quantity').fill('3');
    await page.locator('#sla-purpose').fill('Мініатюра під фарбування + дрібні написи');
    const draft = new URL(await page.locator('[data-sla-form] [data-telegram-link]').getAttribute('href')).searchParams.get('text');
    assert.ok(draft.includes('50 мм') && draft.includes('3 шт.') && draft.includes('?x=1&y=2') && draft.includes('Мініатюра'));
    await page.locator('[data-sla-copy]').click();
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n'), draft);
    await page.locator('#sla-quantity').fill('0');
    assert.equal(await page.locator('[data-sla-form]').evaluate((el) => el.checkValidity()), false);
  });

  const denied = await browser.newContext({ viewport: { width: 320, height: 844 }, reducedMotion: 'reduce' });
  await denied.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Denied for QA'); } } }));
  const fallback = observe(await denied.newPage());
  await scenario('denied clipboard: product, Viber phone and SLA select complete manual text', async () => {
    await go(fallback, productRoute);
    await fallback.locator('#product-contact [data-contact-copy]').click();
    const manual = fallback.locator('#product-contact [data-contact-manual]');
    assert.equal(await manual.isVisible(), true);
    assert.equal(await manual.evaluate((el) => el.selectionEnd - el.selectionStart === el.value.length), true);
    const viber = fallback.locator('#product-contact [data-viber-link]');
    await viber.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault())); await viber.click();
    await fallback.locator('[data-viber-support] [data-contact-copy]').click();
    assert.equal(await fallback.locator('[data-viber-support] [data-contact-manual]').isVisible(), true);
    await go(fallback, 'sla/'); await fallback.locator('[data-sla-copy]').click();
    assert.equal(await fallback.locator('.sla-message-preview').getAttribute('open'), '');
    assert.equal(await fallback.locator('[data-sla-message]').evaluate((el) => el.selectionEnd === el.value.length && el.selectionStart === 0), true);
  });
  await denied.close();

  const animated = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const motion = observe(await animated.newPage());
  await go(motion);
  await scenario('404 portrait: entrance, breathing, ears, blink, parallax, hover and offscreen pause; home reveal', async () => {
    await shot(motion, 'home-desktop');
    assert.equal(await motion.locator('.portrait').count(), 0);
    await scrollToElement(motion, '.catalog-grid__item:nth-child(20)');
    assert.equal(await motion.locator('.catalog-grid__item:nth-child(20)').evaluate((el) => getComputedStyle(el).opacity), '1');

    await go(motion, '404.html');
    await motion.waitForFunction(() => document.querySelector('[data-live]').classList.contains('is-live'));
    const names = await motion.locator('.portrait__body, .portrait__ear, .portrait__blink').evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));
    assert.deepEqual(names, ['portraitBreath', 'earTwitchLeft', 'earTwitchRight', 'portraitBlink']);
    assert.equal(await motion.locator('.not-found__portrait').evaluate((el) => getComputedStyle(el).animationName), 'portraitEnter');
    await motion.mouse.move(1300, 180);
    await motion.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('.not-found__portrait')).transform).m41 < 0);
    await motion.locator('.not-found__actions a').first().hover();
    assert.equal(await motion.locator('.portrait__ear--left').evaluate((el) => getComputedStyle(el).animationName), 'earPerkLeft');
    assert.equal(await motion.locator('.portrait__ear--right').evaluate((el) => getComputedStyle(el).animationName), 'earPerkRight');
    await motion.mouse.move(0, 0);
    // A short 404 can fit almost entirely in a tall desktop viewport. Use a
    // shorter viewport so scrolling can actually take the portrait offscreen.
    await motion.setViewportSize({ width: 1440, height: 480 });
    await scrollToElement(motion, '.site-footer__meta');
    await motion.waitForFunction(() => !document.querySelector('.not-found').classList.contains('is-live'));
    assert.equal(await motion.locator('.portrait__body').evaluate((el) => getComputedStyle(el).animationPlayState), 'paused');
    await motion.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await motion.setViewportSize({ width: 1440, height: 1000 });
    await motion.waitForFunction(() => document.querySelector('.not-found').classList.contains('is-live'));
    await motion.waitForTimeout(950);
    await shot(motion, '404-desktop');
    for (const [name, progress] of [['portrait-open', 0], ['portrait-blink', 0.445], ['portrait-ears', 0.635]]) {
      await motion.locator('.portrait').evaluate((el, progress) => {
        for (const animation of el.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = animation.effect.getTiming().duration * progress; }
      }, progress);
      await motion.locator('.portrait').screenshot({ path: path.join(output, `${name}.png`) });
    }
  });
  await go(motion, productRoute);
  await scenario('messenger hover, press, keyboard focus and pill shape', async () => {
    for (const type of ['telegram', 'viber']) {
      const link = motion.locator(`#product-contact [data-${type}-link]`);
      await link.hover();
      assert.equal(await link.locator('svg').evaluate((el) => getComputedStyle(el).animationName), type === 'telegram' ? 'telegramFly' : 'viberRing');
      await motion.keyboard.press('Tab'); await link.focus();
      const focus = await link.evaluate((el) => {
        const s = getComputedStyle(el);
        return { width: s.outlineWidth, radius: parseFloat(s.borderRadius), color: s.outlineColor, surface: getComputedStyle(el.closest('.product-buy')).backgroundColor };
      });
      assert.equal(focus.width, '2px'); assert.ok(focus.radius > 100);
      assert.ok(contrast(focus.color, focus.surface) >= 3, `${type} focus contrast`);
      await shot(motion, `contact-${type}-focus`);
    }
    await motion.mouse.move(0, 0);
    const link = motion.locator('#product-contact [data-telegram-link]');
    await link.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
    await link.hover(); await motion.mouse.down(); await shot(motion, 'contact-pressed'); await motion.mouse.up();
  });
  await scenario('animation performance: pause/resume, hidden document, batched pointer and bounded filter wave', async () => {
    await motion.setViewportSize({ width: 1440, height: 1000 });
    await go(motion);
    await motion.waitForFunction(() => document.querySelector('.catalog-hero').classList.contains('is-live'));
    const loops = () => motion.locator('.catalog-hero').evaluate((el) => el.getAnimations({ subtree: true })
      .filter((animation) => animation.effect.getTiming().iterations === Infinity)
      .map((animation) => ({ name: animation.animationName, state: animation.playState, time: animation.currentTime, duration: animation.effect.getTiming().duration, delay: animation.effect.getTiming().delay })));
    const initial = await loops();
    assert.equal(initial.length, 9);
    assert.ok(initial.every((animation) => animation.state === 'running'));
    assert.deepEqual(initial.filter((animation) => animation.name === 'rackLedBlink').map(({ duration, delay }) => [duration, delay]).sort((a, b) => a[0] - b[0]), [[3400, 0], [4600, 1200], [5600, 2400]]);
    await motion.evaluate(() => scrollTo({ top: 2400, behavior: 'instant' }));
    await motion.waitForFunction(() => !document.querySelector('.catalog-hero').classList.contains('is-live'));
    const paused = await loops();
    assert.ok(paused.every((animation) => animation.state === 'paused'));
    await motion.waitForTimeout(250);
    assert.deepEqual((await loops()).map((animation) => animation.time), paused.map((animation) => animation.time));
    await motion.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await motion.waitForFunction(() => document.querySelector('.catalog-hero').classList.contains('is-live'));
    assert.ok((await loops()).every((animation, i) => animation.state === 'running' && animation.time >= paused[i].time));

    // Simulate the browser's visibility notification; assert CSS pauses all
    // loops without resetting their animation timelines.
    await motion.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await motion.waitForFunction(() => document.documentElement.classList.contains('motion-suspended'));
    assert.ok((await loops()).every((animation) => animation.state === 'paused'));
    await motion.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.ok((await loops()).every((animation) => animation.state === 'running'));

    const pointer = await motion.locator('[data-parallax]').evaluate(async (scene) => {
      const original = scene.getBoundingClientRect.bind(scene);
      let reads = 0;
      scene.getBoundingClientRect = () => { reads++; return original(); };
      for (let i = 0; i < 240; i++) scene.dispatchEvent(new PointerEvent('pointermove', { clientX: 1100 + i / 10, clientY: 200 }));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      scene.getBoundingClientRect = original;
      return { reads, transform: scene.querySelector('[data-parallax-layer]').style.transform, inherited: scene.style.getPropertyValue('--px') };
    });
    assert.ok(pointer.reads <= 1, `layout reads for 240 events: ${pointer.reads}`);
    assert.match(pointer.transform, /translate3d/);
    assert.equal(pointer.inherited, '');
    await motion.emulateMedia({ reducedMotion: 'reduce' });
    await motion.waitForFunction(() => getComputedStyle(document.querySelector('[data-parallax-layer]')).transform === 'none');
    await motion.emulateMedia({ reducedMotion: 'no-preference' });

    await motion.locator('[data-catalog-filter="featured"]').click();
    await motion.waitForTimeout(100);
    assert.equal(await motion.locator('.is-entering').evaluateAll((els) => els.every((el) => {
      const r = el.getBoundingClientRect(); return r.top < innerHeight + 120 && r.bottom > -120;
    })), true);
    await motion.locator('[data-catalog-filter="all"]').click();
    await motion.locator('[data-catalog-filter="featured"]').click();
    await motion.locator('[data-catalog-filter="all"]').click();
    await motion.waitForTimeout(1100);
    assert.equal(await motion.locator('.is-entering').count(), 0);
    assert.equal(await motion.locator('[data-catalog-item]:not([hidden])').count(), 49);
    assert.equal(await motion.locator('[data-catalog-item].reveal-pending').count(), 0);
    await scrollToElement(motion, '[data-sla-mechanism]');
    await motion.waitForTimeout(250);
    const mechanism = motion.locator('[data-sla-mechanism]');
    assert.equal(await motion.locator('.sla-preview__inner').evaluate((el) => getComputedStyle(el).opacity), '1');
    assert.ok((await mechanism.boundingBox()).height > 200);
    assert.equal(await mechanism.locator('.sla-mechanism__moving').evaluate((el) => getComputedStyle(el).animationPlayState), 'running');
    await shot(motion, 'sla-mechanism-visible');
  });
  await scenario('Gecko/Blink parity: scroll progress, disclosure height and bounded gallery cross-fades', async () => {
    await go(motion, 'sla/');
    await motion.evaluate(() => scrollTo({ top: 700, behavior: 'instant' }));
    await motion.waitForTimeout(100);
    const progress = await motion.locator('.site-header').evaluate((el) => {
      const style = getComputedStyle(el, '::after');
      return { actual: new DOMMatrix(style.transform).a, expected: scrollY / (document.documentElement.scrollHeight - document.documentElement.clientHeight), opacity: style.opacity };
    });
    assert.ok(Math.abs(progress.actual - progress.expected) < 0.01, JSON.stringify(progress));
    assert.equal(progress.opacity, '1');
    const disclosure = motion.locator('.sla-faq__item').first();
    await scrollToElement(motion, '.sla-faq__item');
    const collapsed = (await disclosure.boundingBox()).height;
    await disclosure.locator('summary').click();
    await motion.waitForTimeout(40);
    const duringOpen = (await disclosure.boundingBox()).height;
    await motion.waitForTimeout(350);
    const expanded = (await disclosure.boundingBox()).height;
    assert.ok(duringOpen > collapsed && duringOpen < expanded, `smooth opening: ${collapsed}, ${duringOpen}, ${expanded}`);
    await disclosure.locator('summary').click();
    await motion.waitForTimeout(40);
    const duringClose = (await disclosure.boundingBox()).height;
    assert.ok(duringClose > collapsed && duringClose < expanded, `smooth closing: ${duringClose}`);
    await motion.waitForTimeout(350);
    assert.ok(Math.abs((await disclosure.boundingBox()).height - collapsed) < 1);
    await disclosure.locator('summary').click();
    await motion.waitForTimeout(40);
    await disclosure.locator('summary').click();
    await motion.waitForTimeout(400);
    assert.equal(await disclosure.getAttribute('open'), null);
    assert.equal(await motion.locator('.disclosure-sizing').count(), 0);
    await motion.emulateMedia({ reducedMotion: 'reduce' });
    await motion.waitForFunction(() => getComputedStyle(document.querySelector('.site-header'), '::after').opacity === '0.55');
    assert.equal(await motion.locator('.site-header').evaluate((el) => getComputedStyle(el, '::after').opacity), '0.55');
    await disclosure.locator('summary').click();
    await motion.waitForTimeout(100);
    assert.equal(await motion.locator('.disclosure-sizing').count(), 0);
    await motion.emulateMedia({ reducedMotion: 'no-preference' });
    await go(motion, productRoute);
    await motion.locator('[data-product-gallery]').evaluate((gallery) => {
      const thumbnails = gallery.querySelectorAll('[data-gallery-thumb]');
      for (let i = 0; i < 30; i++) thumbnails[i % thumbnails.length].click();
    });
    const count = await motion.locator('[data-gallery-main-image]').evaluate((el) => el.getAnimations().filter((a) => a.playState !== 'finished').length);
    assert.ok(count <= 1, `rapid gallery activation queued ${count} animations`);
  });
  await animated.close();

  await scenario('reduced motion: portrait, ambient effects and messenger hover are still', async () => {
    await page.setViewportSize({ width: 1440, height: 1000 }); await go(page);
    assert.equal(await page.locator('.portrait').count(), 0);
    assert.equal(await page.locator('.leaf').evaluateAll((els) => els.every((el) => getComputedStyle(el).animationName === 'none')), true);
    assert.equal(await page.locator('.catalog-hero__rack').evaluate((el) => getComputedStyle(el).transform), 'none');
    await go(page, '404.html');
    assert.equal(await page.locator('.portrait__body, .portrait__ear, .portrait__blink').count(), 4);
    assert.equal(await page.locator('.portrait__body, .portrait__ear, .portrait__blink, .not-found__portrait').evaluateAll((els) => els.every((el) => getComputedStyle(el).animationName === 'none')), true);
    await go(page, productRoute); await page.locator('#product-contact [data-telegram-link]').hover();
    assert.equal(await page.locator('#product-contact [data-telegram-link] svg').evaluate((el) => getComputedStyle(el).animationName), 'none');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      window.__tanmekScrolls = [];
      const scroll = Element.prototype.scrollTo;
      Element.prototype.scrollTo = function (options, ...rest) {
        if (this.matches('.product-nav__track')) window.__tanmekScrolls.push(options.behavior);
        return scroll.call(this, options, ...rest);
      };
    });
    await go(page, productRoute);
    await scrollToElement(page, '#product-description');
    assert.equal(await page.evaluate(() => window.__tanmekScrolls.length > 0 && window.__tanmekScrolls.every((behavior) => behavior === 'auto')), true);
  });

  await scenario('touch screen: 44px targets, no sticky messenger hover, Viber sheet within viewport', async () => {
    const touch = await browser.newContext({ viewport: { width: 320, height: 844 }, hasTouch: true, ...(engine === 'chromium' ? { isMobile: true } : {}) });
    const phone = observe(await touch.newPage());
    await go(phone, productRoute);
    assert.equal(await phone.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches), true);
    const controls = await phone.locator('#product-contact .contact-button, #product-contact .contact-copy, #product-contact .contact-browser').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    assert.ok(controls.every((height) => height >= 44));
    const link = phone.locator('#product-contact [data-viber-link]');
    await link.evaluate((el) => el.addEventListener('click', (event) => event.preventDefault()));
    await link.tap();
    assert.equal(await link.locator('svg').evaluate((el) => getComputedStyle(el).animationName), 'none');
    await phone.locator('[data-viber-support]').evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
    const box = await phone.locator('[data-viber-support]').boundingBox();
    assert.ok(box.y >= 0 && box.y + box.height <= 845 && box.width <= 320, JSON.stringify(box));
    await shot(phone, 'viber-touch-320');
    await touch.close();
  });

  await scenario('blocked web fonts: fallback typography remains readable and within 320px', async () => {
    const fonts = await browser.newContext({ viewport: { width: 320, height: 844 }, reducedMotion: 'reduce' });
    await fonts.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
    const fallbackFonts = observe(await fonts.newPage());
    for (const route of ['', productRoute, 'sla/']) {
      await go(fallbackFonts, route);
      await noOverflow(fallbackFonts, `fallback fonts: ${route}`);
    }
    await shot(fallbackFonts, 'fallback-fonts-320');
    await fonts.close();
  });

  await scenario('failed product image: local placeholder and recovery on another thumbnail', async () => {
    const images = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await images.route(product.images[0], (route) => route.fulfill({ contentType: 'image/webp', body: 'invalid image for QA' }));
    const imagePage = observe(await images.newPage());
    await go(imagePage, productRoute);
    await imagePage.waitForFunction(() => document.querySelector('[data-gallery-main-image]').src.endsWith('images/product-placeholder.svg'));
    await imagePage.locator('[data-gallery-thumb]').nth(1).click();
    await imagePage.waitForFunction(() => { const image = document.querySelector('[data-gallery-main-image]'); return image.complete && image.naturalWidth > 0 && !image.src.endsWith('product-placeholder.svg'); });
    await images.close();
  });

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 844 } });
  const native = observe(await noJs.newPage());
  noScriptPages.add(native);
  await scenario('no JavaScript: all products, native mobile menu, contacts, gallery links and SLA fallback', async () => {
    await go(native);
    assert.equal(await native.locator('.portrait').count(), 0);
    assert.equal(await native.locator('[data-catalog-item]').count(), 49);
    assert.equal(await native.locator('.reveal-pending').count(), 0);
    assert.equal(await native.locator('.site-header__burger').isVisible(), false, 'do not expose an inert burger without JS');
    await native.locator('.site-header__native-menu summary').click();
    assert.equal(await native.locator('.site-header__native-menu nav').isVisible(), true);
    assert.equal(await native.locator('.site-header__native-menu nav a').count(), 6);
    // Firefox's screenshot font wait uses the same disabled JS promise queue.
    if (engine !== 'firefox') await shot(native, 'no-js-menu');
    await go(native, productRoute);
    assert.equal(await native.locator('#product-contact [data-contact-copy]').isVisible(), false);
    assert.ok((await native.locator('[data-gallery-open]').getAttribute('href')).startsWith('https://'));
    await native.locator('#contacts details summary').click();
    assert.match(await native.locator('#contacts details').textContent(), /380.*98.*907.*30.*72/);
    await noOverflow(native, 'no JS product');
    await go(native, 'sla/');
    assert.equal(await native.locator('noscript [data-telegram-link]').isVisible(), true);
    assert.equal(await native.locator('[data-sla-form]').isVisible(), false);
    await go(native, '404.html');
    assert.equal(await native.locator('.portrait__base').isVisible(), true);
    await noOverflow(native, 'no JS 404');
  });
  await noJs.close();

  assert.deepEqual(pageErrors, [], 'browser runtime errors');
  assert.deepEqual(consoleErrors, [], 'browser console errors');
  assert.deepEqual(failedRequests, [], 'failed network requests');
  passed = true;
  console.log(`PASS: ${results.length} scenarios. Screenshots: ${output}`);
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ status: passed ? 'passed' : 'failed', engine, browser: browser.version(), functionalOnly: process.argv.includes('--functional-only'), results, pageErrors, consoleErrors, failedRequests, cancelledFontRequests }, null, 2));
  await browser.close();
}
