/** Natural-height transitions for engines without interpolate-size.
 * Native <details> still owns activation, open state, grouping and keyboard
 * behavior. Only its rendered height is animated. Geometry is measured at
 * activation, never in the animation's frames.
 */
export function initDisclosures() {
  if (CSS.supports('interpolate-size: allow-keywords') || !CSS.supports('selector(::details-content)')) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll<HTMLDetailsElement>('details.disclosure').forEach((details) => {
    const summary = details.querySelector<HTMLElement>(':scope > summary');
    if (!summary) return;
    let animation: Animation | undefined;
    let activationHeight: number | undefined;
    let wasOpen = details.open;

    // Capture before the native activation hides the content. This also lets a
    // second activation reverse an in-flight transition at its current height.
    summary.addEventListener('click', () => {
      activationHeight = details.getBoundingClientRect().height;
    });
    const reset = () => {
      animation?.cancel();
      animation = undefined;
      details.classList.remove('disclosure-sizing');
    };
    details.addEventListener('toggle', () => {
      if (details.open === wasOpen) {
        activationHeight = undefined;
        if (!animation) reset();
        return;
      }
      wasOpen = details.open;
      if (motion.matches) { reset(); activationHeight = undefined; return; }
      const interruptedHeight = animation ? details.getBoundingClientRect().height : undefined;
      reset();
      // Keep the original content visible during native closing, matching the
      // content-visibility transition used by Blink. No wrapper alters margins.
      details.classList.add('disclosure-sizing');
      const style = getComputedStyle(details);
      const expandedHeight = details.getBoundingClientRect().height;
      const closedHeight = summary.getBoundingClientRect().height +
        ['padding-top', 'padding-bottom', 'border-top-width', 'border-bottom-width']
          .reduce((sum, property) => sum + parseFloat(style.getPropertyValue(property)), 0);
      const targetHeight = details.open ? expandedHeight : closedHeight;
      const startHeight = activationHeight ?? interruptedHeight ?? (details.open ? closedHeight : expandedHeight);
      activationHeight = undefined;
      // Production CSS can normalize 280ms to .28s. WAAPI expects milliseconds.
      const time = style.getPropertyValue('--dur-normal').trim();
      const duration = parseFloat(time) * (time.endsWith('ms') ? 1 : 1000) || 280;
      animation = details.animate([
        { height: `${startHeight}px` }, { height: `${targetHeight}px` },
      ], { duration, easing: style.getPropertyValue('--ease-out').trim(), fill: 'both' });
      animation.addEventListener('finish', () => {
        reset();
      }, { once: true });
    });
    motion.addEventListener('change', () => { if (motion.matches) reset(); });
  });
}
