/**
 * The site's movement, as progressive enhancement: without this script every
 * element is simply visible and in its place. Only content that is still below
 * the fold gets hidden, so nothing on screen ever flickers.
 *
 * Not applied to ancestors of the catalog's fixed drawer: a transform there
 * would change its containing block (docs/BACKGROUND-DESIGN.md).
 */

const REVEAL_SELECTOR = [
  '.catalog-grid__item',
  '.sla-preview__inner',
  '.catalog-order__intro',
  '.catalog-order__details',
  '.content-section > *',
  '.content-card',
  '.product-section',
  '.product-specs',
  '.product-recap',
  '.sla-section-head',
  '.sla-explainer',
  '.sla-use-card',
  '.sla-tech-card',
  '.sla-help',
  '.sla-steps > li',
  '.sla-order',
  '.sla-faq__inner',
].join(',');

/** Marks the header once the page has moved. */
function initHeader() {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header) return;

  let frame = 0;
  const update = () => {
    frame = 0;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  window.addEventListener('scroll', () => {
    if (frame === 0) frame = requestAnimationFrame(update);
  }, { passive: true });
  update();
}

/** Lets content below the fold ease in the first time it scrolls into view. */
function initReveal() {
  if (!('IntersectionObserver' in window)) return;

  const fold = window.innerHeight * 0.95;
  const pending = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)).filter(
    (element) => element.getBoundingClientRect().top > fold,
  );

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        element.classList.remove('reveal-pending');
        element.classList.add('reveal-in');
        element.addEventListener('animationend', () => {
          element.classList.remove('reveal-in');
          element.style.removeProperty('--reveal-delay');
        }, { once: true });
      }
    },
    { rootMargin: '0px 0px -6% 0px' },
  );

  pending.forEach((element, index) => {
    // A short stagger across a row; long lists never build up a delay.
    element.style.setProperty('--reveal-delay', `${(index % 4) * 60}ms`);
    element.classList.add('reveal-pending');
    observer.observe(element);
  });
}

/** Ambient loops run only while their section is actually on screen. */
function initLive() {
  const scenes = document.querySelectorAll<HTMLElement>('[data-live]');
  if (scenes.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    scenes.forEach((scene) => scene.classList.add('is-live'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle('is-live', entry.isIntersecting);
    }
  }, { threshold: 0.05 });

  scenes.forEach((scene) => observer.observe(scene));
}

/** The ears rise above the footer as it comes into view. */
function initEars() {
  const ears = document.querySelectorAll<HTMLElement>('[data-ears-rise]');
  if (ears.length === 0 || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle('is-tucked', !entry.isIntersecting);
    }
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

  ears.forEach((element) => {
    if (element.getBoundingClientRect().top > window.innerHeight) element.classList.add('is-tucked');
    observer.observe(element);
  });
}

/** Catalog photos ease in as they arrive instead of popping into their frame. */
function initPhotos() {
  document.querySelectorAll<HTMLImageElement>('.product-card__image').forEach((image) => {
    if (image.complete) return;

    const done = () => {
      image.style.removeProperty('opacity');
    };

    image.style.opacity = '0';
    image.addEventListener('load', done, { once: true });
    image.addEventListener('error', done, { once: true });
  });
}

/** A few pixels of depth under the pointer. Mouse only, on the hero. */
function initParallax() {
  const scene = document.querySelector<HTMLElement>('[data-parallax]');
  if (!scene || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let frame = 0;
  let x = 0;
  let y = 0;

  const apply = () => {
    frame = 0;
    scene.style.setProperty('--px', x.toFixed(3));
    scene.style.setProperty('--py', y.toFixed(3));
  };

  scene.addEventListener('pointermove', (event) => {
    const box = scene.getBoundingClientRect();
    x = (event.clientX - box.left) / box.width - 0.5;
    y = (event.clientY - box.top) / box.height - 0.5;
    if (frame === 0) frame = requestAnimationFrame(apply);
  }, { passive: true });

  scene.addEventListener('pointerleave', () => {
    x = 0;
    y = 0;
    if (frame === 0) frame = requestAnimationFrame(apply);
  });
}

export function initMotion() {
  initHeader();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  initReveal();
  initLive();
  initEars();
  initPhotos();
  initParallax();
}
