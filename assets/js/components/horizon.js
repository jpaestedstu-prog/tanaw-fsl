/* =========================================================================
   Tanaw — the horizon's behaviour (the split-screen landing)

   "Tanaw" means to look toward, so looking toward a world opens it. One small
   loop moves the seam and the light, and CSS draws everything else from a few
   custom properties on the split:
     --seam   where the worlds meet, 0–1 of the width (a wipe made of transforms,
              so moving it never re-wraps text or repaints the scenes)
     --lean   how far the seam has leaned, in multiples of --amp
     --px/py  the pointer, -0.5–0.5, for depth
     --lx/ly  the sun behind the capiz window, in pixels

   Everything here is optional: the page is complete and usable without it.
   Pointer effects need a precise pointer; none of the movement runs when the
   visitor prefers reduced motion; dragging always has the Enter links as its
   single-pointer and keyboard alternative.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const C = (T.components = T.components || {});

  const INTRO_KEY = 'tanaw.intro';
  const ENTER_MS = 460;
  const mq = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
  const sideBySide = () => mq('(min-width: 860px)');
  const finePointer = () => mq('(hover: hover) and (pointer: fine)');
  const motionOK = () => !U.reducedMotion();
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);

  C.horizon = (root, signal) => {
    const split = root.querySelector('[data-split]');
    if (!split) return;
    const grip = split.querySelector('[data-seam-grip]');
    const eye = split.querySelector('.seam-eye');
    const art = split.querySelector('.realm__gathering');
    const worldLinks = U.$$('[data-world-link]');
    const s = {
      seam: 0.5, target: 0.5, px: 0, py: 0, tpx: 0, tpy: 0, lx: null, ly: null, tlx: null, tly: null,
      frame: 0, last: 0, dragging: false, entering: false, side: null, turn: -1, held: false,
    };

    const amp = () => parseFloat(getComputedStyle(split).getPropertyValue('--amp')) || 0.08;
    let AMP = amp();

    function write() {
      const st = split.style;
      st.setProperty('--seam', s.seam.toFixed(4));
      st.setProperty('--lean', ((s.seam - 0.5) / AMP).toFixed(3));
      st.setProperty('--px', s.px.toFixed(3));
      st.setProperty('--py', s.py.toFixed(3));
      if (s.lx !== null) {
        st.setProperty('--lx', `${s.lx.toFixed(1)}px`);
        st.setProperty('--ly', `${s.ly.toFixed(1)}px`);
      }
    }

    /* The one loop: runs only while something is still moving. */
    function tick(now) {
      s.frame = 0;
      if (signal.aborted) return;
      const dt = Math.min(48, now - (s.last || now - 16));
      s.last = now;
      // The same feel at any refresh rate.
      const follow = (k) => 1 - (1 - k) ** (dt / 16.67);
      if (!s.entering) s.seam += (s.target - s.seam) * (s.dragging ? follow(0.55) : follow(0.11));
      s.px += (s.tpx - s.px) * follow(0.1);
      s.py += (s.tpy - s.py) * follow(0.1);
      if (s.tlx !== null) {
        if (s.lx === null) { s.lx = s.tlx; s.ly = s.tly; }
        s.lx += (s.tlx - s.lx) * follow(0.09);
        s.ly += (s.tly - s.ly) * follow(0.09);
      }
      write();
      const moving = Math.abs(s.target - s.seam) > 0.0004 || Math.abs(s.tpx - s.px) > 0.001 || Math.abs(s.tpy - s.py) > 0.001
        || (s.tlx !== null && (Math.abs(s.tlx - s.lx) > 0.4 || Math.abs(s.tly - s.ly) > 0.4));
      if (moving) kick();
      else s.last = 0;
    }
    function kick() { if (!s.frame && !signal.aborted) s.frame = requestAnimationFrame(tick); }

    function look(dx, dy) { T.fx.look(eye, dx, dy); }

    function blink() {
      if (!motionOK() || !eye) return;
      eye.classList.remove('is-blinking');
      // Reading a layout value restarts the animation when the class comes back.
      eye.getBoundingClientRect();
      eye.classList.add('is-blinking');
    }

    function markSide(side) {
      if (s.side === side) return;
      const crossed = s.side && side;
      s.side = side;
      if (side) split.dataset.lean = side; else delete split.dataset.lean;
      worldLinks.forEach((a) => a.classList.toggle('is-looked', a.dataset.worldLink === side));
      if (crossed) blink();
    }

    /* Lean toward a world (keyboard focus, the header's world links). */
    function leanTo(side) {
      markSide(side);
      if (!motionOK()) return;
      look(side === 'learn' ? -0.9 : side === 'community' ? 0.9 : 0, 0);
      if (!sideBySide()) return;
      AMP = amp();
      s.target = side === 'learn' ? 0.5 + AMP : side === 'community' ? 0.5 - AMP : 0.5;
      kick();
    }

    /* Whoever signs has everyone's sightlines: the person nearest the pointer takes the turn. */
    function setTurn(i) {
      if (s.turn === i || !art) return;
      s.turn = i;
      art.classList.toggle('has-turn', i >= 0);
      U.$$('.g-lines', art).forEach((g, k) => g.classList.toggle('is-turn', k === i));
      U.$$('.g-person', art).forEach((g, k) => g.classList.toggle('is-turn', k === i));
    }
    function turnFrom(x, y) {
      if (!art) return;
      const r = art.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) > r.width * 0.78) { setTurn(-1); return; }
      const N = U.$$('.g-person', art).length || 7;
      const angle = Math.atan2(dy, dx) + Math.PI / 2; // 0 at the top, where person 0 sits
      setTurn((Math.round((angle / (2 * Math.PI)) * N) + N) % N);
    }

    /* ---------- Pointer: the world you look toward opens ---------- */
    const onMove = U.rafThrottle((x, y, target) => {
      const r = split.getBoundingClientRect();
      if (!r.width) return;
      const nx = U.clamp((x - r.left) / r.width - 0.5, -0.5, 0.5);
      const ny = U.clamp((y - r.top) / r.height - 0.5, -0.5, 0.5);
      s.tpx = nx;
      s.tpy = ny;
      s.tlx = x - r.left;
      s.tly = y - r.top;
      markSide(x - r.left < s.seam * r.width ? 'learn' : 'community');
      // Beads and the eye stay under the pointer: the seam holds still while you are on them.
      s.held = !!(target && target.closest && target.closest('.bead, [data-seam-grip]'));
      if (!s.held && !s.dragging && !s.entering) {
        // Near the middle the seam rests, so the beads and the eye are easy to reach.
        const t = nx * 2;
        const open = Math.max(0, (Math.abs(t) - 0.26) / 0.74);
        AMP = amp();
        s.target = 0.5 - AMP * Math.sign(t) * open ** 0.8;
      }
      const cy = r.height / 2;
      look(((x - r.left) - s.seam * r.width) / (r.width / 2), ((y - r.top) - cy) / cy);
      if (s.side === 'community') turnFrom(x, y); else setTurn(-1);
      kick();
    });

    function rest() {
      if (s.dragging || s.entering) return;
      onMove.cancel();
      s.target = 0.5;
      s.tpx = 0;
      s.tpy = 0;
      s.tlx = null;
      s.tly = null;
      s.lx = null;
      s.ly = null;
      split.style.removeProperty('--lx');
      split.style.removeProperty('--ly');
      markSide(null);
      setTurn(-1);
      look(0, 0);
      kick();
    }

    /* ---------- Dragging the eye: pull the horizon, or pull it all the way to enter ---------- */
    function startDrag(e) {
      if (!sideBySide() || !motionOK() || e.button > 0) return;
      e.preventDefault();
      grip.setPointerCapture(e.pointerId);
      s.dragging = true;
      split.classList.add('is-dragging');
      kick();
    }
    function moveDrag(e) {
      if (!s.dragging) return;
      const r = split.getBoundingClientRect();
      s.target = U.clamp((e.clientX - r.left) / r.width, 0.04, 0.96);
      look(s.target > 0.5 ? -0.9 : 0.9, 0);
      kick();
    }
    function endDrag(e, cancelled) {
      if (!s.dragging) return;
      s.dragging = false;
      split.classList.remove('is-dragging');
      if (grip.hasPointerCapture && grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId);
      if (!cancelled && s.target >= 0.82) { enter('learn', '#/learn'); return; }
      if (!cancelled && s.target <= 0.18) { enter('community', '#/community'); return; }
      s.target = 0.5;
      kick();
    }

    /* ---------- Entering: the chosen world opens across the screen, then its page arrives ---------- */
    function enter(world, href) {
      s.entering = true;
      split.dataset.entering = world;
      markSide(world);
      look(world === 'learn' ? -1 : 1, 0);
      const from = s.seam;
      const to = world === 'learn' ? 1 : 0;
      const begin = performance.now();
      const step = (now) => {
        if (signal.aborted) return;
        const t = U.clamp((now - begin) / ENTER_MS, 0, 1);
        s.seam = from + (to - from) * easeInOut(t);
        write();
        if (t < 1) { requestAnimationFrame(step); return; }
        T.router.nextTransition('enter');
        window.location.hash = href;
      };
      requestAnimationFrame(step);
    }

    split.addEventListener('click', (e) => {
      if (!(e.target instanceof Element)) return;
      if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      let a = e.target.closest('a');
      // With a mouse on a wide screen, a click anywhere in a world enters it, unless it ends a text selection.
      // Phones keep to the links, so a tap while reading goes nowhere.
      if (!a && sideBySide() && finePointer() && !String(window.getSelection())) {
        const realm = e.target.closest('[data-realm]');
        if (realm && !e.target.closest('p, h2')) a = realm.querySelector('a.realm__cta');
        if (a && !motionOK()) { window.location.hash = a.getAttribute('href'); return; }
      }
      if (!a || !a.dataset.enter) return;
      if (s.entering) { e.preventDefault(); return; }
      if (!sideBySide() || !motionOK() || document.visibilityState !== 'visible') return;
      e.preventDefault();
      enter(a.dataset.enter, a.getAttribute('href'));
    }, { signal });

    /* ---------- Keyboard and touch ---------- */
    split.addEventListener('focusin', (e) => {
      const realm = e.target.closest('[data-realm]');
      if (realm) { leanTo(realm.dataset.realm); return; }
      const bead = e.target.closest('.bead');
      if (bead) {
        leanTo(null);
        const item = bead.parentElement;
        if (motionOK()) look(0, (parseFloat(item.style.getPropertyValue('--y')) - 50) / 50);
      }
    }, { signal });
    split.addEventListener('focusout', (e) => {
      if (!split.contains(e.relatedTarget)) leanTo(null);
    }, { signal });

    // Cards on the seam appear on hover and focus, and Escape dismisses them (WCAG 1.4.13).
    split.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && e.target.closest('.bead')) split.classList.add('is-card-dismissed');
    }, { signal });
    const undismiss = () => split.classList.remove('is-card-dismissed');
    split.addEventListener('focusin', undismiss, { signal });
    split.addEventListener('pointerover', undismiss, { signal, passive: true });

    /* The header's world switcher leans the same worlds: both controls are one idea. */
    worldLinks.forEach((a) => {
      a.addEventListener('pointerenter', () => { if (finePointer()) leanTo(a.dataset.worldLink); }, { signal });
      a.addEventListener('pointerleave', () => { if (finePointer()) leanTo(null); }, { signal });
    });
    signal.addEventListener('abort', () => {
      worldLinks.forEach((a) => a.classList.remove('is-looked'));
      if (s.frame) cancelAnimationFrame(s.frame);
    }, { once: true });

    if (finePointer()) {
      split.addEventListener('pointermove', (e) => {
        if (!motionOK()) { if (s.side) rest(); return; }
        if (e.pointerType === 'touch') return;
        onMove(e.clientX, e.clientY, e.target);
      }, { signal, passive: true });
      split.addEventListener('pointerleave', rest, { signal, passive: true });
    }

    if (grip) {
      grip.addEventListener('pointerdown', startDrag, { signal });
      grip.addEventListener('pointermove', moveDrag, { signal });
      grip.addEventListener('pointerup', (e) => endDrag(e, false), { signal });
      grip.addEventListener('pointercancel', (e) => endDrag(e, true), { signal });
    }

    /* Phones: the worlds are stacked, so the eye looks down the page as you scroll. */
    const onScroll = U.rafThrottle(() => {
      if (sideBySide() || !motionOK()) return;
      const r = split.getBoundingClientRect();
      if (r.bottom < 0) return;
      look(0, U.clamp((-r.top / Math.max(1, r.height)) * 3 - 0.5, -1, 1));
    });
    window.addEventListener('scroll', onScroll, { signal, passive: true });

    /* Side by side, the worlds have a set height and their words sit inside it. With a large text
       size or a short window the words may need more, so the worlds grow rather than cut them off. */
    const copies = U.$$('.realm__copy', split);
    const orbs = split.querySelector('.realm__orbs');
    const fit = () => {
      split.classList.remove('is-tight', 'is-crowded');
      if (!sideBySide()) { split.style.removeProperty('--need'); return; }
      const grow = () => {
        const tallest = Math.max(...copies.map((c) => c.offsetHeight));
        const gap = parseFloat(getComputedStyle(copies[0].parentElement).paddingBottom) || 0;
        split.style.setProperty('--need', `${Math.ceil(tallest + gap + 24)}px`);
      };
      const wordsAt = () => Math.min(...copies.map((c) => c.getBoundingClientRect().top)) - split.getBoundingClientRect().top;
      grow();
      // When the words reach up into the scene, the decoration makes way for them, never the reverse.
      if (wordsAt() >= split.offsetHeight * 0.32 && !(orbs && getComputedStyle(orbs).display === 'none')) return;
      split.classList.add('is-tight');
      grow();
      if (wordsAt() < split.offsetHeight * 0.29) split.classList.add('is-crowded');
    };
    fit();
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(fit);
      copies.forEach((c) => ro.observe(c));
      signal.addEventListener('abort', () => ro.disconnect(), { once: true });
    }

    // Crossing a breakpoint, or switching motion off, starts from a clean middle.
    const center = () => {
      s.seam = 0.5;
      s.target = 0.5;
      s.tpx = 0;
      s.tpy = 0;
      s.px = 0;
      s.py = 0;
      write();
      look(0, 0);
    };
    if (window.matchMedia) window.matchMedia('(min-width: 860px)').addEventListener('change', center, { signal });
    T.bus.on('settings:applied', () => { if (!motionOK() && (s.seam !== 0.5 || s.px || s.py)) center(); }, signal);

    /* ---------- First view of a visit: the eye opens, the two worlds part ---------- */
    let seen = true;
    try { seen = !!window.sessionStorage.getItem(INTRO_KEY); window.sessionStorage.setItem(INTRO_KEY, '1'); } catch (e) { seen = true; }
    if (!seen && motionOK() && document.documentElement.dataset.contrast !== 'high') {
      root.classList.add('is-intro');
      const done = setTimeout(() => {
        root.classList.remove('is-intro');
        // Once, a small sway shows that the horizon moves.
        if (sideBySide() && finePointer() && !s.side && !s.dragging) {
          AMP = amp();
          s.target = 0.5 + AMP * 0.28;
          kick();
          setTimeout(() => { if (!s.side && !s.dragging && !s.entering) { s.target = 0.5 - AMP * 0.18; kick(); } }, 340);
          setTimeout(() => { if (!s.side && !s.dragging && !s.entering) { s.target = 0.5; kick(); } }, 760);
        }
      }, 1450);
      signal.addEventListener('abort', () => clearTimeout(done), { once: true });
    }

    T.fx.pauseOffscreen(root, signal);
  };
})();
