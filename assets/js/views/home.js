/* =========================================================================
   Tanaw — the start page (#/): two landing designs, always in this order.

   First, the split-screen landing. Awareness & Learning (capiz light) and Deaf
   Community (banig weave) meet at a seam. Tanaw means "to look toward", so
   looking toward a world opens it: the seam leans, Tanaw's eye follows, and the
   everyday scenes where the two worlds meet sit along the seam. The behaviour
   is in components/horizon.js. It has no 3D hand.

   Second, the 3D sign language landing. A live 3D hand fingerspells a greeting
   and visitors can spell their own name, with the two worlds as portals below.
   The hand waits until the visitor gets there.

   Then what is inside, where to start, the everyday scenes and an honest note.
   Also defines the not-found view, which must be available without loading.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  /* The five parts of a sign, floating around the light of the capiz window. */
  const ORBS = [
    { label: 'Handshape', x: 7, y: 26, d: 0.9 },
    { label: 'Palm orientation', x: 46, y: 0, d: 0.5 },
    { label: 'Location', x: 73, y: 38, d: 1 },
    { label: 'Movement', x: 2, y: 72, d: 0.65 },
    { label: 'Face & body', x: 45, y: 76, d: 0.8 },
  ];

  const GREETING = 'MABUHAY';
  const TEASER_SCENES = ['clinic', 'store', 'commute'];
  // Where each everyday scene sits along the seam, as a share of its height. The eye keeps the middle clear.
  const BEAD_POSITIONS = [21, 29, 37, 63, 71, 79, 87];

  const plural = U.plural;

  /** The stations of a world, as links. The world's own overview is the Enter button. */
  function stationLinks(world) {
    const counts = {
      path: [T.data.lessonOrder().length, 'lessons'],
      play: [T.data.games.length, 'games'],
      scenes: [T.data.scenes.length, 'scenes'],
      library: [T.data.allSigns().length, 'words'],
    };
    const LONG = { history: 'History since 1907', rights: 'Rights under RA 11106' };
    return T.shell.WORLDS[world].stations.slice(1).map((s) => {
      const count = counts[s.id];
      return html`
        <li><a class="realm__station" href="${s.href}" data-enter="${world}">
          <span>${LONG[s.id] || s.label}</span>
          ${count ? html`<span class="realm__count"><span aria-hidden="true">${count[0]}</span><span class="visually-hidden">: ${count[0]} ${count[1]}</span></span>` : ''}
          ${s.id === 'lab' ? html`<span class="realm__exp">Experimental</span>` : ''}
        </a></li>`;
    });
  }

  /** Beads on the seam: each everyday scene draws on both worlds, and its card says how. */
  function crossings() {
    return html`
      <nav class="beads" aria-label="Where the two worlds meet: everyday scenes">
        <ol class="beads__list">
          ${T.data.scenes.slice(0, BEAD_POSITIONS.length).map((s, i) => {
            const rights = s.rights.length ? `RA 11106 ${s.rights.length === 1 ? 'Sec.' : 'Secs.'} ${s.rights.join(', ')}` : '';
            return html`
              <li class="beads__item" style="--y:${BEAD_POSITIONS[i]}%">
                <a class="bead" href="#/scenes/${s.id}">
                  <span class="bead__dot" aria-hidden="true"></span>
                  <span class="bead__card">
                    <span class="bead__head">
                      <span class="bead__fil" lang="fil">${s.fil}</span>
                      <span class="bead__title">${s.title}</span>
                    </span>
                    <span class="bead__sides">
                      <span class="bead__side bead__side--learn">${plural(s.signs.length, 'word')}, ${plural(s.phrases.length, 'phrase')}</span>
                      <span class="bead__side bead__side--community">${plural(s.etiquette.length, 'etiquette tip')}${rights ? `, ${rights}` : ''}</span>
                    </span>
                  </span>
                </a>
              </li>`;
          })}
        </ol>
      </nav>`;
  }

  /** The second landing's hero: the 3D hand. Its heading is an h2, because the page has one h1, on the first landing. */
  function signHero() {
    return html`
      <section class="nh-hero" aria-labelledby="landing-3d-title">
        <div class="nh-hero__sky" aria-hidden="true"><span class="nh-orb nh-orb--a"></span><span class="nh-orb nh-orb--b"></span><span class="nh-orb nh-orb--c"></span></div>
        <div class="nh-hero__floor" aria-hidden="true"></div>
        <div class="container nh-hero__inner">
          <div class="nh-hero__copy">
            <p class="nh-eyebrow">${raw(T.fx.eyeSVG('nh-eye'))}<span><span lang="fil">tanaw</span> · to look toward</span></p>
            <h2 class="nh-title" id="landing-3d-title">
              <span class="nh-title__brand">Tanaw</span>
              <span class="nh-title__line grad-text">See sign language take shape.</span>
            </h2>
            <p class="nh-lead">Meet Filipino Sign Language and the Filipino Deaf community through interactive lessons, games, everyday scenes and documented stories — and an experimental 3D hand you can turn, slow down and fingerspell with.</p>
            <form class="nh-spell" data-hero-spell>
              <label class="nh-spell__label" for="hero-spell">${T.icon('cube')}<span>Fingerspell your name in 3D</span></label>
              <div class="nh-spell__row">
                <input class="input" id="hero-spell" type="text" maxlength="24" autocomplete="off" spellcheck="false" placeholder="Your name">
                <button type="submit" class="btn btn--primary">${T.icon('play')}<span>Spell it</span></button>
              </div>
            </form>
            <nav class="nh-worlds" aria-label="Choose a world">
              <a class="nh-world nh-world--learn" href="#/learn"><span class="nh-world__fil" lang="fil">Matuto</span><span class="nh-world__label">Awareness &amp; Learning</span>${T.icon('arrow-right')}</a>
              <a class="nh-world nh-world--community" href="#/community"><span class="nh-world__fil" lang="fil">Pamayanan</span><span class="nh-world__label">Deaf Community</span>${T.icon('arrow-right')}</a>
            </nav>
          </div>
          <div class="nh-hero__stage">
            ${C.handStage ? C.handStage({ kind: 'Fingerspelling', name: GREETING }) : html`
              <div class="stage3d" data-stage3d>
                <div class="stage3d__hud">
                  <p class="stage3d__label"><span class="stage3d__kind" data-hud-kind>Fingerspelling</span><strong class="stage3d__name" data-hud-name>${GREETING}</strong></p>
                  <span class="exp-badge">Experimental</span>
                </div>
                <p class="stage3d__caption" data-caption aria-live="polite" aria-atomic="true"></p>
                <p class="stage3d__hint" aria-hidden="true">Drag to turn · double-click to reset</p>
              </div>`}
            <div data-hero-strip><ol class="spell-strip" aria-label="Letters">${GREETING.split('').map((ch) => html`<li class="spell-strip__tile">${ch}</li>`)}</ol></div>
            <p class="nh-stage-note">${T.icon('flask')}<span>Experimental prototype: the one-handed manual alphabet FSL shares with ASL, without FSL’s T. Not validated by Deaf FSL experts. <a href="#/lab">Open the 3D Hand Lab</a></span></p>
          </div>
        </div>
      </section>`;
  }

  /** The second landing's portals to the two worlds. */
  function portals() {
    return html`
      <section class="section nh-portals" aria-labelledby="portals-title">
        <div class="container">
          <div class="section__head">
            <h2 class="section__title" id="portals-title">Two ways of seeing, one horizon</h2>
          </div>
          <div class="portal-grid">
            <a class="portal portal--learn" href="#/learn" data-reveal>
              <span class="portal__art" aria-hidden="true"><span class="realm__light"></span><span class="realm__lattice"></span></span>
              <span class="portal__body">
                <span class="portal__fil" lang="fil">Matuto · to learn</span>
                <span class="portal__title">Awareness &amp; Learning</span>
                <span class="portal__text">What FSL is, how signs are built, Deaf etiquette and respectful words — with lessons, games, scenes, a vocabulary to learn with Deaf teachers, and practice tools.</span>
                <span class="portal__facts"><span>${T.data.lessonOrder().length} lessons</span><span>${T.data.games.length} games</span><span>${T.data.scenes.length} scenes</span></span>
                <span class="portal__go">Enter ${T.icon('arrow-right')}</span>
              </span>
            </a>
            <a class="portal portal--community" href="#/community" data-reveal style="--d:1">
              <span class="portal__art" aria-hidden="true"><span class="realm__weave"></span><span class="portal__gathering">${raw(T.art.gathering())}</span></span>
              <span class="portal__body">
                <span class="portal__fil" lang="fil">Pamayanan · community</span>
                <span class="portal__title">Deaf Community</span>
                <span class="portal__text">The people behind the language: Deaf identity and culture, the history of FSL, ${T.config.stories ? 'documented stories, ' : ''}rights under the FSL Act, observances and Deaf-led organizations.</span>
                <span class="portal__facts"><span>History since 1907</span><span>RA 11106</span><span>${T.progress.COMMUNITY_EXHIBITS.length} exhibits</span></span>
                <span class="portal__go">Enter ${T.icon('arrow-right')}</span>
              </span>
            </a>
          </div>
        </div>
      </section>`;
  }

  /**
   * The hand on the second landing. Its code loads as the visitor comes near, the hand itself starts
   * near the screen, and the greeting waits until it can be seen, so the first landing stays quick.
   */
  function signHand(el, signal) {
    const stageEl = el.querySelector('.nh-hero [data-stage3d]');
    if (!stageEl) return;
    const strip = el.querySelector('[data-hero-strip]');
    const form = el.querySelector('[data-hero-spell]');
    const input = el.querySelector('#hero-spell');
    const caption = stageEl.querySelector('[data-caption]');
    let stage = null;
    let pending = null;
    let asked = false;
    let mounting = null;

    const spell = (text, greeting) => {
      asked = true;
      if (!stage) { pending = [text, greeting]; return; }
      const word = String(text || '').trim().slice(0, 24);
      if (!word) return;
      strip.innerHTML = String(C.spellStrip(T.data.spellTokens(word)));
      C.handHud(stageEl, 'Fingerspelling', word.toUpperCase());
      // A name someone asked for is read out letter by letter; the greeting plays by itself, so it stays quiet.
      caption.setAttribute('aria-live', greeting ? 'off' : 'polite');
      stage.setLabel(`3D hand fingerspelling ${word}`);
      stage.spell(word, {
        onStep(step) {
          U.$$('.spell-strip__tile', strip).forEach((t) => t.classList.toggle('is-current', Number(t.dataset.token) === step.index));
          caption.textContent = step.space ? '' : step.char;
        },
        onDone() {
          caption.textContent = '';
          U.$$('.spell-strip__tile', strip).forEach((t) => t.classList.remove('is-current'));
        },
      });
    };

    const mount = () => {
      if (mounting) return mounting;
      mounting = T.router.ensureHand().then(() => {
        if (signal.aborted || !stageEl.isConnected) return;
        stage = C.mountHand(stageEl, { signal, label: '3D hand fingerspelling a greeting' });
        if (stage && pending) { spell(...pending); pending = null; }
      }).catch((err) => { console.error('[Tanaw] 3D hand:', err); stageEl.classList.add('is-unsupported'); });
      return mounting;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const word = input.value.trim();
      if (!word) { input.focus(); return; }
      mount();
      spell(word);
      // On a phone the hand is below the form, and the keyboard would cover it.
      if (window.matchMedia('(pointer: coarse)').matches) input.blur();
      stageEl.scrollIntoView({ block: 'nearest', behavior: U.reducedMotion() ? 'auto' : 'smooth' });
      T.progress.logActivity();
    }, { signal });

    const when = (options, fn) => {
      if (!window.IntersectionObserver) { fn(); return; }
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
      }, options);
      io.observe(stageEl);
      signal.addEventListener('abort', () => io.disconnect(), { once: true });
    };
    when({ rootMargin: '500px 0px' }, mount);
    when({ threshold: 0.25 }, () => { if (!asked) spell(GREETING, true); });
  }

  function features() {
    const list = [
      { href: '#/lab', icon: 'cube', title: '3D Hand Lab', text: 'Turn a 3D hand to study the manual alphabet, handshapes, palm orientation and movement, and fingerspell any word.', tag: 'Experimental' },
      { href: '#/learn/path', icon: 'path', title: 'Learning path', text: `${T.data.lessonOrder().length} short lessons with instant feedback, from what FSL is to allyship.` },
      { href: '#/play', icon: 'dice', title: 'Games & a daily challenge', text: `${T.data.games.length} games about etiquette, respectful words, rights, history and how signs are built.` },
      { href: '#/scenes', icon: 'pin', title: 'Everyday scenes', text: 'The clinic, the sari-sari store, the jeepney: words, phrases, etiquette and rights for each.' },
      T.config.stories
        ? { href: '#/community/stories', icon: 'story', title: 'Stories', text: 'Documented moments from Filipino Deaf history, told in chapters with their sources.' }
        : { href: '#/community/history', icon: 'compass', title: 'History voyage', text: 'Sail through FSL history from the first school for the Deaf in 1907 to the FSL Act.' },
      { href: '#/bridge', icon: 'bridge', title: 'Conversation Bridge', text: 'Big text, live captions, text-to-speech and an Emergency Card for real conversations.' },
    ];
    return list.filter((f) => f.href !== '#/lab' || T.config.hand3d);
  }

  function nextLessonCard() {
    const id = T.progress.nextLesson();
    const order = T.data.lessonOrder();
    const done = order.filter(T.progress.lessonDone).length;
    if (!id) {
      return html`
        <article class="card start-card start-card--learn">
          <p class="start-card__label">${T.icon('trophy')}<span>Learning path</span></p>
          <h3 class="start-card__title">Every lesson complete</h3>
          <p class="start-card__meta">Keep facts fresh with spaced review.</p>
          <a class="btn btn--secondary" href="#/practice/review">Review now ${T.icon('arrow-right')}</a>
        </article>`;
    }
    const lesson = T.data.getLesson(id);
    const unit = T.data.unitOf(id);
    const started = !!T.store.state.progress.lessonState[id];
    return html`
      <article class="card start-card start-card--learn">
        <div class="start-card__head">
          ${C.ring(order.length ? (done / order.length) * 100 : 0, { size: 56, stroke: 6, label: `${done}/${order.length}` })}
          <div>
            <p class="start-card__label">${T.icon('path')}<span>${started ? 'Continue' : done ? 'Up next' : 'Start here'}</span></p>
            <h3 class="start-card__title">${lesson.title}</h3>
          </div>
        </div>
        <p class="start-card__meta">Unit ${unit.num} · ${unit.title} · about ${lesson.minutes} min</p>
        <a class="btn btn--primary" href="#/learn/${id}">${started ? 'Resume lesson' : 'Start lesson'} ${T.icon('arrow-right')}</a>
      </article>`;
  }

  function dailyCard() {
    const id = T.progress.dailyGame();
    const g = id ? T.data.getGame(id) : null;
    if (!g) return '';
    const done = T.progress.dailyDone();
    return html`
      <article class="card start-card start-card--game">
        <div class="start-card__head">
          <span class="start-card__badge start-card__badge--${g.tone}">${T.icon(g.icon, { size: 26 })}</span>
          <div>
            <p class="start-card__label">${T.icon('calendar')}<span>Daily challenge</span></p>
            <h3 class="start-card__title">${g.title}</h3>
          </div>
        </div>
        <p class="start-card__meta">${done ? 'Done for today. A new challenge arrives tomorrow.' : `${g.skill} · about ${g.minutes} min · +10 XP bonus today`}</p>
        <a class="btn ${done ? 'btn--secondary' : 'btn--primary'}" href="#/play/${g.id}">${done ? 'Play again' : 'Play the challenge'} ${T.icon('arrow-right')}</a>
      </article>`;
  }

  function exhibitCard() {
    const ex = T.progress.COMMUNITY_EXHIBITS;
    const explored = ex.filter((x) => T.progress.explored(`exhibit:${x}`)).length;
    const nextId = ex.find((x) => !T.progress.explored(`exhibit:${x}`)) || 'history';
    const station = T.shell.WORLDS.community.stations.find((s) => s.id === nextId);
    return html`
      <article class="card start-card start-card--community">
        <div class="start-card__head">
          ${C.ring((explored / ex.length) * 100, { size: 56, stroke: 6, tone: 'teal', label: `${explored}/${ex.length}` })}
          <div>
            <p class="start-card__label">${T.icon('weave')}<span>Deaf Community</span></p>
            <h3 class="start-card__title">${explored ? 'Next exhibit' : 'First exhibit'}: ${station ? station.label : 'History'}</h3>
          </div>
        </div>
        <p class="start-card__meta">${explored === ex.length ? 'You have explored every exhibit.' : `${ex.length - explored} of ${ex.length} exhibits to explore.`}</p>
        <a class="btn btn--secondary" href="${station ? station.href : '#/community'}">Explore ${T.icon('arrow-right')}</a>
      </article>`;
  }

  function countdown() {
    const list = C.nextObservances();
    const n = list[0];
    const after = list[1];
    return html`
      <div class="countdown" data-reveal>
        <p class="countdown__label">${T.icon('calendar')}<span>Coming up</span></p>
        <p class="countdown__big" aria-hidden="true">${n.ongoing ? 'Now' : n.days}<span>${n.ongoing ? '' : n.days === 1 ? 'day' : 'days'}</span></p>
        <h3 class="countdown__name" id="countdown-title">${n.o.name}</h3>
        <p class="countdown__when"><strong>${C.observanceWhen(n)}</strong> · ${C.observanceRange(n)}</p>
        ${after ? html`<p class="countdown__after">Then: ${after.o.name} · ${C.observanceWhen(after).toLowerCase()}</p>` : ''}
        <a class="link-arrow" href="#/community/calendar">Deaf community calendar ${T.icon('arrow-right')}</a>
      </div>`;
  }

  V.home = {
    title: '',
    world: null,
    station: 'home',
    render(el, params, query, { signal }) {
      const started = Object.keys(T.store.state.progress.lessons).length > 0
        || Object.keys(T.store.state.progress.lessonState).length > 0
        || T.progress.gamesPlayed().length > 0
        || T.progress.exploredCount('exhibit:') > 0;

      el.innerHTML = String(html`
        <div class="landing">
          <section class="horizon" aria-labelledby="landing-title">
            <div class="horizon__split" data-split>
              <h1 class="horizon__title" id="landing-title">
                <span class="horizon__word">Tanaw</span>
                <span class="horizon__tag"><span lang="fil">tanaw</span> · to look toward</span>
                <span class="visually-hidden">: explore Filipino Sign Language and the Filipino Deaf community</span>
              </h1>

              <section class="realm realm--learn" data-realm="learn" aria-labelledby="realm-learn">
                <div class="realm__inner">
                  <div class="realm__scene" aria-hidden="true">
                    <div class="realm__sun"></div>
                    <div class="realm__lattice"></div>
                    <ul class="realm__orbs">
                      ${ORBS.map((o, i) => html`<li class="orb" style="--x:${o.x}%;--y:${o.y}%;--d:${o.d};--i:${i}"><span>${o.label}</span></li>`)}
                    </ul>
                    <div class="realm__scrim"></div>
                  </div>
                  <div class="realm__copy">
                    <p class="realm__eyebrow"><span lang="fil">Matuto</span> · to learn</p>
                    <h2 class="realm__title" id="realm-learn">Awareness <span>&amp; Learning</span></h2>
                    <p class="realm__lead">Understand the language. Short lessons, games and everyday scenes about FSL, Deaf awareness and respectful communication.</p>
                    <div class="realm__actions">
                      <a class="realm__cta" href="#/learn" data-enter="learn"><span>Enter</span><span class="visually-hidden"> Awareness &amp; Learning</span>${T.icon('arrow-right')}</a>
                      <nav class="realm__nav" aria-label="Inside Awareness &amp; Learning"><ul class="realm__stations">${stationLinks('learn')}</ul></nav>
                    </div>
                  </div>
                </div>
              </section>

              <div class="seam" data-seam aria-hidden="true">
                <span class="seam__line"></span>
                <div class="seam__grip" data-seam-grip>
                  <span class="seam__arrow seam__arrow--left">${T.icon('chevron-left')}</span>
                  ${raw(T.fx.eyeSVG('seam-eye'))}
                  <span class="seam__arrow seam__arrow--right">${T.icon('chevron-right')}</span>
                </div>
              </div>

              ${crossings()}

              <section class="realm realm--community" data-realm="community" aria-labelledby="realm-community">
                <div class="realm__inner">
                  <div class="realm__scene" aria-hidden="true">
                    <div class="realm__weave"></div>
                    <div class="realm__glow"></div>
                    <div class="realm__gathering">${raw(T.art.gathering())}</div>
                    <div class="realm__scrim"></div>
                  </div>
                  <div class="realm__copy">
                    <p class="realm__eyebrow"><span lang="fil">Pamayanan</span> · community</p>
                    <h2 class="realm__title" id="realm-community">Deaf <span>Community</span></h2>
                    <p class="realm__lead">Meet the people behind the language: Deaf identity and culture, the history of FSL, rights under the law, and Deaf-led organizations.</p>
                    <div class="realm__actions">
                      <a class="realm__cta" href="#/community" data-enter="community"><span>Enter</span><span class="visually-hidden"> Deaf Community</span>${T.icon('arrow-right')}</a>
                      <nav class="realm__nav" aria-label="Inside Deaf Community"><ul class="realm__stations">${stationLinks('community')}</ul></nav>
                    </div>
                  </div>
                </div>
              </section>

              <div class="horizon__veil" aria-hidden="true"><span></span><span></span></div>
            </div>
          </section>

          ${T.config.hand3d ? signHero() : ''}
          ${portals()}

          <section class="section" aria-labelledby="features-title">
            <div class="container">
              <div class="section__head">
                <h2 class="section__title" id="features-title">What you can do</h2>
              </div>
              <ul class="feature-grid">
                ${features().map((f, i) => html`
                  <li data-reveal style="--d:${i % 3}">
                    <a class="feature" href="${f.href}">
                      <span class="feature__icon">${T.icon(f.icon, { size: 26 })}</span>
                      <span class="feature__title">${f.title}${f.tag ? html` <span class="exp-badge">${f.tag}</span>` : ''}</span>
                      <span class="feature__text">${f.text}</span>
                    </a>
                  </li>`)}
              </ul>
            </div>
          </section>

          <section class="section section--alt" aria-labelledby="start-title">
            <div class="container">
              <div class="section__head">
                <h2 class="section__title" id="start-title">${started ? 'Pick up where you left off' : 'Your first five minutes'}</h2>
                <a class="link-arrow" href="#/journey">Your journey ${T.icon('arrow-right')}</a>
              </div>
              <div class="start-grid" data-start-grid>
                ${nextLessonCard()}${dailyCard()}${exhibitCard()}
              </div>
            </div>
          </section>

          <section class="section meet" aria-labelledby="meet-title">
            <div class="container meet__grid">
              <div class="meet__intro" data-reveal>
                <p class="eyebrow">${T.icon('pin')}<span>Where the two worlds meet</span></p>
                <h2 class="section__title" id="meet-title">Everyday scenes</h2>
                <p class="section__lead">Each scene brings both worlds together for one ordinary moment: the words to learn, written phrases you can show, the etiquette that keeps a conversation visual, and the rights that apply.</p>
                <div class="scene-strip">
                  ${TEASER_SCENES.map((id, i) => {
                    const s = T.data.getScene(id);
                    return html`
                      <a class="scene-chip scene-chip--${s.tone}" href="#/scenes/${s.id}" data-reveal style="--d:${i}">
                        <span class="scene-chip__art" aria-hidden="true">${raw(T.art.scene(s.id))}</span>
                        <span class="scene-chip__text"><span class="scene-chip__fil" lang="fil">${s.fil}</span><span class="scene-chip__title">${s.title}</span></span>
                      </a>`;
                  })}
                </div>
                <a class="link-arrow" href="#/scenes">All ${T.data.scenes.length} everyday scenes ${T.icon('arrow-right')}</a>
              </div>
              ${countdown()}
            </div>
          </section>

          <section class="section section--tight" aria-labelledby="honest-title">
            <div class="container">
              <div class="honest-band card">
                <h2 class="section__title section__title--sm" id="honest-title">${T.icon('shield')}<span>No invented signs. No invented voices.</span></h2>
                <ul class="checklist">
                  <li>Tanaw does not invent or AI-generate FSL signs. Its 3D hand is experimental: it follows published descriptions of the manual alphabet and handshapes, and has not been validated by Deaf FSL experts. Learn signs from Deaf teachers and Deaf-led programs.</li>
                  <li>Tanaw is a student innovation project. Its lessons and exhibits are written from published sources, listed in Connect → Sources, and have not been reviewed by Deaf organizations.</li>
                  <li>Tanaw runs in your browser and works offline once loaded (live captions need a connection). There is no tracking.</li>
                </ul>
                <a class="link-arrow" href="#/about">How Tanaw was made ${T.icon('arrow-right')}</a>
              </div>
            </div>
          </section>
        </div>`);

      C.horizon(el.querySelector('.horizon'), signal);
      T.fx.reveal(el, signal);
      T.fx.pauseOffscreen(el.querySelector('.portal--community'), signal);
      signHand(el, signal);

      // Keep the start cards fresh if progress changes while on the page (e.g. the daily goal).
      T.bus.on('store:change', U.debounce(() => {
        const grid = el.querySelector('[data-start-grid]');
        if (grid) grid.innerHTML = String(html`${nextLessonCard()}${dailyCard()}${exhibitCard()}`);
      }, 50), signal);

      // Warm up both world hubs while the visitor decides.
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
      idle(() => { if (!signal.aborted) { T.router.prefetch('#/learn'); T.router.prefetch('#/community'); } });
    },
  };

  V.notFound = {
    title: 'Page not found',
    render(el) {
      el.innerHTML = String(html`
        <div class="container page">
          ${C.emptyState({
            icon: 'compass',
            title: 'Page not found',
            body: 'That page does not exist. It may have moved when Tanaw was reorganized into two worlds.',
            action: html`<div class="btn-row"><a class="btn btn--primary" href="#/learn">Awareness &amp; Learning</a><a class="btn btn--secondary" href="#/community">Deaf Community</a></div>`,
            page: true,
          })}
        </div>`);
    },
  };
})();
