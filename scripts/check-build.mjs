#!/usr/bin/env node
// Post-build checks over dist/: HTML metadata, JSON-LD validity and its
// consistency with the visible page, internal links and anchors, image
// fallback wiring, favicon/branding assets, dangerous URL schemes.
//
// Usage: npm run check:build   (after `npm run build`)
// Also imported by tests/build-output.test.mjs, which runs the same checks
// as part of `npm test` right after a real production build.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(projectRoot, 'dist');
const productsDir = path.join(projectRoot, 'src', 'data', 'products');

// Must mirror astro.config.mjs (site + base + trailingSlash: 'always').
const SITE_BASE = 'https://4245877.github.io/3D-Drukarnya/';
const BASE_PATH = '/3D-Drukarnya/';

const DANGEROUS_HREF = /^(javascript|data|vbscript):/i;
const INLINE_HANDLER = /\son[a-z]+\s*=\s*["']/i;

/** Decodes the entities Astro emits when escaping interpolated text. */
function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

const normalizeText = (value) => decodeEntities(value).replace(/\s+/g, ' ').trim();

async function walkHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkHtml(p)));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

async function fileSize(p) {
  try {
    return (await stat(p)).size;
  } catch {
    return -1;
  }
}

/**
 * Runs every check against dist/. Returns a list of failure messages
 * (empty = everything passed).
 */
export async function checkBuild() {
  const failures = [];
  const check = (condition, message) => {
    if (!condition) failures.push(message);
  };

  // ── Source products (the contract for what must exist) ──
  const productFiles = (await readdir(productsDir)).filter((n) => n.endsWith('.json'));
  const products = await Promise.all(
    productFiles.map(async (name) =>
      JSON.parse(await readFile(path.join(productsDir, name), 'utf8')),
    ),
  );
  check(products.length === 20, `expected 20 product JSON files, found ${products.length}`);

  // ── Required pages ──
  for (const product of products) {
    const page = path.join(distDir, 'products', product.slug, 'index.html');
    check((await fileSize(page)) > 0, `missing product page: products/${product.slug}/`);
  }
  check((await fileSize(path.join(distDir, 'index.html'))) > 0, 'missing dist/index.html');
  check((await fileSize(path.join(distDir, '404.html'))) > 0, 'missing dist/404.html');
  check((await fileSize(path.join(distDir, 'sitemap.xml'))) > 0, 'missing dist/sitemap.xml');

  // ── Branding assets must survive the build ──
  for (const asset of ['OGimage.png', 'logo.svg', 'images/product-placeholder.svg',
    'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png']) {
    const built = await fileSize(path.join(distDir, asset));
    check(built > 0, `branding/public asset missing or empty in dist: ${asset}`);
    const source = await fileSize(path.join(projectRoot, 'public', asset));
    check(built === source, `dist/${asset} differs in size from public/${asset}`);
  }

  // The image-fallback handler must be wired into a shipped script.
  const jsDir = path.join(distDir, '_astro');
  let fallbackWired = false;
  try {
    for (const name of await readdir(jsDir)) {
      if (!name.endsWith('.js')) continue;
      const text = await readFile(path.join(jsDir, name), 'utf8');
      if (text.includes('product-placeholder.svg')) fallbackWired = true;
      check(
        !text.includes('favicon.svg'),
        `dist JS references removed favicon.svg: ${name}`,
      );
    }
  } catch {
    /* no _astro dir — the check below fails anyway */
  }
  check(fallbackWired, 'image fallback (product-placeholder.svg) is not wired into any dist script');

  // ── Per-page checks ──
  const htmlFiles = await walkHtml(distDir);
  const titles = new Map();
  const canonicals = new Map();
  const descriptions = new Map();
  const pageIds = new Map(); // dist-relative dir -> Set of element ids

  const pages = [];
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    const rel = path.relative(distDir, file).replaceAll('\\', '/');
    pages.push({ file, rel, html });
    pageIds.set(
      rel,
      new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])),
    );
  }

  for (const { rel, html } of pages) {
    const where = (msg) => `${rel}: ${msg}`;

    // <title>
    const titleMatches = [...html.matchAll(/<title>([^<]*)<\/title>/g)];
    check(titleMatches.length === 1, where(`expected exactly 1 <title>, got ${titleMatches.length}`));
    const title = normalizeText(titleMatches[0]?.[1] ?? '');
    check(title.length > 0, where('empty <title>'));
    check(!titles.has(title), where(`duplicate <title> (also on ${titles.get(title)})`));
    titles.set(title, rel);

    // canonical
    const canonicalMatches = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
    check(canonicalMatches.length === 1, where(`expected exactly 1 canonical, got ${canonicalMatches.length}`));
    const canonical = canonicalMatches[0]?.[1] ?? '';
    check(canonical.startsWith(SITE_BASE), where(`canonical is not absolute under site base: ${canonical}`));
    check(!canonicals.has(canonical), where(`duplicate canonical (also on ${canonicals.get(canonical)})`));
    canonicals.set(canonical, rel);

    // description
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
    check(description.length > 0, where('missing meta description'));
    check(
      !descriptions.has(description),
      where(`duplicate meta description (also on ${descriptions.get(description)})`),
    );
    descriptions.set(description, rel);

    // Open Graph absolute URLs
    for (const m of html.matchAll(/property="og:(?:image|url|image:secure_url)" content="([^"]*)"/g)) {
      check(/^https:\/\//.test(m[1]), where(`og URL is not absolute https: ${m[1]}`));
    }
    for (const m of html.matchAll(/name="twitter:image" content="([^"]*)"/g)) {
      check(/^https:\/\//.test(m[1]), where(`twitter:image is not absolute https: ${m[1]}`));
    }

    // og:image:type must match the preceding og:image URL (WebP never PNG)
    const ogPairs = [...html.matchAll(
      /property="og:image" content="([^"]*)"(?:(?!property="og:image"[\s>]).)*?property="og:image:type" content="([^"]*)"/gs,
    )];
    for (const [, url, type] of ogPairs) {
      // A `format,webp` CDN directive wins over the path extension: the CDN
      // re-encodes …/photo.png?…format,webp to WebP.
      if (/format,webp|\.webp(?:[?#]|$)/i.test(url)) {
        check(type === 'image/webp', where(`WebP og:image declared as ${type}: ${url.slice(0, 80)}`));
      } else if (/\.png(?:[?#]|$)/i.test(url)) {
        check(type === 'image/png', where(`PNG og:image declared as ${type}`));
      }
    }

    // No inline event handlers, no dangerous URL schemes
    check(!INLINE_HANDLER.test(html), where('inline on*= event handler found'));
    for (const m of html.matchAll(/\shref="([^"]*)"/g)) {
      check(!DANGEROUS_HREF.test(m[1].trim()), where(`dangerous href scheme: ${m[1].slice(0, 60)}`));
    }
    for (const m of html.matchAll(/<img[^>]*\ssrc="([^"]*)"/g)) {
      check(m[1].trim().length > 0, where('empty <img src>'));
      check(!/^(javascript|vbscript):/i.test(m[1]), where(`dangerous img src: ${m[1].slice(0, 60)}`));
    }

    // JSON-LD parses
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        JSON.parse(m[1]);
      } catch (error) {
        check(false, where(`invalid JSON-LD: ${error.message}`));
      }
    }

    // Local hrefs/srcs must resolve to files that exist and are non-empty
    for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const url = m[1];
      if (!url.startsWith(BASE_PATH)) continue;
      const [clean] = url.slice(BASE_PATH.length).split(/[?#]/);
      if (clean === '' || clean.endsWith('/')) {
        const target = path.join(distDir, clean, 'index.html');
        check((await fileSize(target)) > 0, where(`internal link target missing: ${url}`));
      } else {
        const target = path.join(distDir, clean);
        const size = await fileSize(target);
        check(size !== -1, where(`local resource missing: ${url}`));
        check(size !== 0, where(`local resource is empty (0 bytes): ${url}`));
      }
    }

    // Same-page and cross-page anchors
    for (const m of html.matchAll(/\shref="([^"]*#[^"]+)"/g)) {
      const [target, fragment] = m[1].split('#');
      if (/^https?:\/\//.test(target)) continue; // external
      let targetPage = rel;
      if (target && target.startsWith(BASE_PATH)) {
        const clean = target.slice(BASE_PATH.length).split(/[?#]/)[0];
        targetPage = clean === '' || clean.endsWith('/') ? `${clean}index.html` : clean;
        targetPage = targetPage.replace(/^\//, '');
      }
      const ids = pageIds.get(targetPage);
      if (!ids) continue; // already reported as a missing page above
      check(ids.has(fragment), where(`anchor #${fragment} not found in ${targetPage}`));
    }

    // Favicon links resolve (and never point at the removed favicon.svg)
    check(!/rel="icon"[^>]*favicon\.svg/.test(html), where('links the removed favicon.svg'));
  }

  // ── Product pages: visible price/availability vs JSON-LD ──
  for (const product of products) {
    const rel = `products/${product.slug}/index.html`;
    const page = pages.find((p) => p.rel === rel);
    if (!page) continue; // missing page already reported
    const where = (msg) => `${rel}: ${msg}`;
    const { html } = page;

    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    const graph = ld ? JSON.parse(ld)['@graph'] : [];
    const node = graph.find((n) => n['@type'] === 'Product');
    check(Boolean(node), where('no Product node in JSON-LD'));
    if (!node) continue;

    const visibleLabel = html.match(/class="product-page__price-label">\s*([^<]+?)\s*</)?.[1] ?? '';
    const offers = node.offers;

    if (product.publishOffer === false) {
      check(offers === undefined, where('publishOffer=false but JSON-LD contains offers'));
      continue;
    }
    check(Boolean(offers), where('JSON-LD Product has no offers'));
    if (!offers) continue;

    if (product.priceType === 'from') {
      check(visibleLabel === 'Ціна від', where(`visible label "${visibleLabel}" for priceType=from`));
      check(offers['@type'] === 'AggregateOffer', where(`priceType=from but offers is ${offers['@type']}`));
      check(offers.lowPrice === product.price, where(`lowPrice ${offers.lowPrice} != data price ${product.price}`));
      check(offers.price === undefined, where('AggregateOffer must not publish an exact price'));
      check(offers.highPrice === undefined, where('highPrice must never be invented'));
    } else {
      check(visibleLabel === 'Ціна', where(`visible label "${visibleLabel}" for priceType=exact`));
      check(offers['@type'] === 'Offer', where(`priceType=exact but offers is ${offers['@type']}`));
      check(offers.price === product.price, where(`Offer.price ${offers.price} != data price ${product.price}`));
    }

    // Visible price digits match the data price
    const visiblePrice = html.match(/class="product-price[^"]*">\s*([^<]+?)\s*</)?.[1] ?? '';
    const digits = normalizeText(visiblePrice).replace(/\D/g, '');
    check(digits === String(product.price), where(`visible price "${visiblePrice}" != ${product.price}`));

    // Availability: only confirmed statuses, mapped 1:1 from the data
    const expectedAvailability = {
      in_stock: 'https://schema.org/InStock',
      made_to_order: 'https://schema.org/MadeToOrder',
      unavailable: 'https://schema.org/OutOfStock',
      unconfirmed: undefined,
    }[product.availability ?? 'unconfirmed'];
    check(
      offers.availability === expectedAvailability,
      where(`availability ${offers.availability} != expected ${expectedAvailability}`),
    );

    // Structured warnings must be rendered visibly
    for (const warning of product.safetyWarnings ?? []) {
      check(
        normalizeText(html).includes(normalizeText(warning.text)),
        where('safety warning text is not visible on the page'),
      );
      if (warning.level === 'critical') {
        check(html.includes('product-warning--critical'), where('critical warning block missing'));
      }
    }

    // CTA present
    check(html.includes('product-page__cta-button'), where('order CTA missing'));
  }

  // ── Homepage: visible FAQ == FAQPage JSON-LD ──
  const index = pages.find((p) => p.rel === 'index.html');
  if (index) {
    const visibleQuestions = [...index.html.matchAll(/data-faq-question[^>]*>([\s\S]*?)<\//g)].map(
      (m) => normalizeText(m[1]),
    );
    const visibleAnswers = [...index.html.matchAll(/data-faq-answer[^>]*>([\s\S]*?)<\//g)].map((m) =>
      normalizeText(m[1]),
    );
    const ld = index.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    const faq = ld ? JSON.parse(ld)['@graph'].find((n) => n['@type'] === 'FAQPage') : undefined;
    check(Boolean(faq), 'index.html: FAQPage node missing from JSON-LD');
    if (faq) {
      const ldQuestions = faq.mainEntity.map((q) => normalizeText(q.name));
      const ldAnswers = faq.mainEntity.map((q) => normalizeText(q.acceptedAnswer.text));
      check(
        JSON.stringify(visibleQuestions) === JSON.stringify(ldQuestions),
        `index.html: FAQ questions differ between page and JSON-LD\n  visible: ${JSON.stringify(visibleQuestions)}\n  json-ld: ${JSON.stringify(ldQuestions)}`,
      );
      check(
        JSON.stringify(visibleAnswers) === JSON.stringify(ldAnswers),
        'index.html: FAQ answers differ between page and JSON-LD',
      );
      check(visibleQuestions.length > 0, 'index.html: no visible FAQ items found');
    }
  } else {
    check(false, 'index.html not found among built pages');
  }

  return failures;
}

// CLI entry point
const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const failures = await checkBuild();
  if (failures.length > 0) {
    console.error(`Build checks failed (${failures.length}):\n`);
    for (const failure of failures) console.error(`  ✗ ${failure}`);
    process.exit(1);
  }
  console.log('OK: all build-output checks passed.');
}
