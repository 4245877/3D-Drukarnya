import { defineConfig } from 'astro/config';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default defineConfig({
  site: 'https://4245877.github.io',
  base: '/3D-Drukarnya',
  trailingSlash: 'always',
  vite: {
    cacheDir: '.vite-cache',
    resolve: {
      alias: {
        'astro/entrypoints/prerender': require.resolve('astro/entrypoints/prerender'),
        'astro/entrypoints/legacy': require.resolve('astro/entrypoints/legacy'),
      },
    },
  },
});
