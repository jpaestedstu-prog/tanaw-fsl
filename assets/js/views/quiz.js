/* =========================================================================
   Tanaw — Quiz (#/practice/quiz[?mode=concepts|signs&cat=…])
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const QUESTIONS = 10;

  function readyCategories() {
    return T.data.allCategories()
      .map((c) => ({ c, ids: T.data.signsIn(c.id).map((s) => s.id), withMedia: T.data.signsIn(c.id).filter((s) => T.media.hasMedia(s.id)).map((s) => s.id) }))
      .filter((x) => x.withMedia.length >= 4);
  }

  function chooser(el) {
    const ready = readyCategories();
    const demos = T.config.demonstrations;
    el.innerHTML = String(html`
      <div class="container page">
        ${C.pageHead({
          crumbs: [{ label: 'Practice', href: '#/practice' }, { label: 'Quiz' }],
          title: 'Quiz',
          lead: 'Ten quick questions with instant feedback. A perfect score earns the Sharp eyes badge.',
        })}
        <div class="deck-grid">
          <article class="deck-card deck-card--indigo">
            <span class="deck-card__icon">${T.icon('layers', { size: 28 })}</span>
            <h2 class="deck-card__title">Concept quiz</h2>
            <p>FSL, Deaf culture, etiquette and RA 11106 — drawn at random from every lesson in the learning path.</p>
            <a class="btn btn--primary" href="#/practice/quiz?mode=concepts">${T.icon('play')}<span>Start concept quiz</span></a>
          </article>
          ${!demos ? html`
          <article class="deck-card deck-card--teal">
            <span class="deck-card__icon">${T.icon('people', { size: 28 })}</span>
            <h2 class="deck-card__title">Quizzing yourself on signs</h2>
            <p>Tanaw quizzes you on signs only after Deaf FSL experts have validated demonstrations of them, so there is no sign quiz yet. Ask your teacher or classmates to quiz you, and use spaced review for the words you have learned.</p>
            <a class="btn btn--secondary" href="#/practice/review">${T.icon('layers')}<span>Spaced review</span></a>
          </article>` : html`
          <article class="deck-card deck-card--teal">
            <span class="deck-card__icon">${T.icon('eye', { size: 28 })}</span>
            <h2 class="deck-card__title">Sign recognition</h2>
            <p>Watch a demonstration and choose what it shows. Available for categories with at least 4 demonstrations — Tanaw never quizzes on unverified signs.</p>
            ${ready.length ? html`
              <form class="quiz-form" data-sign-form>
                <label class="field__label" for="quiz-cat">Category</label>
                <select class="select" id="quiz-cat">
                  ${ready.map((x) => html`<option value="${x.c.id}">${x.c.label} (${x.withMedia.length} demonstrations)</option>`)}
                </select>
                <button type="submit" class="btn btn--primary">${T.icon('play')}<span>Start recognition quiz</span></button>
              </form>`
              : html`
              <p class="field__hint">${T.icon('hourglass')}<span>No category has 4 demonstrations yet. Verified clips can be added by Deaf contributors and FSL educators in the Contributor Studio.</span></p>
              <a class="btn btn--secondary" href="#/studio">${T.icon('studio')}<span>Contributor Studio</span></a>`}
          </article>`}
        </div>
      </div>`);
  }

  function buildConcept() {
    return U.sample(T.data.questionPool(), QUESTIONS).map((q) => {
      const step = Object.assign({}, q);
      const lesson = T.data.getLesson(q.lesson);
      step.eyebrow = lesson ? `From: ${lesson.title}` : 'Question';
      return step;
    });
  }

  function buildSigns(catId) {
    const ids = T.data.signsIn(catId).map((s) => s.id);
    const withMedia = ids.filter((id) => T.media.hasMedia(id));
    return U.sample(withMedia, Math.min(QUESTIONS, withMedia.length)).map((id) => ({
      type: 'recognize',
      signId: id,
      options: U.shuffle([id].concat(U.sample(ids.filter((x) => x !== id), 3))),
    }));
  }

  function results(el, stats, again) {
    const perfect = stats.total > 0 && stats.correct === stats.total;
    T.progress.bump('quizzes.taken');
    if (perfect) T.progress.bump('quizzes.perfect');
    const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    el.innerHTML = String(html`
      <div class="container container--narrow page">
        <section class="complete">
          <span class="complete__icon">${T.icon(perfect ? 'trophy' : 'target', { size: 44 })}</span>
          <p class="eyebrow">Quiz complete</p>
          <h1 class="complete__title" tabindex="-1">${perfect ? 'Perfect score — sharp eyes!' : pct >= 70 ? 'Great job!' : 'Good effort — review and try again.'}</h1>
          <div class="complete__stats">
            ${C.statTile({ icon: 'target', value: `${stats.correct}/${stats.total}`, label: 'Correct', tone: 'teal' })}
            ${C.statTile({ icon: 'star', value: `+${stats.xp}`, label: 'XP earned', tone: 'gold' })}
            ${C.statTile({ icon: 'chart', value: `${pct}%`, label: 'Score', tone: 'coral' })}
          </div>
          <div class="complete__actions">
            <button type="button" class="btn btn--primary" data-again>${T.icon('repeat')}<span>New quiz</span></button>
            <a class="btn btn--secondary" href="#/practice/quiz">${T.icon('arrow-left')}<span>Quiz menu</span></a>
            <a class="btn btn--ghost" href="#/practice/review">${T.icon('layers')}<span>Spaced review</span></a>
          </div>
        </section>
      </div>`);
    const h = el.querySelector('.complete__title');
    if (h) h.focus({ preventScroll: true });
    el.querySelector('[data-again]').addEventListener('click', again);
  }

  V.quiz = {
    world: 'learn',
    station: 'practice',
    title: (p, q) => (q.mode === 'signs' ? 'Sign recognition quiz' : q.mode === 'concepts' ? 'Concept quiz' : 'Quiz'),
    render(el, params, query, { signal }) {
      // Sign recognition exists only while demonstrations are switched on.
      if (query.mode !== 'concepts' && !(query.mode === 'signs' && T.config.demonstrations)) {
        chooser(el);
        el.addEventListener('submit', (e) => {
          if (!e.target.matches('[data-sign-form]')) return;
          e.preventDefault();
          const cat = el.querySelector('#quiz-cat').value;
          T.router.go(`#/practice/quiz?mode=signs&cat=${encodeURIComponent(cat)}`);
        }, { signal });
        return;
      }

      const start = () => {
        let steps;
        let title;
        if (query.mode === 'signs') {
          const cat = T.data.category(query.cat);
          steps = cat ? buildSigns(cat.id) : [];
          title = cat ? `Recognition: ${cat.label}` : 'Recognition quiz';
          if (steps.length < 4) {
            el.innerHTML = String(html`<div class="container page">${C.emptyState({ icon: 'hourglass', title: 'Not enough demonstrations yet', body: 'This category needs at least 4 entries with demonstrations before a recognition quiz can run.', action: html`<a class="btn btn--primary" href="#/practice/quiz">Back to the quiz menu</a>`, page: true })}</div>`);
            return;
          }
        } else {
          steps = buildConcept();
          title = 'Concept quiz';
        }
        C.runner(el, {
          title,
          eyebrow: 'Practice · Quiz',
          steps,
          exitHref: '#/practice/quiz',
          exitLabel: 'Exit quiz',
          requeueMissed: false,
          xpPerCorrect: 5,
          signal,
          onFinish: (stats) => results(el, stats, () => { window.scrollTo(0, 0); start(); }),
        });
      };
      start();
    },
    focusMode: false,
  };
})();
