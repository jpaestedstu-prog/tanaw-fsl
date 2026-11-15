/* =========================================================================
   Tanaw — Fingerspelling: planner and reading drill (#/practice/fingerspell)
   With WebGL, an experimental 3D hand spells along and a reading drill asks
   you to read whole words from the hand. Without it, the planner shows the
   letters to spell with your teacher.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const SAMPLES = ['Maria', 'Cebu', 'Bohol', 'Davao', 'Iloilo', 'Pedro', 'Baguio', 'Palawan', 'Mabuhay'];

  V.fingerspell = {
    title: 'Fingerspelling',
    world: 'learn',
    station: 'practice',
    render(el, params, query, { signal }) {
      const D = T.data;
      const use3d = T.config.hand3d !== false && !!T.hand3d && T.hand3d.supported(true);
      // Drill words the 3D hand can spell completely (no T, Ñ or NG).
      const drillWords = (D.fsWords || []).filter((w) => D.spellTokens(w).every((t) => !t.gap));

      let tokens = [];
      let pos = -1;
      let timer = null;
      let speed = 1; // letters per second
      const drill = { word: '', score: 0, tries: 0, playing: false };

      el.innerHTML = String(html`
        <div class="container page">
          ${C.pageHead({
            crumbs: [{ label: 'Practice', href: '#/practice' }, { label: 'Fingerspelling' }],
            title: 'Fingerspelling',
            lead: use3d
              ? 'Plan how a name or place breaks into letters and watch an experimental 3D hand spell it at your pace — then test yourself by reading words from the hand.'
              : 'Plan how a name or place breaks into letters, then fingerspell along at your own pace.',
          })}

          ${use3d ? C.handNotice() : C.notice('info', 'people', html`
            <p><strong>3D needs WebGL, which this browser does not provide.</strong> The planner still shows the letters: fingerspell them the way your Deaf FSL teacher showed you.</p>`)}

          <section class="card fs-card" aria-labelledby="fs-title">
            <h2 class="section__title section__title--sm" id="fs-title">${T.icon('type')}<span>Spell it out</span></h2>
            <label class="field__label" for="fs-input">Type a name, place or word</label>
            <div class="fs-input-row">
              <input class="input" id="fs-input" type="text" maxlength="40" autocomplete="off" spellcheck="false" placeholder="e.g. Maria, Cebu, Bohol" value="${query.text || ''}">
              <button type="button" class="btn btn--secondary" data-sample>${T.icon('shuffle')}<span>Example</span></button>
            </div>
            <div data-notes></div>

            <div class="fs-player ${use3d ? 'fs-player--3d' : ''}">
              ${use3d ? C.handStage({ kind: 'Letter', name: '', compact: true }) : html`<div class="fs-stage" data-stage aria-live="polite"></div>`}
              <div class="fs-controls">
                <button type="button" class="icon-btn icon-btn--lg" data-prev aria-label="Previous letter">${T.icon('chevron-left')}</button>
                <button type="button" class="btn btn--primary" data-play>${T.icon('play')}<span>Play</span></button>
                <button type="button" class="icon-btn icon-btn--lg" data-next aria-label="Next letter">${T.icon('chevron-right')}</button>
                <label class="fs-speed">
                  <span class="field__label">Speed <output data-speed-out>1.0</output> letters/sec</span>
                  <input class="range" type="range" min="0.5" max="2.5" step="0.25" value="1" data-speed>
                </label>
              </div>
              <ol class="fs-tiles" data-tiles aria-label="Letter sequence"></ol>
              <p class="visually-hidden" aria-live="polite" data-live></p>
            </div>
          </section>

          ${use3d ? html`
          <section class="card fs-card" aria-labelledby="drill-title">
            <h2 class="section__title section__title--sm" id="drill-title">${T.icon('eye')}<span>Read the hand</span> <span class="exp-badge">Experimental</span></h2>
            <p>The 3D hand fingerspells a Philippine place or an everyday Filipino word. Read it, then type what you saw. This drill is visual by design: it practices reading handshapes.</p>
            <div class="fs-drill">
              ${C.handStage({ kind: 'Read the hand', name: '?', compact: true, className: 'stage3d--drill' })}
              <form class="fs-drill__form" data-drill-form>
                <label class="field__label" for="drill-answer">What word did the hand spell?</label>
                <div class="fs-input-row">
                  <input class="input" id="drill-answer" type="text" autocomplete="off" spellcheck="false" maxlength="20" disabled>
                  <button type="submit" class="btn btn--primary" data-drill-check disabled>Check</button>
                </div>
                <div class="btn-row">
                  <button type="button" class="btn btn--secondary" data-drill-new>${T.icon('shuffle')}<span>New word</span></button>
                  <button type="button" class="btn btn--ghost" data-drill-replay disabled>${T.icon('repeat')}<span>Replay</span></button>
                  <span class="muted" data-drill-score>Score: 0 / 0</span>
                </div>
                <p class="feedback-inline" data-drill-feedback aria-live="polite"></p>
              </form>
            </div>
          </section>` : ''}
        </div>`);

      const input = el.querySelector('#fs-input');
      const notes = el.querySelector('[data-notes]');
      const tilesEl = el.querySelector('[data-tiles]');
      const playBtn = el.querySelector('[data-play]');
      const speedOut = el.querySelector('[data-speed-out]');
      const live = el.querySelector('[data-live]');
      const stageEls = U.$$('[data-stage3d]', el);
      const flat = el.querySelector('[data-stage]');
      const hand = use3d ? C.mountHand(stageEls[0], { signal, label: '3D hand for fingerspelling' }) : null;
      // A device can offer WebGL and still fail to start it: then the page is drawn again without 3D.
      if (hand) hand.on('fallback', () => { if (!signal.aborted) T.router.render(); });

      function renderNotes() {
        const seen = new Set(tokens.filter((t) => t.gap && t.note).map((t) => t.note));
        notes.innerHTML = seen.size ? String(html`<ul class="fs-notes">${Array.from(seen).map((n) => html`<li>${T.icon('info')}<span>${n}</span></li>`)}</ul>`) : '';
      }

      function renderTiles() {
        tilesEl.innerHTML = String(html`${tokens.map((t, i) => (t.space
          ? html`<li class="fs-tile fs-tile--space" aria-hidden="true"></li>`
          : html`<li><button type="button" class="fs-tile is-plain ${t.gap ? 'fs-tile--special' : ''} ${i === pos ? 'is-current' : ''}" data-pos="${i}" aria-label="${t.char}${t.gap ? ', not modeled' : ''}" ${i === pos ? U.raw('aria-current="step"') : ''}>${t.char}</button></li>`))}`);
      }

      function renderStage() {
        const t = tokens[pos];
        const seq = tokens.filter((x) => !x.space);
        if (hand) {
          const stageEl = stageEls[0];
          if (!t) { C.handHud(stageEl, tokens.length ? `${seq.length} letters` : 'Letter', ''); return; }
          if (t.space) { C.handHud(stageEl, 'Pause', '·'); return; }
          C.handHud(stageEl, `Letter ${seq.indexOf(t) + 1} of ${seq.length}`, t.char);
          if (t.gap) { hand.show('rest'); hand.setLabel(`${t.char}: not modeled`); }
          else { hand.show(t.id); hand.setLabel(`3D hand showing the letter ${t.char}`); }
          live.textContent = `${t.char}${t.gap ? ', not modeled' : ''}`;
          return;
        }
        if (!t) {
          flat.innerHTML = String(html`<p class="fs-stage__hint">${tokens.length ? html`${seq.length} letters. Press <strong>Play</strong> or select a letter.` : 'Type above to see the letter sequence.'}</p>`);
          return;
        }
        if (t.space) { flat.innerHTML = String(html`<p class="fs-stage__hint">— pause between words —</p>`); return; }
        flat.innerHTML = String(html`<div class="fs-stage__letter"><span class="fs-big">${t.char}</span><p>Letter ${seq.indexOf(t) + 1} of ${seq.length}</p></div>`);
      }

      function update(text) {
        stop();
        tokens = D.spellTokens(text);
        pos = -1;
        renderNotes();
        renderTiles();
        renderStage();
        if (hand) hand.show('rest');
        T.router.replaceQuery('/practice/fingerspell', { text: text.trim() });
      }

      function goTo(i) {
        pos = U.clamp(i, 0, tokens.length - 1);
        renderTiles();
        renderStage();
      }

      function stop() {
        clearInterval(timer);
        timer = null;
        playBtn.innerHTML = String(html`${T.icon('play')}<span>Play</span>`);
      }

      function play() {
        if (!tokens.length) { input.focus(); return; }
        if (timer) { stop(); return; }
        if (pos >= tokens.length - 1) pos = -1;
        playBtn.innerHTML = String(html`${T.icon('pause')}<span>Pause</span>`);
        goTo(pos + 1);
        T.progress.logActivity();
        timer = setInterval(() => {
          if (pos >= tokens.length - 1) { stop(); return; }
          goTo(pos + 1);
        }, Math.round(1000 / speed));
      }

      input.addEventListener('input', U.debounce(() => update(input.value), 150), { signal });
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-play]')) play();
        if (e.target.closest('[data-prev]')) { stop(); goTo(pos - 1); }
        if (e.target.closest('[data-next]')) { stop(); goTo(pos + 1); }
        if (e.target.closest('[data-sample]')) {
          input.value = U.sample(SAMPLES.filter((w) => w !== input.value), 1)[0];
          update(input.value);
        }
        const tile = e.target.closest('[data-pos]');
        if (tile) { stop(); goTo(Number(tile.dataset.pos)); }
      }, { signal });
      el.addEventListener('input', (e) => {
        if (e.target.matches('[data-speed]')) {
          speed = Number(e.target.value);
          speedOut.textContent = speed.toFixed(1);
          if (hand) hand.setSpeed(U.clamp(speed, 0.5, 2));
          if (timer) { stop(); play(); }
        }
      }, { signal });

      /* ---------- Reading drill (3D only) ---------- */
      const drillStage = stageEls[1];
      if (use3d && drillStage) {
        const reader = C.mountHand(drillStage, { signal, label: '3D hand fingerspelling a word to read' });
        const answer = el.querySelector('#drill-answer');
        const checkBtn = el.querySelector('[data-drill-check]');
        const replayBtn = el.querySelector('[data-drill-replay]');
        const feedback = el.querySelector('[data-drill-feedback]');
        const scoreEl = el.querySelector('[data-drill-score]');

        const playWord = () => {
          if (!reader || !drill.word) return;
          drill.playing = true;
          C.handHud(drillStage, 'Read the hand', '?');
          reader.spell(drill.word, {
            onDone() {
              drill.playing = false;
              C.handHud(drillStage, 'Your turn', '?');
              if (!answer.disabled) answer.focus({ preventScroll: true });
            },
          });
        };

        el.addEventListener('click', (e) => {
          if (e.target.closest('[data-drill-new]')) {
            drill.word = U.sample(drillWords.filter((w) => w !== drill.word), 1)[0] || drillWords[0];
            answer.value = '';
            answer.disabled = false;
            checkBtn.disabled = false;
            replayBtn.disabled = false;
            feedback.textContent = '';
            feedback.className = 'feedback-inline';
            playWord();
          }
          if (e.target.closest('[data-drill-replay]')) playWord();
        }, { signal });

        el.querySelector('[data-drill-form]').addEventListener('submit', (e) => {
          e.preventDefault();
          if (!drill.word) return;
          const guess = U.normalize(answer.value).replace(/\s/g, '').toUpperCase();
          const ok = guess === drill.word;
          drill.tries += 1;
          if (ok) { drill.score += 1; T.progress.addXP(5, { reason: 'fingerspelling' }); }
          else T.progress.logActivity();
          scoreEl.textContent = `Score: ${drill.score} / ${drill.tries}`;
          feedback.textContent = ok ? `Correct — ${drill.word}! (+5 XP)` : `Not quite. The word was ${drill.word}.`;
          feedback.className = `feedback-inline ${ok ? 'is-correct' : 'is-wrong'}`;
          C.handHud(drillStage, ok ? 'Correct' : 'The word was', drill.word);
          answer.disabled = true;
          checkBtn.disabled = true;
        }, { signal });
      }

      update(input.value);

      return () => clearInterval(timer);
    },
  };
})();
