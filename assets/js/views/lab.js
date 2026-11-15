/* =========================================================================
   Tanaw — 3D Hand Lab (#/lab), experimental
   Turn a 3D hand to study the manual alphabet, named handshapes, palm
   orientation and movement; fingerspell any word. See data/hands.js for
   what is modeled and what is not.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const EXAMPLES = ['MABUHAY', 'PILIPINAS', 'FSL', 'KAIBIGAN'];
  const TABS = [
    { id: 'alphabet', label: 'Alphabet' },
    { id: 'spell', label: 'Spell' },
    { id: 'shapes', label: 'Handshapes' },
    { id: 'params', label: 'Orientation & movement' },
  ];

  V.lab = {
    title: '3D Hand Lab',
    world: 'learn',
    station: 'lab',
    render(el, params, query, { signal }) {
      const D = T.data;
      const letters = D.handLetters;
      const startTab = TABS.some((t) => t.id === query.tab) ? query.tab : (query.text ? 'spell' : 'alphabet');
      let current = query.letter && D.handLetter(query.letter) ? query.letter.toUpperCase() : 'A';
      let spelling = null;

      el.innerHTML = String(html`
        <div class="container page lab">
          ${C.pageHead({
            eyebrow: html`3D Hand Lab <span class="exp-badge">Experimental</span>`, icon: 'cube',
            title: 'See handshapes in 3D',
            lead: 'Turn a 3D hand to study the manual alphabet, the handshapes signs are built from, palm orientation and movement — then fingerspell any word. Drag the hand, or use the arrow keys.',
          })}

          <div class="lab-grid">
            <section class="lab-stage-col" aria-label="3D hand">
              ${C.handStage({ kind: 'Letter', name: current })}
              ${C.handToolbar({ id: 'lab' })}
              ${C.handNotice({ compact: true })}
            </section>

            <section class="lab-panel card" aria-label="What to show">
              <div class="tabs" data-tabs>
                <div class="tabs__list" role="tablist" aria-label="Lab sections">
                  ${TABS.map((t) => html`<button type="button" role="tab" class="tabs__tab" id="lab-t-${t.id}" aria-controls="lab-p-${t.id}" aria-selected="${String(t.id === startTab)}" tabindex="${t.id === startTab ? '0' : '-1'}" data-tab="${t.id}">${t.label}</button>`)}
                </div>

                <div role="tabpanel" class="tabs__panel" id="lab-p-alphabet" aria-labelledby="lab-t-alphabet" tabindex="0" ${startTab === 'alphabet' ? '' : U.raw('hidden')}>
                  <p class="lab-hint">Choose a letter, or type one while the Lab has focus.</p>
                  <div class="lab-letters" role="group" aria-label="Manual alphabet">
                    ${letters.map((l) => html`<button type="button" class="lab-letter ${l.gap ? 'is-gap' : ''}" data-letter="${l.id}" aria-pressed="${String(l.id === current)}">${l.id}${l.gap ? html`<span class="visually-hidden"> (not modeled)</span>` : ''}</button>`)}
                  </div>
                  <div class="lab-info" data-letter-info aria-live="polite"></div>
                </div>

                <div role="tabpanel" class="tabs__panel" id="lab-p-spell" aria-labelledby="lab-t-spell" tabindex="0" ${startTab === 'spell' ? '' : U.raw('hidden')}>
                  <form class="lab-spell" data-spell-form>
                    <label class="field__label" for="lab-spell-input">Type a word or a name</label>
                    <div class="fs-input-row">
                      <input class="input" id="lab-spell-input" type="text" maxlength="40" autocomplete="off" spellcheck="false" placeholder="e.g. Mabuhay, your name" value="${query.text || ''}">
                      <button type="submit" class="btn btn--primary">${T.icon('play')}<span>Spell</span></button>
                    </div>
                  </form>
                  <div class="chip-row chip-row--wrap" aria-label="Examples">
                    ${EXAMPLES.map((w) => html`<button type="button" class="chip" data-example="${w}">${w}</button>`)}
                  </div>
                  <div data-strip></div>
                  <div class="btn-row">
                    <button type="button" class="btn btn--secondary btn--sm" data-spell-pause disabled>${T.icon('pause')}<span>Pause</span></button>
                    <button type="button" class="btn btn--ghost btn--sm" data-spell-replay disabled>${T.icon('repeat')}<span>Replay</span></button>
                  </div>
                  <p class="lab-gap-note" data-gap-note aria-live="polite"></p>
                </div>

                <div role="tabpanel" class="tabs__panel" id="lab-p-shapes" aria-labelledby="lab-t-shapes" tabindex="0" ${startTab === 'shapes' ? '' : U.raw('hidden')}>
                  <p class="lab-hint">Handshapes are one of the five parts of a sign. Researchers name them after letters and numbers.</p>
                  <ul class="lab-tiles">
                    ${D.handshapes.map((h) => html`
                      <li><button type="button" class="lab-tile" data-shape="${h.id}" aria-pressed="false">
                        <span class="lab-tile__name">${h.name}</span>
                        <span class="lab-tile__desc">${h.desc}</span>
                      </button></li>`)}
                  </ul>
                  <p class="field__hint">${T.icon('book')}<span>The FSL signs that Cueto and colleagues (2020) animated use handshapes including 5, 1, S, C, L, X, 4, flat O and bent 5 (claw).</span></p>
                </div>

                <div role="tabpanel" class="tabs__panel" id="lab-p-params" aria-labelledby="lab-t-params" tabindex="0" ${startTab === 'params' ? '' : U.raw('hidden')}>
                  <h2 class="lab-sub">Palm orientation</h2>
                  <div class="chip-row chip-row--wrap">
                    ${D.handDemos.orientation.map((d) => html`<button type="button" class="chip" data-demo="${d.id}" aria-pressed="false">${d.name}</button>`)}
                  </div>
                  <h2 class="lab-sub">Movement</h2>
                  <div class="chip-row chip-row--wrap">
                    ${D.handDemos.movement.map((d) => html`<button type="button" class="chip" data-demo="${d.id}" aria-pressed="false">${d.name}</button>`)}
                  </div>
                  <div class="lab-info" data-demo-info aria-live="polite"><p class="muted">Choose an orientation or a movement to see it.</p></div>
                  <p class="field__hint">${T.icon('info')}<span>Location — where on the body a sign is made — and facial expression need a body and a face, which this hands-only prototype does not have.</span></p>
                </div>
              </div>
            </section>
          </div>

          <section class="lab-about card" aria-labelledby="lab-about-title">
            <h2 class="section__title section__title--sm" id="lab-about-title">${T.icon('flask')}<span>About this prototype</span></h2>
            <div class="lab-about__grid">
              <div>
                <h3>How it works</h3>
                <p>A small WebGL renderer written for Tanaw — no libraries, so it also runs offline from a folder. The hand has a palm, four fingers with three joints each and spread, and a thumb that turns at its base. Poses where the thumb touches a finger were solved with an optimiser so the fingers meet without passing through each other.</p>
              </div>
              <div>
                <h3>What is modeled</h3>
                <p>${letters.filter((l) => !l.gap).length} letters of the manual alphabet (J and Z move), ${D.handshapes.length} named handshapes, ${D.handDemos.orientation.length} palm orientations and ${D.handDemos.movement.length} kinds of movement. Fingerspelled words show double letters with a small slide.</p>
              </div>
              <div>
                <h3>What is not</h3>
                <p>FSL’s T (it differs from the American T), Ñ and NG, numbers and whole signs. Signs also use location, facial expression and the body, which a hands-only model cannot show. The poses have not been validated by Deaf FSL experts.</p>
              </div>
            </div>
          </section>
        </div>`);

      const stageEl = el.querySelector('[data-stage3d]');
      const stage = C.mountHand(stageEl, { signal, toolbar: el.querySelector('[data-hand-tools]'), label: 'Experimental 3D hand' });
      const caption = stageEl.querySelector('[data-caption]');
      const letterInfo = el.querySelector('[data-letter-info]');
      const demoInfo = el.querySelector('[data-demo-info]');
      const strip = el.querySelector('[data-strip]');
      const gapNote = el.querySelector('[data-gap-note]');
      const input = el.querySelector('#lab-spell-input');
      const pauseBtn = el.querySelector('[data-spell-pause]');
      const replayBtn = el.querySelector('[data-spell-replay]');

      const press = (sel, attr, value) => U.$$(sel, el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[attr] === value)));

      function stopSpelling() {
        if (spelling) { stage.stop(); spelling = null; }
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = String(html`${T.icon('pause')}<span>Pause</span>`);
        caption.textContent = '';
      }

      function showLetter(id, opts = {}) {
        const l = T.data.handLetter(id);
        if (!l) return;
        current = l.id;
        stopSpelling();
        press('[data-letter]', 'letter', l.id);
        C.handHud(stageEl, 'Letter', l.id);
        letterInfo.innerHTML = String(html`
          <p class="lab-info__title">${l.gap ? html`${T.icon('info')}<span>Letter ${l.id}: not modeled</span>` : html`Letter ${l.id}`}</p>
          <p>${l.desc}</p>
          ${l.gap ? '' : html`<div class="btn-row">
            ${l.motion ? html`<button type="button" class="btn btn--secondary btn--sm" data-replay-letter>${T.icon('repeat')}<span>Play the movement again</span></button>` : ''}
            <a class="btn btn--ghost btn--sm" href="#/practice/mirror?sign=letter-${l.id.toLowerCase()}">${T.icon('practice')}<span>Practice in the mirror</span></a>
          </div>`}`);
        if (l.gap) {
          stage.show('rest');
          stage.setLabel('3D hand at rest: the letter T is not modeled');
          return;
        }
        stage.show(l.id);
        stage.setLabel(`3D hand showing the letter ${l.id}: ${l.desc}`);
        if (!opts.quiet) T.progress.markExplored(`lab:letter:${l.id}`, { xp: 1 });
        T.router.replaceQuery('/lab', { tab: 'alphabet', letter: l.id });
      }

      function spell(text) {
        const clean = String(text || '').trim().slice(0, 40);
        if (!clean) { input.focus(); return; }
        stopSpelling();
        const tokens = T.data.spellTokens(clean);
        if (!tokens.length) { gapNote.textContent = 'Type letters to fingerspell.'; return; }
        strip.innerHTML = String(C.spellStrip(tokens));
        gapNote.textContent = '';
        const notes = new Set();
        spelling = { text: clean };
        pauseBtn.disabled = false;
        replayBtn.disabled = false;
        C.handHud(stageEl, 'Spelling', clean.toUpperCase());
        stage.setLabel(`3D hand fingerspelling ${clean}`);
        stage.spell(clean, {
          onStep(step) {
            U.$$('.spell-strip__tile', strip).forEach((t) => {
              const on = Number(t.dataset.token) === step.index;
              t.classList.toggle('is-current', on);
              if (on) t.setAttribute('aria-current', 'step'); else t.removeAttribute('aria-current');
            });
            caption.textContent = step.space ? '' : step.char;
            if (step.gap && step.note) { notes.add(step.note); gapNote.textContent = Array.from(notes).join(' '); }
          },
          onDone() {
            caption.textContent = '';
            spelling = null;
            pauseBtn.disabled = true;
            U.$$('.spell-strip__tile', strip).forEach((t) => { t.classList.remove('is-current'); t.removeAttribute('aria-current'); });
            T.ui.announce(`Finished fingerspelling ${clean}.`);
            T.progress.logActivity();
          },
        });
        T.router.replaceQuery('/lab', { tab: 'spell', text: clean });
      }

      // Tabs
      C.bindTabs(el.querySelector('[data-tabs]'), signal, (tab) => {
        const id = tab.dataset.tab;
        stopSpelling();
        if (id === 'alphabet') showLetter(current, { quiet: true });
        T.router.replaceQuery('/lab', { tab: id });
      });

      el.addEventListener('click', (e) => {
        const lb = e.target.closest('[data-letter]');
        if (lb) showLetter(lb.dataset.letter);
        if (e.target.closest('[data-replay-letter]')) showLetter(current, { quiet: true });
        const ex = e.target.closest('[data-example]');
        if (ex) { input.value = ex.dataset.example; spell(ex.dataset.example); }
        if (e.target.closest('[data-spell-replay]')) spell(input.value);
        if (e.target.closest('[data-spell-pause]') && spelling) {
          const paused = !stage.isPlaying();
          stage.pause(!paused);
          pauseBtn.innerHTML = String(paused ? html`${T.icon('pause')}<span>Pause</span>` : html`${T.icon('play')}<span>Resume</span>`);
        }
        const sh = e.target.closest('[data-shape]');
        if (sh) {
          const h = T.data.handshapes.find((x) => x.id === sh.dataset.shape);
          stopSpelling();
          press('[data-shape]', 'shape', h.id);
          C.handHud(stageEl, 'Handshape', h.name);
          stage.show(h.id);
          stage.setLabel(`3D hand showing the ${h.name} handshape: ${h.desc}`);
          T.progress.markExplored(`lab:shape:${h.id}`);
        }
        const dm = e.target.closest('[data-demo]');
        if (dm) {
          const all = T.data.handDemos.orientation.concat(T.data.handDemos.movement);
          const d = all.find((x) => x.id === dm.dataset.demo);
          stopSpelling();
          press('[data-demo]', 'demo', d.id);
          C.handHud(stageEl, d.id.startsWith('or-') ? 'Orientation' : 'Movement', d.name);
          demoInfo.innerHTML = String(html`<p class="lab-info__title">${d.name}</p><p>${d.desc}</p>`);
          stage.demo(d.id);
          stage.setLabel(`3D hand: ${d.name}. ${d.desc}`);
        }
      }, { signal });

      el.querySelector('[data-spell-form]').addEventListener('submit', (e) => { e.preventDefault(); spell(input.value); }, { signal });

      // Type a letter to show it (when not typing in a field).
      el.addEventListener('keydown', (e) => {
        if (U.isTyping(e) || e.ctrlKey || e.metaKey || e.altKey || !/^[a-z]$/i.test(e.key)) return;
        const panel = el.querySelector('#lab-p-alphabet');
        if (!panel || panel.hidden) return;
        showLetter(e.key.toUpperCase());
      }, { signal });

      if (startTab === 'spell' && query.text) spell(query.text);
      else showLetter(current, { quiet: true });
    },
  };
})();
