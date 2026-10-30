import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { TELEGRAM_URL, TELEGRAM_WEB_URL, VIBER_PHONE, VIBER_URL } from '../src/data/site.config.mjs';
import { productInquiry, telegramChatUrl } from '../src/utils/contact.mjs';

test('messenger URLs address the seller and preserve Unicode drafts and special characters', () => {
  assert.equal(telegramChatUrl(), TELEGRAM_URL);
  assert.equal(telegramChatUrl('   '), TELEGRAM_URL);
  const message = productInquiry({ title: 'Кріплення 10″ & NAS + SSD', sku: 'P42', url: 'https://example.com/product/?a=1&b=2' });
  const url = new URL(telegramChatUrl(message));
  assert.equal(url.origin + url.pathname, TELEGRAM_URL);
  assert.equal(url.searchParams.get('text'), message);
  assert.match(message, /артикул P42/);
  assert.match(message, /https:\/\/example.com\/product\/\?a=1&b=2/);
  assert.equal(url.searchParams.has('profile'), false, 'link must request a chat, not a profile');
  assert.equal(url.pathname.includes('share'), false, 'must not open a recipient picker');
  const viber = new URL(VIBER_URL);
  assert.equal(viber.protocol, 'viber:');
  assert.equal(viber.hostname, 'chat');
  assert.equal(viber.searchParams.get('number'), VIBER_PHONE);
  assert.equal(VIBER_URL, 'viber://chat?number=%2B380989073072');
  assert.equal(TELEGRAM_WEB_URL, 'https://web.telegram.org/k/#@M4245877');
});

const source = await readFile(new URL('../src/scripts/contacts.ts', import.meta.url), 'utf8');
const runtime = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

// Exercise event behavior without an installed messenger, browser or clipboard.
function setup(clipboard = { writeText: async () => {} }) {
  const events = new Map();
  let activeElement = null;
  const element = (props = {}) => ({
    hidden: true,
    textContent: '',
    selected: false,
    dataset: {},
    handlers: {},
    addEventListener(name, handler) { this.handlers[name] = handler; },
    focus() { activeElement = this; },
    select() { this.selected = true; },
    ...props,
  });
  const link = element();
  const close = element();
  const status = element();
  const manual = element();
  const support = element({
    querySelector: () => close,
    contains: (candidate) => [support, close, manual].includes(candidate),
  });
  const group = { querySelector: (selector) => selector === '[data-contact-status]' ? status : manual };
  const button = element({ dataset: { contactCopy: 'Запит P42 +380989073072' }, closest: () => group });
  const document = {
    get activeElement() { return activeElement; },
    querySelector: () => support,
    querySelectorAll: (selector) => selector === '[data-viber-link]' ? [link] : [button],
    addEventListener: (name, handler) => events.set(name, handler),
  };
  const exports = {};
  runInNewContext(runtime, { document, navigator: { clipboard }, exports });
  exports.initContacts();
  return { link, support, close, button, status, manual, events, get activeElement() { return activeElement; } };
}

test('Viber opens its native URI immediately and exposes dismissible help', () => {
  const ui = setup();
  ui.link.handlers.click({ detail: 1, preventDefault() { assert.fail('native navigation was cancelled'); } });
  assert.equal(ui.support.hidden, false);
  ui.close.focus();
  ui.close.handlers.click();
  assert.equal(ui.support.hidden, true);
  ui.link.handlers.click({ detail: 0 });
  assert.equal(ui.support.hidden, false);
  ui.events.get('keydown')({ key: 'Escape' });
  assert.equal(ui.support.hidden, true);
  ui.link.handlers.click({ detail: 1, pointerType: '' });
  assert.equal(ui.activeElement, ui.support, 'Gecko keyboard activation moves focus into help');
  ui.events.get('keydown')({ key: 'Escape' });
  assert.equal(ui.support.hidden, true);
  ui.link.handlers.click({ ctrlKey: true });
  assert.equal(ui.support.hidden, true, 'modified clicks must keep browser behavior');
});

test('copy succeeds without sending a message', async () => {
  let copied;
  const ui = setup({ writeText: async (text) => { copied = text; } });
  assert.equal(ui.button.hidden, false);
  await ui.button.handlers.click();
  assert.equal(copied, ui.button.dataset.contactCopy);
  assert.equal(ui.manual.hidden, true);
  assert.match(ui.status.textContent, /Скопійовано/);
});

test('denied or unavailable clipboard exposes selected text for manual copying', async () => {
  for (const clipboard of [undefined, { writeText: async () => { throw new Error('Denied'); } }]) {
    const ui = setup(clipboard === undefined ? null : clipboard);
    await ui.button.handlers.click();
    assert.equal(ui.manual.hidden, false);
    assert.equal(ui.manual.selected, true);
    assert.match(ui.status.textContent, /вручну/);
  }
});
