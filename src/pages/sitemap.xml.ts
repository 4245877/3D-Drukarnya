import type { APIRoute } from 'astro';
import { getAllProducts } from '../utils/products';

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://4245877.github.io');
  const basePath = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const baseUrl = new URL(basePath, origin);

  const paths = ['', ...getAllProducts().map((product) => `products/${product.slug}/`)];

  // URL() percent-encodes every other character XML would choke on, but leaves
  // `&` intact.
  const locations = paths.map((path) =>
    new URL(path, baseUrl).toString().replace(/&/g, '&amp;'),
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locations.map((loc) => `  <url>\n    <loc>${loc}</loc>\n  </url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
