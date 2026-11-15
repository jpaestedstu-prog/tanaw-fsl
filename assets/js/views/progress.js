/* =========================================================================
   Tanaw — Your journey (#/journey): progress in both worlds, achievements
   as a constellation, activity, journal and data management.
   Everything is computed on this device from the learner's own activity.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  function heatmap() {
    const act = T.store.state.progress.activity;
    const todayKey = U.dateKey();
    const dow = (new Date().getDay() + 6) % 7; // Monday = 0
    const startKey = U.addDays(todayKey, -dow - 7 * 11);
    let active = 0;
    const cells = [];
    for (let i = 0; i < 84; i++) {
      const key = U.addDays(startKey, i);
      const future = key > todayKey;
      const d = act[key] || {};
      const xp = Number(d.xp) || 0;
      const actions = Number(d.actions) || 0;
      let level = 0;
      if (!future && (xp > 0 || actions > 0)) {
        active += 1;
        level = xp >= 60 ? 4 : xp >= 30 ? 3 : xp >= 10 ? 2 : 1;
      }
      cells.push(html`<span class="heatmap__cell ${future ? 'is-future' : ''} ${key === todayKey ? 'is-today' : ''}" data-level="${level}" title="${U.formatDate(key)}: ${xp} XP"></span>`);
    }
    return html`
      <div class="heatmap" role="img" aria-label="Learning activity over the last 12 weeks: active on ${active} of ${dow + 1 + 77} days.">
        <div class="heatmap__days" aria-hidden="true"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span>Sun</span></div>
        <div class="heatmap__grid" aria-hidden="true">${cells}</div>
      </div>
      <div class="heatmap__legend" aria-hidden="true"><span>Less</span>${[0, 1, 2, 3, 4].map((l) => html`<span class="heatmap__cell" data-level="${l}"></span>`)}<span>More</span></div>`;
  }

  /* ---------- Constellation ---------- */
  function placeStars() {
    const B = T.progress.BADGES;
    const learn = B.filter((b) => b.world === 'learn');
    const comm = B.filter((b) => b.world === 'community');
    const both = B.filter((b) => b.world === 'both');
    const golden = 2.39996;
    const pos = {};
    learn.forEach((b, i) => {
      const r = 21 * Math.sqrt(i + 1);
      pos[b.id] = { x: 178 + 1.3 * r * Math.cos(i * golden), y: 168 + 0.92 * r * Math.sin(i * golden), w: 'learn' };
    });
    comm.forEach((b, i) => {
      const r = 27 * Math.sqrt(i + 1);
      pos[b.id] = { x: 446 + 1.2 * r * Math.cos(i * golden + 1), y: 168 + 0.95 * r * Math.sin(i * golden + 1), w: 'community' };
    });
    both.forEach((b, i) => { pos[b.id] = { x: 312 + i * 20, y: 52, w: 'both' }; });
    return pos;
  }

  function constellation(earned) {
    const pos = placeStars();
    const ids = Object.keys(pos);
    const on = ids.filter((id) => earned[id]);
    // Each earned star links to the nearest earlier-earned star of its own world, so the
    // figure grows as a tree; the shared star links to the nearest star of each world.
    const lines = [];
    const dist = (a, b) => Math.hypot(pos[a].x - pos[b].x, pos[a].y - pos[b].y);
    ['learn', 'community'].forEach((w) => {
      const list = on.filter((id) => pos[id].w === w);
      list.forEach((id, k) => {
        if (!k) return;
        const near = list.slice(0, k).reduce((best, other) => (dist(id, other) < dist(id, best) ? other : best), list[0]);
        lines.push([id, near, w]);
      });
    });
    on.filter((id) => pos[id].w === 'both').forEach((id) => {
      ['learn', 'community'].forEach((w) => {
        const list = on.filter((x) => pos[x].w === w);
        if (list.length) lines.push([id, list.reduce((best, o) => (dist(id, o) < dist(id, best) ? o : best), list[0]), 'both']);
      });
    });
    const f = (n) => n.toFixed(1);
    return `
      <svg class="sky" viewBox="0 0 620 320" aria-hidden="true" focusable="false">
        <text x="178" y="300" text-anchor="middle" class="sky__label">Awareness &amp; Learning</text>
        <text x="446" y="300" text-anchor="middle" class="sky__label">Deaf Community</text>
        <path d="M24 266c90-14 180-18 286-18s196 4 286 18" class="sky__horizon"/>
        ${lines.map(([a, b, w]) => `<line x1="${f(pos[a].x)}" y1="${f(pos[a].y)}" x2="${f(pos[b].x)}" y2="${f(pos[b].y)}" class="sky__line sky__line--${w}"/>`).join('')}
        ${ids.map((id) => {
          const p = pos[id];
          const lit = !!earned[id];
          return `<g class="sky__star sky__star--${p.w} ${lit ? 'is-lit' : ''}" data-star="${id}">
            ${lit ? `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="14" class="sky__glow"/>` : ''}
            <circle cx="${f(p.x)}" cy="${f(p.y)}" r="${lit ? 5.5 : 3.2}" class="sky__dot"/>
          </g>`;
        }).join('')}
      </svg>`;
  }

  function worldColumn(world) {
    if (world === 'learn') {
      const games = T.data.games.map((g) => ({ g, r: (T.store.state.games || {})[g.id] }));
      return html`
        <section class="card world-progress world-progress--learn" aria-labelledby="wp-learn">
          <h2 class="section__title section__title--sm" id="wp-learn">${T.icon('window')}<span>Awareness &amp; Learning</span></h2>
          <ul class="unit-progress">
            ${T.data.units.map((u) => {
              const d = u.lessons.filter(T.progress.lessonDone).length;
              return html`<li>
                <div class="unit-progress__row"><a href="#/learn/path">Island ${u.num} · ${u.title}</a><span>${d}/${u.lessons.length}</span></div>
                ${C.bar((d / u.lessons.length) * 100, `${u.title} progress`, u.tone)}
              </li>`;
            })}
          </ul>
          <h3 class="world-progress__sub">Games</h3>
          <ul class="game-progress">
            ${games.map(({ g, r }) => html`<li><a href="#/play/${g.id}">${g.title}</a>${r && r.plays ? C.stars(r.stars) : html`<span class="muted">Not played</span>`}</li>`)}
          </ul>
        </section>`;
    }
    const ex = T.progress.COMMUNITY_EXHIBITS;
    const station = (id) => T.shell.WORLDS.community.stations.find((s) => s.id === id);
    const rightsN = T.data.rights.filter((r) => T.progress.explored(`rights:${r.sec}`)).length;
    const histN = T.data.timeline.filter((t) => T.progress.explored(`history:${t.year}`)).length;
    const scenesN = T.data.scenes.filter((s) => T.progress.explored(`scene:${s.id}`)).length;
    return html`
      <section class="card world-progress world-progress--community" aria-labelledby="wp-community">
        <h2 class="section__title section__title--sm" id="wp-community">${T.icon('weave')}<span>Deaf Community</span></h2>
        <ul class="exhibit-progress">
          ${ex.map((id) => {
            const s = station(id);
            const done = T.progress.explored(`exhibit:${id}`);
            return html`<li class="${done ? 'is-done' : ''}"><a href="${s.href}">${T.icon(s.icon)}<span>${s.label}</span></a><span>${done ? html`${T.icon('check-circle')}<span class="visually-hidden">explored</span>` : html`<span class="muted">Not yet</span>`}</span></li>`;
          })}
        </ul>
        <div class="mini-meters">
          <div><span class="mini-meters__label">Rights areas</span>${C.bar((rightsN / T.data.rights.length) * 100, 'Rights areas explored', 'teal')}<span class="mini-meters__n">${rightsN}/${T.data.rights.length}</span></div>
          <div><span class="mini-meters__label">History stops</span>${C.bar((histN / T.data.timeline.length) * 100, 'History stops visited', 'teal')}<span class="mini-meters__n">${histN}/${T.data.timeline.length}</span></div>
          <div><span class="mini-meters__label">Everyday scenes</span>${C.bar((scenesN / T.data.scenes.length) * 100, 'Everyday scenes explored', 'gold')}<span class="mini-meters__n">${scenesN}/${T.data.scenes.length}</span></div>
        </div>
      </section>`;
  }

  V.progress = {
    title: 'Your journey',
    station: 'progress',
    render(el, params, query, { signal }) {
      const st = T.store.state;
      const p = st.progress;
      const order = T.data.lessonOrder();
      const done = order.filter(T.progress.lessonDone).length;
      const s = T.progress.streak();
      const xpToday = T.progress.todayXP();
      const goal = T.progress.goal();
      const confident = Object.keys(p.selfcheck || {}).map((id) => T.data.getSign(id)).filter(Boolean);
      const earned = p.badges || {};
      const B = T.progress.BADGES;
      const groups = [
        ['learn', 'Awareness & Learning', 'window'],
        ['community', 'Deaf Community', 'weave'],
        ['both', 'Both worlds', 'eye'],
      ];

      el.innerHTML = String(html`
        <div class="container page journey">
          ${C.pageHead({
            eyebrow: 'Your journey', icon: 'sparkles',
            title: 'Two ways of seeing',
            lead: 'Your progress in both worlds. Everything here is computed on this device from your own activity: no leaderboards, no tracking, and no account needed.',
          })}

          <div class="stat-grid">
            ${C.statTile({ icon: 'star', value: String(p.xp), label: 'Total XP', tone: 'gold' })}
            ${C.statTile({ icon: 'flame', value: String(s.current), label: 'Day streak', hint: `Best: ${s.best}`, tone: 'coral' })}
            ${C.statTile({ icon: 'target', value: `${xpToday}/${goal}`, label: 'Today’s goal (XP)', tone: 'gold' })}
            ${C.statTile({ icon: 'path', value: `${done}/${order.length}`, label: 'Lessons', tone: 'indigo' })}
            ${C.statTile({ icon: 'dice', value: `${T.progress.gamesPlayed().length}/${T.data.games.length}`, label: 'Games played', tone: 'coral' })}
            ${C.statTile({ icon: 'weave', value: `${T.progress.exploredCount('exhibit:')}/${T.progress.COMMUNITY_EXHIBITS.length}`, label: 'Exhibits explored', tone: 'teal' })}
          </div>

          <section class="sky-card" aria-labelledby="h-sky">
            <div class="sky-card__head">
              <h2 class="section__title section__title--sm" id="h-sky">${T.icon('sparkles')}<span>Your constellation</span></h2>
              <p class="sky-card__count">${Object.keys(earned).filter((id) => B.some((b) => b.id === id)).length} of ${B.length} stars lit</p>
            </div>
            <p class="sky-card__lead">Every achievement lights a star. Learning stars gather on the left, community stars on the right, and one star joins the two.</p>
            <div class="sky-card__sky">${raw(constellation(earned))}</div>
          </section>

          <div class="progress-layout progress-layout--even">
            ${worldColumn('learn')}
            ${worldColumn('community')}
          </div>

          <section class="section--flush" aria-labelledby="h-badges">
            <h2 class="section__title section__title--sm" id="h-badges">${T.icon('trophy')}<span>Achievements</span></h2>
            ${groups.map(([w, label, icon]) => html`
              <h3 class="badge-group">${T.icon(icon)}<span>${label}</span></h3>
              <ul class="badge-grid">
                ${B.filter((b) => b.world === w).map((b) => html`
                  <li class="award award--${w} ${earned[b.id] ? 'is-earned' : ''}" data-badge="${b.id}">
                    <span class="award__icon">${T.icon(b.icon, { size: 26 })}</span>
                    <span class="award__title">${b.title}</span>
                    <span class="award__desc">${b.desc}</span>
                    <span class="award__state">${earned[b.id] ? `Earned ${U.formatDate(earned[b.id])}` : 'Not yet'}</span>
                  </li>`)}
              </ul>`)}
          </section>

          <div class="progress-layout">
            <section class="card" aria-labelledby="h-activity">
              <h2 class="section__title section__title--sm" id="h-activity">${T.icon('calendar')}<span>Activity — last 12 weeks</span></h2>
              ${heatmap()}
            </section>
            <section class="card" aria-labelledby="h-confident">
              <h2 class="section__title section__title--sm" id="h-confident">${T.icon('check-circle')}<span>Signs you marked confident</span></h2>
              ${confident.length ? html`
                <p class="field__hint">From lesson self-checks. Confirm them with your Deaf teacher.</p>
                <div class="chip-row chip-row--wrap">${confident.map((sg) => html`<a class="chip chip--link" href="#/sign/${encodeURIComponent(sg.id)}">${C.signLabel(sg)}</a>`)}</div>`
                : html`<p class="muted">None yet. Vocabulary lessons include a self-check you can use alongside a class.</p>`}
            </section>
          </div>

          <section class="card" aria-labelledby="h-journal">
            <h2 class="section__title section__title--sm" id="h-journal">${T.icon('edit')}<span>Learning journal</span></h2>
            ${(p.journal || []).length ? html`
              <ul class="journal">
                ${p.journal.slice(0, 20).map((j) => html`
                  <li class="journal__item">
                    <p class="journal__prompt">${j.prompt}</p>
                    <p class="journal__text">${j.text}</p>
                    <p class="journal__meta"><span>${U.formatDate(j.at)}</span><button type="button" class="link-btn" data-del-journal="${j.id}">Delete</button></p>
                  </li>`)}
              </ul>`
              : html`<p class="muted">Reflection prompts in lessons save here — privately, on this device.</p>`}
          </section>

          <section class="card data-card" aria-labelledby="h-data">
            <h2 class="section__title section__title--sm" id="h-data">${T.icon('lock')}<span>Your data</span></h2>
            <div class="data-card__grid">
              <div class="prose">
                <p>Tanaw stores your progress, settings, phrases and emergency card <strong>only in this browser</strong> (localStorage), and nothing is uploaded. If you have a demo account, this is that account's own copy.</p>
                <ul>
                  <li>It does <strong>not sync</strong> to other devices or browsers — use Export and Import to move it.</li>
                  <li>Clearing your browser’s site data, or some private/incognito windows, will <strong>erase it</strong>.</li>
                  <li>${T.config.demonstrations
                    ? 'Media added in the Contributor Studio is stored separately (IndexedDB); share it with a class pack.'
                    : 'Words added on the Class vocabulary page are part of this data, so they are included in exports.'}</li>
                </ul>
                <p class="muted">Storage status: ${T.store.isPersistent() ? 'saving normally on this device.' : 'NOT saving — your browser is blocking local storage.'}</p>
              </div>
              <div class="data-actions">
                <button type="button" class="btn btn--primary" data-export>${T.icon('download')}<span>Export progress (.json)</span></button>
                <label class="btn btn--secondary file-btn">
                  ${T.icon('upload')}<span>Import progress</span>
                  <input type="file" accept="application/json,.json" data-import class="visually-hidden">
                </label>
                <button type="button" class="btn btn--danger-ghost" data-reset>${T.icon('trash')}<span>Reset all progress</span></button>
                <p class="field__hint">Exports include your emergency card and journal — store the file somewhere private.</p>
              </div>
            </div>
          </section>
        </div>`);

      // Pointing at an achievement lights its star (decorative; the list holds the information).
      const sky = el.querySelector('.sky');
      const highlight = (id) => U.$$('[data-star]', sky).forEach((g) => g.classList.toggle('is-pointed', g.dataset.star === id));
      el.addEventListener('pointerover', (e) => { const b = e.target.closest('[data-badge]'); highlight(b ? b.dataset.badge : null); }, { signal });

      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-export]')) {
          U.download(`tanaw-progress-${U.dateKey()}.json`, T.store.exportJSON(), 'application/json');
          T.ui.toast('Progress exported.', { icon: 'download' });
        }
        if (e.target.closest('[data-reset]')) {
          const ok = await T.ui.confirm({
            title: 'Reset all progress?',
            message: `This permanently deletes your XP, streak, lessons, games, explored exhibits, reviews, learned words, added vocabulary, journal, phrases, emergency card and settings from this browser.${T.config.demonstrations ? ' Media in the Contributor Studio is not affected.' : ''} Consider exporting first.`,
            confirmLabel: 'Reset everything',
            danger: true,
          });
          if (!ok) return;
          T.store.reset();
          T.settings.apply();
          T.ui.toast('Progress reset.', { icon: 'trash' });
          T.router.render();
        }
        const del = e.target.closest('[data-del-journal]');
        if (del) {
          T.store.update((stt) => { stt.progress.journal = (stt.progress.journal || []).filter((j) => j.id !== del.dataset.delJournal); });
          T.router.render();
        }
      }, { signal });

      el.addEventListener('change', async (e) => {
        if (!e.target.matches('[data-import]')) return;
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!file) return;
        try {
          const text = await U.readFileAsText(file);
          T.store.readBackup(text); // a file that cannot be used is turned away before asking anything
          const ok = await T.ui.confirm({
            title: 'Replace your current progress?',
            message: `Importing "${file.name}" replaces the progress currently stored in this browser.`,
            confirmLabel: 'Import and replace',
          });
          if (!ok) return;
          T.store.importJSON(text);
          T.settings.apply();
          T.ui.toast('Progress imported.', { icon: 'upload' });
          T.router.render();
        } catch (err) {
          T.ui.toast(err && err.message ? err.message : 'Import failed.', { icon: 'alert', tone: 'danger', timeout: 6000 });
        }
      }, { signal });
    },
  };
})();
