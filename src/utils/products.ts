export interface Product {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  priceLabel?: string;
  priceNote?: string;
  images: string[];
  category?: string;
  material?: string;
  leadTime?: string;
  variantSummary?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  name: string;
  description: string;
  badge?: string;
}

type ProductModule = {
  default: Product;
};

const productModules = import.meta.glob('../data/products/*.json', {
  eager: true,
}) as Record<string, ProductModule>;

const products = Object.values(productModules)
  .map((module) => module.default)
  .sort((a, b) => a.title.localeCompare(b.title, 'uk-UA'));

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(price: number): string {
  return `${new Intl.NumberFormat('uk-UA').format(price)} ₴`;
}

export function withBase(path: string | undefined): string {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${normalized}`;
}
