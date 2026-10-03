import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

// Resolve the dependency from Astro, so these checks exercise the override
// actually used by the build, rather than importing the vendor file directly.
const requireFromAstro = createRequire(
  new URL('../node_modules/astro/package.json', import.meta.url),
);
const CachePolicy = requireFromAstro('http-cache-semantics');

class FixedClockPolicy extends CachePolicy {
  now() {
    return 1_700_000_000_000;
  }
}

const request = (cacheControl = '') => ({
  url: 'https://example.com/image.png',
  method: 'GET',
  headers: { 'cache-control': cacheControl },
});

function policy(headers, options, originalRequest = request()) {
  return new FixedClockPolicy(originalRequest, { status: 200, headers }, options);
}

const restrictedResponses = [
  ['shared Set-Cookie', { 'set-cookie': 'session=user-a', 'cache-control': 'max-age=60' }],
  ['shared proxy-revalidate', { 'cache-control': 'max-age=60, proxy-revalidate' }],
  ['no-cache', { 'cache-control': 'max-age=60, no-cache' }],
  ['no-store', { 'cache-control': 'max-age=60, no-store' }],
  ['shared private response', { 'cache-control': 'max-age=60, private' }],
];

for (const [label, headers] of restrictedResponses) {
  for (const directive of ['max-stale', 'max-stale=600']) {
    test(`${label} cannot be reused with ${directive}, including after serialization`, () => {
      const original = policy(headers);
      assert.equal(original.maxAge(), 0);
      for (const cached of [original, FixedClockPolicy.fromObject(original.toObject())]) {
        const incoming = request(directive);
        assert.equal(cached.satisfiesWithoutRevalidation(incoming), false);
        const result = cached.evaluateRequest(incoming);
        assert.equal(result.response, undefined, 'must not expose cached headers/cookies');
        assert.equal(result.revalidation.synchronous, true);
      }
    });
  }
}

test('an authenticated response without shared-cache opt-in cannot be reused', () => {
  const cached = policy(
    { 'cache-control': 'max-age=60' },
    undefined,
    { ...request(), headers: { authorization: 'Bearer user-a' } },
  );
  assert.equal(cached.storable(), false);
  assert.equal(cached.satisfiesWithoutRevalidation(request('max-stale=600')), false);
});

test('stale-while-revalidate cannot expose a security-restricted response', () => {
  for (const [, headers] of restrictedResponses) {
    const cached = policy({
      ...headers,
      'cache-control': `${headers['cache-control']}, stale-while-revalidate=600`,
    });
    const result = cached.evaluateRequest(request());
    assert.equal(result.response, undefined);
    assert.equal(result.revalidation.synchronous, true);
  }
});

test('ordinary expiry still allows max-stale; zero lifetime alone is not a security restriction', () => {
  const cached = policy({ 'cache-control': 'public, max-age=0' });
  for (const directive of ['max-stale', 'max-stale=600']) {
    assert.equal(cached.satisfiesWithoutRevalidation(request(directive)), true);
  }
});

test('fresh public responses and explicit public Set-Cookie opt-in remain usable', () => {
  for (const headers of [
    { 'cache-control': 'public, max-age=60' },
    { 'cache-control': 'public, max-age=60', 'set-cookie': 'shared=value' },
  ]) {
    const cached = policy(headers);
    assert.equal(cached.satisfiesWithoutRevalidation(request()), true);
    assert.equal(cached.timeToLive(), 60_000);
    const restored = FixedClockPolicy.fromObject(cached.toObject());
    assert.deepEqual(restored.responseHeaders(), cached.responseHeaders());
  }
});

test('single-user cookie and proxy-revalidate responses keep their existing behavior', () => {
  for (const [, headers] of restrictedResponses.slice(0, 2)) {
    assert.equal(policy(headers, { shared: false }).satisfiesWithoutRevalidation(request()), true);
  }
});

test('ordinary stale-while-revalidate remains asynchronous', () => {
  const cached = policy({ 'cache-control': 'public, max-age=0, stale-while-revalidate=600' });
  const result = cached.evaluateRequest(request());
  assert.ok(result.response);
  assert.equal(result.revalidation.synchronous, false);
});
