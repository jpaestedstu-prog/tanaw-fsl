/* =========================================================================
   Tanawan — system (#/system): this browser's data, and what a real console needs
   The backup tools exist because all of this data lives in one browser. The
   readiness table is the honest map from this demonstration to a real system;
   its full version is docs/backend-integration.md.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const K = T.console;
  const C = T.components;

  /* What works now, and what only a server can make real. Each row maps to docs/backend-integration.md. */
  const READINESS = [
    ['Log in, register, log out', 'Interface complete: validation, errors, lockout messages, loading and logged-out states', 'Password hashing, sessions in secure cookies, rate limiting and lockout on the server', 'core/backend-demo.js'],
    ['Roles and this console', 'Interface complete: the gate, roles, first-time setup', 'A role check on the server on every admin request. Hiding this page protects nothing', 'admin/demo-admin.js'],
    ['Password reset', 'Temporary passwords issued by an administrator', 'Email or another verified recovery channel', 'core/backend-demo.js'],
    ['Each person’s progress', 'Kept apart per account, in this browser', 'Storage on the server, sync between devices, and a privacy assessment', 'core/store.js'],
    ['Review ledger', 'Records saved in this browser, downloadable as CSV', 'A shared database, so reviewers’ records outlast one browser and can be audited', 'admin/demo-admin.js'],
    ['Activity log', 'Events kept in this browser', 'An append-only log on the server. A log the user can edit proves nothing', 'core/backend-demo.js'],
    ['Site notice and registration', 'Take effect in this browser', 'Settings on the server, so every visitor sees them', 'admin/demo-admin.js'],
  ];

  function resetDialog() {
    T.ui.dialog({
      title: 'Delete everything in this console?',
      size: 'sm',
      body: html`
        <form class="c-form" data-reset novalidate>
          <p>This deletes every account and its progress, the activity log, the review ledger and the site settings from this browser. It cannot be undone. A guest’s progress stays.</p>
          ${C.errorSummary()}
          ${C.field({ id: 'reset-word', name: 'word', label: 'Type DELETE to confirm', autocomplete: 'off', spellcheck: false, maxlength: 10 })}
          <div class="btn-row c-form__actions">
            <button type="button" class="btn btn--ghost" data-dialog-close>Keep everything</button>
            <button type="submit" class="btn btn--danger">${T.icon('trash')}<span>Delete everything</span></button>
          </div>
        </form>`,
      onOpen: (dlg) => {
        const f = dlg.querySelector('[data-reset]');
        f.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (f.word.value.trim() !== 'DELETE') {
            C.showErrors(f, new T.AuthError('Check the highlighted fields.', { word: 'Type DELETE, in capital letters.' }));
            return;
          }
          await T.backend.admin.resetAll();
          dlg.close('reset');
          // The session is gone with the accounts: the first-time setup returns.
          T.store.useProfile(null, { discard: true });
          T.settings.apply();
          T.auth.setCurrent(null, 'reset');
          T.ui.toast('Everything was deleted from this browser.');
        });
        f.querySelector('input').focus();
      },
    });
  }

  K.section({
    id: 'system',
    label: 'System',
    icon: 'code',
    async render(el, query, { signal }) {
      const usage = await T.backend.admin.usage();
      if (signal.aborted) return;
      const bytes = (n) => U.formatBytes(n);
      el.innerHTML = String(html`
        ${K.head({
          title: 'System',
          lead: 'What this console keeps in this browser, and what a real one would need.',
        })}

        <section class="c-truth" aria-labelledby="sys-truth">
          <h2 class="c-truth__title" id="sys-truth">${T.icon('shield')}<span>This page is not a security boundary</span></h2>
          <p>Having a separate page for administrators organizes the interface. It keeps nothing safe: anyone can open <code>admin.html</code>, and every check here runs in a browser its user controls. Anyone with this device could read this data or give themselves the administrator role.</p>
          <p>Real protection has to be on a server, which checks who someone is and their role on <strong>every request</strong>, whatever the page looks like. The table below marks where that connects, and <code>docs/backend-integration.md</code> has the full map.</p>
        </section>

        <section class="c-panel c-panel--table" aria-labelledby="sys-ready">
          <h2 class="c-panel__title c-panel__title--pad" id="sys-ready">Ready for a backend</h2>
          <table class="c-table c-table--ready">
            <caption class="visually-hidden">What works in this frontend, and what needs a server</caption>
            <thead><tr><th scope="col">Feature</th><th scope="col">Works now, in this browser</th><th scope="col">Needs a server</th><th scope="col">Where it connects</th></tr></thead>
            <tbody>
              ${READINESS.map((r) => html`<tr><th scope="row" data-label="Feature">${r[0]}</th><td data-label="Works now">${r[1]}</td><td data-label="Needs a server">${r[2]}</td><td data-label="Where it connects"><code>${r[3]}</code></td></tr>`)}
            </tbody>
          </table>
        </section>

        <div class="c-grid">
          <section class="c-panel" aria-labelledby="sys-store">
            <h2 class="c-panel__title" id="sys-store">Stored in this browser</h2>
            <dl class="c-dl">
              <div><dt>Accounts and activity</dt><dd>${bytes(usage.accounts)}</dd></div>
              <div><dt>Progress of ${U.plural(usage.profiles, 'account')}</dt><dd>${bytes(usage.progress)}</dd></div>
              <div><dt>A guest’s progress</dt><dd>${bytes(usage.guest)}</dd></div>
              <div><dt>Review ledger</dt><dd>${bytes(usage.reviews)}</dd></div>
              <div><dt>Site settings</dt><dd>${bytes(usage.site)}</dd></div>
            </dl>
          </section>

          <section class="c-panel" aria-labelledby="sys-backup">
            <h2 class="c-panel__title" id="sys-backup">Backup</h2>
            <p>Download accounts, activity, the ledger and site settings as a file, or restore them here or in another browser. Password hashes are included, so keep the file private.</p>
            <div class="btn-row">
              <button type="button" class="btn btn--secondary" data-export>${T.icon('download')}<span>Download a backup</span></button>
              <label class="btn btn--secondary c-file">${T.icon('upload')}<span>Restore a backup</span><input class="visually-hidden" type="file" accept="application/json,.json" data-import></label>
            </div>
            <p class="c-error" role="alert" data-import-error hidden></p>
            <h3 class="c-panel__subtitle">Start again</h3>
            <p>Deletes every account, the log, the ledger and the site settings from this browser.</p>
            <button type="button" class="btn btn--danger-ghost" data-reset-all>${T.icon('trash')}<span>Delete everything</span></button>
          </section>
        </div>`);

      el.querySelector('[data-export]').addEventListener('click', async () => {
        U.download(`tanaw-console-backup-${U.dateKey()}.json`, await T.backend.admin.exportData(), 'application/json');
        T.ui.toast('Backup downloaded.', { icon: 'download' });
      }, { signal });
      const errBox = el.querySelector('[data-import-error]');
      el.querySelector('[data-import]').addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!file) return;
        errBox.hidden = true;
        const ok = await T.ui.confirm({ title: 'Restore this backup?', message: 'Accounts, activity, the ledger and site settings in this browser will be replaced by the file’s. Everyone else will need to log in again.', confirmLabel: 'Restore', danger: true });
        if (!ok) return;
        try {
          await T.backend.admin.importData(await U.readFileAsText(file));
          T.ui.toast('Backup restored.');
          T.backend.touch();
          K.refresh();
        } catch (err) {
          errBox.hidden = false;
          errBox.textContent = err.message || 'That file could not be restored.';
        }
      }, { signal });
      el.querySelector('[data-reset-all]').addEventListener('click', resetDialog, { signal });
    },
  });
})();
