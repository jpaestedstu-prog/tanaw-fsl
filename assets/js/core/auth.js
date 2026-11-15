/* =========================================================================
   Tanaw — accounts, as the interface sees them

   Everything the pages use: who is signed in, form rules, and the calls that
   log people in and out. Every call goes through one object, T.backend, which
   stands in for a server. In this build T.backend is core/backend-demo.js,
   which keeps everything in this browser.

   THIS IS A FRONTEND DEMONSTRATION, NOT SECURE AUTHENTICATION. Nothing here
   can protect anything: all of it runs on the visitor's device and can be
   changed there. To connect a real backend, replace core/backend-demo.js with
   an implementation of the same methods. docs/backend-integration.md lists
   each method, the endpoint it maps to, and what must move to the server.

   Events on T.bus:
     auth:change  { user, reason }   someone signed in or out, or their details changed
     site:change                     the site notice or the registration policy changed
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;

  /** An error the interface can show. `fields` maps a field name to its message; `lockedFor` is in seconds. */
  class AuthError extends Error {
    constructor(message, fields = {}, extra = {}) {
      super(message);
      this.fields = fields;
      Object.assign(this, extra);
    }
  }
  T.AuthError = AuthError;

  const ROLES = { learner: 'Learner', admin: 'Administrator' };

  /* ---------- Form rules: instant feedback for people. A real server must check these again. ---------- */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const COMMON = ['password', 'password1', 'password123', '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000',
    'qwerty123', 'qwertyuiop', 'iloveyou', 'sunshine', 'princess', 'football', 'baseball', 'welcome1', 'welcome123', 'admin123',
    'letmein1', 'abc12345', 'abcd1234', 'passw0rd', 'pilipinas', 'philippines', 'mabuhay1', 'tanaw123', 'tanawtanaw', 'asdfghjkl',
    'zxcvbnm1', 'monkey12', 'dragon12', 'trustno1', 'superman', 'batman12', 'iloveyou1', 'mahalkita', 'jesus123', 'manila123'];
  const SEQUENCES = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiopasdfghjklzxcvbnm'];
  const normEmail = (e) => String(e || '').trim().toLowerCase();

  function checkName(name) {
    const v = String(name || '').trim().replace(/\s+/g, ' ');
    if (!v) return { value: v, error: 'Enter your name.' };
    if (v.length > 40) return { value: v, error: 'Use at most 40 characters.' };
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f<>]/.test(v)) return { value: v, error: 'Use letters, numbers and ordinary punctuation.' };
    return { value: v, error: '' };
  }

  function checkEmail(email) {
    const v = normEmail(email);
    if (!v) return { value: v, error: 'Enter your email address.' };
    if (v.length > 254 || !EMAIL.test(v)) return { value: v, error: 'Enter an email address like name@example.com.' };
    return { value: v, error: '' };
  }

  /**
   * Password rules follow current guidance (NIST SP 800-63B): a minimum length, a maximum
   * generous enough for passphrases, no forced symbol rules, and a check against guessable
   * passwords. `rules` drives the live checklist.
   */
  function checkPassword(pw, ctx = {}) {
    const v = String(pw || '');
    const lower = v.toLowerCase();
    const length = v.length >= 8 && v.length <= 128;
    const guessable = COMMON.includes(lower) || /^(.)\1+$/.test(v)
      || (v.length >= 6 && SEQUENCES.some((s) => s.includes(lower) || s.split('').reverse().join('').includes(lower)));
    // Any part of the name or of the email's first half, four letters or longer
    // (shorter parts, like "Ana", would also match ordinary words such as "banana").
    const parts = String(ctx.name || '').toLowerCase().split(/[^a-zà-ÿñ]+/)
      .concat(normEmail(ctx.email).split('@')[0].split(/[^a-z0-9]+/))
      .filter((w) => w.length >= 4);
    const personal = parts.some((w) => lower.includes(w));
    const errors = [];
    if (v.length < 8) errors.push('Use at least 8 characters.');
    if (v.length > 128) errors.push('Use at most 128 characters.');
    if (v.length >= 8 && guessable) errors.push('This password is too easy to guess.');
    if (personal) errors.push('Do not use your name or email address in your password.');
    let score = 0;
    if (!errors.length) {
      const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(v)).length;
      const words = v.trim().split(/[\s\-_.]+/).filter((w) => w.length >= 3).length;
      score = v.length >= 16 || words >= 4 ? 3 : v.length >= 12 ? 2 : 1;
      if (classes >= 3 || words >= 3) score += 1;
      score = Math.min(score, 4);
    }
    const labels = ['Not allowed', 'Weak', 'Fair', 'Good', 'Strong'];
    return { ok: !errors.length, errors, score, label: v ? labels[score] : '', rules: { length, guess: !!v && !guessable, personal: !!v && !personal } };
  }

  /* ---------- Who is here ---------- */
  let current = null;
  let notice = null; // why the last session ended, shown once on the next page

  function setUser(user, reason) {
    current = user;
    T.bus.emit('auth:change', { user, reason });
  }

  /** Called once at start-up, before the store loads, so the right person's data and display settings appear. */
  function restore() {
    const r = T.backend.restoreSession();
    current = r.user;
    notice = r.ended || null;
    if (current) T.store.useProfile(current.id);
  }

  /** Called once the page is up: keeps this tab in step with other tabs and with the backend. */
  function init() {
    T.backend.onChange((kind) => {
      if (kind === 'site') { T.bus.emit('site:change'); return; }
      if (kind === 'accounts' && current) T.bus.emit('accounts:change');
      const r = T.backend.restoreSession();
      const was = current;
      if (r.user && was && r.user.id === was.id) {
        // Same person: pick up any change (a new name, a new role).
        current = r.user;
        if (JSON.stringify(r.user) !== JSON.stringify(was)) T.bus.emit('auth:change', { user: r.user, reason: 'update' });
      } else if (!r.user && was) {
        notice = r.ended || 'elsewhere';
        T.store.useProfile(null);
        T.settings.apply();
        setUser(null, notice);
      } else if (r.user && (!was || r.user.id !== was.id)) {
        T.store.useProfile(r.user.id);
        T.settings.apply();
        setUser(r.user, 'switched');
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') T.backend.touch();
    });
  }

  /* ---------- Actions: each validates for the person, then asks the backend ---------- */
  async function register(input) {
    const name = checkName(input.name);
    const email = checkEmail(input.email);
    const pw = checkPassword(input.password, { email: email.value, name: name.value });
    const fields = {};
    if (name.error) fields.name = name.error;
    if (email.error) fields.email = email.error;
    if (!pw.ok) fields.password = pw.errors[0];
    if (!input.confirm) fields.confirm = 'Type your password again.';
    else if (input.confirm !== input.password) fields.confirm = 'The passwords do not match.';
    if (Object.keys(fields).length) throw new AuthError('Check the highlighted fields.', fields);
    const user = await T.backend.register({ name: name.value, email: email.value, password: input.password, remember: !!input.remember, role: input.role });
    T.store.useProfile(user.id, { bringGuest: !!input.bringGuest });
    T.settings.apply();
    setUser(user, 'register');
    return user;
  }

  async function login(input) {
    const email = checkEmail(input.email);
    const fields = {};
    if (email.error) fields.email = email.error;
    if (!input.password) fields.password = 'Enter your password.';
    if (Object.keys(fields).length) throw new AuthError('Check the highlighted fields.', fields);
    const user = await T.backend.login({ email: email.value, password: input.password, remember: !!input.remember });
    T.store.useProfile(user.id);
    T.settings.apply();
    setUser(user, 'login');
    return user;
  }

  function endLocal(reason, opts = {}) {
    T.store.useProfile(null, { discard: !!opts.discard });
    T.settings.apply();
    setUser(null, reason);
  }

  /** Log out: the session ends here and in every other tab, and the guest's data and settings return. */
  async function logout() {
    if (!current) return;
    await T.backend.logout();
    endLocal('logout');
  }

  async function updateProfile(input) {
    const name = checkName(input.name);
    const email = checkEmail(input.email);
    const fields = {};
    if (name.error) fields.name = name.error;
    if (email.error) fields.email = email.error;
    if (email.value !== current.email && !input.password) fields.password = 'Enter your password to change your email.';
    if (Object.keys(fields).length) throw new AuthError('Check the highlighted fields.', fields);
    const user = await T.backend.updateProfile({ name: name.value, email: email.value, password: input.password });
    current = user;
    T.bus.emit('auth:change', { user, reason: 'update' });
    return user;
  }

  async function changePassword(input) {
    const fields = {};
    if (!input.current) fields.current = 'Enter your current password.';
    const pw = checkPassword(input.next, { email: current.email, name: current.name });
    if (!pw.ok) fields.next = pw.errors[0];
    else if (input.next === input.current) fields.next = 'Choose a password different from the current one.';
    if (input.confirm !== input.next) fields.confirm = 'The passwords do not match.';
    if (Object.keys(fields).length) throw new AuthError('Check the highlighted fields.', fields);
    const user = await T.backend.changePassword({ current: input.current, next: input.next });
    current = user;
    T.bus.emit('auth:change', { user, reason: 'update' });
    return user;
  }

  async function deleteAccount(password) {
    if (!password) throw new AuthError('Enter your password.', { password: 'Enter your password.' });
    await T.backend.deleteAccount({ password });
    endLocal('deleted', { discard: true });
  }

  T.auth = {
    ROLES,
    checkName,
    checkEmail,
    checkPassword,
    restore,
    init,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    user: () => current,
    isAdmin: () => !!(current && current.role === 'admin' && current.status === 'active'),
    /** False where the browser cannot hash passwords (a plain http page that is not localhost). */
    supported: () => T.backend.supported(),
    registrationOpen: () => T.backend.siteInfo().registration !== 'closed',
    siteNotice: () => T.backend.siteInfo().notice,
    /** Why the last session ended (expired, ended in another tab…), once. */
    takeNotice: () => { const n = notice; notice = null; return n; },
    /** For the administrator's page, after signing in with a form. */
    setCurrent: (user, reason) => setUser(user, reason),
  };
})();
