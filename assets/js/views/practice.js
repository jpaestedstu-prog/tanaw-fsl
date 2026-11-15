/* =========================================================================
   Tanaw — Practice hub
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  V.practice = {
    title: 'Practice',
    world: 'learn',
    station: 'practice',
    render(el) {
      const concepts = T.srs.counts('concepts');
      const signs = T.srs.counts('signs');
      const demos = T.config.demonstrations;
      const letters = T.data.signsIn('alphabet');
      const letterCount = letters.filter((s) => T.media.hasMedia(s.id)).length;
      const lettersLearned = letters.filter((s) => C.isLearned(s.id)).length;
      const quizCats = T.data.allCategories().filter((c) => T.data.signsIn(c.id).filter((s) => T.media.hasMedia(s.id)).length >= 4);
      const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

      el.innerHTML = String(html`
        <div class="container page">
          ${C.pageHead({
            eyebrow: 'Practice studio', icon: 'practice',
            title: 'Practice',
            lead: 'Short, focused practice builds lasting skill. Combine these tools with real conversation and feedback from Deaf teachers.',
          })}

          <div class="mode-grid">
            <a class="mode-card mode-card--coral" href="#/practice/mirror">
              <span class="mode-card__icon">${T.icon('practice', { size: 28 })}</span>
              <h2 class="mode-card__title">Practice Mirror</h2>
              <p>${demos
                ? 'See your camera next to a demonstration. Record short clips, replay them side by side and run a five-parameter self-check.'
                : 'Check your framing and signing on camera. Record short clips to show your teacher, and run a five-parameter self-check.'}</p>
              <p class="mode-card__meta">${T.icon('lock')}<span>${hasCamera ? 'Camera starts only when you press Start. Video stays on your device.' : 'Camera access is not available in this browser context.'}</span></p>
            </a>
            <a class="mode-card mode-card--gold" href="#/practice/review">
              <span class="mode-card__icon">${T.icon('layers', { size: 28 })}</span>
              <h2 class="mode-card__title">Spaced review</h2>
              <p>Flashcards scheduled just before you would forget them. Rate how well you remembered and Tanaw does the timing.</p>
              <p class="mode-card__meta">${T.icon('clock')}<span>${concepts.due + signs.due} due · ${concepts.fresh + signs.fresh} new today</span></p>
            </a>
            <a class="mode-card mode-card--indigo" href="#/practice/quiz">
              <span class="mode-card__icon">${T.icon('target', { size: 28 })}</span>
              <h2 class="mode-card__title">Quiz</h2>
              ${demos ? html`
                <p>Ten quick questions on FSL, Deaf culture and rights — or a sign-recognition quiz once a category has demonstrations.</p>
                <p class="mode-card__meta">${T.icon('eye')}<span>${quizCats.length ? `${quizCats.length} categor${quizCats.length === 1 ? 'y' : 'ies'} ready for recognition` : 'Recognition quizzes unlock with verified demonstrations'}</span></p>` : html`
                <p>Ten quick questions on FSL, Deaf culture, etiquette and rights, drawn from the learning path.</p>
                <p class="mode-card__meta">${T.icon('book')}<span>${T.data.questionPool().length} questions in the pool</span></p>`}
            </a>
            <a class="mode-card mode-card--teal" href="#/practice/fingerspell">
              <span class="mode-card__icon">${T.icon('type', { size: 28 })}</span>
              <h2 class="mode-card__title">Fingerspelling</h2>
              ${demos ? html`
                <p>Break names and places into letters, replay the sequence at your pace, and drill reading fingerspelling.</p>
                <p class="mode-card__meta">${T.icon('film')}<span>${letterCount} of ${letters.length} letters have demonstrations</span></p>` : html`
                <p>${T.config.hand3d
                  ? 'Watch an experimental 3D hand spell any name or place at your pace, then test yourself by reading words from the hand.'
                  : 'Break names and places into letters, then fingerspell along with a steady pacer.'}</p>
                <p class="mode-card__meta">${T.icon('check-circle')}<span>${lettersLearned} of ${letters.length} letters marked “I can sign this”</span></p>`}
            </a>
          </div>

          <section class="card tips-card" aria-labelledby="tips-title">
            <h2 class="section__title section__title--sm" id="tips-title">${T.icon('bulb')}<span>How to practice well</span></h2>
            <ul class="tips-list">
              <li><strong>Little and often.</strong> Ten focused minutes a day beats one long session a week.</li>
              <li><strong>One parameter at a time.</strong> Handshape, palm orientation, location, movement, then face.</li>
              <li><strong>Watch the face.</strong> Non-manual signals are part of FSL grammar.</li>
              <li><strong>Get feedback from Deaf signers.</strong> Download a clip from the mirror to show your teacher.</li>
            </ul>
          </section>
        </div>`);
    },
  };
})();
