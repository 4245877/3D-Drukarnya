// Single source of truth for the homepage FAQ. The visible FAQ section and
// the FAQPage JSON-LD are BOTH generated from this array, so the questions,
// answers and their order always match and nothing hidden goes into the
// structured data.
//
// Only purchase details belong on the compact homepage. Selection advice
// lives on product/category pages and in guides; prices are on product pages.

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Які строки виготовлення?',
    answer:
      'Усі товари друкуються на замовлення. Термін виготовлення вказаний на сторінці товару; для невеликих кріплень це зазвичай 1–3 дні, для великих корпусів — довше.',
  },
  {
    question: 'Що входить у комплект?',
    answer:
      'Лише надруковані пластикові деталі. Метизи, вставки, електроніка, кабелі, вентилятори та блоки живлення не входять у комплект і узгоджуються окремо. Склад комплекту та матеріал зазначені на сторінці товару.',
  },
  {
    question: 'Яка доставка доступна?',
    answer:
      'У Києві можливий самовивіз із району Академмістечко. По Україні відправлення здійснюється через OLX Доставку, якщо замовлення підходить за розміром і умовами відправлення.',
  },
  {
    question: 'Чи можна замовити нестандартну деталь?',
    answer:
      'Так. Надішліть через OLX модель у форматі STL, 3MF або STEP чи опис задачі з розмірами. Матеріал, колір, зміни моделі, вартість і термін узгоджуються перед друком.',
  },
];
