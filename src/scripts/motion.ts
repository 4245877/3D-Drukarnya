/**
 * The site's movement, as progressive enhancement: without this script every
 * element is simply visible and in its place. Only content that is still below
 * the fold gets hidden, so nothing on screen ever flickers.
 *
 * Not applied to ancestors of the catalog's fixed drawer: a transform there
 * would change its containing block (docs/BACKGROUND-DESIGN.md).
 */

import { initDisclosures } from './disclosures';

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
  let scrolled: boolean | undefined;
  const root = document.documentElement;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nativeProgress = CSS.supports('animation-timeline: scroll(root block)');
  let progress: Animation | undefined;
  let range = 0;
  let measureRange = true;
  let previousProgress = -1;
  const update = () => {
    frame = 0;
    const next = window.scrollY > 8;
    if (next !== scrolled) {
      scrolled = next;
      header.classList.toggle('is-scrolled', next);
    }
    if (!progress) return;
    if (measureRange) {
      range = Math.max(0, root.scrollHeight - root.clientHeight);
      measureRange = false;
    }
    const position = range ? Math.max(0, Math.min(1, window.scrollY / range)) : 0;
    if (position !== previousProgress) {
      // Animate only the pseudo-element: no inherited custom property that
      // would invalidate the header's text and links on every scroll frame.
      progress.currentTime = position;
      previousProgress = position;
    }
  };

  const schedule = () => {
    if (frame === 0) frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  if (!nativeProgress) {
    const syncProgress = () => {
      progress?.cancel();
      progress = undefined;
      if (!motionQuery.matches) {
        progress = header.animate([
          { transform: 'scaleX(0)', opacity: 1 },
          { transform: 'scaleX(1)', opacity: 1 },
        ], { duration: 1, fill: 'both', pseudoElement: '::after' });
        progress.pause();
      }
      previousProgress = -1;
      schedule();
    };
    const resize = () => { measureRange = true; schedule(); };
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(resize);
      observer.observe(document.body);
      observer.observe(root);
    }
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pageshow', resize);
    motionQuery.addEventListener('change', syncProgress);
    syncProgress();
  }
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
        // Filtering may already have made this card visible. Do not replay a
        // stale reveal when that card later returns to the viewport.
        if (!element.classList.contains('reveal-pending')) continue;
        element.classList.remove('reveal-pending');
        element.classList.add('reveal-in');
        const finish = (event: AnimationEvent) => {
          if (event.target !== element || event.animationName !== 'fadeUp') return;
          element.classList.remove('reveal-in');
          element.style.removeProperty('--reveal-delay');
          element.removeEventListener('animationend', finish);
        };
        element.addEventListener('animationend', finish);
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

/** A few pixels of depth under the pointer. Mouse only, on the hero or 404. */
function initParallax() {
  const scene = document.querySelector<HTMLElement>('[data-parallax]');
  if (!scene || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const layer = scene.querySelector<HTMLElement>('[data-parallax-layer]');
  if (!layer) return;
  const dx = Number(layer.dataset.parallaxX);
  const dy = Number(layer.dataset.parallaxY);
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let frame = 0;
  let pointer: { x: number; y: number } | undefined;
  let previous = '';

  const apply = () => {
    frame = 0;
    if (motionQuery.matches) {
      layer.style.removeProperty('transform');
      previous = '';
      return;
    }
    // Coalesce high-frequency input before reading layout. Write the transform
    // on its one consumer: inherited variables on the scene used to invalidate
    // every text node and SVG descendant on each pointer frame.
    const box = pointer ? scene.getBoundingClientRect() : undefined;
    const x = box && box.width ? Number(((pointer!.x - box.left) / box.width - 0.5).toFixed(3)) : 0;
    const y = box && box.height ? Number(((pointer!.y - box.top) / box.height - 0.5).toFixed(3)) : 0;
    const transform = `translate3d(${x * dx}px, ${y * dy}px, 0)`;
    if (transform === previous) return;
    previous = transform;
    layer.style.transform = transform;
  };

  scene.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (frame === 0) frame = requestAnimationFrame(apply);
  }, { passive: true });

  scene.addEventListener('pointerleave', () => {
    pointer = undefined;
    if (frame === 0) frame = requestAnimationFrame(apply);
  });
  motionQuery.addEventListener('change', () => {
    pointer = undefined;
    if (frame === 0) frame = requestAnimationFrame(apply);
  });
}

export function initMotion() {
  initHeader();
  initDisclosures();
  // Keep the current animation phase across hidden tabs and the back/forward
  // cache, including CSS/SVG animations managed by individual components.
  const syncVisibility = () => document.documentElement.classList.toggle('motion-suspended', document.hidden);
  document.addEventListener('visibilitychange', syncVisibility);
  window.addEventListener('pageshow', syncVisibility);
  syncVisibility();

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let initialized = false;
  const enhance = () => {
    if (initialized || motionQuery.matches) return;
    initialized = true;
    initReveal();
    initLive();
    initEars();
    initPhotos();
    initParallax();
  };
  motionQuery.addEventListener('change', enhance);
  enhance();
}
