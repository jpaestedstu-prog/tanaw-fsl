/* =========================================================================
   Tanawan — the review ledger (#/review)

   Tanaw's content has not been reviewed by Deaf organizations, and the site
   says so. This ledger is where review would be recorded, item by item: the 3D
   hand's poses first, then lessons, words and exhibits. It starts empty on
   purpose and ships with no sample reviews, so it can never imply an approval
   that did not happen. Recording a review here changes no public label: public
   wording only changes when the team decides it should.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const K = T.console;
  const C = T.components;

  const STATUS = {
    none: { label: 'Not reviewed', icon: 'hourglass' },
    team: { label: 'Checked by the team', icon: 'people' },
    changes: { label: 'Needs changes', icon: 'alert' },
    deaf: { label: 'Reviewed by a Deaf reviewer', icon: 'check-circle' },
  };
  K.REVIEW_STATUS = STATUS;

  /** Everything reviewable, grouped and tied to the page where it appears. Counted from the site's own data. */
  let cached = null;
  K.catalog = () => {
    if (cached) return cached;
    const D = T.data;
    const items = (prefix, list, title, href) => list.map((x) => ({ key: `${prefix}:${x.id || x.sec || x.year || x.name}`, title: title(x), href: href(x) }));
    const letters = D.handLetters.filter((l) => !l.gap);
    const demos = D.handDemos.orientation.concat(D.handDemos.movement);
    cached = [
      { id: 'hand-letters', world: 'learn', label: '3D hand: letters', experimental: true, items: items('hand-letter', letters, (l) => `Letter ${l.id}`, (l) => `#/lab?tab=alphabet&letter=${l.id}`) },
      { id: 'hand-shapes', world: 'learn', label: '3D hand: handshapes', experimental: true, items: items('hand-shape', D.handshapes, (h) => `Handshape ${h.name}`, () => '#/lab?tab=shapes') },
      { id: 'hand-demos', world: 'learn', label: '3D hand: orientation and movement', experimental: true, items: items('hand-demo', demos, (d) => d.name, () => '#/lab?tab=params') },
      { id: 'lessons', world: 'learn', label: 'Lessons', items: D.lessonOrder().map((id) => ({ key: `lesson:${id}`, title: D.getLesson(id).title, href: `#/learn/${id}` })) },
      { id: 'games', world: 'learn', label: 'Games', items: items('game', D.games, (g) => g.title, (g) => `#/play/${g.id}`) },
      { id: 'scenes', world: 'learn', label: 'Everyday scenes', items: items('scene', D.scenes, (s) => s.title, (s) => `#/scenes/${s.id}`) },
      { id: 'words', world: 'learn', label: 'Vocabulary', items: items('word', D.signs, (s) => s.en, (s) => `#/sign/${encodeURIComponent(s.id)}`) },
      { id: 'identity', world: 'community', label: 'Identity and culture', items: items('facet', D.facets, (f) => f.title, () => '#/community/identity') },
      { id: 'stories', world: 'community', label: 'Stories', items: items('story', D.storyList, (s) => s.title, (s) => `#/community/stories/${s.id}`) },
      { id: 'history', world: 'community', label: 'History', items: items('history', D.timeline.filter((t) => !t.future), (t) => `${t.year}: ${t.title}`, () => '#/community/history') },
      { id: 'rights', world: 'community', label: 'Rights under RA 11106', items: items('rights', D.rights, (r) => `Sec. ${r.sec}: ${r.area}`, () => '#/community/rights') },
      { id: 'calendar', world: 'community', label: 'Observances', items: items('observance', D.observances, (o) => o.name, () => '#/community/calendar') },
      { id: 'organizations', world: 'community', label: 'Organizations and links', items: items('org', D.resources, (r) => r.name, () => '#/community/connect') },
    ].filter((g) => (!g.experimental || T.config.hand3d) && (g.id !== 'stories' || T.config.stories));
    return cached;
  };

  const emptyCounts = () => ({ none: 0, team: 0, changes: 0, deaf: 0 });
  K.groupCounts = (g, reviews) => {
    const c = emptyCounts();
    g.items.forEach((it) => { c[(reviews[it.key] && reviews[it.key].status) || 'none'] += 1; });
    return c;
  };
  K.totalCounts = (groups, reviews) => {
    const c = emptyCounts();
    groups.forEach((g) => { const x = K.groupCounts(g, reviews); Object.keys(c).forEach((k) => { c[k] += x[k]; }); });
    return c;
  };

  /** A thin bar of parts of a whole. Its text alternative and the legend beside it carry the same numbers. */
  K.reviewBar = (c, total) => {
    const parts = ['changes', 'team', 'deaf'].filter((k) => c[k] > 0);
    const text = `${c.deaf} reviewed by a Deaf reviewer, ${c.team} checked by the team, ${c.changes} needing changes, ${c.none} not reviewed, of ${total}`;
    return html`
      <span class="rbar" role="img" aria-label="${text}">
        ${parts.map((k) => html`<span class="rbar__part rbar__part--${k}" style="flex-grow:${c[k]}"></span>`)}
        ${c.none ? html`<span class="rbar__rest" style="flex-grow:${c.none}"></span>` : ''}
      </span>`;
  };

  const statusBadge = (status) => html`<span class="rstatus rstatus--${status}">${T.icon(STATUS[status].icon)}<span>${STATUS[status].label}</span></span>`;

  function recordDialog(item, group, current) {
    const rec = current || { status: 'none', reviewer: '', note: '' };
    T.ui.dialog({
      title: item.title,
      size: 'md',
      body: html`
        <form class="c-form" data-review-form novalidate>
          <p class="c-small">${group.label} · ${K.publicLink(item.href, 'See it on the public site')}</p>
          ${C.errorSummary()}
          <fieldset class="setting">
            <legend class="setting__label">Status</legend>
            <div class="rchoices">
              ${Object.keys(STATUS).map((k) => html`
                <label class="rchoice">
                  <input type="radio" name="status" value="${k}" ${rec.status === k ? raw('checked') : ''}>
                  <span class="rchoice__box">${T.icon(STATUS[k].icon)}<span>${STATUS[k].label}</span></span>
                </label>`)}
            </div>
          </fieldset>
          ${C.field({ id: 'rv-reviewer', name: 'reviewer', label: 'Reviewer', maxlength: 80, required: false, optional: true, value: rec.reviewer, hint: 'Who looked at it. Required when a Deaf reviewer did, so the record is accountable.' })}
          <div class="field">
            <label class="field__label" for="rv-note">Notes <span class="field__optional">(optional)</span></label>
            <textarea class="textarea" id="rv-note" name="note" rows="3" maxlength="500">${rec.note}</textarea>
          </div>
          <p class="c-small">Only record a Deaf reviewer when one has really reviewed this. Recording a review does not change anything on the public site.</p>
        </form>`,
      actions: [
        { label: 'Cancel', variant: 'ghost', value: 'cancel' },
        {
          label: 'Save',
          variant: 'primary',
          value: 'save',
          onClick: (dlg) => {
            const f = dlg.querySelector('[data-review-form]');
            const status = f.status.value;
            const reviewer = f.reviewer.value.trim();
            if (status === 'deaf' && !reviewer) {
              C.showErrors(f, new T.AuthError('Check the highlighted fields.', { reviewer: 'Name the Deaf reviewer, or choose another status.' }));
              return false;
            }
            T.backend.admin.saveReview(item.key, { status, reviewer, note: f.note.value.trim() }, { title: item.title, statusLabel: STATUS[status].label, world: group.world })
              .then(() => { T.ui.toast('Review recorded.'); K.refresh(); })
              .catch((err) => T.ui.toast(err.message || 'Could not save the review.', { icon: 'alert', tone: 'danger' }));
            return undefined;
          },
        },
      ],
    });
  }

  function exportCSV(groups, reviews) {
    const safe = (v) => {
      const s = String(v == null ? '' : v);
      // A cell starting with these could run as a formula in a spreadsheet.
      const t = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
      return `"${t.replace(/"/g, '""')}"`;
    };
    const rows = [['World', 'Group', 'Item', 'Status', 'Reviewer', 'Notes', 'Recorded by', 'Recorded on']];
    groups.forEach((g) => g.items.forEach((it) => {
      const r = reviews[it.key];
      rows.push([g.world === 'learn' ? 'Awareness & Learning' : 'Deaf Community', g.label, it.title, STATUS[(r && r.status) || 'none'].label, r ? r.reviewer : '', r ? r.note : '', r ? r.by : '', r ? new Date(r.at).toISOString() : '']);
    }));
    U.download(`tanaw-review-ledger-${U.dateKey()}.csv`, rows.map((row) => row.map(safe).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  }

  K.section({
    id: 'review',
    label: 'Review ledger',
    icon: 'note',
    async render(el, query, { signal }) {
      const reviews = await T.backend.admin.listReviews();
      if (signal.aborted) return;
      const groups = K.catalog();
      const items = groups.reduce((n, g) => n + g.items.length, 0);
      const totals = K.totalCounts(groups, reviews);
      const state = { group: query.group || 'all', status: query.status || 'all', q: '' };

      el.innerHTML = String(html`
        ${K.head({
          title: 'Review ledger',
          lead: 'Every piece of Tanaw’s content, and whether anyone has reviewed it. It starts empty on purpose. A record here is the team’s own note and does not change what the public site says.',
          actions: html`<button type="button" class="btn btn--secondary" data-export>${T.icon('download')}<span>Download as CSV</span></button>`,
        })}

        <section class="c-panel rsum" aria-label="Summary">
          ${K.reviewBar(totals, items)}
          <ul class="rsum__legend">
            ${['deaf', 'team', 'changes', 'none'].map((k) => html`<li><span class="rsum__key rsum__key--${k}" aria-hidden="true"></span><span class="rsum__n">${totals[k]}</span> ${STATUS[k].label}</li>`)}
          </ul>
        </section>

        <div class="c-filters" role="search" aria-label="Filter the ledger">
          <div class="c-filter c-filter--grow">
            <label class="field__label" for="rv-q">Search</label>
            <input class="input" id="rv-q" type="search" placeholder="Title or reviewer" data-q>
          </div>
          <div class="c-filter">
            <label class="field__label" for="rv-group">Group</label>
            <select class="select" id="rv-group" data-group>
              <option value="all">All groups</option>
              <optgroup label="Awareness &amp; Learning">${groups.filter((g) => g.world === 'learn').map((g) => html`<option value="${g.id}" ${state.group === g.id ? raw('selected') : ''}>${g.label}</option>`)}</optgroup>
              <optgroup label="Deaf Community">${groups.filter((g) => g.world === 'community').map((g) => html`<option value="${g.id}" ${state.group === g.id ? raw('selected') : ''}>${g.label}</option>`)}</optgroup>
            </select>
          </div>
          <div class="c-filter">
            <label class="field__label" for="rv-status">Status</label>
            <select class="select" id="rv-status" data-status>
              <option value="all">Any status</option>
              ${Object.keys(STATUS).map((k) => html`<option value="${k}" ${state.status === k ? raw('selected') : ''}>${STATUS[k].label}</option>`)}
            </select>
          </div>
        </div>
        <p class="visually-hidden" role="status" data-count></p>
        <div data-list></div>`);

      const list = el.querySelector('[data-list]');
      const count = el.querySelector('[data-count]');
      const paint = () => {
        const q = U.normalize(state.q);
        const shown = [];
        let found = 0;
        groups.forEach((g) => {
          if (state.group !== 'all' && state.group !== g.id) return;
          const rows = g.items.filter((it) => {
            const r = reviews[it.key];
            const st = (r && r.status) || 'none';
            if (state.status !== 'all' && state.status !== st) return false;
            return !q || U.normalize(`${it.title} ${r ? r.reviewer : ''}`).includes(q);
          });
          if (rows.length) { shown.push({ g, rows }); found += rows.length; }
        });
        count.textContent = `${U.plural(found, 'item')} shown`;
        // One open group is plenty for long lists; a narrowed list opens everything it found.
        const open = state.group !== 'all' || state.status !== 'all' || !!q;
        list.innerHTML = String(found ? html`${shown.map(({ g, rows }) => {
          const c = K.groupCounts(g, reviews);
          return html`
            <details class="rgroup rgroup--${g.world}" ${open ? raw('open') : ''}>
              <summary class="rgroup__head">
                <span class="rgroup__name">${g.label}${g.experimental ? html` <span class="c-tag">Experimental</span>` : ''}</span>
                <span class="rgroup__meta">${c.deaf + c.team + c.changes} of ${g.items.length} recorded</span>
                ${K.reviewBar(c, g.items.length)}
              </summary>
              <ul class="rlist">
                ${rows.map((it) => {
                  const r = reviews[it.key];
                  const st = (r && r.status) || 'none';
                  return html`
                    <li class="rrow">
                      <div class="rrow__main">
                        <p class="rrow__title">${it.title}</p>
                        ${r ? html`<p class="rrow__detail">${r.reviewer ? `${r.reviewer} · ` : ''}${K.fmtDate(r.at)}${r.note ? ` · ${r.note}` : ''}</p>` : ''}
                      </div>
                      ${statusBadge(st)}
                      <button type="button" class="btn btn--secondary btn--sm" data-record="${it.key}" aria-label="Record a review of ${it.title}">Record</button>
                    </li>`;
                })}
              </ul>
            </details>`;
        })}` : K.empty('Nothing matches these filters.'));
      };

      paint();
      el.querySelector('[data-q]').addEventListener('input', U.debounce((e) => { state.q = e.target.value; paint(); }, 120), { signal });
      el.querySelector('[data-group]').addEventListener('change', (e) => { state.group = e.target.value; paint(); }, { signal });
      el.querySelector('[data-status]').addEventListener('change', (e) => { state.status = e.target.value; paint(); }, { signal });
      el.querySelector('[data-export]').addEventListener('click', () => { exportCSV(groups, reviews); T.ui.toast('Ledger downloaded.', { icon: 'download' }); }, { signal });
      list.addEventListener('click', (e) => {
        const b = e.target.closest('[data-record]');
        if (!b) return;
        const g = groups.find((x) => x.items.some((it) => it.key === b.dataset.record));
        recordDialog(g.items.find((it) => it.key === b.dataset.record), g, reviews[b.dataset.record]);
      }, { signal });
    },
  });
})();
