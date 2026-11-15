/* =========================================================================
   Tanawan — the administrator console's shell (admin.html)

   "Tanawan" is a lookout: tanaw (to look toward) + -an (a place for it).
   A separate page from the public site, with its own look and navigation:
   the seam from the landing runs down the rail, and each section is a bead on it.

   This file holds the gate (who may see the console), the rail, a small hash
   router and helpers shared by the sections in this folder.

   THE GATE IS NOT SECURITY. It decides what this page shows, in a browser the
   visitor controls. docs/backend-integration.md says where a server must take
   over: authentication, and a role check on every admin request.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const C = T.components;

  const LOOK_KEY = 'tanaw.console.look';
  const SECTIONS = [];
  const K = (T.console = {});

  /* ---------- Helpers shared by the sections ---------- */
  K.section = (def) => SECTIONS.push(def);
  K.fmtDate = (t) => (t ? U.formatDate(new Date(t), { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  K.fmtDateTime = (t) => (t ? new Date(t).toLocaleString('en-PH', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
  K.ago = (t) => {
    if (!t) return 'never';
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return U.plural(Math.floor(s / 3600), 'hour') + ' ago';
    if (s < 86400 * 14) return U.plural(Math.floor(s / 86400), 'day') + ' ago';
    return K.fmtDate(t);
  };
  /** A public-site page, opened beside the console so its place here is kept. */
  K.publicLink = (href, label) => html`<a class="c-public" href="index.html${href}" target="_blank" rel="noopener">${label}<span class="visually-hidden"> (opens in a new tab)</span>${T.icon('arrow-right')}</a>`;
  K.head = ({ title, lead, actions }) => html`
    <header class="c-head">
      <div class="c-head__text">
        <h1 class="c-head__title" tabindex="-1">${title}</h1>
        ${lead ? html`<p class="c-head__lead">${lead}</p>` : ''}
      </div>
      ${actions ? html`<div class="c-head__actions">${actions}</div>` : ''}
    </header>`;
  /** A short message when a list has nothing to show. */
  K.empty = (text) => html`<p class="c-empty">${text}</p>`;

  /** Text for the log: what happened, to whom. */
  const EVENT = {
    'admin.setup': ['First administrator created', 'accounts'],
    login: ['Logged in', 'logins'],
    logout: ['Logged out', 'logins'],
    'logout.expired': ['Login expired', 'logins'],
    'login.failed': ['Failed login', 'logins'],
    'login.blocked': ['Login blocked', 'logins'],
    'account.locked': ['Account locked', 'accounts'],
    'account.unlocked': ['Account unlocked', 'accounts'],
    'account.registered': ['Registered', 'accounts'],
    'account.created': ['Account created', 'accounts'],
    'account.updated': ['Details changed', 'accounts'],
    'account.deleted': ['Account deleted', 'accounts'],
    'account.disabled': ['Account disabled', 'accounts'],
    'account.enabled': ['Account enabled', 'accounts'],
    'role.changed': ['Role changed', 'accounts'],
    'password.changed': ['Password changed', 'accounts'],
    'password.reset': ['Password reset', 'accounts'],
    'sample.added': ['Sample account added', 'accounts'],
    'sample.removed': ['Sample accounts removed', 'accounts'],
    'review.saved': ['Review recorded', 'reviews'],
    'site.notice': ['Site notice', 'site'],
    'site.registration': ['Registration', 'site'],
    'data.exported': ['Backup downloaded', 'site'],
    'data.restored': ['Backup restored', 'site'],
    'log.cleared': ['Log cleared', 'site'],
  };
  K.eventLabel = (ev) => (EVENT[ev.type] ? EVENT[ev.type][0] : ev.type);
  K.eventKind = (ev) => (EVENT[ev.type] ? EVENT[ev.type][1] : 'site');
  K.eventText = (ev) => {
    const who = ev.targetName || ev.actorName || '';
    return [who, ev.note].filter(Boolean).join(' · ');
  };

  /* ---------- The Firefox file:// limitation, stated rather than left to surprise ---------- */
  const fileOriginNote = () => (window.location.protocol === 'file:' && /firefox/i.test(window.navigator.userAgent)
    ? html`<p class="c-warn" role="status">${T.icon('alert')}<span><strong>Firefox keeps each local file apart.</strong> Opened from a folder, this page cannot see accounts made on the main site. Run Tanaw from a local server (see the README) so both pages share one browser storage.</span></p>`
    : '');

  /* ---------- Look ---------- */
  const look = () => {
    try { return window.localStorage.getItem(LOOK_KEY) === 'night' ? 'night' : 'paper'; } catch (e) { return 'paper'; }
  };
  /** The console has its own look; the other display settings are shared with the site. */
  function applyLook() {
    const root = document.documentElement;
    const l = look();
    root.dataset.console = l;
    root.dataset.theme = l === 'night' ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', l === 'night' ? '#0E0E15' : '#15132E');
  }
  K.applyLook = applyLook;

  function openDisplay() {
    const s = T.store.state.settings;
    T.ui.dialog({
      title: 'Display',
      size: 'sm',
      body: html`
        <form class="c-form" data-display>
          <fieldset class="setting">
            <legend class="setting__label">Console look</legend>
            <div class="segmented">
              <label class="segmented__option"><input type="radio" name="look" value="paper" ${look() === 'paper' ? raw('checked') : ''}><span>Paper</span></label>
              <label class="segmented__option"><input type="radio" name="look" value="night" ${look() === 'night' ? raw('checked') : ''}><span>Night watch</span></label>
            </div>
          </fieldset>
          <div class="setting setting--toggle">
            <label class="switch">
              <input type="checkbox" name="contrast" ${s.contrast === 'high' ? raw('checked') : ''}>
              <span class="switch__track" aria-hidden="true"><span class="switch__thumb"></span></span>
              <span class="switch__label">High contrast</span>
            </label>
          </div>
          <div class="setting">
            <label class="setting__label" for="c-text">Text size <output id="c-text-out">${Math.round((Number(s.textScale) || 1) * 100)}%</output></label>
            <input class="range" id="c-text" type="range" name="textScale" min="0.9" max="1.5" step="0.05" value="${Number(s.textScale) || 1}">
          </div>
          <p class="c-small">High contrast, text size and motion are the same settings as on the main site, for your account.</p>
        </form>`,
      actions: [{ label: 'Done', variant: 'primary', value: 'done' }],
      onOpen: (dlg) => {
        const form = dlg.querySelector('[data-display]');
        const out = dlg.querySelector('#c-text-out');
        form.addEventListener('submit', (e) => e.preventDefault());
        form.addEventListener('input', (e) => {
          const t = e.target;
          if (t.name === 'look') {
            try { window.localStorage.setItem(LOOK_KEY, t.value); } catch (err) { /* ignore */ }
            applyLook();
          } else if (t.name === 'contrast') {
            T.settings.set('contrast', t.checked ? 'high' : 'standard');
          } else if (t.name === 'textScale') {
            T.settings.set('textScale', Number(t.value));
            out.textContent = `${Math.round(Number(t.value) * 100)}%`;
          }
        });
      },
    });
  }

  /* ---------- The gate ---------- */
  function gateShell(root, o) {
    root.innerHTML = String(html`
      <main class="c-gate" id="console-main" tabindex="-1">
        <div class="c-gate__card">
          <div class="c-gate__brand">
            <span class="c-gate__eye" aria-hidden="true">${raw(T.fx.eyeSVG('gate-eye'))}</span>
            <p class="c-gate__name"><span lang="fil">Tanawan</span><span>the lookout: Tanaw's administrator console</span></p>
          </div>
          <h1 class="c-gate__title" tabindex="-1">${o.title}</h1>
          ${fileOriginNote()}
          ${o.status || ''}
          ${o.body}
          <details class="c-gate__truth">
            <summary>What this gate is, and is not</summary>
            <p>This is a page check that runs in your browser. It decides what this page shows, and it protects nothing: anyone with this device could read or change the data directly.</p>
            <p>A real console needs a server that checks who you are and your role on every request. <code>docs/backend-integration.md</code> marks where that connects.</p>
          </details>
          <p class="c-gate__back"><a href="index.html">${T.icon('arrow-left')}<span>Back to Tanaw</span></a></p>
        </div>
      </main>`);
    const eye = root.querySelector('.gate-eye');
    const title = root.querySelector('.c-gate__title');
    return { eye, title };
  }

  const STATUS = {
    loggedout: () => html`<p class="c-ok" role="status">${T.icon('check-circle')}<span><strong>You have logged out of the console.</strong> The session has ended in every tab.</span></p>`,
    ended: () => html`<p class="c-warn" role="status">${T.icon('info')}<span>Your session has ended. Log in again to continue.</span></p>`,
  };

  function gateLogin(root, status, signal) {
    const g = gateShell(root, {
      title: 'Administrator login',
      status: status ? STATUS[status]() : '',
      body: html`
        <p class="c-gate__demo">${T.icon('flask')}<span><strong>Demonstration.</strong> Accounts live only in this browser. Please do not reuse a real password.</span></p>
        ${T.auth.supported() ? '' : html`<p class="c-warn">${T.icon('lock')}<span>Accounts need a secure page: open Tanaw over https, from localhost, or straight from its folder.</span></p>`}
        <form class="gate__form" data-console-login novalidate>
          ${C.errorSummary()}
          ${C.field({ id: 'c-email', name: 'email', label: 'Email address', type: 'email', autocomplete: 'username', inputmode: 'email', spellcheck: false, maxlength: 254 })}
          ${C.field({ id: 'c-password', name: 'password', label: 'Password', type: 'password', autocomplete: 'current-password', reveal: true, maxlength: 128 })}
          <button type="submit" class="btn btn--primary btn--block btn--lg" ${T.auth.supported() ? '' : raw('disabled')}><span>Log in to the console</span>${T.icon('arrow-right')}</button>
        </form>`,
    });
    const form = root.querySelector('[data-console-login]');
    const eye = C.watchEye(form, g.eye, signal);
    C.wireForm(form, { checks: { email: (v) => T.auth.checkEmail(v).error } });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      C.clearErrors(form);
      const done = C.busy(form.querySelector('[type="submit"]'), 'Logging in…');
      try {
        await C.atLeast(T.auth.login({ email: form.email.value, password: form.password.value }));
        // auth:change redraws the page: the console for an administrator, a clear refusal for anyone else.
      } catch (err) {
        if (signal.aborted) return;
        done();
        if (!(err instanceof T.AuthError)) console.error('[Tanawan] login failed', err);
        form.password.value = '';
        eye.wrong();
        C.showErrors(form, err);
        C.lockCountdown(form, err.lockedFor, signal);
      }
    }, { signal });
    form.querySelector('input').focus({ preventScroll: true });
  }

  function gateSetup(root, signal) {
    const g = gateShell(root, {
      title: 'Set up this device’s first administrator',
      body: html`
        <p class="c-gate__demo">${T.icon('flask')}<span><strong>Demonstration.</strong> No administrator exists in this browser yet, and Tanaw ships with no built-in password. Whoever opens this page first creates one. A real system would never work this way.</span></p>
        ${T.auth.supported() ? '' : html`<p class="c-warn">${T.icon('lock')}<span>Accounts need a secure page: open Tanaw over https, from localhost, or straight from its folder.</span></p>`}
        <form class="gate__form" data-console-setup novalidate>
          ${C.errorSummary()}
          ${C.field({ id: 'c-name', name: 'name', label: 'Your name', autocomplete: 'name', maxlength: 40 })}
          ${C.field({ id: 'c-email', name: 'email', label: 'Email address', type: 'email', autocomplete: 'email', inputmode: 'email', spellcheck: false, maxlength: 254 })}
          ${C.field({ id: 'c-password', name: 'password', label: 'Password', type: 'password', autocomplete: 'new-password', reveal: true, maxlength: 128, after: C.strengthMeter('c-password') })}
          ${C.field({ id: 'c-confirm', name: 'confirm', label: 'Type the password again', type: 'password', autocomplete: 'new-password', reveal: true, maxlength: 128 })}
          <button type="submit" class="btn btn--primary btn--block btn--lg" ${T.auth.supported() ? '' : raw('disabled')}><span>Create administrator</span>${T.icon('arrow-right')}</button>
        </form>`,
    });
    const form = root.querySelector('[data-console-setup]');
    const eye = C.watchEye(form, g.eye, signal);
    const context = () => ({ name: form.name.value, email: form.email.value });
    C.wireForm(form, {
      context,
      checks: {
        name: (v) => T.auth.checkName(v).error,
        email: (v) => T.auth.checkEmail(v).error,
        password: (v) => T.auth.checkPassword(v, context()).errors[0] || '',
        confirm: (v) => (v === form.password.value ? '' : 'The passwords do not match.'),
      },
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      C.clearErrors(form);
      const name = T.auth.checkName(form.name.value);
      const email = T.auth.checkEmail(form.email.value);
      const pw = T.auth.checkPassword(form.password.value, { name: name.value, email: email.value });
      const fields = {};
      if (name.error) fields.name = name.error;
      if (email.error) fields.email = email.error;
      if (!pw.ok) fields.password = pw.errors[0];
      if (form.confirm.value !== form.password.value) fields.confirm = 'The passwords do not match.';
      if (Object.keys(fields).length) { eye.wrong(); C.showErrors(form, new T.AuthError('Check the highlighted fields.', fields)); return; }
      const done = C.busy(form.querySelector('[type="submit"]'), 'Creating…');
      try {
        const user = await C.atLeast(T.backend.createFirstAdmin({ name: name.value, email: email.value, password: form.password.value }));
        T.store.useProfile(user.id);
        T.settings.apply();
        T.auth.setCurrent(user, 'login');
      } catch (err) {
        if (signal.aborted) return;
        done();
        if (!(err instanceof T.AuthError)) console.error('[Tanawan] setup failed', err);
        eye.wrong();
        C.showErrors(form, err);
      }
    }, { signal });
    form.querySelector('input').focus({ preventScroll: true });
  }

  function gateRefused(root, signal) {
    const u = T.auth.user();
    gateShell(root, {
      title: u.mustChange ? 'Choose a new password first' : 'This account is not an administrator',
      body: u.mustChange
        ? html`
          <p>You are logged in as <strong>${u.name}</strong> with a temporary password. Choose your own on your account page, then come back.</p>
          <div class="btn-row"><a class="btn btn--primary" href="index.html#/account?change=1">Go to your account</a><button type="button" class="btn btn--ghost" data-logout>Log out</button></div>`
        : html`
          <p>You are logged in as <strong>${u.name}</strong>, a learner. Only an administrator can use this console. An administrator can change your role under People.</p>
          <div class="btn-row"><a class="btn btn--primary" href="index.html">Back to Tanaw</a><button type="button" class="btn btn--ghost" data-logout>Log out and use another account</button></div>`,
    });
    root.querySelector('[data-logout]').addEventListener('click', () => T.auth.logout(), { signal });
    root.querySelector('.c-gate__title').focus({ preventScroll: true });
  }

  /* ---------- The console: rail + one section at a time ---------- */
  function parse() {
    const raw_ = window.location.hash.replace(/^#\/?/, '');
    const [path, q = ''] = raw_.split('?');
    let query = {};
    try { query = Object.fromEntries(new URLSearchParams(q)); } catch (e) { query = {}; }
    return { id: path || SECTIONS[0].id, query };
  }

  function drawShell(root, signal) {
    const u = T.auth.user();
    root.innerHTML = String(html`
      <div class="console">
        <aside class="rail">
          <a class="rail__brand" href="#/overview" aria-label="Tanawan: overview">
            <span class="rail__eye" aria-hidden="true">${raw(T.fx.eyeSVG('rail-eye'))}</span>
            <span class="rail__name"><span lang="fil">Tanawan</span><small>the lookout</small></span>
          </a>
          <nav class="rail__nav" aria-label="Console sections">
            <ul>
              ${SECTIONS.map((s) => html`<li><a class="rail__link" href="#/${s.id}" data-section="${s.id}"><span class="rail__bead" aria-hidden="true"></span>${T.icon(s.icon)}<span>${s.label}</span></a></li>`)}
            </ul>
          </nav>
          <div class="rail__foot">
            <p class="rail__who"><strong>${u.name}</strong><span>${u.email}</span></p>
            <div class="rail__tools">
              <button type="button" class="rail__tool" data-console-display>${T.icon('sliders')}<span>Display</span></button>
              <a class="rail__tool" href="index.html">${T.icon('eye')}<span>Public site</span></a>
              <button type="button" class="rail__tool" data-logout>${T.icon('arrow-left')}<span>Log out</span></button>
            </div>
          </div>
        </aside>
        <div class="console__main">
          <header class="c-top">
            <p class="c-strip">${T.icon('flask')}<span><strong>Demonstration.</strong> This console works only in this browser and is not a security boundary. <a href="#/system">What a real one needs</a></span></p>
            ${fileOriginNote()}
          </header>
          <main class="c-page" id="console-main" tabindex="-1"></main>
        </div>
      </div>`);
    root.querySelector('[data-console-display]').addEventListener('click', openDisplay, { signal });
    root.querySelector('[data-logout]').addEventListener('click', () => { wasLoggedIn = 'loggedout'; T.auth.logout(); }, { signal });
    return root.querySelector('#console-main');
  }

  let shellCtl = null;     // alive while the console's frame is on screen
  let sectionCtl = null;   // alive while one section is on screen
  let mainEl = null;
  let wasLoggedIn = null;  // why the gate is back: 'loggedout' | 'ended'
  let freshPage = true;    // nothing has been drawn since the page loaded

  async function drawSection(focusHeading) {
    if (!mainEl) return;
    const { id, query } = parse();
    const def = SECTIONS.find((s) => s.id === id);
    if (sectionCtl) sectionCtl.abort();
    sectionCtl = new AbortController();
    const { signal } = sectionCtl;
    U.$$('.rail__link').forEach((a) => {
      if (def && a.dataset.section === def.id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const active = document.querySelector('.rail__link[aria-current]');
    if (active && active.scrollIntoView && window.matchMedia('(max-width: 859px)').matches) active.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (!def) {
      mainEl.innerHTML = String(html`${K.head({ title: 'Section not found', lead: 'That part of the console does not exist.' })}<a class="btn btn--primary" href="#/overview">Go to the overview</a>`);
      document.title = 'Not found · Tanawan';
      return;
    }
    document.title = `${def.label} · Tanawan`;
    try {
      await def.render(mainEl, query, { signal });
    } catch (err) {
      if (signal.aborted) return;
      console.error('[Tanawan] section failed', err);
      mainEl.innerHTML = String(html`${K.head({ title: 'Something went wrong', lead: err && err.message ? err.message : 'This section could not be shown.' })}`);
    }
    if (signal.aborted) return;
    if (focusHeading) {
      const h = mainEl.querySelector('h1');
      if (h) h.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      T.ui.announce(def.label);
    }
  }
  /** Redraw the section on screen after a change. */
  K.refresh = () => drawSection(false);

  async function draw() {
    const root = document.getElementById('console-root');
    if (shellCtl) shellCtl.abort();
    if (sectionCtl) sectionCtl.abort();
    shellCtl = new AbortController();
    const { signal } = shellCtl;
    mainEl = null;
    // A fresh page starts at its top, with the skip link first. After the gate, focus has to leave the form that just went away.
    const startAtTop = freshPage;
    freshPage = false;
    const u = T.auth.user();
    document.title = 'Tanawan · Tanaw administrator console';
    if (!u) {
      const has = await T.backend.hasAdmin();
      if (signal.aborted) return;
      const status = wasLoggedIn;
      wasLoggedIn = null;
      if (has) gateLogin(root, status, signal);
      else gateSetup(root, signal);
      return;
    }
    if (!T.auth.isAdmin() || u.mustChange) {
      gateRefused(root, signal);
      return;
    }
    mainEl = drawShell(root, signal);
    if (!window.location.hash) {
      try { window.history.replaceState(null, '', '#/overview'); } catch (e) { /* file:// in some browsers */ }
    }
    await drawSection(!startAtTop);
  }

  K.start = () => {
    T.bus.on('auth:change', ({ reason }) => {
      if (reason !== 'update') {
        if (!T.auth.user() && !wasLoggedIn) wasLoggedIn = reason === 'logout' ? 'loggedout' : 'ended';
        draw();
      } else if (mainEl) {
        draw();
      }
    });
    // Another tab or a restored backup changed the accounts: show what is true now.
    T.bus.on('accounts:change', () => { if (mainEl) K.refresh(); });
    T.bus.on('settings:applied', applyLook);
    window.addEventListener('hashchange', () => { if (mainEl) drawSection(true); });
    const skip = document.querySelector('[data-console-skip]');
    if (skip) {
      skip.addEventListener('click', (e) => {
        e.preventDefault();
        const main = document.getElementById('console-main');
        if (main) main.focus();
      });
    }
    draw();
  };
})();
