#!/usr/bin/env node
// Submits the site's canonical URLs to IndexNow after a deploy.
//
// IndexNow is a push protocol: instead of waiting for a crawler to notice a
// change, the site tells participating engines which URLs to re-fetch. Bing,
// Yandex, Seznam, Naver and Yep consume it (and share submissions with each
// other). Google does NOT participate — Google discovers changes through the
// sitemap and normal crawling, which is why the sitemap stays the primary
// mechanism and this is an addition, not a replacement.
//
// Ownership is proved by a key file served from the site itself
// (public/<key>.txt). Because the key file must be publicly readable at a
// fixed URL, an IndexNow key is a verification token, not a secret — keeping
// it in the repository is exactly as exposed as serving it, which the
// protocol requires anyway.
//
// KEY LOCATION AND SCOPE: the key file sits under the deployment's base path,
// not at the host root (a GitHub Pages project site cannot write to the host
// root). The spec allows this via `keyLocation`, and a key served from a
// directory authorises exactly the URLs under that directory — which is
// precisely the set this script submits.
//
// Usage:
//   node scripts/submit-indexnow.mjs                 # submit every URL
//   node scripts/submit-indexnow.mjs --dry-run       # print, do not send
//   node scripts/submit-indexnow.mjs --changed-since <git-ref>
//
// Exits 0 even when an endpoint rejects the batch: a failed ping must never
// fail a deploy that already succeeded. Problems are reported on stderr.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

const { INDEXNOW_KEY, INDEXNOW_KEY_LOCATION, SITE_ORIGIN, SITE_URL } = await import(
  new URL('../src/data/site.config.mjs', import.meta.url)
);

/** Endpoint that fans the submission out to every participating engine. */
const ENDPOINT = 'https://api.indexnow.org/IndexNow';

/** IndexNow accepts at most 10 000 URLs per request. */
const MAX_URLS_PER_REQUEST = 10_000;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

/**
 * Reads the built sitemap and returns its <loc> values. The sitemap is the
 * single definition of what is indexable, so IndexNow can never be told about
 * a URL the site does not publish.
 *
 * @returns {Promise<string[]>}
 */
async function readSitemapUrls() {
  const sitemapPath = path.join(projectRoot, 'dist', 'sitemap.xml');
  const xml = await readFile(sitemapPath, 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].replace(/&amp;/g, '&').trim(),
  );

  if (urls.length === 0) {
    throw new Error(`${sitemapPath} contains no <loc> entries`);
  }

  // Guard the protocol's scope rule: everything submitted must live under the
  // directory the key file is served from.
  const outOfScope = urls.filter((url) => !url.startsWith(SITE_URL));
  if (outOfScope.length > 0) {
    throw new Error(
      `sitemap contains URLs outside the key's scope (${SITE_URL}):\n  ${outOfScope.join('\n  ')}`,
    );
  }

  return urls;
}

async function main() {
  const urls = await readSitemapUrls();

  if (urls.length > MAX_URLS_PER_REQUEST) {
    console.error(
      `Refusing to submit ${urls.length} URLs in one request (limit ${MAX_URLS_PER_REQUEST}).`,
    );
    process.exit(0);
  }

  const payload = {
    host: new URL(SITE_ORIGIN).host,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls,
  };

  if (dryRun) {
    console.log(`[dry-run] would POST ${urls.length} URLs to ${ENDPOINT}`);
    console.log(`[dry-run] host=${payload.host} keyLocation=${payload.keyLocation}`);
    for (const url of urls) console.log(`  ${url}`);
    return;
  }

  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(`IndexNow request failed: ${error.message}`);
    return;
  }

  // 200 = accepted, 202 = accepted but the key is still being validated.
  if (response.status === 200 || response.status === 202) {
    console.log(`IndexNow: submitted ${urls.length} URLs (HTTP ${response.status}).`);
    return;
  }

  const body = await response.text().catch(() => '');
  console.error(
    `IndexNow returned HTTP ${response.status}. ${body.slice(0, 300)}\n` +
      `Check that ${INDEXNOW_KEY_LOCATION} is reachable and contains exactly the key.`,
  );
}

await main();
