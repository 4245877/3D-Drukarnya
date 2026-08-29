import { defineConfig } from 'astro/config';

// Host and subpath live in one place (src/data/site.config.mjs) so that the
// Astro build, the page templates, the standalone Node scripts and the tests
// can never drift apart — and so moving to a custom domain is a two-line edit.
import { BASE_PATH, SITE_ORIGIN } from './src/data/site.config.mjs';

export default defineConfig({
  site: SITE_ORIGIN,
  base: BASE_PATH,
  trailingSlash: 'always',
  build: {
    // Keep component styles in external .css files instead of inlining them
    // as <style> tags, so the pages stay compatible with a strict CSP
    // (style-src without 'unsafe-inline'). See README, "HTTP headers".
    inlineStylesheets: 'never',
  },
  vite: {
    cacheDir: '.vite-cache',
    build: {
      // Same reasoning for scripts/assets: never inline them into the HTML.
      assetsInlineLimit: 0,
    },
  },
});
