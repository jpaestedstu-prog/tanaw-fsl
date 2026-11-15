/* =========================================================================
   Tanaw — the demo backend's administrator methods (T.backend.admin)

   INTEGRATION POINT, loaded only by admin.html. Each method here is what an
   admin API endpoint would do; docs/backend-integration.md lists them.

   The role check below is a courtesy, not protection: this code runs on the
   visitor's device, where it can be read, changed or skipped. A real backend
   must check the session and the role on the server, on every request.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const AuthError = T.AuthError;
  const I = T.backend.internal;
  const REVIEW = 'tanaw.review.v1';

  function requireAdmin() {
    I.reloadDb();
    const u = I.requireUser();
    if (u.role !== 'admin' || u.status !== 'active') throw new AuthError('Only an administrator can do this.');
    return u;
  }

  /** Changes that would leave the device without an active administrator are refused. */
  function guardLastAdmin(target, change) {
    const others = I.activeAdmins().filter((a) => a.id !== target.id);
    if (target.role === 'admin' && target.status === 'active' && !others.length) {
      throw new AuthError(`${change} would leave this device without an administrator. Make someone else an administrator first.`);
    }
  }

  /** A temporary password: Filipino sky and sea words, so it can be read out and typed easily. */
  function tempPassword() {
    const words = ['araw', 'buwan', 'tala', 'alon', 'ulap', 'hangin', 'bundok', 'ilog', 'dagat', 'bituin', 'sinag', 'liwanag'];
    const pick = () => words[I.bytes(1)[0] % words.length];
    return `${pick()}-${pick()}-${(I.bytes(2)[0] % 90) + 10}${pick()}`;
  }

  const readReviews = () => I.read(REVIEW, {}) || {};

  const admin = {
    async listUsers() { requireAdmin(); return I.db().users.map(I.publicUser); },

    /** Create an account with a temporary password, which its owner must change at first login. */
    async createUser(input) {
      I.requireCrypto();
      requireAdmin();
      if (I.byEmail(input.email)) throw new AuthError('Check the highlighted fields.', { email: 'An account with this email already exists.' });
      const temp = tempPassword();
      const salt = I.newSalt();
      const u = I.makeUser({ name: input.name, email: input.email, role: input.role, mustChange: true, sample: !!input.sample }, await I.derive(temp, salt, I.ITERATIONS), salt);
      I.db().users.push(u);
      I.log(input.sample ? 'sample.added' : 'account.created', { target: u, note: input.sample ? '' : `as ${T.auth.ROLES[u.role]}` });
      I.save();
      return { user: I.publicUser(u), temp };
    },

    async setRole(id, role) {
      requireAdmin();
      const u = I.byId(id);
      if (!u || !T.auth.ROLES[role] || u.role === role) return;
      if (role !== 'admin') guardLastAdmin(u, 'Removing this administrator');
      const was = u.role;
      u.role = role;
      I.log('role.changed', { target: u, note: `${T.auth.ROLES[was]} → ${T.auth.ROLES[role]}` });
      I.save();
    },

    async setStatus(id, status) {
      const me = requireAdmin();
      const u = I.byId(id);
      if (!u || u.status === status || !['active', 'disabled'].includes(status)) return;
      if (u.id === me.id) throw new AuthError('You cannot disable your own account.');
      if (status === 'disabled') guardLastAdmin(u, 'Disabling this administrator');
      u.status = status;
      if (status === 'disabled') u.tokens = [];
      I.log(status === 'disabled' ? 'account.disabled' : 'account.enabled', { target: u });
      I.save();
    },

    async unlock(id) {
      requireAdmin();
      const u = I.byId(id);
      if (!u) return;
      u.lockedUntil = 0;
      u.failed = 0;
      u.locks = 0;
      I.log('account.unlocked', { target: u });
      I.save();
    },

    /** A new temporary password: every session of that account ends. */
    async resetPassword(id) {
      I.requireCrypto();
      const me = requireAdmin();
      const u = I.byId(id);
      if (!u) throw new AuthError('That account no longer exists.');
      if (u.id === me.id) throw new AuthError('Change your own password on your account page.');
      const temp = tempPassword();
      u.salt = I.newSalt();
      u.hash = await I.derive(temp, u.salt, I.ITERATIONS);
      u.iter = I.ITERATIONS;
      u.mustChange = true;
      u.tokens = [];
      u.lockedUntil = 0;
      u.failed = 0;
      I.log('password.reset', { target: u, note: 'temporary password issued' });
      I.save();
      return temp;
    },

    async removeUser(id) {
      const me = requireAdmin();
      const u = I.byId(id);
      if (!u) return;
      if (u.id === me.id) throw new AuthError('Delete your own account from your account page.');
      guardLastAdmin(u, 'Deleting this administrator');
      I.log('account.deleted', { target: u, note: 'by an administrator' });
      I.db().users = I.db().users.filter((x) => x.id !== u.id);
      I.drop(T.store.profileKey(u.id));
      I.save();
    },

    /** Progress figures per account, read from each account's own storage. Never journals. */
    async stats() {
      requireAdmin();
      return I.db().users.map((u) => {
        const st = I.read(T.store.profileKey(u.id), null) || {};
        const p = st.progress || {};
        return {
          id: u.id,
          xp: Number(p.xp) || 0,
          lessons: Object.keys(p.lessons || {}).length,
          games: Object.keys(st.games || {}).filter((g) => (st.games[g] || {}).plays > 0).length,
          words: Object.keys(p.selfcheck || {}).length,
        };
      });
    },

    async listEvents() { requireAdmin(); return I.db().events.slice(); },

    async clearEvents() {
      requireAdmin();
      I.db().events = [];
      I.log('log.cleared');
      I.save();
    },

    async site() { requireAdmin(); return JSON.parse(JSON.stringify(I.site())); },

    /** Publish or remove (null) the notice shown at the top of the public site. */
    async setNotice(n) {
      requireAdmin();
      const site = I.site();
      if (!n) {
        site.notice = null;
        I.log('site.notice', { note: 'removed' });
      } else {
        site.notice = { id: U.uid('nt'), text: n.text, tone: n.tone === 'important' ? 'important' : 'info', until: n.until || '', at: Date.now() };
        I.log('site.notice', { note: 'published' });
      }
      I.save();
      I.saveSite();
    },

    async setRegistration(value) {
      requireAdmin();
      const site = I.site();
      if (site.registration === value) return;
      site.registration = value === 'closed' ? 'closed' : 'open';
      I.log('site.registration', { note: site.registration === 'open' ? 'open to everyone' : 'closed: administrators create accounts' });
      I.save();
      I.saveSite();
    },

    /* ---------- The content review ledger ---------- */
    async listReviews() { requireAdmin(); return readReviews(); },

    /** Record a review of one content item. status 'none' clears the record. */
    async saveReview(key, record, meta = {}) {
      const me = requireAdmin();
      const all = readReviews();
      if (record.status === 'none') delete all[key];
      else all[key] = { status: record.status, reviewer: record.reviewer || '', note: record.note || '', at: Date.now(), by: me.name };
      if (!I.write(REVIEW, all)) throw new AuthError('This browser could not save the review. Its storage may be full or blocked.');
      I.log('review.saved', { targetName: meta.title || key, note: meta.statusLabel || record.status, world: meta.world || '' });
      I.save();
      return all;
    },

    /* ---------- Data ---------- */
    /** What Tanaw keeps in this browser, in bytes by kind. */
    async usage() {
      requireAdmin();
      const out = { accounts: 0, reviews: 0, site: 0, progress: 0, guest: 0, profiles: 0 };
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (!k || !k.startsWith('tanaw.')) continue;
          const n = (window.localStorage.getItem(k) || '').length;
          if (k === I.ACCOUNTS) out.accounts += n;
          else if (k === REVIEW) out.reviews += n;
          else if (k === I.SITE) out.site += n;
          else if (k === T.store.KEY) out.guest += n;
          else if (k.startsWith(`${T.store.KEY}.u.`)) { out.progress += n; out.profiles += 1; }
        }
      } catch (e) { /* storage unavailable */ }
      return out;
    },

    /** A backup of accounts, the log, site settings and the ledger. Sessions are not part of a backup. */
    async exportData() {
      requireAdmin();
      I.log('data.exported');
      I.save();
      const db = I.db();
      const accounts = { version: 1, users: db.users.map((u) => Object.assign({}, u, { tokens: [] })), events: db.events };
      return JSON.stringify({ app: 'tanaw', kind: 'console-backup', version: 1, exportedAt: new Date().toISOString(), accounts, site: I.site(), reviews: readReviews() }, null, 2);
    },

    async importData(text) {
      const me = requireAdmin();
      let data;
      try { data = JSON.parse(text); } catch (e) { throw new AuthError('That file is not valid JSON.'); }
      if (!data || data.app !== 'tanaw' || data.kind !== 'console-backup' || !data.accounts || !Array.isArray(data.accounts.users)) {
        throw new AuthError('That file is not a Tanawan backup.');
      }
      const valid = data.accounts.users.filter((u) => u && u.id && u.email && u.salt && u.hash && T.auth.ROLES[u.role]).map((u) => Object.assign({}, u, { tokens: [] }));
      if (!valid.some((u) => u.role === 'admin' && u.status === 'active')) throw new AuthError('That backup has no active administrator, so it was not restored.');
      const session = I.readSession();
      I.setDb({ version: 1, users: valid, events: Array.isArray(data.accounts.events) ? data.accounts.events : [] });
      I.setSite(Object.assign({}, I.SITE_DEFAULTS, data.site || {}));
      I.write(REVIEW, data.reviews && typeof data.reviews === 'object' ? data.reviews : {});
      // Everyone logs in again, except the administrator restoring it, if their account is in the backup.
      const stillHere = I.byId(me.id);
      if (stillHere && session && stillHere.status === 'active' && stillHere.role === 'admin') stillHere.tokens = [{ token: session.token, issued: Date.now() }];
      else I.clearSession();
      I.log('data.restored', { actor: stillHere || me, note: U.plural(valid.length, 'account') });
      I.save();
      I.saveSite();
    },

    /** Clearly labeled sample learners, so the console can be shown with something in it. */
    async addSamples(count = 4) {
      requireAdmin();
      const start = I.db().users.filter((u) => u.sample).length + 1;
      for (let i = 0; i < count; i++) {
        const n = start + i;
        // eslint-disable-next-line no-await-in-loop
        await admin.createUser({ name: `Sample learner ${n}`, email: `sample${n}@example.com`, role: 'learner', sample: true });
      }
    },

    async removeSamples() {
      requireAdmin();
      const samples = I.db().users.filter((u) => u.sample);
      samples.forEach((u) => I.drop(T.store.profileKey(u.id)));
      I.db().users = I.db().users.filter((u) => !u.sample);
      I.log('sample.removed', { note: U.plural(samples.length, 'sample account') });
      I.save();
      return samples.length;
    },

    /** Delete every account, the log, the ledger and the site settings. The guest's progress stays. */
    async resetAll() {
      requireAdmin();
      I.db().users.forEach((u) => I.drop(T.store.profileKey(u.id)));
      I.setDb({ version: 1, users: [], events: [] });
      I.drop(I.ACCOUNTS);
      I.drop(I.SITE);
      I.drop(REVIEW);
      I.clearSession();
      I.setSite(Object.assign({}, I.SITE_DEFAULTS));
      I.listeners.forEach((fn) => fn('site'));
    },
  };

  T.backend.admin = admin;
})();
