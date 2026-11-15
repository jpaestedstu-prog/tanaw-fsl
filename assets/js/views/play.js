/* =========================================================================
   Tanaw — Games (Laro): the hub (#/play) and the game player (#/play/:id)
   The player provides one shell for every game: progress, score, feedback,
   a continue button and the results screen. Game rules live in games.js.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});
  T.gameImpl = T.gameImpl || {};

  function bestLine(g) {
    const r = (T.store.state.games || {})[g.id];
    if (!r || !r.plays) return html`<span class="game-card__best">Not played yet</span>`;
    return html`<span class="game-card__best">${C.stars(r.stars)}<span>Best ${r.best}/${r.total} · played ${r.plays}×</span></span>`;
  }

  /* ===================== Hub ===================== */
  V.play = {
    title: 'Games',
    world: 'learn',
    station: 'play',
    render(el, params, query, { signal }) {
      const D = T.data;
      const dailyId = T.progress.dailyGame();
      const daily = D.getGame(dailyId);
      const dailyDone = T.progress.dailyDone();

      el.innerHTML = String(html`
        <div class="container page">
          ${C.pageHead({
            eyebrow: 'Games · Laro', icon: 'dice',
            title: 'Play to learn',
            lead: `Short games about Deaf awareness, etiquette, respectful language, rights, history and how signs are built${D.games.some((g) => g.experimental) ? ', plus Read the Hand: reading fingerspelling from an experimental 3D hand' : ''}. None of them tests FSL vocabulary signs${T.config.demonstrations ? ': sign-recognition games unlock only when verified demonstrations exist' : ''}.`,
          })}

          ${daily ? html`
            <a class="daily ${dailyDone ? 'is-done' : ''} daily--${daily.tone}" href="#/play/${daily.id}" data-reveal>
              <span class="daily__icon">${T.icon(daily.icon, { size: 30 })}</span>
              <span class="daily__text">
                <span class="daily__kicker">${T.icon('calendar')}<span>Daily challenge · ${U.formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}</span></span>
                <span class="daily__title">${daily.title}</span>
                <span class="daily__meta">${dailyDone ? 'Done for today. Come back tomorrow for a new one.' : 'Finish it today for a +10 XP bonus.'}</span>
              </span>
              <span class="daily__go">${dailyDone ? T.icon('check-circle', { size: 28 }) : T.icon('play', { size: 26 })}</span>
            </a>` : ''}

          <div class="game-grid" data-tilt-root>
            ${D.games.map((g, i) => html`
              <a class="game-card game-card--${g.tone}" href="#/play/${g.id}" data-tilt data-reveal style="--d:${i % 3}">
                <span class="game-card__icon">${T.icon(g.icon, { size: 28 })}</span>
                <span class="game-card__fil" lang="fil">${g.fil}</span>
                <span class="game-card__title">${g.title}${g.experimental ? html` <span class="exp-badge">Experimental</span>` : ''}</span>
                <span class="game-card__text">${g.blurb}</span>
                <span class="game-card__meta"><span>${T.icon('target')}<span>${g.skill}</span></span><span>${T.icon('clock')}<span>${g.minutes} min</span></span></span>
                ${bestLine(g)}
              </a>`)}
          </div>

          ${T.config.demonstrations ? html`<section class="locked" aria-labelledby="h-locked">
            <h2 class="section__title section__title--sm" id="h-locked">${T.icon('lock')}<span>Waiting for verified demonstrations</span></h2>
            <p class="section__lead">These games test recognition of real FSL signs, so they open only when Deaf signers’ demonstrations have been verified. Tanaw never quizzes anyone on unverified or invented signs.</p>
            <ul class="locked__list">
              ${D.lockedGames.map((g) => {
                const ready = g.ready();
                return html`
                  <li class="locked__item ${ready ? 'is-ready' : ''}">
                    <span class="locked__icon">${T.icon(ready ? g.icon : 'lock', { size: 24 })}</span>
                    <span class="locked__text"><strong>${g.title}</strong><span>${ready ? 'Ready: demonstrations are available.' : `Needs: ${g.needs}`}</span></span>
                    <a class="btn btn--sm ${ready ? 'btn--primary' : 'btn--ghost'}" href="${g.href}">${ready ? 'Play' : 'See the tool'}</a>
                  </li>`;
              })}
            </ul>
          </section>` : ''}
        </div>`);

      T.fx.tilt(el.querySelector('[data-tilt-root]'), signal);
      T.fx.reveal(el, signal);
    },
  };

  /* ===================== Player ===================== */
  function shell(el, meta) {
    el.innerHTML = String(html`
      <div class="game game--${meta.tone}">
        <header class="game__top">
          <a class="icon-btn game__exit" href="#/play" aria-label="Exit ${meta.title}">${T.icon('close')}</a>
          <div class="game__meta">
            <p class="game__eyebrow">${T.icon(meta.icon)}<span>Game · ${meta.skill}</span></p>
            <h1 class="game__title">${meta.title}</h1>
          </div>
          <div class="game__status">
            <span class="game__progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0"><span class="game__progress-fill"></span></span>
            <span class="game__count" aria-hidden="true"></span>
            <span class="game__score" aria-label="Score"><span class="visually-hidden">Score: </span>${T.icon('star')}<span data-score>0</span></span>
          </div>
        </header>
        <div class="game__stage">
          <div class="game__body" data-game-body></div>
          <div class="game__feedback" data-game-feedback hidden></div>
        </div>
        <footer class="game__bar">
          <div class="game__bar-inner">
            <p class="game__hint" data-game-hint></p>
            <button type="button" class="btn btn--primary btn--lg" data-game-next hidden><span>Continue</span>${T.icon('arrow-right')}</button>
          </div>
        </footer>
      </div>`);
  }

  function makeKit(el, meta, signal, restart) {
    shell(el, meta);
    const body = el.querySelector('[data-game-body]');
    const fb = el.querySelector('[data-game-feedback]');
    const nextBtn = el.querySelector('[data-game-next]');
    const hint = el.querySelector('[data-game-hint]');
    const bar = el.querySelector('.game__progress');
    const fill = el.querySelector('.game__progress-fill');
    const count = el.querySelector('.game__count');
    const scoreEl = el.querySelector('[data-score]');
    let onNext = null;
    let ended = false;

    nextBtn.addEventListener('click', () => { const fn = onNext; onNext = null; if (fn) fn(); }, { signal });

    const kit = {
      body,
      signal,
      meta,
      setProgress(i, n) {
        fill.style.width = `${n ? Math.round((i / n) * 100) : 0}%`;
        bar.setAttribute('aria-valuemax', String(n));
        bar.setAttribute('aria-valuenow', String(i));
        bar.setAttribute('aria-valuetext', `${Math.min(i + 1, n)} of ${n}`);
        count.textContent = `${Math.min(i + 1, n)} / ${n}`;
      },
      setScore(n) { scoreEl.textContent = String(n); },
      setHint(text) { hint.textContent = text || ''; },
      /** ok: true | false | null (neutral). content: trusted HTML. */
      feedback(ok, content) {
        fb.hidden = false;
        fb.className = `game__feedback ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`;
        fb.innerHTML = String(html`
          <span class="game__feedback-icon">${T.icon(ok === true ? 'check-circle' : ok === false ? 'x-circle' : 'info', { size: 26 })}</span>
          <div class="game__feedback-body">${content}</div>`);
        // One announcement with the whole message; the panel itself is not a live region.
        T.ui.announce(fb.querySelector('.game__feedback-body').textContent.replace(/\s+/g, ' ').trim());
        // Bring the message into view: instantly when motion is reduced, never skipped.
        fb.scrollIntoView({ block: 'nearest', behavior: U.reducedMotion() ? 'auto' : 'smooth' });
      },
      clearFeedback() { fb.hidden = true; fb.innerHTML = ''; },
      /** Show the continue button; fn runs once when it is pressed. */
      next(label, fn) {
        onNext = fn;
        nextBtn.hidden = false;
        nextBtn.innerHTML = String(html`<span>${label || 'Continue'}</span>${T.icon('arrow-right')}`);
        nextBtn.focus({ preventScroll: true });
      },
      hideNext() { nextBtn.hidden = true; onNext = null; },
      announce: (msg) => T.ui.announce(msg),
      focusTitle() {
        const t = body.querySelector('[data-focus]');
        if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
      },
      finish(correct, total) {
        if (ended) return;
        ended = true;
        const res = T.progress.gameResult(meta.id, correct, total);
        results(el, meta, correct, total, res, restart);
      },
      get ended() { return ended; },
    };
    return kit;
  }

  function results(el, meta, correct, total, res, restart) {
    const D = T.data;
    const others = D.games.filter((g) => g.id !== meta.id);
    const record = (T.store.state.games || {})[meta.id] || {};
    const suggestion = others.find((g) => !((T.store.state.games || {})[g.id] || {}).plays) || others[U.hash(meta.id + U.dateKey()) % others.length];
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const title = res.stars === 3 ? 'Mahusay! Three stars.' : res.stars === 2 ? 'Great work!' : res.stars === 1 ? 'Good start — try again?' : 'Keep going — every round teaches something.';
    el.innerHTML = String(html`
      <div class="container container--narrow page">
        <section class="complete complete--game">
          <div class="complete__burst" aria-hidden="true">${Array.from({ length: res.stars * 5 }, (_, i) => html`<span style="--i:${i}"></span>`)}</div>
          <span class="complete__icon">${T.icon(meta.icon, { size: 44 })}</span>
          <p class="eyebrow">${meta.title} · results</p>
          <h1 class="complete__title" tabindex="-1">${title}</h1>
          <p class="complete__stars">${C.stars(res.stars)}</p>
          <div class="complete__stats">
            ${C.statTile({ icon: 'target', value: `${correct}/${total}`, label: `Correct (${pct}%)`, tone: 'teal' })}
            ${C.statTile({ icon: 'star', value: `+${res.xp}`, label: res.isDaily ? 'XP, with daily bonus' : 'XP earned', tone: 'gold' })}
            ${C.statTile({ icon: 'trophy', value: `${record.best}/${record.total}`, label: res.newBest ? 'New personal best!' : 'Personal best', tone: 'coral' })}
          </div>
          ${res.isDaily ? html`<p class="pill pill--ok">${T.icon('calendar')}<span>Daily challenge complete</span></p>` : ''}
          <div class="complete__actions">
            <button type="button" class="btn btn--primary btn--lg" data-again>${T.icon('repeat')}<span>Play again</span></button>
            ${meta.related ? html`<a class="btn btn--secondary" href="${meta.related.href}">${T.icon('book')}<span>${meta.related.label}</span></a>` : ''}
            ${suggestion ? html`<a class="btn btn--ghost" href="#/play/${suggestion.id}">${T.icon('dice')}<span>Next: ${suggestion.title}</span></a>` : ''}
            <a class="btn btn--ghost" href="#/play">${T.icon('grid')}<span>All games</span></a>
          </div>
        </section>
      </div>`);
    const h = el.querySelector('.complete__title');
    if (h) h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    T.ui.announce(`${title} ${correct} of ${total} correct.`);
    el.querySelector('[data-again]').addEventListener('click', restart);
  }

  V.game = {
    world: 'learn',
    station: 'play',
    focusMode: true,
    title: (params) => {
      const g = T.data.getGame(params.id);
      return g ? `${g.title} — Games` : 'Game not found';
    },
    render(el, params, query, { signal }) {
      const meta = T.data.getGame(params.id);
      const impl = meta && T.gameImpl[meta.id];
      if (!meta || !impl) {
        el.innerHTML = String(html`<div class="container page">${C.emptyState({ icon: 'dice', title: 'Game not found', body: 'This game does not exist.', action: html`<a class="btn btn--primary" href="#/play">All games</a>`, page: true })}</div>`);
        return;
      }
      let round = null;
      const start = () => {
        if (round) round.abort();
        round = new AbortController();
        signal.addEventListener('abort', () => round.abort(), { once: true });
        const kit = makeKit(el, meta, round.signal, start);
        impl(kit);
        window.scrollTo(0, 0);
        const t = el.querySelector('.game__title');
        if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
      };
      start();
      return () => { if (round) round.abort(); };
    },
  };
})();
