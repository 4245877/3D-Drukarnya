// Pure parser for the product `description` field. Plain ESM (.mjs) so the
// same module is used by the Astro page and by the node:test suite — mirrors
// the approach of src/data/product.schema.mjs.
//
// The format is deliberately tiny (this is NOT Markdown):
//   - blocks are separated by blank lines (`\n\n`);
//   - inside a block, consecutive lines starting with `- ` form a bulleted
//     list; any lines before them stay a paragraph (e.g. "Особливості:").
// The output is a list of typed blocks with PLAIN TEXT content; rendering is
// left to the component, which escapes everything by default (no set:html).

/**
 * @typedef {{ type: 'paragraph', text: string }} ParagraphBlock
 * @typedef {{ type: 'list', items: string[] }} ListBlock
 * @typedef {ParagraphBlock | ListBlock} DescriptionBlock
 */

const LIST_ITEM_PATTERN = /^[-–—•]\s+/;

/**
 * Parses a raw description string into paragraph and list blocks.
 *
 * @param {unknown} description
 * @returns {DescriptionBlock[]}
 */
export function parseDescription(description) {
  if (typeof description !== 'string') return [];

  /** @type {DescriptionBlock[]} */
  const blocks = [];

  for (const rawBlock of description.split(/\n{2,}/)) {
    const lines = rawBlock
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) continue;

    /** @type {string[]} */
    let paragraphLines = [];
    /** @type {string[]} */
    let listItems = [];

    const flushParagraph = () => {
      if (paragraphLines.length > 0) {
        blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
        paragraphLines = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        blocks.push({ type: 'list', items: listItems });
        listItems = [];
      }
    };

    for (const line of lines) {
      if (LIST_ITEM_PATTERN.test(line)) {
        flushParagraph();
        listItems.push(line.replace(LIST_ITEM_PATTERN, ''));
      } else {
        // A normal line ends any running list (a new paragraph starts).
        flushList();
        paragraphLines.push(line);
      }
    }

    flushParagraph();
    flushList();
  }

  return blocks;
}
