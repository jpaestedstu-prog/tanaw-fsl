/* =========================================================================
   Tanaw — service worker (offline support)
   Only registered when Tanaw is served over http(s), e.g. a local server or
   static hosting. Opening index.html directly from a folder works without it.
   Bump CACHE_VERSION whenever app files change. The shell list includes
   every view, so pages that load on demand also work offline.
   On GitHub Pages, every site of one account shares one address
   (https://<account>.github.io), and so shares one set of caches. This
   worker removes only Tanaw's own old caches, and puts back whatever is
   missing if another site's worker clears them.
   ========================================================================= */
const CACHE_PREFIX = 'tanaw-';
const CACHE_VERSION = `${CACHE_PREFIX}v4.1.1`;

const APP_SHELL = [
  './',
  './index.html',
  './admin.html',
  './manifest.webmanifest',
  './assets/css/tokens.css',
  './assets/css/base.css',
  './assets/css/layout.css',
  './assets/css/components.css',
  './assets/css/worlds.css',
  './assets/css/horizon.css',
  './assets/css/pages.css',
  './assets/css/tools.css',
  './assets/css/community.css',
  './assets/css/play.css',
  './assets/css/lab.css',
  './assets/css/futura.css',
  './assets/css/accounts.css',
  './assets/css/admin.css',
  './assets/fonts/atkinson-hyperlegible-next-italic-latin.woff2',
  './assets/fonts/atkinson-hyperlegible-next-latin.woff2',
  './assets/fonts/bricolage-grotesque-display.woff2',
  './assets/fonts/space-grotesk-latin.woff2',
  './assets/img/apple-touch-icon.png',
  './assets/img/banig.svg',
  './assets/img/capiz.svg',
  './assets/img/favicon.svg',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/icon-maskable-512.png',
  './assets/js/admin/activity.js',
  './assets/js/admin/boot.js',
  './assets/js/admin/console.js',
  './assets/js/admin/demo-admin.js',
  './assets/js/admin/overview.js',
  './assets/js/admin/people.js',
  './assets/js/admin/review.js',
  './assets/js/admin/site.js',
  './assets/js/admin/system.js',
  './assets/js/core/auth.js',
  './assets/js/core/backend-demo.js',
  './assets/js/core/config.js',
  './assets/js/core/icons.js',
  './assets/js/core/media.js',
  './assets/js/core/progress.js',
  './assets/js/core/router.js',
  './assets/js/core/settings.js',
  './assets/js/core/shell.js',
  './assets/js/core/srs.js',
  './assets/js/core/store.js',
  './assets/js/core/ui.js',
  './assets/js/core/util.js',
  './assets/js/data/concepts.js',
  './assets/js/data/culture.js',
  './assets/js/data/games.js',
  './assets/js/data/hands.js',
  './assets/js/data/lessons.js',
  './assets/js/data/media-manifest.js',
  './assets/js/data/phrases.js',
  './assets/js/data/scenes.js',
  './assets/js/data/signs.js',
  './assets/js/data/stories.js',
  './assets/js/components/art.js',
  './assets/js/components/forms.js',
  './assets/js/components/fx.js',
  './assets/js/components/horizon.js',
  './assets/js/components/hand-ui.js',
  './assets/js/components/hand3d.js',
  './assets/js/components/palette.js',
  './assets/js/components/runner.js',
  './assets/js/components/sign-ui.js',
  './assets/js/components/steps.js',
  './assets/js/components/widgets.js',
  './assets/js/views/about.js',
  './assets/js/views/account.js',
  './assets/js/views/bridge.js',
  './assets/js/views/community.js',
  './assets/js/views/fingerspell.js',
  './assets/js/views/games.js',
  './assets/js/views/history.js',
  './assets/js/views/home.js',
  './assets/js/views/identity.js',
  './assets/js/views/lab.js',
  './assets/js/views/learn.js',
  './assets/js/views/lesson.js',
  './assets/js/views/library.js',
  './assets/js/views/mirror.js',
  './assets/js/views/path.js',
  './assets/js/views/play.js',
  './assets/js/views/practice.js',
  './assets/js/views/progress.js',
  './assets/js/views/quiz.js',
  './assets/js/views/review.js',
  './assets/js/views/rights.js',
  './assets/js/views/scenes.js',
  './assets/js/views/sign.js',
  './assets/js/views/stories.js',
  './assets/js/views/studio.js',
  './assets/js/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // Only Tanaw's own old caches: other sites on the same address keep theirs.
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Put back any app-shell file missing from the cache (another site on the same address may have cleared it). */
function refillShell() {
  return caches.open(CACHE_VERSION)
    .then((cache) => Promise.all(APP_SHELL.map((u) => cache.match(u).then((hit) => (hit ? '' : u))))
      .then((missing) => missing.filter(Boolean))
      .then((missing) => (missing.length ? cache.addAll(missing) : undefined)))
    .catch(() => undefined);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Let the browser stream sign videos directly (range requests); cache only the app shell.
  if (url.pathname.includes('/assets/media/')) return;
  if (request.mode === 'navigate') event.waitUntil(refillShell());

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || (request.mode === 'navigate'
          ? caches.match('./index.html').then((page) => page || Response.error())
          : Response.error()));
      // Stale-while-revalidate: answer from cache immediately when possible.
      return cached || network;
    })
  );
});
