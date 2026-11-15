/* =========================================================================
   Tanaw — Awareness & Learning hub (#/learn)
   The world's front door: today's progress, the next step, and the six
   stations of the world, each a capiz pane with live status.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  function stations() {
    const order = T.data.lessonOrder();
    const done = order.filter(T.progress.lessonDone).length;
    const played = T.progress.gamesPlayed().length;
    const daily = T.data.getGame(T.progress.dailyGame());
    const scenes = T.data.scenes.filter((s) => T.progress.explored(`scene:${s.id}`)).length;
    const words = T.data.allSigns().length;
    const learned = Object.keys(T.store.state.progress.selfcheck || {}).filter((id) => T.data.getSign(id)).length;
    const due = T.srs.counts('concepts').due + T.srs.counts('signs').due;
    const titles = T.data.games.map((g) => g.title);
    const gameList = `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}.`;
    const labSeen = T.progress.exploredCount('lab:letter:');
    return [
      { id: 'path', href: '#/learn/path', icon: 'path', tone: 'indigo', kicker: 'Learning path',
        title: `${order.length} lessons across ${T.data.units.length} islands`,
        text: 'From what FSL is and how signs are built, to fingerspelling in 3D, everyday vocabulary and allyship.',
        meta: done ? `${done} of ${order.length} complete` : 'Start with Foundations', pct: (done / order.length) * 100 },
      { id: 'play', href: '#/play', icon: 'dice', tone: 'coral', kicker: 'Games',
        title: `${T.data.games.length} games about awareness and etiquette`,
        text: gameList,
        meta: daily ? `Today’s challenge: ${daily.title}${T.progress.dailyDone() ? ' (done)' : ''}` : `${played} played`, pct: (played / T.data.games.length) * 100 },
      { id: 'scenes', href: '#/scenes', icon: 'pin', tone: 'gold', kicker: 'Everyday scenes',
        title: 'The clinic, the store, the jeepney…',
        text: 'Words, written phrases, etiquette and rights for ordinary moments, in one place.',
        meta: `${scenes} of ${T.data.scenes.length} explored`, pct: (scenes / T.data.scenes.length) * 100 },
      { id: 'library', href: '#/library', icon: 'library', tone: 'teal', kicker: 'Vocabulary',
        title: `${words} words and phrases by topic`,
        text: 'In English and Filipino, with culture notes. Learn each sign from a Deaf teacher, then mark it as learned.',
        meta: learned ? `${learned} marked “I can sign this”` : 'Nothing marked as learned yet', pct: (learned / words) * 100 },
      { id: 'lab', href: '#/lab', icon: 'cube', tone: 'teal', kicker: '3D Hand Lab · Experimental',
        title: 'Handshapes you can turn in 3D',
        text: 'Study the manual alphabet, named handshapes, palm orientation and movement on a 3D hand, and fingerspell any word.',
        meta: labSeen ? `${labSeen} letter${labSeen === 1 ? '' : 's'} viewed in 3D` : 'Start with the letter A', pct: null },
      { id: 'practice', href: '#/practice', icon: 'practice', tone: 'indigo', kicker: 'Practice',
        title: 'Mirror, review, quiz and fingerspelling',
        text: `A camera mirror for your signing, spaced review, quick quizzes and fingerspelling${T.config.hand3d ? ' with the 3D hand' : ' with a pacer'}.`,
        meta: due ? `${due} review card${due === 1 ? '' : 's'} due` : 'Nothing due right now', pct: null },
      { id: 'bridge', href: '#/bridge', icon: 'bridge', tone: 'teal', kicker: 'Conversation Bridge',
        title: 'Tools for real conversations',
        text: 'Big text, live captions, text-to-speech, ready phrases and an Emergency Card.',
        meta: 'Not a translator, and no substitute for an interpreter', pct: null },
    ].filter((s) => s.id !== 'lab' || T.config.hand3d);
  }

  function today() {
    const xp = T.progress.todayXP();
    const goal = T.progress.goal();
    const s = T.progress.streak();
    return html`
      <div class="hub-today" aria-label="Today">
        ${C.ring((xp / goal) * 100, { size: 92, stroke: 9, tone: 'gold', label: `${Math.min(xp, 999)}` })}
        <div class="hub-today__text">
          <p class="hub-today__title">${xp >= goal ? 'Daily goal reached' : `${goal - xp} XP to today’s goal`}</p>
          <p class="hub-today__meta">${T.icon('flame')}<span>${s.current}-day streak · best ${s.best}</span></p>
          <button type="button" class="link-btn" data-open-settings-global>Change daily goal</button>
        </div>
      </div>`;
  }

  V.learnHub = {
    title: 'Awareness & Learning',
    world: 'learn',
    station: 'learnHub',
    render(el, params, query, { signal }) {
      const next = T.progress.nextLesson();
      const lesson = next ? T.data.getLesson(next) : null;
      const started = next && !!T.store.state.progress.lessonState[next];
      const daily = T.data.getGame(T.progress.dailyGame());

      el.innerHTML = String(html`
        <section class="hub-hero hub-hero--learn" aria-labelledby="hub-title">
          <div class="hub-hero__scene" aria-hidden="true"><div class="realm__light"></div><div class="realm__lattice"></div></div>
          <div class="container hub-hero__inner">
            <div class="hub-hero__copy">
              <p class="hub-hero__eyebrow"><span lang="fil">Matuto</span> · Awareness &amp; Learning</p>
              <h1 class="hub-hero__title" id="hub-title">Understand the language</h1>
              <p class="hub-hero__lead">Learn what Filipino Sign Language is, how signs are built and how to communicate with Deaf people respectfully — then turn an experimental 3D hand to study the manual alphabet and handshapes. Learn the signs themselves from Deaf teachers; use Tanaw to explore, practice and review.</p>
              <div class="btn-row">
                ${lesson ? html`<a class="btn btn--gold btn--lg" href="#/learn/${next}">${started ? 'Resume' : 'Start'}: ${lesson.title} ${T.icon('arrow-right')}</a>` : html`<a class="btn btn--gold btn--lg" href="#/practice/review">Review what you learned ${T.icon('arrow-right')}</a>`}
                ${daily ? html`<a class="btn btn--ghost-inverse" href="#/play/${daily.id}">${T.icon('calendar')}<span>Daily challenge: ${daily.title}</span></a>` : ''}
              </div>
            </div>
            ${today()}
          </div>
        </section>

        <div class="container page page--hub">
          <h2 class="section__title hub-section-title">Stations</h2>
          <div class="panes" data-tilt-root>
            ${stations().map((s, i) => html`
              <a class="pane pane--${s.tone}" href="${s.href}" data-tilt data-reveal style="--d:${i}">
                <span class="pane__icon">${T.icon(s.icon, { size: 26 })}</span>
                <span class="pane__kicker">${s.kicker}</span>
                <span class="pane__title">${s.title}</span>
                <span class="pane__text">${s.text}</span>
                ${s.pct != null ? html`<span class="pane__bar" aria-hidden="true"><span style="width:${U.clamp(s.pct, 0, 100)}%"></span></span>` : ''}
                <span class="pane__meta">${s.meta}</span>
                <span class="pane__go" aria-hidden="true">${T.icon('arrow-right')}</span>
              </a>`)}
          </div>

          <a class="crossing crossing--to-community" href="#/community" data-reveal>
            <span class="crossing__art" aria-hidden="true">${T.icon('weave', { size: 30 })}</span>
            <span class="crossing__text">
              <span class="crossing__kicker">The other side of the horizon</span>
              <span class="crossing__title">Meet the Deaf community: identity, history, rights and stories</span>
            </span>
            <span class="crossing__go" aria-hidden="true">${T.icon('arrow-right')}</span>
          </a>
        </div>`);

      T.fx.tilt(el.querySelector('[data-tilt-root]'), signal);
      T.fx.reveal(el, signal);
    },
  };
})();
