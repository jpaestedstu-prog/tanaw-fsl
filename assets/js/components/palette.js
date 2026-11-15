/* =========================================================================
   Tanaw — command palette (Ctrl/⌘ + K, or the search button in the header)
   One search across pages, lessons, games, scenes, vocabulary, history and
   rights, plus quick actions such as "fingerspell this in 3D". Uses the
   accessible combobox pattern inside the standard dialog.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = (T.components = T.components || {});

  const MAX = 14;
  const STORY_DATA = 'assets/js/data/stories.js';
  const norm = (s) => U.normalize(String(s || '')).toLowerCase();
  /** True when w starts a word in hay, not only inside one ("story" in "history"). */
  const startsWord = (hay, w) => {
    for (let i = hay.indexOf(w); i !== -1; i = hay.indexOf(w, i + 1)) {
      if (i === 0 || !/[a-z0-9]/.test(hay[i - 1])) return true;
    }
    return false;
  };

  /** Extra words people may search for, by page. */
  const KEYWORDS = {
    '#/learn/path': 'lessons course aralin',
    '#/play': 'games play laro quiz',
    '#/library': 'vocabulary words signs dictionary salita',
    '#/lab': '3d hand handshapes alphabet letters fingerspelling experimental kamay',
    '#/practice': 'mirror camera review flashcards quiz fingerspelling',
    '#/bridge': 'conversation captions text to speech emergency card',
    '#/community/stories': 'story stories kuwento history',
    '#/community/history': 'timeline voyage kasaysayan',
    '#/community/rights': 'law ra 11106 fsl act karapatan',
    '#/community/calendar': 'observances events deaf awareness week',
    '#/community/connect': 'organizations sources links',
  };

  /** Everything searchable, built on first use (data is static per visit). */
  let index = null;
  function buildIndex() {
    const D = T.data;
    const out = [];
    // The type is searchable too, so "rights" or "story" lists everything of that kind.
    const add = (type, label, href, extra = '', hint = '') => out.push({ type, label, href, hint, hay: norm(`${label} ${extra} ${type}`) });
    add('Page', 'Start', '#/', 'home landing tanaw');
    Object.values(T.shell.WORLDS).forEach((w) => w.stations.forEach((s) => add('Page', s.id === w.stations[0].id ? w.label : s.label, s.href, `${w.label} ${w.fil} ${KEYWORDS[s.href] || ''}`, w.short)));
    T.shell.UTILITY.forEach((u) => add('Page', u.label, u.href));
    add('Page', 'Log in', '#/login', 'sign in account password');
    add('Page', 'Create an account', '#/register', 'register sign up account');
    add('Page', 'Your account', '#/account', 'profile password log out sign out settings');
    D.lessonOrder().forEach((id) => { const l = D.getLesson(id); add('Lesson', l.title, `#/learn/${id}`, l.summary, `${l.minutes} min`); });
    D.games.forEach((g) => add('Game', g.title, `#/play/${g.id}`, `${g.fil} ${g.skill} ${g.blurb}`, g.skill));
    D.scenes.forEach((s) => add('Scene', s.title, `#/scenes/${s.id}`, `${s.fil} ${s.summary || ''}`, s.fil));
    D.allSigns().forEach((s) => add('Word', C.signLabel ? C.signLabel(s) : s.en, `#/sign/${encodeURIComponent(s.id)}`, `${s.fil} ${s.cat}`, s.fil && s.fil !== s.en ? s.fil : ''));
    D.timeline.filter((t) => !t.future).forEach((t) => add('History', `${t.year}: ${t.title}`, '#/community/history', t.text));
    D.rights.forEach((r) => add('Rights', `Sec. ${r.sec}: ${r.area}`, '#/community/rights', `${r.place} ${r.text}`, 'RA 11106'));
    if (D.storyList) D.storyList.forEach((s) => add('Story', s.title, `#/community/stories/${s.id}`, `${s.fil} ${s.summary}`, s.era));
    return out;
  }

  function actionsFor(q) {
    const acts = [];
    const raw = q.trim();
    if (T.config.hand3d && /^[a-zñ\s.'-]{1,24}$/i.test(raw)) {
      if (raw.length === 1 && /[a-z]/i.test(raw)) acts.push({ type: 'Action', label: `Show the letter ${raw.toUpperCase()} in 3D`, href: `#/lab?tab=alphabet&letter=${raw.toUpperCase()}`, icon: 'cube' });
      else if (raw.length > 1) acts.push({ type: 'Action', label: `Fingerspell “${raw}” in 3D`, href: `#/lab?tab=spell&text=${encodeURIComponent(raw)}`, icon: 'cube' });
    }
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!raw || /theme|dark|light|mode|kulay/.test(norm(raw))) acts.push({ type: 'Action', label: `Switch to the ${theme} theme`, run: () => T.settings.set('theme', theme), icon: theme === 'dark' ? 'moon' : 'sun' });
    if (!raw || /setting|access|text|motion|contrast/.test(norm(raw))) acts.push({ type: 'Action', label: 'Display & accessibility settings', run: () => T.shell.openSettings(), icon: 'sliders' });
    if (raw && T.auth.user() && /log ?out|sign ?out|account|exit/.test(norm(raw))) acts.push({ type: 'Action', label: 'Log out', run: () => T.auth.logout(), icon: 'arrow-left' });
    if (raw && T.auth.isAdmin() && /admin|console|tanawan/.test(norm(raw))) acts.push({ type: 'Action', label: 'Open the administrator console', run: () => { window.location.href = 'admin.html'; }, icon: 'shield' });
    return acts;
  }

  function search(q) {
    if (!index) index = buildIndex();
    const nq = norm(q).trim();
    const acts = actionsFor(q);
    if (!nq) {
      const picks = ['#/', '#/learn', '#/community', '#/lab', '#/learn/path', '#/play', '#/library', '#/community/stories'];
      return acts.concat(picks.map((h) => index.find((x) => x.href === h)).filter(Boolean));
    }
    const words = nq.split(/\s+/);
    const scored = [];
    index.forEach((it) => {
      if (!words.every((w) => it.hay.includes(w))) return;
      const label = norm(it.label);
      let score = label === nq ? 100 : label.startsWith(nq) ? 60 : label.split(/\W+/).some((w) => w.startsWith(words[0])) ? 40 : 20;
      // Naming a kind ("story", "game", "rights") lists everything of that kind first;
      // a match only inside another word ("story" in "history") ranks lower.
      if (it.type.toLowerCase().startsWith(nq)) score += 25;
      else if (!words.every((w) => startsWord(it.hay, w))) score -= 10;
      if (it.type === 'Page') score += 6;
      // A page named by one of its keywords ("story", "alphabet") comes before its contents.
      if (it.type === 'Page' && KEYWORDS[it.href] && words.every((w) => KEYWORDS[it.href].split(' ').includes(w))) score += 30;
      if (it.type === 'Word' && label.length <= nq.length + 2) score += 10;
      scored.push({ it, score });
    });
    scored.sort((a, b) => b.score - a.score || a.it.label.localeCompare(b.it.label));
    return acts.slice(0, 2).concat(scored.slice(0, MAX).map((x) => x.it));
  }

  const ICON = { Page: 'map', Lesson: 'path', Game: 'dice', Scene: 'pin', Word: 'library', History: 'compass', Rights: 'scale', Story: 'story', Action: 'zap' };

  function open() {
    if (document.querySelector('dialog.palette[open]')) return;
    let items = [];
    let active = 0;
    T.ui.dialog({
      title: 'Search Tanaw',
      size: 'md',
      className: 'palette',
      body: html`
        <div class="palette__box">
          <span class="palette__icon" aria-hidden="true">${T.icon('search')}</span>
          <input class="palette__input" type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list"
            aria-label="Search pages, lessons, games, words and more" placeholder="Search pages, lessons, games, words…" autocomplete="off" spellcheck="false">
        </div>
        <ul class="palette__list" id="palette-list" role="listbox" aria-label="Results"></ul>
        <p class="palette__hint" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> to move · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to close</p>
        <p class="visually-hidden" aria-live="polite" data-palette-count></p>`,
      onOpen: (dlg) => {
        const input = dlg.querySelector('.palette__input');
        const list = dlg.querySelector('.palette__list');
        const count = dlg.querySelector('[data-palette-count]');
        const paint = () => {
          list.innerHTML = String(html`${items.map((it, i) => html`
            <li class="palette__item ${i === active ? 'is-active' : ''}" role="option" id="palette-opt-${i}" aria-selected="${String(i === active)}" data-i="${i}">
              <span class="palette__type">${T.icon(it.icon || ICON[it.type] || 'dot')}<span>${it.type}</span></span>
              <span class="palette__label">${it.label}</span>
              ${it.hint ? html`<span class="palette__meta">${it.hint}</span>` : ''}
            </li>`)}`);
          if (items.length) input.setAttribute('aria-activedescendant', `palette-opt-${active}`);
          else input.removeAttribute('aria-activedescendant');
          const cur = list.querySelector('.is-active');
          if (cur) cur.scrollIntoView({ block: 'nearest' });
        };
        const refresh = () => {
          items = search(input.value);
          active = 0;
          paint();
          count.textContent = items.length ? `${items.length} result${items.length === 1 ? '' : 's'}` : 'No results';
          if (!items.length) list.innerHTML = String(html`<li class="palette__empty" role="presentation">No results. Try another word in English or Filipino.</li>`);
        };
        const go = (it) => {
          if (!it) return;
          dlg.close('go');
          if (it.run) setTimeout(it.run, 30);
          else if (it.href) T.router.go(it.href);
        };
        input.addEventListener('input', U.debounce(refresh, 60));
        input.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) { active = (active + 1) % items.length; paint(); } }
          else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) { active = (active - 1 + items.length) % items.length; paint(); } }
          else if (e.key === 'Home') { e.preventDefault(); active = 0; paint(); }
          else if (e.key === 'End') { e.preventDefault(); active = Math.max(0, items.length - 1); paint(); }
          else if (e.key === 'Enter') { e.preventDefault(); go(items[active]); }
        });
        list.addEventListener('click', (e) => {
          const li = e.target.closest('[data-i]');
          if (li) go(items[Number(li.dataset.i)]);
        });
        list.addEventListener('pointermove', (e) => {
          const li = e.target.closest('[data-i]');
          if (li && Number(li.dataset.i) !== active) { active = Number(li.dataset.i); paint(); }
        });
        refresh();
        input.focus();
        // Stories load with their exhibit; fetch their small data file so search covers them too.
        if (T.config.stories && !T.data.storyList) {
          T.router.load(STORY_DATA).then(() => { index = null; if (dlg.open) refresh(); }).catch(() => {});
        }
      },
    });
  }

  function init() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        open();
      }
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-palette]')) open();
    });
    // Story titles join the index once the Stories data has been loaded.
    T.bus.on('route', () => { if (index && T.data.storyList && !index.some((x) => x.type === 'Story')) index = null; });
  }

  C.palette = { open, init, search };
})();
