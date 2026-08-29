import type { APIRoute } from 'astro';
import { STATIC_ROUTES } from '../data/routes.mjs';
import { getAllProducts } from '../utils/products';
import { absoluteUrl } from '../utils/urls';

/**
 * Sitemap of every indexable, canonical URL: the home page, the catalog hub
 * and its category landing pages, the guides, About, the English overview and
 * every product page.
 *
 * Deliberately excluded: 404.html (noindex), sitemap.xml and robots.txt
 * themselves, and the IndexNow key file — none of them are content, and a
 * sitemap that lists non-canonical or non-indexable URLs is treated as a
 * quality signal against the site.
 */
export const GET: APIRoute = () => {
  const routes = [
    ...STATIC_ROUTES,
    ...getAllProducts().map((product) => ({
      path: `products/${product.slug}/`,
      lastmod: undefined as string | undefined,
    })),
  ];

  // URL() percent-encodes every other character XML would choke on, but leaves
  // `&` intact.
  const entries = routes.map((route) => ({
    loc: absoluteUrl(route.path).replace(/&/g, '&amp;'),
    lastmod: route.lastmod,
  }));

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    ({ loc, lastmod }) =>
      `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
