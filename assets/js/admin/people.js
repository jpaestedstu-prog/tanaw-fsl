/* =========================================================================
   Tanawan — people (#/people): the accounts in this browser
   Who is here, what role they have, and the things only an administrator can
   do for them. A forgotten password is one of those: with no email, a temporary
   password handed over in person is the only way back in.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const K = T.console;
  const C = T.components;

  const A = () => T.backend.admin;
  const fail = (err) => T.ui.toast(err && err.message ? err.message : 'That did not work.', { icon: 'alert', tone: 'danger' });

  /** Shows a temporary password once, and says plainly how it must be handled. */
  function showTemp(name, temp) {
    T.ui.dialog({
      title: 'Temporary password',
      size: 'sm',
      body: html`
        <p>Give this to <strong>${name}</strong>. They will be asked to choose their own the next time they log in. It is not shown again.</p>
        <p class="c-temp"><code data-temp>${temp}</code></p>`,
      actions: [
        { label: 'Copy', variant: 'secondary', onClick: (dlg) => { U.copyText(dlg.querySelector('[data-temp]').textContent).then((ok) => T.ui.toast(ok ? 'Copied.' : 'Could not copy. Select the text instead.')); return false; } },
        { label: 'Done', variant: 'primary', value: 'done' },
      ],
    });
  }

  function manageDialog(u, me) {
    const self = u.id === me.id;
    const locked = u.lockedUntil > Date.now();
    T.ui.dialog({
      title: `Manage ${u.name}`,
      size: 'md',
      body: html`
        <p class="c-small">${u.email}${u.sample ? ' · Sample account' : ''} · Created ${K.fmtDate(u.createdAt)}</p>
        ${self ? html`<p class="c-note">${T.icon('info')}<span>This is your own account. Change your password or delete it on <a href="index.html#/account">your account page</a>.</span></p>` : ''}
        <div class="c-manage">
          <div class="c-manage__row">
            <div><p class="c-manage__title">Role</p><p class="c-small">An administrator can use this console. A learner cannot.</p></div>
            <div class="c-filter">
              <label class="visually-hidden" for="m-role">Role of ${u.name}</label>
              <select class="select" id="m-role" data-role>
                ${Object.entries(T.auth.ROLES).map(([k, v]) => html`<option value="${k}" ${u.role === k ? raw('selected') : ''}>${v}</option>`)}
              </select>
            </div>
          </div>
          ${self ? '' : html`
            <div class="c-manage__row">
              <div><p class="c-manage__title">${u.status === 'active' ? 'Disable' : 'Enable'} this account</p><p class="c-small">${u.status === 'active' ? 'They cannot log in, and any session ends at once.' : 'They can log in again.'}</p></div>
              <button type="button" class="btn btn--secondary" data-toggle-status>${u.status === 'active' ? 'Disable' : 'Enable'}</button>
            </div>
            ${locked ? html`
              <div class="c-manage__row">
                <div><p class="c-manage__title">Locked after failed logins</p><p class="c-small">Lets them try again now.</p></div>
                <button type="button" class="btn btn--secondary" data-unlock>Unlock</button>
              </div>` : ''}
            <div class="c-manage__row">
              <div><p class="c-manage__title">Reset password</p><p class="c-small">Issues a temporary password and ends their sessions.</p></div>
              <button type="button" class="btn btn--secondary" data-reset>Reset</button>
            </div>
            <div class="c-manage__row c-manage__row--danger">
              <div><p class="c-manage__title">Delete this account</p><p class="c-small">Removes the account and its progress from this browser. It cannot be undone.</p></div>
              <button type="button" class="btn btn--danger-ghost" data-remove>${T.icon('trash')}<span>Delete</span></button>
            </div>`}
        </div>`,
      actions: [{ label: 'Close', variant: 'primary', value: 'close' }],
      onOpen: (dlg) => {
        const act = (sel, fn) => { const b = dlg.querySelector(sel); if (b) b.addEventListener('click', fn); };
        const role = dlg.querySelector('[data-role]');
        role.addEventListener('change', async () => {
          try {
            await A().setRole(u.id, role.value);
            T.ui.toast(`${u.name} is now ${role.value === 'admin' ? 'an administrator' : 'a learner'}.`);
            // Changing your own role changes what you may see here.
            if (self) { dlg.close('role'); T.backend.touch(); return; }
            K.refresh();
          } catch (err) {
            role.value = u.role;
            fail(err);
          }
        });
        act('[data-toggle-status]', async () => {
          try {
            await A().setStatus(u.id, u.status === 'active' ? 'disabled' : 'active');
            T.ui.toast(u.status === 'active' ? `${u.name} is disabled.` : `${u.name} is enabled.`);
            dlg.close('status');
            K.refresh();
          } catch (err) { fail(err); }
        });
        act('[data-unlock]', async () => {
          try {
            await A().unlock(u.id);
            T.ui.toast(`${u.name} is unlocked.`);
            dlg.close('unlock');
            K.refresh();
          } catch (err) { fail(err); }
        });
        act('[data-reset]', async () => {
          try {
            const temp = await A().resetPassword(u.id);
            dlg.close('reset');
            K.refresh();
            showTemp(u.name, temp);
          } catch (err) { fail(err); }
        });
        act('[data-remove]', async () => {
          const ok = await T.ui.confirm({ title: `Delete ${u.name}?`, message: 'The account and its progress will be removed from this browser. This cannot be undone.', confirmLabel: 'Delete account', danger: true });
          if (!ok) return;
          try {
            await A().removeUser(u.id);
            T.ui.toast(`${u.name} was deleted.`);
            dlg.close('remove');
            K.refresh();
          } catch (err) { fail(err); }
        });
      },
    });
  }

  function addDialog() {
    T.ui.dialog({
      title: 'Add an account',
      size: 'sm',
      body: html`
        <form class="c-form" data-add novalidate>
          ${C.errorSummary()}
          ${C.field({ id: 'add-name', name: 'name', label: 'Name', autocomplete: 'off', maxlength: 40 })}
          ${C.field({ id: 'add-email', name: 'email', label: 'Email address', type: 'email', autocomplete: 'off', inputmode: 'email', spellcheck: false, maxlength: 254 })}
          <div class="field">
            <label class="field__label" for="add-role">Role</label>
            <select class="select" id="add-role" name="role">
              <option value="learner">Learner</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <p class="c-small">You will get a temporary password to hand over. They choose their own at first login.</p>
          <div class="btn-row c-form__actions">
            <button type="button" class="btn btn--ghost" data-dialog-close>Cancel</button>
            <button type="submit" class="btn btn--primary">Add account</button>
          </div>
        </form>`,
      onOpen: (dlg) => {
        const f = dlg.querySelector('[data-add]');
        C.wireForm(f, { checks: { name: (v) => T.auth.checkName(v).error, email: (v) => T.auth.checkEmail(v).error } });
        f.addEventListener('submit', async (e) => {
          e.preventDefault();
          C.clearErrors(f);
          const name = T.auth.checkName(f.name.value);
          const email = T.auth.checkEmail(f.email.value);
          const fields = {};
          if (name.error) fields.name = name.error;
          if (email.error) fields.email = email.error;
          if (Object.keys(fields).length) { C.showErrors(f, new T.AuthError('Check the highlighted fields.', fields)); return; }
          const done = C.busy(f.querySelector('[type="submit"]'), 'Adding…');
          try {
            const { user, temp } = await A().createUser({ name: name.value, email: email.value, role: f.role.value });
            dlg.close('added');
            K.refresh();
            showTemp(user.name, temp);
          } catch (err) {
            done();
            C.showErrors(f, err);
          }
        });
        f.querySelector('input').focus();
      },
    });
  }

  const COLS = [
    { id: 'name', label: 'Name', value: (u) => u.name.toLowerCase() },
    { id: 'role', label: 'Role', value: (u) => u.role },
    { id: 'login', label: 'Last login', value: (u) => u.lastLoginAt || 0 },
    { id: 'xp', label: 'XP', value: (u, s) => (s[u.id] ? s[u.id].xp : 0), num: true },
  ];

  K.section({
    id: 'people',
    label: 'People',
    icon: 'people',
    async render(el, query, { signal }) {
      const [users, statsList] = await Promise.all([A().listUsers(), A().stats()]);
      if (signal.aborted) return;
      const stats = Object.fromEntries(statsList.map((s) => [s.id, s]));
      const me = T.auth.user();
      const samples = users.filter((u) => u.sample).length;
      const state = { q: '', role: 'all', sort: 'name', dir: 1 };

      el.innerHTML = String(html`
        ${K.head({
          title: 'People',
          lead: `${U.plural(users.length, 'account')} in this browser. A real system would hold these on a server, and an administrator could not see passwords there either.`,
          actions: html`
            <button type="button" class="btn btn--primary" data-add-account>${T.icon('people')}<span>Add an account</span></button>
            ${samples
              ? html`<button type="button" class="btn btn--ghost" data-remove-samples>Remove ${U.plural(samples, 'sample account')}</button>`
              : html`<button type="button" class="btn btn--ghost" data-add-samples>Add sample learners</button>`}`,
        })}
        <div class="c-filters" role="search" aria-label="Filter accounts">
          <div class="c-filter c-filter--grow">
            <label class="field__label" for="p-q">Search</label>
            <input class="input" id="p-q" type="search" placeholder="Name or email" data-q>
          </div>
          <div class="c-filter">
            <label class="field__label" for="p-role">Role</label>
            <select class="select" id="p-role" data-role-filter>
              <option value="all">Everyone</option>
              <option value="admin">Administrators</option>
              <option value="learner">Learners</option>
            </select>
          </div>
        </div>
        <p class="visually-hidden" role="status" data-count></p>
        <div class="c-panel c-panel--table" data-table></div>`);

      const host = el.querySelector('[data-table]');
      const count = el.querySelector('[data-count]');
      const paint = (focusSort) => {
        const q = U.normalize(state.q);
        const col = COLS.find((c) => c.id === state.sort);
        const rows = users
          .filter((u) => state.role === 'all' || u.role === state.role)
          .filter((u) => !q || U.normalize(`${u.name} ${u.email}`).includes(q))
          .sort((a, b) => {
            const va = col.value(a, stats);
            const vb = col.value(b, stats);
            return (va < vb ? -1 : va > vb ? 1 : 0) * state.dir;
          });
        count.textContent = `${U.plural(rows.length, 'account')} shown`;
        host.innerHTML = String(rows.length ? html`
          <table class="c-table">
            <caption class="visually-hidden">Accounts in this browser</caption>
            <thead>
              <tr>
                ${COLS.map((c) => html`
                  <th scope="col" class="${c.num ? 'c-num' : ''}" aria-sort="${state.sort === c.id ? (state.dir > 0 ? 'ascending' : 'descending') : 'none'}">
                    <button type="button" class="c-sort" data-sort="${c.id}">${c.label}<span class="c-sort__mark" aria-hidden="true">${state.sort === c.id ? (state.dir > 0 ? '▲' : '▼') : ''}</span></button>
                  </th>`)}
                <th scope="col">Lessons</th>
                <th scope="col"><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((u) => {
                const s = stats[u.id] || {};
                const locked = u.lockedUntil > Date.now();
                return html`
                  <tr>
                    <th scope="row" data-label="Name" class="c-person">
                      <span class="c-person__name">${u.name}${u.id === me.id ? html` <span class="c-tag">You</span>` : ''}${u.sample ? html` <span class="c-tag">Sample</span>` : ''}</span>
                      <span class="c-person__email">${u.email}</span>
                    </th>
                    <td data-label="Role">
                      ${T.auth.ROLES[u.role]}
                      ${u.status !== 'active' ? html`<span class="c-state c-state--bad">${T.icon('x-circle')}<span>Disabled</span></span>` : ''}
                      ${locked ? html`<span class="c-state c-state--warn">${T.icon('lock')}<span>Locked</span></span>` : ''}
                      ${u.mustChange ? html`<span class="c-state">${T.icon('info')}<span>Temporary password</span></span>` : ''}
                    </td>
                    <td data-label="Last login">${K.ago(u.lastLoginAt)}</td>
                    <td data-label="XP" class="c-num">${s.xp || 0}</td>
                    <td data-label="Lessons">${s.lessons || 0}</td>
                    <td class="c-actions"><button type="button" class="btn btn--secondary btn--sm" data-manage="${u.id}" aria-label="Manage ${u.name}">Manage</button></td>
                  </tr>`;
              })}
            </tbody>
          </table>` : K.empty('No accounts match.'));
        if (focusSort) {
          const b = host.querySelector(`[data-sort="${focusSort}"]`);
          if (b) b.focus();
          T.ui.announce(`Sorted by ${col.label}, ${state.dir > 0 ? 'ascending' : 'descending'}.`);
        }
      };
      paint();

      el.querySelector('[data-q]').addEventListener('input', U.debounce((e) => { state.q = e.target.value; paint(); }, 120), { signal });
      el.querySelector('[data-role-filter]').addEventListener('change', (e) => { state.role = e.target.value; paint(); }, { signal });
      el.querySelector('[data-add-account]').addEventListener('click', addDialog, { signal });
      host.addEventListener('click', (e) => {
        const sort = e.target.closest('[data-sort]');
        if (sort) {
          if (state.sort === sort.dataset.sort) state.dir = -state.dir;
          else { state.sort = sort.dataset.sort; state.dir = 1; }
          paint(sort.dataset.sort);
          return;
        }
        const m = e.target.closest('[data-manage]');
        if (m) manageDialog(users.find((u) => u.id === m.dataset.manage), me);
      }, { signal });
      const addS = el.querySelector('[data-add-samples]');
      if (addS) {
        addS.addEventListener('click', async () => {
          const done = C.busy(addS, 'Adding…');
          try {
            await A().addSamples(4);
            T.ui.toast('Sample learners added. They are labeled, and easy to remove.');
            K.refresh();
          } catch (err) { done(); fail(err); }
        }, { signal });
      }
      const rmS = el.querySelector('[data-remove-samples]');
      if (rmS) {
        rmS.addEventListener('click', async () => {
          try {
            const n = await A().removeSamples();
            T.ui.toast(`${U.plural(n, 'sample account')} removed.`);
            K.refresh();
          } catch (err) { fail(err); }
        }, { signal });
      }
    },
  });
})();
