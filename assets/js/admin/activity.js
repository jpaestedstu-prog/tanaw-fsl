/* =========================================================================
   Tanawan — activity (#/activity): what happened in this browser
   Logins, account changes, reviews and site changes, newest first. It keeps
   the last 400 events, and because it lives in the browser anyone could edit
   it, so unlike a real audit log it proves nothing.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const K = T.console;

  const KINDS = { all: 'Everything', logins: 'Logins', accounts: 'Accounts', reviews: 'Reviews', site: 'Site and data' };
  const ICON = { logins: 'lock', accounts: 'people', reviews: 'note', site: 'sliders' };

  function exportCSV(events) {
    const safe = (v) => {
      const s = String(v == null ? '' : v);
      const t = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s; // never a formula in a spreadsheet
      return `"${t.replace(/"/g, '""')}"`;
    };
    const rows = [['Time', 'Event', 'By', 'About', 'Details']];
    events.forEach((ev) => rows.push([new Date(ev.t).toISOString(), K.eventLabel(ev), ev.actorName, ev.targetName, ev.note]));
    U.download(`tanaw-activity-${U.dateKey()}.csv`, rows.map((r) => r.map(safe).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  }

  K.section({
    id: 'activity',
    label: 'Activity',
    icon: 'compass',
    async render(el, query, { signal }) {
      const events = await T.backend.admin.listEvents();
      if (signal.aborted) return;
      const state = { kind: 'all', q: '' };
      el.innerHTML = String(html`
        ${K.head({
          title: 'Activity',
          lead: 'What happened in this browser, newest first. It keeps the last 400 events. Stored here anyone could edit it, so unlike a server’s audit log it proves nothing.',
          actions: html`
            <button type="button" class="btn btn--secondary" data-export ${events.length ? '' : U.raw('disabled')}>${T.icon('download')}<span>Download as CSV</span></button>
            <button type="button" class="btn btn--ghost" data-clear ${events.length ? '' : U.raw('disabled')}>Clear the log</button>`,
        })}
        <div class="c-filters" role="search" aria-label="Filter activity">
          <div class="c-filter c-filter--grow">
            <label class="field__label" for="a-q">Search</label>
            <input class="input" id="a-q" type="search" placeholder="Name or event" data-q>
          </div>
          <div class="c-filter">
            <label class="field__label" for="a-kind">Show</label>
            <select class="select" id="a-kind" data-kind>
              ${Object.entries(KINDS).map(([k, v]) => html`<option value="${k}">${v}</option>`)}
            </select>
          </div>
        </div>
        <p class="visually-hidden" role="status" data-count></p>
        <div data-list></div>`);

      const list = el.querySelector('[data-list]');
      const count = el.querySelector('[data-count]');
      const paint = () => {
        const q = U.normalize(state.q);
        const rows = events
          .filter((ev) => state.kind === 'all' || K.eventKind(ev) === state.kind)
          .filter((ev) => !q || U.normalize(`${K.eventLabel(ev)} ${ev.actorName} ${ev.targetName} ${ev.note}`).includes(q));
        count.textContent = `${U.plural(rows.length, 'event')} shown`;
        list.innerHTML = String(rows.length ? html`
          <ol class="log">
            ${rows.slice(0, 200).map((ev) => html`
              <li class="log__row">
                <span class="log__icon" aria-hidden="true">${T.icon(ICON[K.eventKind(ev)] || 'info')}</span>
                <div class="log__body">
                  <p class="log__what">${K.eventLabel(ev)}</p>
                  ${K.eventText(ev) ? html`<p class="log__who">${K.eventText(ev)}</p>` : ''}
                </div>
                <time class="log__when" datetime="${new Date(ev.t).toISOString()}">${K.fmtDateTime(ev.t)}</time>
              </li>`)}
          </ol>
          ${rows.length > 200 ? html`<p class="c-small">Showing the latest 200 of ${rows.length}. The CSV has them all.</p>` : ''}` : K.empty('Nothing matches.'));
      };
      paint();
      el.querySelector('[data-q]').addEventListener('input', U.debounce((e) => { state.q = e.target.value; paint(); }, 120), { signal });
      el.querySelector('[data-kind]').addEventListener('change', (e) => { state.kind = e.target.value; paint(); }, { signal });
      el.querySelector('[data-export]').addEventListener('click', () => { exportCSV(events); T.ui.toast('Activity downloaded.', { icon: 'download' }); }, { signal });
      el.querySelector('[data-clear]').addEventListener('click', async () => {
        const ok = await T.ui.confirm({ title: 'Clear the log?', message: 'All recorded activity in this browser will be deleted. This cannot be undone.', confirmLabel: 'Clear the log', danger: true });
        if (!ok) return;
        await T.backend.admin.clearEvents();
        T.ui.toast('The log is cleared.');
        K.refresh();
      }, { signal });
    },
  });
})();
