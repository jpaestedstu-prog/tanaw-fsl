/* =========================================================================
   Tanaw — Spaced review (#/practice/review)
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const DEMOS = T.config.demonstrations;
  const DECKS = {
    concepts: { title: 'Concepts', icon: 'layers', tone: 'indigo', text: 'Facts about FSL, Deaf culture, etiquette and rights — always available.' },
    signs: DEMOS
      ? { title: 'Signs', icon: 'film', tone: 'teal', text: 'Recall entries that have demonstrations, plus any entry you added from Vocabulary.' }
      : { title: 'Vocabulary', icon: 'library', tone: 'teal', text: 'Words you added from Vocabulary. Recall how to sign each one, and check the ones you forget with your teacher.' },
  };

  V.review = {
    title: 'Spaced review',
    world: 'learn',
    station: 'practice',
    render(el, params, query, { signal }) {
      let keyHandler = null;

      function deckHome() {
        keyHandler = null;
        const cc = T.srs.counts('concepts');
        const sc = T.srs.counts('signs');
        el.innerHTML = String(html`
          <div class="container page">
            ${C.pageHead({
              crumbs: [{ label: 'Practice', href: '#/practice' }, { label: 'Spaced review' }],
              title: 'Spaced review',
              lead: 'Recall the answer before you reveal it, then rate how well you remembered. Cards you find hard come back sooner; easy ones wait longer. Up to 10 new cards per deck per day.',
            })}
            <div class="deck-grid">
              ${[['concepts', cc], ['signs', sc]].map(([id, c]) => {
                const d = DECKS[id];
                const ready = c.due + c.fresh;
                return html`
                  <article class="deck-card deck-card--${d.tone}">
                    <span class="deck-card__icon">${T.icon(d.icon, { size: 28 })}</span>
                    <h2 class="deck-card__title">${d.title}</h2>
                    <p>${d.text}</p>
                    <dl class="deck-card__stats">
                      <div><dt>Due</dt><dd>${c.due}</dd></div>
                      <div><dt>New today</dt><dd>${c.fresh}</dd></div>
                      <div><dt>In deck</dt><dd>${c.total}</dd></div>
                    </dl>
                    ${c.total === 0
                      ? html`<p class="field__hint">${T.icon('hourglass')}<span>${DEMOS
                          ? 'No cards yet. Entries join this deck when they get a verified demonstration — or add entries yourself from Vocabulary.'
                          : 'No cards yet. Open a word you learned in class and choose Add to review deck.'}</span></p>
                             <a class="btn btn--secondary" href="#/library">${T.icon('library')}<span>Open Vocabulary</span></a>`
                      : ready
                        ? html`<button type="button" class="btn btn--primary" data-start="${id}">${T.icon('play')}<span>Review ${ready} card${ready === 1 ? '' : 's'}</span></button>`
                        : html`<p class="deck-card__done">${T.icon('check-circle')}<span>All caught up for today. Come back tomorrow!</span></p>`}
                  </article>`;
              })}
            </div>
            <div class="callout callout--tip" role="note">
              ${T.icon('bulb')}
              <div>
                <p class="callout__title">Why spaced repetition?</p>
                <p>Remembering something right before you would forget it strengthens memory far more than re-reading. Short daily reviews add up.</p>
              </div>
            </div>
          </div>`);
      }

      function session(deck) {
        const q = T.srs.queue(deck);
        const list = q.due.concat(q.fresh);
        const seenAgain = {};
        let i = 0;
        let flipped = false;
        let reviewed = 0;
        let xp = 0;
        const total0 = list.length;

        function frontBack(card) {
          if (card.type === 'concept') {
            const lesson = T.data.getLesson(card.ref.lesson);
            return {
              kind: 'Concept',
              front: html`<h2 class="flashcard__prompt" tabindex="-1">${card.ref.q}</h2><p class="flashcard__hint">Think of your answer, then reveal it.</p>`,
              back: html`<p class="flashcard__answer">${card.ref.a}</p>${lesson ? html`<p class="flashcard__source">${T.icon('path')}<span>From the lesson <a href="#/learn/${lesson.id}">${lesson.title}</a></span></p>` : ''}`,
            };
          }
          const s = card.ref;
          if (!DEMOS) {
            return {
              kind: 'Word',
              front: html`<h2 class="flashcard__prompt" tabindex="-1">How do you sign <span class="flashcard__term">${C.signLabel(s)}</span>${s.fil && s.fil !== s.en ? html` <span class="flashcard__fil" lang="fil">· ${s.fil}</span>` : ''}?</h2>
                <p class="flashcard__hint">Sign it from memory, then reveal the card.</p>`,
              back: html`${s.note ? html`<p class="flashcard__note">${T.icon('bulb')}<span>${s.note}</span></p>` : ''}
                <p class="flashcard__answer flashcard__answer--sm">Rate yourself honestly. If the sign did not come back to you, ask your teacher to show it again.</p>`,
            };
          }
          return {
            kind: 'Sign',
            front: html`<h2 class="flashcard__prompt" tabindex="-1">How do you sign <span class="flashcard__term">${C.signLabel(s)}</span>${s.fil && s.fil !== s.en ? html` <span class="flashcard__fil" lang="fil">· ${s.fil}</span>` : ''}?</h2>
              <p class="flashcard__hint">Sign it yourself first — then compare with the demonstration.</p>`,
            back: html`${C.mediaFrame(s, { size: 'md', autoplay: true })}`,
          };
        }

        function show() {
          if (i >= list.length) { summary(); return; }
          flipped = false;
          const card = list[i];
          const fb = frontBack(card);
          const pv = T.srs.preview(card.id);
          el.innerHTML = String(html`
            <div class="container container--narrow page review">
              <div class="review__top">
                <button type="button" class="btn btn--ghost btn--sm" data-home>${T.icon('arrow-left')}<span>Decks</span></button>
                <h1 class="review__title">${DECKS[deck].title} review</h1>
                <span class="review__count">${Math.min(i + 1, list.length)} / ${list.length}</span>
              </div>
              ${C.bar((i / Math.max(1, list.length)) * 100, 'Review progress', DECKS[deck].tone)}
              <article class="flashcard" data-face="front" aria-live="polite">
                <p class="flashcard__kind">${T.icon(card.type === 'concept' ? 'layers' : DECKS.signs.icon)}<span>${fb.kind}${seenAgain[card.id] ? ' · again' : ''}</span></p>
                <div class="flashcard__front">${fb.front}</div>
                <div class="flashcard__back" hidden>${fb.back}</div>
              </article>
              <div class="review__actions" data-actions>
                <button type="button" class="btn btn--primary btn--lg btn--block" data-reveal>${T.icon('eye')}<span>Show answer</span><kbd>Space</kbd></button>
              </div>
              <div class="rating" data-rating hidden>
                <p class="rating__label">How well did you remember?</p>
                <div class="rating__grid">
                  ${T.srs.RATINGS.map((r, ri) => html`
                    <button type="button" class="rating__btn rating__btn--${ri}" data-rate="${ri}">
                      <span class="rating__name">${r}</span>
                      <span class="rating__when">${T.srs.intervalLabel(pv[ri])}</span>
                      <kbd>${ri + 1}</kbd>
                    </button>`)}
                </div>
              </div>
            </div>`);
          const prompt = el.querySelector('.flashcard__prompt');
          if (prompt) prompt.focus({ preventScroll: true });
        }

        function reveal() {
          if (flipped) return;
          flipped = true;
          el.querySelector('.flashcard').dataset.face = 'back';
          el.querySelector('.flashcard__back').hidden = false;
          el.querySelector('[data-actions]').hidden = true;
          el.querySelector('[data-rating]').hidden = false;
          C.hydrateMedia(el);
          const good = el.querySelector('[data-rate="2"]');
          if (good) good.focus({ preventScroll: true });
        }

        function rate(r) {
          if (!flipped) return;
          const card = list[i];
          T.srs.grade(card, r, deck);
          reviewed += 1;
          xp += 2;
          T.progress.addXP(2, { reason: 'review' });
          if (r === 0 && (seenAgain[card.id] || 0) < 2) {
            seenAgain[card.id] = (seenAgain[card.id] || 0) + 1;
            list.push(card);
          }
          i += 1;
          show();
        }

        function summary() {
          keyHandler = null;
          el.innerHTML = String(html`
            <div class="container container--narrow page">
              <section class="complete">
                <span class="complete__icon">${T.icon('layers', { size: 44 })}</span>
                <p class="eyebrow">Review complete</p>
                <h1 class="complete__title" tabindex="-1">Nice work — ${reviewed} card${reviewed === 1 ? '' : 's'} reviewed</h1>
                <div class="complete__stats">
                  ${C.statTile({ icon: 'layers', value: String(total0), label: 'Cards in session', tone: 'teal' })}
                  ${C.statTile({ icon: 'star', value: `+${xp}`, label: 'XP earned', tone: 'gold' })}
                  ${C.statTile({ icon: 'flame', value: String(T.progress.streak().current), label: 'Day streak', tone: 'coral' })}
                </div>
                <div class="complete__actions">
                  <button type="button" class="btn btn--primary" data-home>${T.icon('arrow-left')}<span>Back to decks</span></button>
                  <a class="btn btn--secondary" href="#/practice">Practice hub</a>
                </div>
              </section>
            </div>`);
          const h = el.querySelector('.complete__title');
          if (h) h.focus({ preventScroll: true });
        }

        keyHandler = (e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            if (!flipped && i < list.length) {
              const tag = e.target && e.target.tagName;
              if (tag === 'A' || (tag === 'BUTTON' && !e.target.matches('[data-reveal]'))) return;
              e.preventDefault();
              reveal();
            }
          } else if (/^[1-4]$/.test(e.key) && flipped) {
            e.preventDefault();
            rate(Number(e.key) - 1);
          }
        };

        show();
      }

      el.addEventListener('click', (e) => {
        const start = e.target.closest('[data-start]');
        if (start) session(start.dataset.start);
        if (e.target.closest('[data-home]')) deckHome();
        if (e.target.closest('[data-reveal]')) {
          // Handled by the keyboard handler for Space/Enter; clicks land here.
          if (keyHandler) keyHandler({ key: ' ', target: e.target.closest('[data-reveal]'), preventDefault() {} });
        }
        const rateBtn = e.target.closest('[data-rate]');
        if (rateBtn && keyHandler) keyHandler({ key: String(Number(rateBtn.dataset.rate) + 1), target: rateBtn, preventDefault() {} });
      }, { signal });

      document.addEventListener('keydown', (e) => {
        if (!keyHandler || e.ctrlKey || e.metaKey || e.altKey || U.isTyping(e) || document.querySelector('dialog[open]')) return;
        keyHandler(e);
      }, { signal });

      if (query.deck === 'signs' || query.deck === 'concepts') session(query.deck);
      else deckHome();
    },
  };
})();
