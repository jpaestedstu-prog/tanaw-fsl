/* =========================================================================
   Tanaw — Vocabulary (search + filters)
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  function haystack(sign) {
    const cat = T.data.category(sign.cat) || {};
    return U.normalize([sign.en, sign.fil, cat.label, cat.fil, sign.id.replace(/-/g, ' '), sign.cat === 'alphabet' ? 'letter alphabet fingerspelling' : '', sign.cat === 'numbers' ? 'number numbers bilang' : ''].join(' '));
  }

  function search(signs, q) {
    const nq = U.normalize(q);
    if (!nq) return signs;
    const tokens = nq.split(' ');
    const scored = [];
    signs.forEach((s, order) => {
      const hay = haystack(s);
      if (!tokens.every((t) => hay.includes(t))) return;
      const en = U.normalize(s.en);
      const fil = U.normalize(s.fil);
      const parts = fil.split(/\s*\/\s*|\s+/);
      let score = 4;
      if (en === nq || fil === nq || parts.includes(nq)) score = 0;
      else if (en.startsWith(nq) || fil.startsWith(nq)) score = 1;
      else if (en.includes(nq) || fil.includes(nq)) score = 2;
      else if (en.split(' ').some((w) => w.startsWith(tokens[0])) || fil.split(' ').some((w) => w.startsWith(tokens[0]))) score = 3;
      scored.push({ s, score, order });
    });
    return scored.sort((a, b) => a.score - b.score || a.order - b.order).map((x) => x.s);
  }

  // Second filter: demonstration status when demonstrations are on, otherwise the learner's own progress.
  const FILTERS = T.config.demonstrations
    ? { label: 'Demonstration status', options: [['all', 'All'], ['media', 'Has demonstration'], ['pending', 'Awaiting']] }
    : { label: 'Your progress', options: [['all', 'All'], ['learned', 'Learned'], ['todo', 'Not yet']] };

  const passes = (sign, status) => {
    if (status === 'media') return T.media.hasMedia(sign.id);
    if (status === 'pending') return !T.media.hasMedia(sign.id);
    if (status === 'learned') return C.isLearned(sign.id);
    if (status === 'todo') return !C.isLearned(sign.id);
    return true;
  };

  V.library = {
    title: 'Vocabulary',
    world: 'learn',
    station: 'library',
    render(el, params, query, { signal }) {
      const cats = T.data.allCategories();
      const state = {
        q: query.q || '',
        cat: cats.some((c) => c.id === query.cat) ? query.cat : 'all',
        status: FILTERS.options.some(([v]) => v === query.status) ? query.status : 'all',
      };
      const all = T.data.allSigns();
      const studio = T.shell.UTILITY.find((u) => u.id === 'studio');
      let lead;
      if (T.config.demonstrations) {
        const counts = T.media.counts(all.map((s) => s.id));
        lead = html`Search ${all.length} vocabulary entries in English or Filipino. Each entry shows its verification status — <strong>${counts.verified}</strong> verified, <strong>${counts.local + counts.test}</strong> added on this device, <strong>${counts.pending}</strong> awaiting a verified demonstration.`;
      } else {
        const learned = all.filter((s) => C.isLearned(s.id)).length;
        lead = html`${all.length} words and phrases in English and Filipino, grouped by topic. Learn each sign from a Deaf FSL teacher, because signs vary by region, then mark it “I can sign this”. You have marked <strong>${learned}</strong> so far.`;
      }

      el.innerHTML = String(html`
        <div class="container page">
          ${C.pageHead({
            eyebrow: 'Vocabulary', icon: 'library',
            title: T.config.demonstrations ? 'FSL Sign Library' : 'FSL vocabulary',
            lead,
          })}

          <div class="library-tools card">
            <div class="search">
              <label class="visually-hidden" for="library-search">Search vocabulary</label>
              <span class="search__icon" aria-hidden="true">${T.icon('search')}</span>
              <input class="input search__input" id="library-search" type="search" autocomplete="off" spellcheck="false"
                placeholder="Search in English or Filipino — e.g. salamat, family, jeepney" value="${state.q}">
              <kbd class="search__kbd" aria-hidden="true">/</kbd>
            </div>
            <div class="filter-row">
              <div class="chip-row" role="group" aria-label="Filter by topic">
                <button type="button" class="chip" data-cat="all" aria-pressed="${String(state.cat === 'all')}">All</button>
                ${cats.map((c) => html`<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${String(state.cat === c.id)}">${T.icon(c.icon)}<span>${c.label}</span></button>`)}
              </div>
              <fieldset class="segmented segmented--sm">
                <legend class="visually-hidden">${FILTERS.label}</legend>
                ${FILTERS.options.map(([v, l]) => html`
                  <label class="segmented__option"><input type="radio" name="lib-status" value="${v}" ${state.status === v ? U.raw('checked') : ''}><span>${l}</span></label>`)}
              </fieldset>
            </div>
          </div>

          <p class="results-summary" id="lib-summary" aria-live="polite"></p>
          <div class="sign-grid" id="lib-grid"></div>
        </div>`);

      const input = el.querySelector('#library-search');
      const grid = el.querySelector('#lib-grid');
      const summary = el.querySelector('#lib-summary');

      function apply() {
        let list = T.data.allSigns();
        if (state.cat !== 'all') list = list.filter((s) => s.cat === state.cat);
        list = list.filter((s) => passes(s, state.status));
        list = search(list, state.q);
        const catLabel = state.cat === 'all' ? '' : ` in ${(T.data.category(state.cat) || {}).label || state.cat}`;
        summary.textContent = `${list.length} ${list.length === 1 ? 'entry' : 'entries'}${catLabel}${state.q ? ` matching “${state.q}”` : ''}`;
        if (!list.length) {
          grid.innerHTML = String(C.emptyState({
            icon: 'search',
            title: 'No entries found',
            body: 'Try another English or Filipino word, or clear the filters. Teachers can add the words their class needs in the class vocabulary tools.',
            action: html`<div class="btn-row"><button type="button" class="btn btn--secondary" data-clear>Clear search and filters</button><a class="btn btn--ghost" href="#/studio">${studio.label}</a></div>`,
          }));
        } else {
          grid.innerHTML = String(html`${list.map((s) => C.signTile(s))}`);
        }
        T.router.replaceQuery('/library', { q: state.q, cat: state.cat === 'all' ? '' : state.cat, status: state.status === 'all' ? '' : state.status });
      }

      input.addEventListener('input', U.debounce(() => { state.q = input.value.trim(); apply(); }, 120), { signal });
      el.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-cat]');
        if (chip) {
          state.cat = chip.dataset.cat;
          U.$$('[data-cat]', el).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
          apply();
        }
        if (e.target.closest('[data-clear]')) {
          state.q = ''; state.cat = 'all'; state.status = 'all';
          input.value = '';
          U.$$('[data-cat]', el).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === 'all')));
          const radio = el.querySelector('input[name="lib-status"][value="all"]');
          if (radio) radio.checked = true;
          apply();
          input.focus();
        }
      }, { signal });
      el.addEventListener('change', (e) => {
        if (e.target.name === 'lib-status') { state.status = e.target.value; apply(); }
      }, { signal });

      apply();
      if (query.focus === '1') setTimeout(() => input.focus(), 30);
    },
  };
})();
