/* =========================================================================
   Tanaw — motion & spatial effects (progressive enhancement)

   Every effect here is optional decoration on top of a complete, static page:
   - nothing runs when the visitor prefers reduced motion (Settings → Motion);
   - pointer effects run only for precise pointers (mouse, trackpad, pen);
   - content never depends on an effect having run.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const fx = {};

  const finePointer = () => !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const motionOK = () => !U.reducedMotion();

  /** Fade/slide in [data-reveal] elements as they enter the viewport. */
  fx.reveal = (root, signal) => {
    const items = U.$$('[data-reveal]', root);
    if (!items.length) return;
    if (!motionOK() || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => {
      el.classList.add('is-pending');
      io.observe(el);
    });
    // Safety net: whatever has not been revealed after a while is shown anyway.
    const fallback = setTimeout(() => items.forEach((el) => el.classList.add('is-visible')), 4000);
    if (signal) signal.addEventListener('abort', () => { io.disconnect(); clearTimeout(fallback); }, { once: true });
  };

  /**
   * Run cb once, after el has stayed visible for `dwell` ms (used to mark exhibits,
   * scenes and history stops as explored). The dwell keeps credit honest: content
   * must actually be looked at, not merely loaded.
   */
  fx.onceVisible = (el, cb, signal, threshold = 0.6, dwell = 1200) => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    let timer = null;
    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      if (visible && !timer) {
        timer = setTimeout(() => { io.disconnect(); cb(); }, dwell);
      } else if (!visible && timer) {
        clearTimeout(timer);
        timer = null;
      }
    }, { threshold });
    io.observe(el);
    if (signal) signal.addEventListener('abort', () => { io.disconnect(); clearTimeout(timer); }, { once: true });
  };

  /** Add .is-offscreen while el is out of view, so CSS can pause its animations. */
  fx.pauseOffscreen = (el, signal) => {
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => el.classList.toggle('is-offscreen', !e.isIntersecting));
    });
    io.observe(el);
    if (signal) signal.addEventListener('abort', () => io.disconnect(), { once: true });
  };

  /** Gentle 3D tilt and a light spot that follows the pointer, for [data-tilt] cards. */
  fx.tilt = (root, signal) => {
    if (!finePointer()) return;
    const MAX = 5; // degrees
    let active = null;
    const move = U.rafThrottle((card, x, y) => {
      const r = card.getBoundingClientRect();
      const px = (x - r.left) / r.width;
      const py = (y - r.top) / r.height;
      card.style.setProperty('--mx', `${Math.round(px * 100)}%`);
      card.style.setProperty('--my', `${Math.round(py * 100)}%`);
      card.style.setProperty('--ry', `${((px - 0.5) * 2 * MAX).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${((0.5 - py) * 2 * MAX).toFixed(2)}deg`);
    });
    const reset = (card) => {
      card.style.removeProperty('--rx');
      card.style.removeProperty('--ry');
      card.classList.remove('is-tilting');
    };
    root.addEventListener('pointermove', (e) => {
      // Checked on every move, so switching motion off in Settings applies at once.
      if (!motionOK()) { if (active) reset(active); active = null; return; }
      const card = e.target instanceof Element ? e.target.closest('[data-tilt]') : null;
      if (active && active !== card) reset(active);
      active = card;
      if (!card) return;
      card.classList.add('is-tilting');
      move(card, e.clientX, e.clientY);
    }, { signal, passive: true });
    root.addEventListener('pointerleave', () => { if (active) reset(active); active = null; }, { signal, passive: true });
  };

  /**
   * Point an eye (svg with .eye__look group) toward a screen position.
   * dx/dy are normalised -1..1; the look group shifts up to `range` user units.
   */
  fx.look = (svg, dx, dy, range = 9) => {
    if (!svg) return;
    const g = svg.querySelector('.eye__look');
    if (!g) return;
    const x = U.clamp(dx, -1, 1) * range;
    const y = U.clamp(dy, -1, 1) * range * 0.55;
    // A CSS transform (not the SVG attribute) so the movement eases via CSS transition.
    g.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
  };

  /** Inline SVG for Tanaw's eye (decorative); `cls` styles it and keeps clip ids unique. */
  fx.eyeSVG = (cls = 'seam-eye') => `
    <svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle class="eye__halo" cx="60" cy="60" r="57"/>
      <g class="eye__lid">
        <path class="eye__white" d="M10 60c12.8-19.6 29.4-29.4 50-29.4S97.2 40.4 110 60c-12.8 19.6-29.4 29.4-50 29.4S22.8 79.6 10 60z"/>
        <clipPath id="${cls}-clip"><path d="M10 60c12.8-19.6 29.4-29.4 50-29.4S97.2 40.4 110 60c-12.8 19.6-29.4 29.4-50 29.4S22.8 79.6 10 60z"/></clipPath>
        <g clip-path="url(#${cls}-clip)">
          <g class="eye__look">
            <circle class="eye__iris" cx="60" cy="60" r="19"/>
            <circle class="eye__pupil" cx="60" cy="60" r="8.2"/>
            <circle class="eye__glint" cx="65.5" cy="54.5" r="3.2"/>
          </g>
        </g>
        <path class="eye__line" d="M10 60c12.8-19.6 29.4-29.4 50-29.4S97.2 40.4 110 60c-12.8 19.6-29.4 29.4-50 29.4S22.8 79.6 10 60z"/>
      </g>
    </svg>`;

  T.fx = fx;
})();
