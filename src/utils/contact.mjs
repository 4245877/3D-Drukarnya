import { TELEGRAM_URL } from '../data/site.config.mjs';

/** Opens the seller's chat, with an optional editable draft (never auto-sent). */
export function telegramChatUrl(message = '') {
  const url = new URL(TELEGRAM_URL);
  if (message.trim()) url.searchParams.set('text', message);
  return url.toString();
}

/** Use the canonical product URL so a copied request also works off-site. */
export function productInquiry({ title, sku, url }) {
  return `Вітаю! Цікавить ${title} (артикул ${sku}).\n${url}\nХочу уточнити виконання, кількість, колір і термін виготовлення.`;
}
