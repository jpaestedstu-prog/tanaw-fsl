/* =========================================================================
   Tanawan — overview (#/overview): the view from the lookout

   Laid out like the landing: Awareness & Learning on one side, Deaf Community
   on the other, with the activity log running down the seam between them. Its
   headline is the project's real open question: how much of the content a Deaf
   reviewer has looked at. Every number is counted from the site's own data.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const K = T.console;

  const DAYS = 14;
  const LOGIN_TYPES = new Set(['login', 'account.registered', 'admin.setup']);

  /** Logins per local calendar day, oldest first. */
  function loginSeries(events) {
    const out = [];
    const today = U.dateKey();
    for (let i = DAYS - 1; i >= 0; i--) out.push({ key: U.addDays(today, -i), value: 0 });
    const byKey = new Map(out.map((d) => [d.key, d]));
    events.forEach((ev) => {
      if (!LOGIN_TYPES.has(ev.type)) return;
      const d = byKey.get(U.dateKey(new Date(ev.t)));
      if (d) d.value += 1;
    });
    return out;
  }

  /* A single series, so no legend: the title names it. A table view carries the same numbers. */
  function chart(series) {
    const max = Math.max(1, ...series.map((d) => d.value));
    const top = max <= 4 ? max : Math.ceil(max / 5) * 5;
    const ticks = top >= 2 ? [top, Math.round(top / 2), 0] : [top, 0];
    const dayName = (k) => U.formatDate(k, { day: 'numeric', month: 'short' });
    const peak = series.reduce((a, b) => (b.value > a.value ? b : a), series[0]);
    return html`
      <figure class="bars">
        <figcaption class="bars__title">Logins per day, last ${DAYS} days</figcaption>
        <div class="bars__plot">
          <div class="bars__grid" aria-hidden="true">
            ${ticks.map((t) => html`<span class="bars__tick"><span>${t}</span></span>`)}
          </div>
          <div class="bars__cols" role="group" aria-label="Logins per day. Use the left and right arrow keys to move between days." data-bars>
            ${series.map((d, i) => html`
              <button type="button" class="bars__col" tabindex="${i === series.length - 1 ? '0' : '-1'}" data-value="${d.value}" data-day="${dayName(d.key)}" aria-label="${dayName(d.key)}: ${U.plural(d.value, 'login')}">
                ${d.value ? html`<span class="bars__bar" style="height:${((d.value / top) * 100).toFixed(1)}%">${d === peak ? html`<span class="bars__cap" aria-hidden="true">${d.value}</span>` : ''}</span>` : ''}
              </button>`)}
          </div>
          <div class="bars__tip" data-bars-tip hidden></div>
        </div>
        <div class="bars__x" aria-hidden="true">
          <span>${dayName(series[0].key)}</span><span>Today</span>
        </div>
        <details class="bars__table">
          <summary>Show as a table</summary>
          <table class="c-table c-table--tight">
            <caption class="visually-hidden">Logins per day, last ${DAYS} days</caption>
            <thead><tr><th scope="col">Day</th><th scope="col" class="c-num">Logins</th></tr></thead>
            <tbody>${series.map((d) => html`<tr><th scope="row">${dayName(d.key)}</th><td class="c-num">${d.value}</td></tr>`)}</tbody>
          </table>
        </details>
      </figure>`;
  }

  function wireChart(root, signal) {
    const group = root.querySelector('[data-bars]');
    const tip = root.querySelector('[data-bars-tip]');
    if (!group || !tip) return;
    const cols = U.$$('.bars__col', group);
    const show = (col) => {
      const box = group.getBoundingClientRect();
      const r = col.getBoundingClientRect();
      tip.hidden = false;
      tip.textContent = '';
      const strong = document.createElement('strong');
      strong.textContent = col.dataset.value;
      tip.appendChild(strong);
      tip.appendChild(document.createTextNode(` ${col.dataset.value === '1' ? 'login' : 'logins'}, ${col.dataset.day}`));
      const x = r.left - box.left + r.width / 2;
      tip.style.left = `${U.clamp(x, tip.offsetWidth / 2, box.width - tip.offsetWidth / 2)}px`;
      cols.forEach((c) => c.classList.toggle('is-active', c === col));
    };
    const hide = () => { tip.hidden = true; cols.forEach((c) => c.classList.remove('is-active')); };
    group.addEventListener('pointerover', (e) => { const c = e.target.closest('.bars__col'); if (c) show(c); }, { signal });
    group.addEventListener('pointerleave', hide, { signal });
    group.addEventListener('focusin', (e) => { const c = e.target.closest('.bars__col'); if (c) show(c); }, { signal });
    group.addEventListener('focusout', hide, { signal });
    group.addEventListener('keydown', (e) => {
      const i = cols.indexOf(e.target.closest('.bars__col'));
      if (i < 0) return;
      let n = i;
      if (e.key === 'ArrowRight') n = Math.min(cols.length - 1, i + 1);
      else if (e.key === 'ArrowLeft') n = Math.max(0, i - 1);
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = cols.length - 1;
      else return;
      e.preventDefault();
      cols[i].tabIndex = -1;
      cols[n].tabIndex = 0;
      cols[n].focus();
    }, { signal });
  }

  function inventoryRow(g, reviews) {
    const c = K.groupCounts(g, reviews);
    const reviewed = c.deaf + c.team + c.changes;
    return html`
      <li>
        <a class="inv" href="#/review?group=${g.id}">
          <span class="inv__name">${g.label}${g.experimental ? html` <span class="c-tag">Experimental</span>` : ''}</span>
          <span class="inv__count">${g.items.length}</span>
          ${K.reviewBar(c, g.items.length)}
          <span class="inv__meta">${reviewed ? `${c.deaf} by a Deaf reviewer · ${c.team} by the team${c.changes ? ` · ${c.changes} need changes` : ''}` : 'Not reviewed yet'}</span>
        </a>
      </li>`;
  }

  function seamEvent(ev) {
    return html`
      <li class="tl__item tl__item--${ev.world || 'seam'}">
        <span class="tl__bead" aria-hidden="true"></span>
        <div class="tl__card">
          <p class="tl__what">${K.eventLabel(ev)}</p>
          ${K.eventText(ev) ? html`<p class="tl__who">${K.eventText(ev)}</p>` : ''}
          <p class="tl__when"><time datetime="${new Date(ev.t).toISOString()}">${K.ago(ev.t)}</time></p>
        </div>
      </li>`;
  }

  K.section({
    id: 'overview',
    label: 'Overview',
    icon: 'eye',
    async render(el, query, { signal }) {
      const A = T.backend.admin;
      const [users, events, reviews] = await Promise.all([A.listUsers(), A.listEvents(), A.listReviews()]);
      if (signal.aborted) return;
      const groups = K.catalog();
      const items = groups.reduce((n, g) => n + g.items.length, 0);
      const totals = K.totalCounts(groups, reviews);
      const admins = users.filter((u) => u.role === 'admin').length;
      const learners = users.length - admins;
      const disabled = users.filter((u) => u.status !== 'active').length;
      const locked = users.filter((u) => u.lockedUntil > Date.now()).length;
      const samples = users.filter((u) => u.sample).length;
      const series = loginSeries(events);
      const logins = series.reduce((n, d) => n + d.value, 0);
      const worldGroups = (w) => groups.filter((g) => g.world === w);

      el.innerHTML = String(html`
        ${K.head({
          title: 'The view from here',
          lead: `${U.formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}. Everything here is counted from Tanaw’s own content and from what happened in this browser.`,
        })}

        <div class="ov-top">
          <section class="c-panel ov-hero" aria-labelledby="ov-hero">
            <h2 class="c-label" id="ov-hero">Reviewed by a Deaf reviewer</h2>
            <p class="ov-hero__fig">${totals.deaf}</p>
            <p class="ov-hero__of">of ${items} content items. Tanaw’s content is written from published sources; this ledger is where review by Deaf FSL users would be recorded.</p>
            ${K.reviewBar(totals, items)}
            <a class="link-arrow" href="#/review">Open the review ledger ${T.icon('arrow-right')}</a>
          </section>

          <section class="c-panel ov-people" aria-labelledby="ov-people">
            <h2 class="c-label" id="ov-people">Accounts in this browser</h2>
            <p class="c-figure">${users.length}</p>
            <ul class="ov-list">
              <li>${U.plural(admins, 'administrator')}</li>
              <li>${U.plural(learners, 'learner')}${samples ? ` (${samples} sample)` : ''}</li>
              ${disabled ? html`<li>${disabled} disabled</li>` : ''}
              ${locked ? html`<li>${locked} locked</li>` : ''}
            </ul>
            <a class="link-arrow" href="#/people">Manage people ${T.icon('arrow-right')}</a>
          </section>

          <section class="c-panel ov-chart" aria-label="Logins">
            <p class="c-figure c-figure--sm">${logins} <span>in ${DAYS} days</span></p>
            ${chart(series)}
          </section>
        </div>

        <div class="board">
          <section class="board__world board__world--learn" aria-labelledby="board-learn">
            <h2 class="board__band" id="board-learn"><span lang="fil">Matuto</span>Awareness &amp; Learning</h2>
            <ul class="inv-list">${worldGroups('learn').map((g) => inventoryRow(g, reviews))}</ul>
          </section>

          <section class="board__seam" aria-labelledby="board-seam">
            <h2 class="board__seam-title" id="board-seam">Latest activity</h2>
            ${events.length ? html`
              <ol class="tl">${events.slice(0, 7).map(seamEvent)}</ol>
              <a class="link-arrow board__all" href="#/activity">All activity ${T.icon('arrow-right')}</a>` : K.empty('Nothing has happened in this browser yet.')}
          </section>

          <section class="board__world board__world--community" aria-labelledby="board-community">
            <h2 class="board__band" id="board-community"><span lang="fil">Pamayanan</span>Deaf Community</h2>
            <ul class="inv-list">${worldGroups('community').map((g) => inventoryRow(g, reviews))}</ul>
          </section>
        </div>`);

      wireChart(el, signal);
    },
  });
})();
