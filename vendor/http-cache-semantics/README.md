# Local security patch for http-cache-semantics

This is the BSD-2-Clause source from **http-cache-semantics 4.2.0**, with its
original license retained. `4.2.0-patched.1` identifies this local fork; it is
not a published upstream release. It has no dependencies or install scripts.

- Source archive: https://registry.npmjs.org/http-cache-semantics/-/http-cache-semantics-4.2.0.tgz
- Upstream: https://github.com/kornelski/http-cache-semantics
- Advisory: https://github.com/advisories/GHSA-ch52-4w7c-c8xp
- Report and remediation: https://github.com/kornelski/http-cache-semantics/issues/56

As of 2026-10-03, all published upstream versions are affected and Astro
7.3.5 still depends on this package. Downgrading Astro to 2.10.9 would remove
the dependency but introduce unrelated breaking changes. The root npm
`overrides` entry instead makes Astro use this reviewed local source while
keeping the existing Astro version and site behavior.

The only source change is an early guard in `evaluateRequest()`: responses
whose cache lifetime is zeroed for security reasons must require synchronous
revalidation before either `max-stale` or `stale-while-revalidate` is considered.
It covers non-storable responses, `no-cache`, shared `proxy-revalidate`, and
shared `Set-Cookie` without upstream's explicit `public`/`immutable` opt-in.
Ordinary expiry, including `max-age=0`, can still honor `max-stale`.

`npm audit --audit-level=high` remains enabled for registry dependencies.
npm does not audit local file dependencies against registry advisories, so
the actual security behavior of this fork is checked by
`tests/http-cache-semantics.test.mjs`, resolving the package **from Astro**.
The tests also cover restored cache policies and normal cache behavior.

When upstream publishes a verified fix, remove this override and directory,
regenerate the lockfile, and keep the regression tests against Astro's
replacement dependency. Run `npm ci`, `npm audit --audit-level=high`,
`npm run check`, `npm test`, `npm run build`, and `npm run check:build`.
