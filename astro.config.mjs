import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://4245877.github.io',
  base: '/3D-Drukarnya',
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
