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
      'Вироби виготовляються на замовлення. Звір термін у картці: невеликі кріплення зазвичай потребують 1–3 дні, великі корпуси — більше. Якщо строк ще не визначений, узгодь його з магазином на OLX перед замовленням.',
  },
  {
    question: 'Що входить у комплект?',
    answer:
      'У комплект входять лише надруковані пластикові деталі. Метизи, вставки, електроніка, кабелі, вентилятори та блоки живлення не входять і узгоджуються окремо. Перед замовленням переглянь склад комплекту й матеріал у картці — так буде легше підготувати все для складання.',
  },
  {
    question: 'Яка доставка доступна?',
    answer:
      'У Києві доступний самовивіз у районі Академмістечко. По Україні — OLX Доставка, якщо замовлення відповідає її обмеженням за розміром та умовам відправлення. Спосіб отримання узгодь на OLX.',
  },
  {
    question: 'Чи можна замовити нестандартну деталь?',
    answer:
      'Так. Напиши магазину на OLX і додай модель STL, 3MF або STEP чи опис задачі з розмірами. Почни з того, до якої техніки має підійти деталь. Матеріал, колір, зміни моделі, вартість і термін узгоджуються до друку.',
  },
];
