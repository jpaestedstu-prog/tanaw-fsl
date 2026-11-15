/* =========================================================================
   Tanaw — display & accessibility settings
   Applies settings as data-attributes on <html>; CSS does the rest.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const root = document.documentElement;

  const mq = (q) => (window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener() {} });
  const mqDark = mq('(prefers-color-scheme: dark)');
  const mqMotion = mq('(prefers-reduced-motion: reduce)');

  function apply() {
    const s = T.store.state.settings;
    const theme = s.theme === 'light' || s.theme === 'dark' ? s.theme : (mqDark.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    root.dataset.contrast = s.contrast === 'high' ? 'high' : 'standard';
    root.dataset.motion = s.motion === 'reduce' || (s.motion !== 'full' && mqMotion.matches) ? 'reduce' : 'full';
    root.dataset.spacing = s.spacing === 'relaxed' ? 'relaxed' : 'normal';
    const scale = T.util.clamp(Number(s.textScale) || 1, 0.9, 1.5);
    root.style.setProperty('--text-scale', String(scale));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#060719' : '#F3F5FD');
    T.bus.emit('settings:applied');
  }

  const watch = (m) => {
    if (m.addEventListener) m.addEventListener('change', apply);
    else if (m.addListener) m.addListener(apply);
  };
  watch(mqDark);
  watch(mqMotion);

  T.settings = {
    apply,
    get(key) { return T.store.state.settings[key]; },
    set(key, value) {
      T.store.update((st) => { st.settings[key] = value; });
      apply();
    },
  };
})();
