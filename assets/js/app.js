/* =========================================================================
   Tanaw — bootstrap
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;

  T.auth.restore(); // first, so the right person's data and display settings load
  T.store.load();
  T.settings.apply();

  const R = T.router;
  R.add(/^\/$/, 'home');

  // Awareness & Learning
  R.add(/^\/learn$/, 'learnHub');
  R.add(/^\/learn\/path$/, 'path');
  R.add(/^\/learn\/([\w-]+)$/, 'lesson', ['id']);
  R.add(/^\/play$/, 'play');
  R.add(/^\/play\/([\w-]+)$/, 'game', ['id']);
  R.add(/^\/scenes$/, 'scenes');
  R.add(/^\/scenes\/([\w-]+)$/, 'scene', ['id']);
  R.add(/^\/library$/, 'library');
  R.add(/^\/sign\/([\w-]+)$/, 'sign', ['id']);
  R.add(/^\/practice$/, 'practice');
  R.add(/^\/practice\/mirror$/, 'mirror');
  R.add(/^\/practice\/review$/, 'review');
  R.add(/^\/practice\/quiz$/, 'quiz');
  R.add(/^\/practice\/fingerspell$/, 'fingerspell');
  R.add(/^\/bridge$/, 'bridge');
  R.add(/^\/lab$/, 'lab');

  // Deaf Community
  R.add(/^\/community$/, 'community');
  R.add(/^\/community\/identity$/, 'identity');
  R.add(/^\/community\/stories$/, 'stories');
  R.add(/^\/community\/stories\/([\w-]+)$/, 'story', ['id']);
  R.add(/^\/community\/history$/, 'history');
  R.add(/^\/community\/rights$/, 'rights');
  R.add(/^\/community\/calendar$/, 'calendar');
  R.add(/^\/community\/connect$/, 'connect');

  // Shared
  R.add(/^\/journey$/, 'progress');
  R.add(/^\/studio$/, 'studio');
  R.add(/^\/about$/, 'about');

  // Accounts (a frontend demonstration: see core/auth.js)
  R.add(/^\/login$/, 'login');
  R.add(/^\/register$/, 'register');
  R.add(/^\/account$/, 'account');
  R.redirect(/^\/(signin|sign-in)$/, () => '/login');
  R.redirect(/^\/(signup|sign-up)$/, () => '/register');

  // Addresses from the earlier version of Tanaw keep working.
  const CULTURE = {
    identity: '/community/identity', etiquette: '/community/identity', words: '/community/identity?s=words',
    myths: '/community/identity?s=myths', history: '/community/history', observances: '/community/calendar',
    rights: '/community/rights', connect: '/community/connect', sources: '/community/connect?s=sources',
  };
  R.redirect(/^\/culture$/, (m, q) => CULTURE[q.s] || '/community');
  R.redirect(/^\/progress$/, () => '/journey');
  // Paused features (core/config.js) send visitors somewhere useful instead.
  if (!T.config.stories) R.redirect(/^\/community\/stories(\/[\w-]+)?$/, () => '/community');
  if (!T.config.hand3d) {
    R.redirect(/^\/lab$/, () => '/learn');
    R.redirect(/^\/play\/read-hand$/, () => '/play');
  }

  T.shell.init();
  T.auth.init();
  T.components.palette.init();

  // `is-ready` marks that the first page is in place; the footer waits for it (no layout shift while loading).
  const ready = T.bus.on('route', () => { document.documentElement.classList.add('is-ready'); ready(); });
  const start = () => R.start();
  // With demonstrations on, load the on-device media index first so statuses are accurate.
  // With them off, skip IndexedDB entirely: it can stall start-up in some browsers.
  if (T.config.demonstrations) T.media.init().finally(start);
  else start();

  // Progressive Web App features need http(s); file:// keeps working without them.
  const isWeb = /^https?:$/.test(window.location.protocol);
  if (isWeb) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = 'manifest.webmanifest';
    document.head.appendChild(link);
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((err) => console.warn('[Tanaw] Offline mode unavailable:', err && err.message));
      });
    }
  }
})();
