/** The existing filter wave, scheduled only for cards that can be painted. */
export function createCatalogEntrance(items: HTMLElement[], motionQuery: MediaQueryList) {
  let observer: IntersectionObserver | undefined;
  let expiry = 0;
  let generation = 0;

  const clean = (item: HTMLElement) => {
    item.classList.remove('is-entering');
    item.style.removeProperty('--enter-delay');
  };
  for (const item of items) {
    item.addEventListener('animationend', (event) => {
      if (event.target === item && event.animationName === 'catalogCardIn') clean(item);
    });
  }

  return () => {
    const currentGeneration = ++generation;
    observer?.disconnect();
    window.clearTimeout(expiry);
    for (const item of items) {
      clean(item);
      item.classList.remove('reveal-pending', 'reveal-in');
      item.style.removeProperty('--reveal-delay');
    }
    if (motionQuery.matches) return;

    const start = performance.now();
    const delays = new Map<HTMLElement, number>();
    let index = 0;
    for (const item of items) {
      if (!item.hidden) delays.set(item, Math.min(index++, 11) * 34);
    }
    const enter = (item: HTMLElement) => {
      const elapsed = performance.now() - start;
      const delay = delays.get(item)!;
      if (generation !== currentGeneration || item.hidden || motionQuery.matches || elapsed >= delay + 340) return;
      // A negative delay joins the original wave at its current phase, so a
      // fast scroll sees precisely the same timing as a card already on screen.
      item.style.setProperty('--enter-delay', `${delay - elapsed}ms`);
      item.classList.add('is-entering');
    };

    if (!('IntersectionObserver' in window)) {
      // Progressive fallback: let removal of the old classes reach a render
      // before restarting. No synchronous layout is forced on the whole page.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (performance.now() - start < 714) delays.forEach((_, item) => enter(item));
      }));
      return;
    }
    observer = new IntersectionObserver((entries, current) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const item = entry.target as HTMLElement;
        enter(item);
        current.unobserve(item);
      }
    }, { rootMargin: '100px 0px' });
    delays.forEach((_, item) => observer!.observe(item));
    // The last stagger finishes after 714ms. Cards that stayed off screen have
    // no remaining motion to play and need neither a layer nor an observer.
    expiry = window.setTimeout(() => observer?.disconnect(), 714);
  };
}
