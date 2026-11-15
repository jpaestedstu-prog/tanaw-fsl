/* =========================================================================
   Tanaw — hash router
   Hash routes (#/learn, #/sign/thank-you …) work from file:// and any server.
   Each view gets an AbortSignal; every listener registered with it is removed
   automatically when the user navigates away.

   Views can declare:
     title      string | (params, query) => string
     world      'learn' | 'community' | null   (sets the world theme)
     station    id of the station highlighted in the world navigation
     focusMode  true to hide the tab bar, footer and world navigation
     access     'guest' (logged-out people only) | 'user' (asks to log in first).
                This only shapes the experience: a browser cannot enforce access.

   Most views are loaded on demand (see VIEW_FILES) so the first visit only
   downloads the shell and the landing page. Lazy loading uses plain <script>
   tags, which also work when Tanaw is opened straight from a folder.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  T.views = T.views || {};

  const routes = [];
  const redirects = [];
  let current = { controller: null, cleanup: null, token: 0, path: null, world: null };
  let firstRender = true;

  /* View name -> script file(s), loaded in order. */
  const V = 'assets/js/views/';
  // The experimental 3D hand: engine, poses and shared interface, loaded only where used.
  const HAND = ['assets/js/components/hand3d.js', 'assets/js/data/hands.js', 'assets/js/components/hand-ui.js'];
  const ACCOUNT = ['assets/js/components/forms.js', V + 'account.js'];
  const VIEW_FILES = {
    login: ACCOUNT,
    register: ACCOUNT,
    account: ACCOUNT,
    lab: HAND.concat(V + 'lab.js'),
    learnHub: V + 'learn.js',
    path: V + 'path.js',
    lesson: V + 'lesson.js',
    library: V + 'library.js',
    sign: V + 'sign.js',
    play: V + 'play.js',
    game: [V + 'play.js', V + 'games.js'],
    scenes: V + 'scenes.js',
    scene: V + 'scenes.js',
    practice: V + 'practice.js',
    mirror: V + 'mirror.js',
    review: V + 'review.js',
    quiz: V + 'quiz.js',
    fingerspell: HAND.concat(V + 'fingerspell.js'),
    bridge: V + 'bridge.js',
    // Exhibits share helpers defined in community.js, so it always loads first.
    community: V + 'community.js',
    identity: [V + 'community.js', V + 'identity.js'],
    stories: [V + 'community.js', 'assets/js/data/stories.js', V + 'stories.js'],
    story: [V + 'community.js', 'assets/js/data/stories.js', V + 'stories.js'],
    history: [V + 'community.js', V + 'history.js'],
    rights: [V + 'community.js', V + 'rights.js'],
    calendar: V + 'community.js',
    connect: V + 'community.js',
    progress: V + 'progress.js',
    studio: V + 'studio.js',
    about: V + 'about.js',
  };

  const loading = new Map();
  // Files that have run: the scripts in index.html, plus every file loaded on demand.
  const loaded = new Set(Array.from(document.querySelectorAll('script[src]'), (el) => el.getAttribute('src')));

  function loadScript(src) {
    if (loaded.has(src)) return Promise.resolve();
    if (loading.has(src)) return loading.get(src);
    const promise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { loaded.add(src); resolve(); };
      s.onerror = () => {
        loading.delete(src);
        s.remove();
        reject(new Error(`Could not load ${src}`));
      };
      document.head.appendChild(s);
    });
    loading.set(src, promise);
    return promise;
  }

  /** Load the experimental 3D hand (engine, poses, interface) on demand, for the pages that show it. */
  async function ensureHand() {
    for (const f of HAND) await loadScript(f);
    return T.hand3d || null;
  }

  /** True while a route still lacks one of its files. One file can define several views
      (play.js defines the game player too), so a defined view is not enough. */
  const missingFiles = (name) => [].concat(VIEW_FILES[name] || []).some((f) => !loaded.has(f));

  async function ensureView(name) {
    for (const f of [].concat(VIEW_FILES[name] || [])) await loadScript(f);
    return T.views[name] || null;
  }

  function add(pattern, view, keys = []) {
    routes.push({ pattern, view, keys });
  }

  /** to(match, query) returns the replacement path (with optional ?query). */
  function redirect(pattern, to) {
    redirects.push({ pattern, to });
  }

  function parse() {
    const hash = window.location.hash.replace(/^#/, '');
    const [pathPart, queryPart = ''] = hash.split('?');
    let path = pathPart || '/';
    if (!path.startsWith('/')) path = '/' + path;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    let query = {};
    try { query = Object.fromEntries(new URLSearchParams(queryPart)); } catch (e) { query = {}; }
    return { path, query };
  }

  function resolve(path) {
    for (const r of routes) {
      const m = path.match(r.pattern);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => {
          try { params[k] = decodeURIComponent(m[i + 1]); } catch (e) { params[k] = m[i + 1]; }
        });
        return { name: r.view, params };
      }
    }
    return { name: 'notFound', params: {} };
  }

  function redirectFor(path, query) {
    for (const r of redirects) {
      const m = path.match(r.pattern);
      if (m) return r.to(m, query);
    }
    return null;
  }

  /** Replace the current history entry without adding a new one. */
  function replaceHash(target) {
    const url = `#${target}`;
    try {
      window.history.replaceState(null, '', url);
      return true;
    } catch (e) {
      window.location.replace(url);
      return false;
    }
  }

  function loadFailedView(err) {
    return {
      title: 'Could not load this page',
      render(el) {
        el.innerHTML = String(U.html`
          <section class="container page">
            <div class="empty-state">
              <span class="empty-state__icon">${T.icon('wifi', { size: 36 })}</span>
              <h1 class="empty-state__title">This part of Tanaw could not load</h1>
              <p>${err && err.message ? err.message : 'A file is missing.'} If you are offline, connect once over the internet so Tanaw can save itself for offline use.</p>
              <div class="btn-row"><button type="button" class="btn btn--primary" data-retry>Try again</button><a class="btn btn--secondary" href="#/">Go to the start</a></div>
            </div>
          </section>`);
        el.querySelector('[data-retry]').addEventListener('click', () => render());
      },
    };
  }

  /** Where to send someone instead of this view, or null. Experience only: a browser cannot enforce access. */
  function guard(view, path, query) {
    const user = T.auth.user();
    if (user && user.mustChange && path !== '/account') return '/account?change=1';
    if (view.access === 'guest' && user) return '/account';
    if (view.access === 'user' && !user) {
      const qs = new URLSearchParams(query).toString();
      return `/login?next=${encodeURIComponent(path + (qs ? `?${qs}` : ''))}`;
    }
    return null;
  }

  /** A view that has already animated its way out can ask for a gentler arrival on the next page. */
  let nextKind = null;
  function nextTransition(kind) { nextKind = kind; }

  /** Direction of the page transition, used by CSS to wipe toward the destination world. */
  function transitionKind(fromWorld, toWorld) {
    if (nextKind) { const kind = nextKind; nextKind = null; return kind; }
    if (!fromWorld && !toWorld) return 'fade';
    if (fromWorld === toWorld) return 'same';
    if (toWorld === 'learn') return 'to-learn';
    if (toWorld === 'community') return 'to-community';
    return 'fade';
  }

  async function render() {
    const { path, query } = parse();
    const target = redirectFor(path, query);
    if (target) {
      if (replaceHash(target)) render();
      return;
    }
    const { name, params } = resolve(path);
    const token = ++current.token;
    const el = document.getElementById('view');

    let view = T.views[name];
    if (!view || missingFiles(name)) {
      const slow = setTimeout(() => {
        if (token === current.token) el.setAttribute('aria-busy', 'true');
      }, 150);
      try {
        view = await ensureView(name);
      } catch (err) {
        console.error('[Tanaw] view failed to load', err);
        view = loadFailedView(err);
      }
      clearTimeout(slow);
      if (token !== current.token) return; // a newer navigation won
    }
    view = view || T.views.notFound;

    const to = guard(view, path, query);
    if (to) {
      if (replaceHash(to)) render();
      return;
    }

    const fromWorld = current.world;
    const toWorld = view.world || null;

    const swap = async () => {
      // Tear down the previous view.
      if (current.controller) current.controller.abort();
      if (typeof current.cleanup === 'function') {
        try { current.cleanup(); } catch (err) { console.error('[Tanaw] cleanup failed', err); }
      }
      const controller = new AbortController();
      current.controller = controller;
      current.cleanup = null;
      current.path = path;
      current.world = toWorld;

      const body = document.body;
      body.dataset.view = name;
      if (toWorld) body.dataset.world = toWorld; else delete body.dataset.world;
      body.classList.toggle('is-focus-mode', !!view.focusMode);
      el.innerHTML = '';
      el.setAttribute('aria-busy', 'true');

      let cleanup = null;
      try {
        cleanup = await view.render(el, params, query, { signal: controller.signal });
      } catch (err) {
        console.error('[Tanaw] view failed to render', err);
        el.innerHTML = String(U.html`
          <section class="container page">
            <div class="empty-state">
              <span class="empty-state__icon">${T.icon('alert', { size: 36 })}</span>
              <h1 class="empty-state__title">Something went wrong</h1>
              <p>This page could not be displayed. Your progress is safe.</p>
              <a class="btn btn--primary" href="#/">Go to the start</a>
            </div>
          </section>`);
      }
      el.removeAttribute('aria-busy');
      if (token !== current.token) {
        if (typeof cleanup === 'function') cleanup();
        return;
      }
      current.cleanup = cleanup;
      if (!firstRender && !query.keepScroll) window.scrollTo(0, 0);
    };

    const canTransition = !firstRender && typeof document.startViewTransition === 'function'
      && !U.reducedMotion() && document.visibilityState === 'visible';
    if (canTransition) {
      const root = document.documentElement;
      root.dataset.vt = transitionKind(fromWorld, toWorld);
      try {
        const vt = document.startViewTransition(swap);
        // A newer navigation skips this transition; `ready` then rejects (AbortError).
        vt.ready.catch(() => {});
        await vt.updateCallbackDone;
        vt.finished.catch(() => {}).finally(() => { if (token === current.token) delete root.dataset.vt; });
      } catch (err) {
        delete root.dataset.vt;
        if (current.path !== path) await swap();
      }
    } else {
      await swap();
    }
    if (token !== current.token) return;

    const title = typeof view.title === 'function' ? view.title(params, query) : view.title;
    document.title = title ? `${title} · Tanaw` : 'Tanaw — Filipino Sign Language & the Filipino Deaf community';

    if (!firstRender) {
      const heading = el.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      T.ui.announce(title || 'Tanaw');
    }
    firstRender = false;
    T.bus.emit('route', { name, path, params, query, world: toWorld, station: view.station || name, focusMode: !!view.focusMode });
  }

  function go(hash) {
    if (window.location.hash === hash) render();
    else window.location.hash = hash;
  }

  /** Update the query string without re-rendering (e.g. live search filters). */
  function replaceQuery(path, query) {
    const qs = new URLSearchParams();
    Object.keys(query).forEach((k) => { if (query[k] !== '' && query[k] != null) qs.set(k, query[k]); });
    const s = qs.toString();
    const url = `#${path}${s ? '?' + s : ''}`;
    try { window.history.replaceState(null, '', url); } catch (e) { /* file:// in some browsers */ }
  }

  /** Load the script for a route ahead of time (on hover or focus of a link). */
  function prefetch(hash) {
    const clean = String(hash || '').replace(/^#/, '').split('?')[0] || '/';
    const { name } = resolve(clean.startsWith('/') ? clean : '/' + clean);
    if (missingFiles(name)) ensureView(name).catch(() => {});
  }

  function start() {
    window.addEventListener('hashchange', render);
    render();
  }

  T.router = { add, redirect, start, go, render, replaceQuery, parse, prefetch, ensureView, ensureHand, nextTransition, load: loadScript, VIEW_FILES };
})();
