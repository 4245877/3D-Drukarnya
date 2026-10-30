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
import { SITE_REDIRECTS } from '../src/data/category-redirects.mjs';
import { selectCatalogProducts } from '../src/data/publication.mjs';
import { getSearchTerms } from '../src/data/search-terms.mjs';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(projectRoot, 'dist');
const productsDir = path.join(projectRoot, 'src', 'data', 'products');

const { computeCatalogPrice } = await import(
  new URL('../src/data/pricing.config.mjs', import.meta.url)
);
const { STATIC_ROUTE_PATHS } = await import(
  new URL('../src/data/routes.mjs', import.meta.url)
);
const { INDEXNOW_KEY } = await import(
  new URL('../src/data/site.config.mjs', import.meta.url)
);

// Must mirror astro.config.mjs (site + base + trailingSlash: 'always').
const SITE_BASE = 'https://4245877.github.io/3D-Drukarnya/';
const BASE_PATH = '/3D-Drukarnya/';

const DANGEROUS_HREF = /^(javascript|data|vbscript):/i;
const INLINE_HANDLER = /\son[a-z]+\s*=\s*["']/i;

/** Stable site-wide JSON-LD @id values any page may reference. */
const SITE_NODE_IDS = new Set([`${SITE_BASE}#website`, `${SITE_BASE}#organization`]);

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
  const allProducts = await Promise.all(
    productFiles.map(async (name) =>
      JSON.parse(await readFile(path.join(productsDir, name), 'utf8')),
    ),
  );
  check(allProducts.length === 49, `expected 49 product JSON files, found ${allProducts.length}`);
  const products = selectCatalogProducts(allProducts);
  for (const draft of allProducts.filter((product) => product.publicationStatus === 'draft')) {
    check((await fileSize(path.join(distDir, 'products', draft.slug, 'index.html'))) === -1,
      `draft must not have a production page: ${draft.sku}`);
    check((await fileSize(path.join(distDir, 'ru', 'products', draft.slug, 'index.html'))) === -1,
      `draft must not have a Russian production page: ${draft.sku}`);
  }

  // ── Required pages ──
  for (const product of products) {
    const page = path.join(distDir, 'products', product.slug, 'index.html');
    check((await fileSize(page)) > 0, `missing product page: products/${product.slug}/`);
  }
  // Every declared route (home, catalog hub, categories, guide articles
  // and SLA service) must have been built.
  for (const routePath of STATIC_ROUTE_PATHS) {
    const page = path.join(distDir, routePath, 'index.html');
    check((await fileSize(page)) > 0, `missing page for route: /${routePath}`);
  }
  for (const routePath of Object.keys(SITE_REDIRECTS)) {
    const page = path.join(distDir, routePath.slice(1), 'index.html');
    check((await fileSize(page)) > 0, `missing retired route redirect: ${routePath}`);
  }
  check((await fileSize(path.join(distDir, '404.html'))) > 0, 'missing dist/404.html');
  check((await fileSize(path.join(distDir, 'sitemap.xml'))) > 0, 'missing dist/sitemap.xml');
  check((await fileSize(path.join(distDir, 'robots.txt'))) > 0, 'missing dist/robots.txt');
  check(
    (await fileSize(path.join(distDir, `${INDEXNOW_KEY}.txt`))) > 0,
    'missing the IndexNow key file in dist',
  );

  // ── Branding assets must survive the build ──
  for (const asset of ['OGimage.png', 'logo.svg', 'images/product-placeholder.svg',
    'images/brand/raphtalia-920.webp', 'images/brand/raphtalia-560.webp',
    'images/brand/raphtalia-ear-left.webp', 'images/brand/raphtalia-ear-right.webp',
    'images/brand/raphtalia-blink.webp',
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

    // Astro's static redirects are small noindex documents, with a canonical
    // pointing to the destination. Verify them before the full-page checks.
    const redirectTarget = SITE_REDIRECTS[`/${rel.replace(/index\.html$/, '')}`];
    if (redirectTarget) {
      const destination = `${BASE_PATH}${redirectTarget.slice(1)}`;
      check(
        html.includes(`<meta http-equiv="refresh" content="0;url=${destination}">`),
        where(`redirect must lead immediately to ${destination}`),
      );
      check(
        html.includes(`<link rel="canonical" href="${SITE_BASE}${redirectTarget.slice(1)}">`),
        where('redirect canonical must address the destination'),
      );
      check(/<meta name="robots" content="noindex"/.test(html), where('redirect must be noindex'));
      check(html.includes(`<a href="${destination}">`), where('redirect needs a fallback link'));
      check(
        (await fileSize(path.join(distDir, redirectTarget.slice(1), 'index.html'))) > 0,
        where('redirect destination is missing'),
      );
      continue;
    }

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

    // Exactly one <h1> per page. Two H1s make the page's subject ambiguous
    // to both search engines and to anything summarising the page.
    const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
    check(h1Count === 1, where(`expected exactly 1 <h1>, got ${h1Count}`));

    // The canonical must address THIS page, not another one. Catches a
    // copy-pasted canonicalPath, which silently de-indexes a page.
    const expectedPath = rel === 'index.html' ? '' : rel.replace(/index\.html$/, '');
    const expectedCanonical =
      rel === '404.html' ? `${SITE_BASE}404.html` : `${SITE_BASE}${expectedPath}`;
    check(
      canonical === expectedCanonical,
      where(`canonical ${canonical} does not match the page's own URL ${expectedCanonical}`),
    );

    // og:url always mirrors the canonical.
    const ogUrl = html.match(/property="og:url" content="([^"]*)"/)?.[1];
    check(ogUrl === canonical, where(`og:url ${ogUrl} != canonical ${canonical}`));

    // Indexable pages must not carry a noindex directive, and vice versa.
    const robotsMeta = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? '';
    if (rel === '404.html') {
      check(robotsMeta.includes('noindex'), where('404 page must be noindex'));
    } else {
      check(!robotsMeta.includes('noindex'), where(`indexable page carries "${robotsMeta}"`));
    }

    const graphNodes = (() => {
      const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
      if (!raw) return [];
      try {
        return JSON.parse(raw)['@graph'] ?? [];
      } catch {
        return [];
      }
    })();

    // A FAQPage may only publish questions the page also shows. Applies to
    // every page, not just the home page: the same rule, one check.
    const faqLd = graphNodes.find((node) => node['@type'] === 'FAQPage');
    const visibleQuestions = [...html.matchAll(/data-faq-question[^>]*>([\s\S]*?)<\//g)].map((m) =>
      normalizeText(m[1]),
    );
    const visibleAnswers = [...html.matchAll(/data-faq-answer[^>]*>([\s\S]*?)<\//g)].map((m) =>
      normalizeText(m[1]),
    );
    if (faqLd) {
      check(
        JSON.stringify(faqLd.mainEntity.map((q) => normalizeText(q.name))) ===
          JSON.stringify(visibleQuestions),
        where('FAQPage questions differ between the page and its JSON-LD'),
      );
      check(
        JSON.stringify(
          faqLd.mainEntity.map((q) => normalizeText(q.acceptedAnswer.text)),
        ) === JSON.stringify(visibleAnswers),
        where('FAQPage answers differ between the page and its JSON-LD'),
      );
    } else {
      check(
        visibleQuestions.length === 0,
        where('page shows a FAQ but publishes no FAQPage node'),
      );
    }

    // BreadcrumbList must describe the trail the page actually renders.
    const breadcrumbLd = graphNodes.find((node) => node['@type'] === 'BreadcrumbList');
    if (breadcrumbLd) {
      const visibleCrumbs = [
        ...html.matchAll(/<li class="breadcrumbs__item">([\s\S]*?)<\/li>/g),
      ].map((m) => normalizeText(m[1].replace(/<[^>]+>/g, ' ')));
      const ldCrumbs = breadcrumbLd.itemListElement.map((item) => normalizeText(item.name));

      // The home page has no visible breadcrumb bar; its single-item list is
      // the page itself, which is legitimate.
      if (visibleCrumbs.length > 0) {
        check(
          JSON.stringify(ldCrumbs) === JSON.stringify(visibleCrumbs),
          where(
            `BreadcrumbList differs from the visible trail
  visible: ${JSON.stringify(visibleCrumbs)}
  json-ld: ${JSON.stringify(ldCrumbs)}`,
          ),
        );
      }

      // Positions are 1-based and contiguous.
      const positions = breadcrumbLd.itemListElement.map((item) => item.position);
      check(
        positions.every((position, index) => position === index + 1),
        where(`BreadcrumbList positions are not contiguous: ${JSON.stringify(positions)}`),
      );
    }

    // One public language: never advertise retired translations.
    check(html.includes('<html lang="uk">'), where('content language must be Ukrainian'));
    check(!/\bhreflang=/.test(html), where('retired language alternate remains'));
    check(!html.includes('site-languages'), where('language switcher remains'));
    check(!/(?:href|content)="[^"<>]*\/3D-Drukarnya\/(?:ru|en)\//.test(html),
      where('page still references a retired language URL'));
    const routePath = rel === 'index.html' ? '/' : `/${rel.replace(/index\.html$/, '')}`;
    const keywords = normalizeText(html.match(/<meta name="keywords" content="([^"]*)"/)?.[1] ?? '');
    for (const term of getSearchTerms(routePath, products)) {
      check(keywords.includes(term), where(`missing retained search term: ${term}`));
    }
    for (const node of graphNodes.filter((node) => node.inLanguage !== undefined)) {
      check(node.inLanguage === 'uk-UA', where('structured data advertises an unavailable language'));
    }

    // ── JSON-LD graph integrity ──
    // Every {"@id": …} reference must resolve to a node defined on this page
    // or to a stable site-wide node, so the graph never points at an entity
    // that does not exist. Catches a renamed @id left behind in one caller.
    if (graphNodes.length > 0) {
      const definedIds = new Set(
        graphNodes.map((node) => node['@id']).filter((id) => typeof id === 'string'),
      );
      const references = [];
      const collect = (value) => {
        if (Array.isArray(value)) {
          value.forEach(collect);
        } else if (value && typeof value === 'object') {
          const keys = Object.keys(value);
          if (keys.length === 1 && keys[0] === '@id') references.push(value['@id']);
          else Object.values(value).forEach(collect);
        }
      };
      collect(graphNodes);
      for (const reference of references) {
        check(
          definedIds.has(reference) || SITE_NODE_IDS.has(reference),
          where(`JSON-LD references an @id that no node defines: ${reference}`),
        );
      }

      // A Product node describes one purchasable item and belongs on that
      // item's own page. Listing pages use ItemList, never inline Products.
      const hasProductNode = graphNodes.some((node) => node['@type'] === 'Product');
      check(
        hasProductNode === /^products\//.test(rel),
        where(
          hasProductNode
            ? 'Product node on a page that is not a product page'
            : 'product page has no Product node',
        ),
      );

      // Whatever sells, sells as the one organization the site publishes.
      for (const node of graphNodes) {
        const sellerId = node?.offers?.seller?.['@id'];
        if (node['@type'] !== 'Product' || sellerId === undefined) continue;
        check(
          sellerId === `${SITE_BASE}#organization`,
          where(`Offer.seller is ${sellerId}, expected ${SITE_BASE}#organization`),
        );
      }
    }
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

    if (product.priceType === 'from') {
      check(visibleLabel === 'Ціна від', where(`visible label "${visibleLabel}" for priceType=from`));
    } else {
      check(visibleLabel === 'Ціна', where(`visible label "${visibleLabel}" for priceType=exact`));
    }
    const expectsOffer = product.publishOffer !== false &&
      (product.priceType !== 'from' || (product.weightGrams !== undefined && Boolean(product.priceNote)));
    check(Boolean(offers) === expectsOffer, where('Offer must describe a priced, documented configuration, never an estimate'));
    if (offers) {
      check(offers['@type'] === 'Offer', where('product variants must not use AggregateOffer'));
      check(offers.price === product.price, where(`Offer.price ${offers.price} != data price ${product.price}`));
      check(offers.priceValidUntil === undefined, where('price expiry has not been confirmed'));
      if (product.priceType === 'from') {
        const scope = product.priceNote;
        check(offers.description === scope, where('base Offer must identify its visible scope'));
        check(normalizeText(html).includes(normalizeText(scope)), where('base Offer scope is not visible'));
      }
    }

    // Visible price digits match the data price
    const visiblePrice = html.match(/class="product-price[^"]*">\s*([^<]+?)\s*</)?.[1] ?? '';
    const digits = normalizeText(visiblePrice).replace(/\D/g, '');
    check(digits === String(product.price), where(`visible price "${visiblePrice}" != ${product.price}`));

    const calculatedPrice = computeCatalogPrice(product);
    if (calculatedPrice !== undefined) {
      check(product.price === calculatedPrice,
        where(`price ${product.price} != policy price ${calculatedPrice}`));
    }

    // Physical weight appears only when the target product has a known weight.
    // Benchmark weights must never leak into visible facts or JSON-LD.
    const visibleWeights = [...html.matchAll(/<dt>(?:Вага|Вес)<\/dt>\s*<dd>([^<]*)<\/dd>/g)].map(
      (match) => normalizeText(match[1]).replace(/\D/g, ''),
    );

    if (product.weightGrams === undefined) {
      check(node.weight === undefined, where('no weightGrams in data but JSON-LD publishes a weight'));
      check(visibleWeights.length === 0, where(`no weightGrams in data but page shows ${JSON.stringify(visibleWeights)}`));
      if (product.pricingProfile) {
        check(html.includes('Попередня ціна за аналогічним виробом.'),
          where('benchmark price must be labelled as provisional'));
      }
    } else {
      const weightNode = node.weight;
      check(
        weightNode?.value === product.weightGrams && weightNode?.unitCode === 'GRM',
        where(`JSON-LD weight ${JSON.stringify(weightNode)} != ${product.weightGrams} g`),
      );
      check(
        visibleWeights.length > 0 &&
          visibleWeights.every((value) => value === String(product.weightGrams)),
        where(`visible weight ${JSON.stringify(visibleWeights)} != ${product.weightGrams}`),
      );
    }

    // Availability: only confirmed statuses, mapped 1:1 from the data
    const expectedAvailability = {
      in_stock: 'https://schema.org/InStock',
      made_to_order: undefined,
      unavailable: 'https://schema.org/OutOfStock',
      unconfirmed: undefined,
    }[product.availability ?? 'unconfirmed'];
    if (offers) check(
      offers.availability === expectedAvailability,
      where(`availability ${offers.availability} != expected ${expectedAvailability}`),
    );

    // Structured warnings must be rendered visibly
    const warnings = product.safetyWarnings ?? [];
    for (const warning of warnings) {
      check(
        normalizeText(html).includes(normalizeText(warning.text)),
        where('safety warning text is not visible on the page'),
      );
      if (warning.level === 'critical') {
        check(html.includes('product-warning--critical'), where('critical warning block missing'));
      }
    }

    // CTA present
    check(html.includes('data-order-cta') && html.includes('data-telegram-link') && html.includes('data-viber-link'), where('direct contact order CTA missing'));
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
