/* =========================================================================
   Tanaw — the demo backend: a pretend server that lives in this browser

   INTEGRATION POINT. This is the one file to replace when a real backend
   exists. Everything else talks to T.backend and does not know where the data
   lives. docs/backend-integration.md maps each method below to its endpoint.

   Stored in this browser:
     tanaw.accounts.v1   accounts and the activity log
     tanaw.site.v1       the site notice and the registration policy
     tanaw.session.v1    the current session (localStorage, so tabs share it)
     tanaw.state.v1.u.*  each account's own progress (core/store.js)
     tanaw.review.v1     the content review ledger (admin/demo-admin.js)

   Passwords are never stored: each is hashed with PBKDF2-SHA-256 (Web Crypto)
   and a random salt. Sessions carry a random token that logging out revokes.
   Repeated failures lock an account for a while.

   NONE OF THIS IS SECURITY. There is no server: anyone with this device can
   read or change all of it, including giving themselves any role. Hashing and
   lockouts here only show how a real system should behave. A real backend must
   do all of it on the server, and must check the role on every request.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const AuthError = T.AuthError;

  const ACCOUNTS = 'tanaw.accounts.v1';
  const SITE = 'tanaw.site.v1';
  const SESSION = 'tanaw.session.v1';
  const ITERATIONS = 210000;
  const MAX_FAILS = 5;
  const LOCKS = [60e3, 5 * 60e3, 15 * 60e3]; // 1st, 2nd, then every later lock
  const SESSION_MS = 8 * 36e5;               // 8 hours
  const REMEMBER_MS = 30 * 864e5;            // "Keep me logged in": 30 days
  const EVENTS_MAX = 400;
  const SITE_DEFAULTS = { notice: null, registration: 'open' };

  /* ---------- Storage ---------- */
  const read = (key, fallback) => {
    try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  };
  const write = (key, value) => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  };
  const drop = (key) => { try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ } };

  function loadDb() {
    const d = read(ACCOUNTS, null);
    return d && Array.isArray(d.users) ? { version: 1, users: d.users, events: Array.isArray(d.events) ? d.events : [] } : { version: 1, users: [], events: [] };
  }
  let db = loadDb();
  let site = Object.assign({}, SITE_DEFAULTS, read(SITE, {}));
  const save = () => {
    if (!write(ACCOUNTS, db)) throw new AuthError('This browser could not save the account. Its storage may be full or blocked.');
  };
  const saveSite = () => {
    write(SITE, site);
    listeners.forEach((fn) => fn('site'));
  };

  /* ---------- Crypto ---------- */
  const supported = () => !!(window.crypto && window.crypto.subtle && window.isSecureContext !== false);
  const bytes = (n) => window.crypto.getRandomValues(new Uint8Array(n));
  const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  const toB64 = (buf) => btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
  const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function derive(password, salt, iterations) {
    const key = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await window.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(salt), iterations }, key, 256);
    return toB64(bits);
  }
  /** Compare without stopping at the first difference. */
  const sameText = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  };
  function requireCrypto() {
    if (!supported()) throw new AuthError('Accounts need a secure page: open Tanaw over https, from localhost, or straight from its folder.');
  }
  const newSalt = () => toB64(bytes(16));
  const verify = async (u, password) => sameText(await derive(String(password || ''), u.salt, u.iter), u.hash);

  /* ---------- Users and the activity log ---------- */
  const normEmail = (e) => String(e || '').trim().toLowerCase();
  const byId = (id) => db.users.find((u) => u.id === id) || null;
  const byEmail = (email) => db.users.find((u) => u.email === normEmail(email)) || null;
  const activeAdmins = () => db.users.filter((u) => u.role === 'admin' && u.status === 'active');
  /** What the interface may see: never the hash, the salt or session tokens. */
  const publicUser = (u) => (u ? {
    id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt || null, mustChange: !!u.mustChange, sample: !!u.sample, lockedUntil: u.lockedUntil || 0,
  } : null);

  function log(type, opts = {}) {
    const actor = opts.actor !== undefined ? opts.actor : currentUser();
    const target = opts.target || null;
    db.events.unshift({
      id: U.uid('ev'), t: Date.now(), type,
      actor: actor ? actor.id : null, actorName: actor ? actor.name : '',
      target: target ? target.id : null, targetName: target ? target.name : (opts.targetName || ''),
      note: opts.note || '', world: opts.world || '',
    });
    if (db.events.length > EVENTS_MAX) db.events.length = EVENTS_MAX;
  }
  const maskEmail = (email) => {
    const [a, b] = normEmail(email).split('@');
    return a && b ? `${a.slice(0, 2)}${'•'.repeat(Math.max(1, Math.min(6, a.length - 2)))}@${b}` : '(unknown)';
  };

  function makeUser(input, hash, salt) {
    return {
      id: `u_${hex(bytes(8))}`, name: input.name, email: normEmail(input.email), role: input.role === 'admin' ? 'admin' : 'learner',
      status: 'active', createdAt: Date.now(), lastLoginAt: null, salt, hash, iter: ITERATIONS,
      failed: 0, locks: 0, lockedUntil: 0, mustChange: !!input.mustChange, tokens: [], sample: !!input.sample,
    };
  }

  /* ---------- Sessions ---------- */
  const readSession = () => read(SESSION, null);
  const clearSession = () => drop(SESSION);

  function startSession(u, remember) {
    const token = hex(bytes(16));
    const now = Date.now();
    u.tokens = (u.tokens || []).concat({ token, issued: now }).slice(-6);
    u.lastLoginAt = now;
    u.failed = 0;
    u.locks = 0;
    u.lockedUntil = 0;
    write(SESSION, { uid: u.id, token, issued: now, expires: now + (remember ? REMEMBER_MS : SESSION_MS), remember: !!remember });
  }

  /** The signed-in account behind the stored session, or null with the reason it ended. */
  function sessionState() {
    const s = readSession();
    if (!s || !s.uid) return { user: null, ended: null };
    const u = byId(s.uid);
    if (!u) return { user: null, ended: 'gone' };
    if (!(u.tokens || []).some((t) => t.token === s.token)) return { user: null, ended: 'revoked' };
    if (u.status !== 'active') return { user: null, ended: 'disabled' };
    if (Date.now() > (Number(s.expires) || 0)) return { user: null, ended: 'expired' };
    return { user: u, ended: null };
  }
  const currentUser = () => sessionState().user;

  function requireUser() {
    const u = currentUser();
    if (!u) throw new AuthError('Log in first.');
    return u;
  }

  /* ---------- Other tabs ---------- */
  const listeners = new Set();
  window.addEventListener('storage', (e) => {
    if (e.key === ACCOUNTS) { db = loadDb(); listeners.forEach((fn) => fn('accounts')); }
    else if (e.key === SESSION) listeners.forEach((fn) => fn('session'));
    else if (e.key === SITE) { site = Object.assign({}, SITE_DEFAULTS, read(SITE, {})); listeners.forEach((fn) => fn('site')); }
    else if (e.key === null) { db = loadDb(); listeners.forEach((fn) => fn('accounts')); }
  });

  /* The methods a real backend must provide. All but the first four return promises. */
  const backend = {
    mode: 'demo',

    /** Can this browser run the demo's password hashing? (A real backend always returns true.) */
    supported,

    /** Fast check before first paint, from what this browser remembers: { user, ended }. */
    restoreSession() {
      db = loadDb();
      const r = sessionState();
      if (!r.user && r.ended) {
        const s = readSession();
        const u = s && byId(s.uid);
        if (u && r.ended === 'expired') {
          u.tokens = (u.tokens || []).filter((t) => t.token !== s.token);
          log('logout.expired', { actor: u, target: u });
          try { save(); } catch (e) { /* ignore */ }
        }
        clearSession();
      }
      return { user: publicUser(r.user), ended: r.ended };
    },

    /** Public information about the site. */
    siteInfo() {
      const n = site.notice;
      const live = n && n.text && (!n.until || U.dateKey() <= n.until) ? n : null;
      return { notice: live, registration: site.registration };
    },

    /** kind: 'accounts' | 'session' | 'site', when another tab changes them. Returns an unsubscribe function. */
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** Re-read shared data, for example when a tab becomes visible again. */
    touch() { db = loadDb(); listeners.forEach((fn) => fn('session')); },

    /** Is there an active administrator yet? Decides whether admin.html offers first-time setup. */
    async hasAdmin() { db = loadDb(); return activeAdmins().length > 0; },

    async register(input) {
      requireCrypto();
      db = loadDb();
      if (site.registration === 'closed') throw new AuthError('New accounts on this device are created by an administrator.');
      if (byEmail(input.email)) {
        throw new AuthError('Check the highlighted fields.', { email: 'An account with this email already exists on this device. Log in instead.' });
      }
      const salt = newSalt();
      const u = makeUser({ name: input.name, email: input.email, role: 'learner' }, await derive(input.password, salt, ITERATIONS), salt);
      db.users.push(u);
      startSession(u, input.remember);
      log('account.registered', { actor: u, target: u });
      save();
      return publicUser(u);
    },

    /** First-time setup on this device: the first administrator, allowed only while there is none. */
    async createFirstAdmin(input) {
      requireCrypto();
      db = loadDb();
      if (activeAdmins().length) throw new AuthError('This device already has an administrator. Log in instead.');
      if (byEmail(input.email)) {
        throw new AuthError('Check the highlighted fields.', { email: 'An account with this email already exists. Choose another, or ask to have it made an administrator.' });
      }
      const salt = newSalt();
      const u = makeUser({ name: input.name, email: input.email, role: 'admin' }, await derive(input.password, salt, ITERATIONS), salt);
      db.users.push(u);
      startSession(u, input.remember);
      log('admin.setup', { actor: u, target: u, note: 'first administrator on this device' });
      save();
      return publicUser(u);
    },

    async login(input) {
      requireCrypto();
      db = loadDb();
      const u = byEmail(input.email);
      if (u && u.lockedUntil > Date.now()) {
        const secs = Math.ceil((u.lockedUntil - Date.now()) / 1000);
        throw new AuthError(`Too many attempts. This account is locked for ${secs < 90 ? `${secs} seconds` : `${Math.ceil(secs / 60)} minutes`}.`, {}, { lockedFor: secs });
      }
      // Hash even for an unknown email, so both cases take the same time.
      const ok = u ? await verify(u, input.password) : (await derive(String(input.password), newSalt(), ITERATIONS), false);
      if (!ok) {
        if (u) {
          u.failed = (u.failed || 0) + 1;
          log('login.failed', { actor: null, target: u });
          if (u.failed >= MAX_FAILS) {
            u.locks = (u.locks || 0) + 1;
            const ms = LOCKS[Math.min(u.locks, LOCKS.length) - 1];
            u.lockedUntil = Date.now() + ms;
            u.failed = 0;
            log('account.locked', { actor: null, target: u, note: `${Math.round(ms / 60e3)} min after ${MAX_FAILS} failed logins` });
          }
        } else {
          log('login.failed', { actor: null, targetName: maskEmail(input.email), note: 'no account with this email' });
        }
        save();
        throw new AuthError('The email or password is not right. Check them and try again.', { password: ' ' });
      }
      if (u.status !== 'active') {
        log('login.blocked', { actor: null, target: u, note: 'account disabled' });
        save();
        throw new AuthError('This account is disabled. Ask an administrator on this device.');
      }
      startSession(u, input.remember);
      log('login', { actor: u, target: u, note: input.remember ? 'kept logged in on this device' : '' });
      save();
      return publicUser(u);
    },

    async logout() {
      db = loadDb();
      const s = readSession();
      const u = s && byId(s.uid);
      if (u) {
        u.tokens = (u.tokens || []).filter((t) => t.token !== s.token);
        log('logout', { actor: u, target: u });
        try { save(); } catch (e) { /* ignore */ }
      }
      clearSession();
    },

    async updateProfile(input) {
      db = loadDb();
      const u = requireUser();
      const email = normEmail(input.email);
      if (email !== u.email) {
        requireCrypto();
        if (byEmail(email)) throw new AuthError('Check the highlighted fields.', { email: 'Another account on this device uses this email.' });
        if (!(await verify(u, input.password))) throw new AuthError('Check the highlighted fields.', { password: 'Your password is not right.' });
      }
      const changed = [u.name !== input.name ? 'name' : '', email !== u.email ? 'email' : ''].filter(Boolean);
      u.name = input.name;
      u.email = email;
      if (changed.length) log('account.updated', { target: u, note: `${changed.join(' and ')} changed` });
      save();
      return publicUser(u);
    },

    async changePassword(input) {
      requireCrypto();
      db = loadDb();
      const u = requireUser();
      if (!(await verify(u, input.current))) throw new AuthError('Check the highlighted fields.', { current: 'Your current password is not right.' });
      u.salt = newSalt();
      u.hash = await derive(input.next, u.salt, ITERATIONS);
      u.iter = ITERATIONS;
      u.mustChange = false;
      // Other sessions of this account end; this one continues.
      const s = readSession();
      u.tokens = (u.tokens || []).filter((t) => s && t.token === s.token);
      log('password.changed', { target: u });
      save();
      return publicUser(u);
    },

    async deleteAccount(input) {
      requireCrypto();
      db = loadDb();
      const u = requireUser();
      if (u.role === 'admin' && activeAdmins().length === 1 && db.users.length > 1) {
        throw new AuthError('You are the only administrator here. Make someone else an administrator first, or delete the other accounts.');
      }
      if (!(await verify(u, input.password))) throw new AuthError('Check the highlighted fields.', { password: 'Your password is not right.' });
      log('account.deleted', { target: u, note: 'deleted by its owner' });
      db.users = db.users.filter((x) => x.id !== u.id);
      drop(T.store.profileKey(u.id));
      clearSession();
      save();
    },
  };

  /* Shared with the administrator's tools (admin/demo-admin.js), which only admin.html loads. */
  backend.internal = {
    read, write, drop, byId, byEmail, activeAdmins, publicUser, log, save, saveSite, requireUser, requireCrypto, currentUser,
    derive, newSalt, makeUser, listeners, readSession, clearSession, bytes, ITERATIONS, SITE_DEFAULTS, ACCOUNTS, SITE,
    db: () => db,
    setDb: (next) => { db = next; },
    reloadDb: () => { db = loadDb(); return db; },
    site: () => site,
    setSite: (next) => { site = next; },
  };

  T.backend = backend;
})();
