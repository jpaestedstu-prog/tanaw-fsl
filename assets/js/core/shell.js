/* =========================================================================
   Tanaw — app shell: the two-world navigation, site map, settings panel,
   journey chip, account control, keyboard shortcuts and notices.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;

  /* The two worlds and their stations. Order is the order shown in navigation. */
  const WORLDS = {
    learn: {
      id: 'learn', label: 'Awareness & Learning', short: 'Learning', fil: 'Matuto', href: '#/learn', icon: 'window',
      stations: [
        { id: 'learnHub', href: '#/learn', label: 'Overview', icon: 'window' },
        { id: 'path', href: '#/learn/path', label: 'Learning path', icon: 'path' },
        { id: 'play', href: '#/play', label: 'Games', icon: 'dice' },
        { id: 'scenes', href: '#/scenes', label: 'Everyday scenes', icon: 'pin' },
        { id: 'library', href: '#/library', label: 'Vocabulary', icon: 'library' },
        { id: 'lab', href: '#/lab', label: '3D Hand Lab', icon: 'cube' },
        { id: 'practice', href: '#/practice', label: 'Practice', icon: 'practice' },
        { id: 'bridge', href: '#/bridge', label: 'Bridge', icon: 'bridge' },
      ].filter((s) => s.id !== 'lab' || T.config.hand3d),
    },
    community: {
      id: 'community', label: 'Deaf Community', short: 'Community', fil: 'Pamayanan', href: '#/community', icon: 'weave',
      stations: [
        { id: 'community', href: '#/community', label: 'Overview', icon: 'weave' },
        { id: 'identity', href: '#/community/identity', label: 'Identity & culture', icon: 'people' },
        { id: 'stories', href: '#/community/stories', label: 'Stories', icon: 'story' },
        { id: 'history', href: '#/community/history', label: 'History', icon: 'compass' },
        { id: 'rights', href: '#/community/rights', label: 'Rights', icon: 'scale' },
        { id: 'calendar', href: '#/community/calendar', label: 'Calendar', icon: 'calendar' },
        { id: 'connect', href: '#/community/connect', label: 'Connect', icon: 'link' },
      ].filter((s) => s.id !== 'stories' || T.config.stories),
    },
  };

  const UTILITY = [
    { id: 'progress', href: '#/journey', label: 'Your journey', icon: 'sparkles' },
    { id: 'about', href: '#/about', label: 'About, status & roadmap', icon: 'info' },
    { id: 'studio', href: '#/studio', label: T.config.demonstrations ? 'Contributor Studio' : 'Class vocabulary (for teachers)', icon: 'studio' },
  ];

  /* ---------- Journey chip (daily goal, streak, XP) ---------- */
  function renderStats() {
    const el = document.getElementById('header-stats');
    if (!el) return;
    const s = T.progress.streak();
    const xp = Number(T.store.state.progress.xp) || 0;
    const today = T.progress.todayXP();
    const goal = T.progress.goal();
    const pct = U.clamp(goal ? today / goal : 0, 0, 1);
    const r = 8;
    const circ = 2 * Math.PI * r;
    el.innerHTML = String(html`
      <a class="journey-chip" href="#/journey" aria-label="Your journey: ${today} of ${goal} XP today, ${s.current}-day streak, ${xp} XP in total.">
        <svg class="journey-chip__ring" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="${r}" class="journey-chip__track"/>
          <circle cx="10" cy="10" r="${r}" class="journey-chip__value" stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${(circ * (1 - pct)).toFixed(2)}" transform="rotate(-90 10 10)"/>
        </svg>
        <span class="journey-chip__item ${s.activeToday ? 'is-hot' : ''}">${T.icon('flame')}<span>${s.current}</span></span>
        <span class="journey-chip__item journey-chip__xp">${T.icon('star')}<span>${xp}</span></span>
      </a>`);
  }

  /* ---------- Account control: log in, or who you are and how to log out ---------- */
  function closeAccountMenu(returnFocus) {
    const menu = document.getElementById('account-menu');
    const btn = document.querySelector('[data-account-toggle]');
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) btn.focus();
    }
  }

  function renderAccount() {
    const slot = document.getElementById('account-slot');
    if (!slot) return;
    const u = T.auth.user();
    if (!u) {
      slot.innerHTML = String(html`<a class="account-btn" href="#/login" aria-label="Log in or create an account">${T.icon('people')}<span class="account-btn__label">Log in</span></a>`);
    } else {
      slot.innerHTML = String(html`
        <button type="button" class="account-btn account-btn--user" data-account-toggle aria-expanded="false" aria-controls="account-menu" aria-label="Your account: ${u.name}">
          <span class="account-btn__initial" aria-hidden="true">${(u.name || '?').trim().charAt(0).toUpperCase()}</span>
        </button>
        <div class="account-menu" id="account-menu" hidden>
          <div class="account-menu__who">
            <p class="account-menu__name">${u.name}</p>
            <p class="account-menu__email">${u.email}</p>
          </div>
          <ul class="account-menu__list">
            <li><a class="account-menu__item" href="#/account">${T.icon('people')}<span>Your account</span></a></li>
            <li><a class="account-menu__item" href="#/journey">${T.icon('sparkles')}<span>Your journey</span></a></li>
            ${T.auth.isAdmin() ? html`<li><a class="account-menu__item" href="admin.html">${T.icon('shield')}<span>Administrator console</span></a></li>` : ''}
            <li><button type="button" class="account-menu__item" data-logout>${T.icon('arrow-left')}<span>Log out</span></button></li>
          </ul>
          <p class="account-menu__note">Demonstration account, kept only in this browser.</p>
        </div>`);
    }
    U.$$('[data-account-link]').forEach((a) => {
      a.textContent = u ? 'Your account' : 'Log in or create an account';
      a.setAttribute('href', u ? '#/account' : '#/login');
    });
  }

  const LOGGED_OUT_ELSEWHERE = {
    expired: 'Your login has ended.',
    revoked: 'Your session has ended.',
    elsewhere: 'You were logged out in another tab.',
    disabled: 'This account has been disabled.',
    gone: 'This account no longer exists.',
    switched: '', // someone logged in, in another tab
  };

  /** Everything that follows someone logging in or out. */
  function onAuthChange({ reason }) {
    renderAccount();
    renderStats();
    if (reason === 'logout') {
      // A clear logged-out state: a page that says so, and a way back in or onward.
      T.router.go('#/login?out=1');
      return;
    }
    if (reason === 'deleted') {
      T.router.go('#/');
      return;
    }
    if (reason in LOGGED_OUT_ELSEWHERE) {
      if (LOGGED_OUT_ELSEWHERE[reason]) T.ui.toast(LOGGED_OUT_ELSEWHERE[reason], { icon: 'info' });
      T.router.render(); // this tab's page may belong to the previous person
    }
  }

  /* ---------- World switcher, station nav and tab bar state ---------- */
  function updateWorlds(route) {
    const world = route.world;
    U.$$('[data-world-link]').forEach((a) => {
      const on = a.dataset.worldLink === world;
      if (on) a.setAttribute('aria-current', route.station === WORLDS[world].stations[0].id ? 'page' : 'true');
      else a.removeAttribute('aria-current');
    });
    // Tab bar: a tab for the exact station wins (Bridge, Journey); otherwise highlight the world.
    const tabs = U.$$('[data-nav]');
    const exact = tabs.some((a) => a.dataset.nav === route.station);
    tabs.forEach((a) => {
      const id = a.dataset.nav;
      const on = id === 'home' ? route.name === 'home' : exact ? id === route.station : id === world;
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    const nav = document.getElementById('world-nav');
    if (!nav) return;
    if (!world || route.focusMode) {
      nav.hidden = true;
      nav.innerHTML = '';
      return;
    }
    const w = WORLDS[world];
    nav.hidden = false;
    nav.setAttribute('aria-label', `${w.label} sections`);
    nav.className = `world-nav world-nav--${world}`;
    nav.innerHTML = String(html`
      <div class="container world-nav__inner">
        <a class="world-nav__home" href="${w.href}"><span class="world-nav__fil" lang="fil">${w.fil}</span><span class="world-nav__label">${w.label}</span></a>
        <ul class="world-nav__list">
          ${w.stations.slice(1).map((s) => html`
            <li><a class="world-nav__link" href="${s.href}" ${s.id === route.station ? U.raw('aria-current="page"') : ''}>${T.icon(s.icon)}<span>${s.label}</span></a></li>`)}
        </ul>
      </div>`);
    // On narrow screens the station list scrolls sideways: bring the current station into view.
    const active = nav.querySelector('[aria-current="page"]');
    const list = nav.querySelector('.world-nav__list');
    if (active && list && list.scrollWidth > list.clientWidth) list.scrollLeft = active.offsetLeft - 24;
  }

  /* ---------- Site map ---------- */
  function openMenu() {
    const activeHref = window.location.hash.split('?')[0] || '#/';
    const col = (w) => html`
      <section class="sitemap__world sitemap__world--${w.id}" aria-labelledby="map-${w.id}">
        <h3 class="sitemap__title" id="map-${w.id}"><span class="sitemap__fil" lang="fil">${w.fil}</span>${w.label}</h3>
        <ul class="menu-list">
          ${w.stations.map((s) => html`<li><a class="menu-list__link" href="${s.href}" ${s.href === activeHref ? U.raw('aria-current="page"') : ''}>${T.icon(s.icon)}<span>${s.label}</span>${T.icon('chevron-right', { className: 'menu-list__chev' })}</a></li>`)}
        </ul>
      </section>`;
    T.ui.dialog({
      title: 'Explore Tanaw',
      size: 'lg',
      className: 'dialog--menu',
      body: html`
        <nav aria-label="Site map">
          <div class="sitemap">${col(WORLDS.learn)}${col(WORLDS.community)}</div>
          <ul class="menu-list menu-list--utility">
            <li><a class="menu-list__link" href="#/">${T.icon('eye')}<span>Start: choose a world</span>${T.icon('chevron-right', { className: 'menu-list__chev' })}</a></li>
            ${UTILITY.map((n) => html`<li><a class="menu-list__link" href="${n.href}">${T.icon(n.icon)}<span>${n.label}</span>${T.icon('chevron-right', { className: 'menu-list__chev' })}</a></li>`)}
            ${T.auth.user() ? html`
              <li><a class="menu-list__link" href="#/account">${T.icon('people')}<span>Your account</span>${T.icon('chevron-right', { className: 'menu-list__chev' })}</a></li>
              ${T.auth.isAdmin() ? html`<li><a class="menu-list__link" href="admin.html" data-no-close>${T.icon('shield')}<span>Administrator console</span>${T.icon('chevron-right', { className: 'menu-list__chev' })}</a></li>` : ''}
              <li><button type="button" class="menu-list__link menu-list__link--button" data-logout>${T.icon('arrow-left')}<span>Log out</span></button></li>` : html`
              <li><a class="menu-list__link" href="#/login">${T.icon('people')}<span>Log in or create an account</span>${T.icon('chevron-right', { className: 'menu-list__chev' })}</a></li>`}
          </ul>
        </nav>
        <button type="button" class="btn btn--secondary btn--block" data-open-settings>${T.icon('sliders')}<span>Display &amp; accessibility settings</span></button>`,
      onOpen: (dlg) => {
        dlg.addEventListener('click', (e) => {
          if (e.target.closest('a[href^="#"]') || e.target.closest('[data-logout]')) dlg.close('nav');
          if (e.target.closest('[data-open-settings]')) { dlg.close('settings'); setTimeout(openSettings, 50); }
        });
      },
    });
  }

  /* ---------- Settings panel ---------- */
  function segmented(name, legend, options, value, hint) {
    return html`
      <fieldset class="setting">
        <legend class="setting__label">${legend}</legend>
        ${hint ? html`<p class="setting__hint">${hint}</p>` : ''}
        <div class="segmented">
          ${options.map(([v, label]) => html`
            <label class="segmented__option">
              <input type="radio" name="${name}" value="${v}" ${String(v) === String(value) ? U.raw('checked') : ''}>
              <span>${label}</span>
            </label>`)}
        </div>
      </fieldset>`;
  }

  function toggle(name, label, checked, hint) {
    return html`
      <div class="setting setting--toggle">
        <label class="switch">
          <input type="checkbox" name="${name}" ${checked ? U.raw('checked') : ''}>
          <span class="switch__track" aria-hidden="true"><span class="switch__thumb"></span></span>
          <span class="switch__label">${label}${hint ? html`<span class="switch__hint">${hint}</span>` : ''}</span>
        </label>
      </div>`;
  }

  function openSettings() {
    const s = T.store.state.settings;
    T.ui.dialog({
      title: 'Display & accessibility',
      size: 'md',
      body: html`
        <form class="settings" id="settings-form">
          <h3 class="settings__group">Appearance</h3>
          ${segmented('theme', 'Theme', [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']], s.theme)}
          ${toggle('contrast', 'High contrast', s.contrast === 'high', 'Stronger colors, borders and underlined links. Decorative patterns are removed.')}

          <h3 class="settings__group">Reading</h3>
          <div class="setting">
            <label class="setting__label" for="set-text">Text size <output id="set-text-out">${Math.round((Number(s.textScale) || 1) * 100)}%</output></label>
            <input class="range" id="set-text" type="range" name="textScale" min="0.9" max="1.5" step="0.05" value="${Number(s.textScale) || 1}">
          </div>
          ${toggle('spacing', 'Relaxed spacing', s.spacing === 'relaxed', 'More space between letters, words and lines.')}

          <h3 class="settings__group">Motion</h3>
          ${segmented('motion', 'Animations', [['system', 'System'], ['reduce', 'Reduce'], ['full', 'Full']], s.motion, 'Reduce turns off page transitions, parallax, tilting cards and the gliding eye. The 3D hand then steps from pose to pose.')}

          <h3 class="settings__group">Learning</h3>
          ${segmented('dailyGoal', 'Daily goal', [['10', '10 XP'], ['30', '30 XP'], ['50', '50 XP'], ['100', '100 XP']], String(s.dailyGoal), 'A gentle target — about 10 XP per short activity.')}

          <h3 class="settings__group">3D hand <span class="exp-badge">Experimental</span></h3>
          ${segmented('handStyle', 'Hand style', Object.entries({ kayumanggi: 'Kayumanggi', light: 'Light', deep: 'Deep', polymer: 'Polymer', hologram: 'Hologram' }), s.handStyle || 'kayumanggi')}
          ${toggle('handMirror', 'Left hand', !!s.handMirror, 'Mirror the 3D hand for left-handed signers.')}

          <h3 class="settings__group">Practice Mirror</h3>
          ${toggle('mirrorCamera', 'Mirror my camera', !!s.mirrorCamera, 'Shows your camera like a mirror (recommended).')}
          ${T.config.demonstrations ? toggle('flipDemo', 'Flip demonstrations horizontally', !!s.flipDemo, 'Some learners find a flipped view easier to copy.') : ''}

          <p class="settings__note">${T.icon('lock')} Settings are saved in this browser only.</p>
        </form>`,
      actions: [
        { label: 'Reset to defaults', variant: 'ghost', value: 'reset', onClick: () => {
          const defaults = { theme: 'dark', contrast: 'standard', motion: 'system', textScale: 1, spacing: 'normal', dailyGoal: 30, mirrorCamera: true, flipDemo: false, handStyle: 'kayumanggi', handMirror: false };
          T.store.update((st) => { Object.assign(st.settings, defaults); });
          T.settings.apply();
          T.ui.toast('Settings reset to defaults.');
        } },
        { label: 'Done', variant: 'primary', value: 'done' },
      ],
      onOpen: (dlg) => {
        const form = dlg.querySelector('#settings-form');
        const out = dlg.querySelector('#set-text-out');
        form.addEventListener('submit', (e) => e.preventDefault());
        form.addEventListener('input', (e) => {
          const t = e.target;
          if (!t.name) return;
          let value;
          if (t.type === 'checkbox') {
            if (t.name === 'contrast') value = t.checked ? 'high' : 'standard';
            else if (t.name === 'spacing') value = t.checked ? 'relaxed' : 'normal';
            else value = t.checked;
          } else if (t.name === 'textScale') {
            value = Number(t.value);
            if (out) out.textContent = `${Math.round(value * 100)}%`;
          } else if (t.name === 'dailyGoal') {
            value = Number(t.value);
          } else {
            value = t.value;
          }
          T.settings.set(t.name, value);
        });
      },
      onClose: () => T.bus.emit('store:change'),
    });
  }

  /* ---------- Notices: storage problems, and the site notice an administrator published ---------- */
  const NOTICE_DISMISSED = 'tanaw.notice.dismissed';
  function renderNotices() {
    const host = document.getElementById('app-notices');
    if (!host) return;
    const site = T.auth.siteNotice();
    let dismissed = '';
    try { dismissed = window.sessionStorage.getItem(NOTICE_DISMISSED) || ''; } catch (e) { /* ignore */ }
    host.innerHTML = String(html`
      ${T.store.isPersistent() ? '' : html`
      <div class="app-notice" role="status">
        ${T.icon('alert')}
        <p><strong>Progress can't be saved in this browser mode.</strong> Your browser is blocking local storage (for example in some private windows). Everything still works, but progress resets when you close the tab.</p>
      </div>`}
      ${T.store.isDamaged() ? html`
      <div class="app-notice" role="status">
        ${T.icon('alert')}
        <p><strong>Your saved progress could not be read, so Tanaw started fresh.</strong> If you exported a backup, you can restore it on <a href="#/journey">Your journey</a>.</p>
      </div>` : ''}
      ${site && site.id !== dismissed ? html`
      <div class="app-notice app-notice--site ${site.tone === 'important' ? 'is-important' : ''}" role="status">
        ${T.icon(site.tone === 'important' ? 'alert' : 'info')}
        <p>${site.text}</p>
        <button type="button" class="icon-btn" data-dismiss-notice="${site.id}" aria-label="Dismiss this notice">${T.icon('close')}</button>
      </div>` : ''}`);
  }

  /* Keep --header-total in sync so sticky elements sit below the header and world navigation. */
  function trackHeaderHeight() {
    const header = document.querySelector('.site-header');
    const nav = document.getElementById('world-nav');
    const set = () => {
      const h = (header ? header.offsetHeight : 0) + (nav && !nav.hidden && getComputedStyle(nav).position === 'sticky' ? nav.offsetHeight : 0);
      document.documentElement.style.setProperty('--header-total', `${h}px`);
    };
    set();
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(set);
      if (header) ro.observe(header);
      if (nav) ro.observe(nav);
    } else {
      window.addEventListener('resize', U.debounce(set, 100));
    }
    T.bus.on('route', () => requestAnimationFrame(set));
  }

  /* Media queries know the window's width but not the text size someone chose, so the header
     measures itself: if its contents do not fit, it compacts one step at a time (layout.css). */
  function fitHeader() {
    const header = document.querySelector('.site-header');
    const inner = header && header.querySelector('.site-header__inner');
    if (!inner) return;
    const fit = () => {
      for (let level = 0; level <= 3; level++) {
        header.dataset.fit = String(level);
        if (inner.scrollWidth <= inner.clientWidth + 1) break;
      }
    };
    fit();
    if (window.ResizeObserver) new ResizeObserver(U.rafThrottle(fit)).observe(inner);
    else window.addEventListener('resize', U.debounce(fit, 100));
    T.bus.on('settings:applied', fit);
    T.bus.on('auth:change', fit);
    T.bus.on('xp', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  function init() {
    // A soft light follows the pointer across interactive cards (futura.css reads --sx/--sy).
    const SPOT = '.pane, .game-card, .mode-card, .lab-tile, .feature';
    let spotEl = null;
    let spotEvt = null;
    const paintSpot = U.rafThrottle(() => {
      if (!spotEl || !spotEvt) return;
      const r = spotEl.getBoundingClientRect();
      spotEl.style.setProperty('--sx', `${spotEvt.clientX - r.left}px`);
      spotEl.style.setProperty('--sy', `${spotEvt.clientY - r.top}px`);
    });
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      spotEl = e.target.closest && e.target.closest(SPOT);
      spotEvt = e;
      if (spotEl) paintSpot();
    }, { passive: true });

    // Static shell markup uses <span data-icon="…"> placeholders; swap in the SVG icons.
    U.$$('[data-icon]').forEach((el) => { el.outerHTML = String(T.icon(el.dataset.icon)); });

    // Links to switched-off features (core/config.js) are removed; the studio link follows its role.
    U.$$('[data-feature]').forEach((el) => { if (!T.config[el.dataset.feature]) el.remove(); });
    const studio = UTILITY.find((u) => u.id === 'studio');
    U.$$('[data-studio-link]').forEach((a) => { a.textContent = studio.label; });

    // Skip link: focus the page heading without changing the route hash.
    const skip = document.querySelector('.skip-link');
    if (skip) {
      skip.addEventListener('click', (e) => {
        e.preventDefault();
        const main = document.getElementById('main');
        const h1 = main && main.querySelector('h1');
        const target = h1 || main;
        if (target) {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus();
        }
      });
    }

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-settings-global]')) openSettings();
      if (e.target.closest('[data-open-menu]')) openMenu();
      const toggle = e.target.closest('[data-account-toggle]');
      const menu = document.getElementById('account-menu');
      if (toggle && menu) {
        const open = menu.hidden;
        menu.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
      } else if (menu && !menu.hidden && (!e.target.closest('#account-menu') || e.target.closest('a'))) {
        closeAccountMenu(false);
      }
      if (e.target.closest('[data-logout]')) {
        closeAccountMenu(false);
        T.auth.logout();
      }
      const dismiss = e.target.closest('[data-dismiss-notice]');
      if (dismiss) {
        try { window.sessionStorage.setItem(NOTICE_DISMISSED, dismiss.dataset.dismissNotice); } catch (err) { /* ignore */ }
        renderNotices();
      }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAccountMenu(true); });
    document.addEventListener('focusin', (e) => {
      if (!e.target.closest('#account-slot')) closeAccountMenu(false);
    });

    // Fetch a page's script as soon as the visitor shows interest in its link.
    const warm = (e) => {
      const a = e.target instanceof Element ? e.target.closest('a[href^="#/"]') : null;
      if (a) T.router.prefetch(a.getAttribute('href'));
    };
    document.addEventListener('pointerover', warm, { passive: true });
    document.addEventListener('focusin', warm);

    // Keyboard shortcut: "/" jumps to the Vocabulary search.
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (U.isTyping(e) || document.querySelector('dialog[open]')) return;
      if (e.key === '/') {
        e.preventDefault();
        if (document.body.dataset.view === 'library') {
          const input = document.getElementById('library-search');
          if (input) input.focus();
        } else {
          T.router.go('#/library?focus=1');
        }
      }
    });

    renderStats();
    renderAccount();
    T.bus.on('store:change', renderStats);
    T.bus.on('xp', renderStats);
    T.bus.on('route', updateWorlds);
    T.bus.on('auth:change', onAuthChange);
    T.bus.on('site:change', renderNotices);
    T.bus.on('storage:error', () => T.ui.toast('Could not save progress — browser storage may be full.', { icon: 'alert', tone: 'danger' }));
    renderNotices();
    trackHeaderHeight();
    fitHeader();

    const year = document.getElementById('footer-year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  T.shell = { init, openSettings, openMenu, renderAccount, WORLDS, UTILITY };
})();
