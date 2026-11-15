/* =========================================================================
   Tanaw — lesson step renderers
   Each step type exposes:
     question  true if the step is scored
     render(step, ctx)      -> SafeHTML
     mount(host, step, ctx) -> controller (optional)
   Controllers may implement: canSubmit(), submit() -> { correct, explain,
   correctText }, reveal(), onKey(event) -> handled?, beforeNext().
   ctx = { changed(), signal (per-step AbortSignal), lessonId }
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const C = T.components;

  const S = {};

  const retryNote = (step) => (step.retry ? html`<p class="step__retry">${T.icon('repeat')}<span>Let’s try this one again</span></p>` : '');
  const keyHint = (n) => html`<p class="step__hint">${T.icon('keyboard')}<span>Press 1–${n} to choose, then Enter to check.</span></p>`;

  function option(name, value, index, text, extraClass = '') {
    return html`
      <label class="option ${extraClass}">
        <input type="radio" name="${name}" value="${value}">
        <span class="option__key" aria-hidden="true">${index + 1}</span>
        <span class="option__text">${text}</span>
        <span class="option__mark" aria-hidden="true"></span>
      </label>`;
  }

  /** Shared controller for radio-based questions. */
  function radioController(host, ctx, isCorrect, correctValue, correctText, explain) {
    const inputs = U.$$('input[type="radio"]', host);
    host.addEventListener('change', () => ctx.changed(), { signal: ctx.signal });
    return {
      canSubmit: () => inputs.some((i) => i.checked),
      submit() {
        const chosen = inputs.find((i) => i.checked);
        const value = chosen ? chosen.value : null;
        const correct = isCorrect(value);
        inputs.forEach((i) => {
          i.disabled = true;
          const label = i.closest('.option');
          if (i.value === String(correctValue)) label.classList.add('is-correct');
          else if (i === chosen) label.classList.add('is-wrong');
        });
        return { correct, explain, correctText: correct ? '' : correctText };
      },
      reveal() {
        inputs.forEach((i) => {
          i.disabled = true;
          if (i.value === String(correctValue)) { i.checked = true; i.closest('.option').classList.add('is-correct'); }
        });
      },
      onKey(e) {
        const n = Number(e.key);
        if (Number.isInteger(n) && n >= 1 && n <= inputs.length && !inputs[n - 1].disabled) {
          inputs[n - 1].checked = true;
          inputs[n - 1].focus();
          ctx.changed();
          return true;
        }
        return false;
      },
    };
  }

  /* ---------- content ---------- */
  S.content = {
    render(step) {
      const tone = step.callout && step.callout.tone === 'note' ? 'note' : 'tip';
      return html`
        <article class="step step--content">
          ${step.art && T.art.has(step.art) ? html`<div class="step__art">${raw(T.art.lesson(step.art))}</div>` : ''}
          <h2 class="step__title">${step.title}</h2>
          <div class="prose">${raw(step.body)}</div>
          ${step.callout ? html`
            <div class="callout callout--${tone}" role="note">
              ${T.icon(tone === 'note' ? 'info' : 'bulb')}
              <div><p class="callout__title">${step.callout.title}</p>${raw(step.callout.body)}</div>
            </div>` : ''}
          ${step.source ? html`<p class="step__source">${T.icon('book')}<span>Source: ${step.source}</span></p>` : ''}
          ${step.cta ? html`<p><a class="btn btn--secondary" href="${step.cta.href}">${step.cta.label}${T.icon('arrow-right')}</a></p>` : ''}
        </article>`;
    },
  };

  /* ---------- tabs ---------- */
  S.tabs = {
    render(step) {
      const id = U.uid('tabs');
      return html`
        <article class="step step--tabs">
          <h2 class="step__title">${step.title}</h2>
          ${step.intro ? html`<p class="step__lead">${step.intro}</p>` : ''}
          <div class="tabs" data-tabs>
            <div class="tabs__list" role="tablist" aria-label="${step.title}">
              ${step.tabs.map((t, i) => html`
                <button type="button" role="tab" class="tabs__tab" id="${id}-t${i}" aria-controls="${id}-p${i}"
                  aria-selected="${i === 0 ? 'true' : 'false'}" tabindex="${i === 0 ? '0' : '-1'}">
                  <span class="tabs__num" aria-hidden="true">${i + 1}</span>${t.label}
                </button>`)}
            </div>
            ${step.tabs.map((t, i) => html`
              <div role="tabpanel" class="tabs__panel prose" id="${id}-p${i}" aria-labelledby="${id}-t${i}" tabindex="0" ${i === 0 ? '' : raw('hidden')}>
                ${raw(t.body)}
              </div>`)}
          </div>
        </article>`;
    },
    mount(host, step, ctx) {
      C.bindTabs(host.querySelector('[data-tabs]'), ctx.signal);
    },
  };

  /* ---------- hand3d: the experimental 3D hand inside a lesson ----------
     mode 'alphabet' shows letter buttons; mode 'params' shows palm orientation and movement. */
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSUVWXYZ'.split('');
  S.hand3d = {
    render(step) {
      return html`
        <article class="step step--hand3d">
          <h2 class="step__title">${step.title} <span class="exp-badge">Experimental</span></h2>
          ${step.intro ? html`<p class="step__lead">${step.intro}</p>` : ''}
          <div class="step-hand">
            <div class="step-hand__stage" data-step-stage></div>
            <div class="step-hand__side">
              <div class="step-hand__picker" data-step-picker role="group" aria-label="${step.mode === 'params' ? 'Orientation and movement' : 'Letters'}">
                <p class="muted">${T.icon('cube')}<span>Loading the 3D hand…</span></p>
              </div>
              <div class="step-hand__info" data-step-info aria-live="polite"></div>
            </div>
          </div>
          <div data-step-note></div>
        </article>`;
    },
    mount(host, step, ctx) {
      const picker = host.querySelector('[data-step-picker]');
      T.router.ensureHand().then(() => {
        if (ctx.signal.aborted) return;
        const D = T.data;
        const stageHost = host.querySelector('[data-step-stage]');
        const info = host.querySelector('[data-step-info]');
        const params = step.mode === 'params';
        const demos = params ? D.handDemos.orientation.concat(D.handDemos.movement) : [];
        stageHost.innerHTML = String(C.handStage({ kind: params ? 'Palm orientation' : 'Letter', name: params ? demos[0].name : 'A', compact: true }));
        host.querySelector('[data-step-note]').innerHTML = String(C.handNotice({ compact: true }));
        const stageEl = stageHost.querySelector('[data-stage3d]');
        const hand = C.mountHand(stageEl, { signal: ctx.signal, label: 'Experimental 3D hand' });
        picker.innerHTML = String(params
          ? html`${demos.map((d) => html`<button type="button" class="chip" data-demo="${d.id}" aria-pressed="false">${d.name}</button>`)}`
          : html`${ALPHABET.map((ch) => html`<button type="button" class="lab-letter" data-letter="${ch}" aria-pressed="false">${ch}</button>`)}`);
        picker.classList.add(params ? 'step-hand__picker--chips' : 'step-hand__picker--letters');
        const select = (btn) => U.$$('[aria-pressed]', picker).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        const showLetter = (ch, btn) => {
          const l = D.handLetter(ch);
          select(btn);
          C.handHud(stageEl, 'Letter', ch);
          hand.show(ch);
          hand.setLabel(`3D hand showing the letter ${ch}: ${l.desc}`);
          info.innerHTML = String(html`<p><strong>${ch}.</strong> ${l.desc}</p>`);
          T.progress.markExplored(`lab:letter:${ch}`, { xp: 1 });
        };
        const showDemo = (d, btn) => {
          select(btn);
          C.handHud(stageEl, d.id.startsWith('or-') ? 'Palm orientation' : 'Movement', d.name);
          hand.demo(d.id);
          hand.setLabel(`3D hand: ${d.name}. ${d.desc}`);
          info.innerHTML = String(html`<p><strong>${d.name}.</strong> ${d.desc}</p>`);
        };
        picker.addEventListener('click', (e) => {
          const lb = e.target.closest('[data-letter]');
          if (lb) showLetter(lb.dataset.letter, lb);
          const db = e.target.closest('[data-demo]');
          if (db) showDemo(demos.find((x) => x.id === db.dataset.demo), db);
        }, { signal: ctx.signal });
        if (params) showDemo(demos[0], picker.querySelector('[data-demo]'));
        else showLetter('A', picker.querySelector('[data-letter]'));
      }).catch((err) => {
        console.error('[Tanaw] 3D hand step:', err);
        picker.innerHTML = String(html`<p class="muted">The 3D hand could not be loaded in this browser.</p>`);
      });
    },
  };

  /** Accessible tabs: click + arrow keys, roving tabindex. Reused by other views. */
  C.bindTabs = (root, signal, onChange) => {
    if (!root) return;
    const tabs = U.$$('[role="tab"]', root);
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      if (onChange) onChange(tab);
    };
    root.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab && root.contains(tab)) select(tab, false);
    }, { signal });
    root.addEventListener('keydown', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (!tab) return;
      const i = tabs.indexOf(tab);
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    }, { signal });
    return { select: (i) => tabs[i] && select(tabs[i], false) };
  };

  /* ---------- multiple choice ---------- */
  S.mcq = {
    question: true,
    render(step, ctx) {
      if (!ctx.order) ctx.order = U.shuffle(step.options.map((_, i) => i));
      const name = U.uid('q');
      return html`
        <article class="step step--question">
          ${retryNote(step)}
          <p class="step__eyebrow">${T.icon('help')}<span>${step.eyebrow || 'Check your understanding'}</span></p>
          <fieldset class="options">
            <legend class="step__title">${step.prompt}</legend>
            ${ctx.order.map((oi, i) => option(name, oi, i, step.options[oi]))}
          </fieldset>
          ${keyHint(step.options.length)}
        </article>`;
    },
    mount(host, step, ctx) {
      return radioController(host, ctx, (v) => Number(v) === step.answer, step.answer, step.options[step.answer], step.explain);
    },
  };

  /* ---------- true / false ---------- */
  S.truefalse = {
    question: true,
    render(step) {
      const name = U.uid('tf');
      return html`
        <article class="step step--question">
          ${retryNote(step)}
          <p class="step__eyebrow">${T.icon('help')}<span>True or false?</span></p>
          <fieldset class="options options--binary">
            <legend class="step__title">${step.statement}</legend>
            ${option(name, 'true', 0, 'True', 'option--big')}
            ${option(name, 'false', 1, 'False', 'option--big')}
          </fieldset>
          ${keyHint(2)}
        </article>`;
    },
    mount(host, step, ctx) {
      const correctValue = step.answer ? 'true' : 'false';
      return radioController(host, ctx, (v) => v === correctValue, correctValue, step.answer ? 'True' : 'False', step.explain);
    },
  };

  /* ---------- match ---------- */
  S.match = {
    question: true,
    render(step, ctx) {
      if (!ctx.rightOrder) ctx.rightOrder = U.shuffle(step.pairs.map((_, i) => i));
      return html`
        <article class="step step--question">
          ${retryNote(step)}
          <p class="step__eyebrow">${T.icon('link')}<span>Match the pairs</span></p>
          <h2 class="step__title">${step.prompt}</h2>
          <p class="step__lead">Select an item on the left, then its match on the right. Select a matched item again to undo.</p>
          <div class="match" data-match>
            <ul class="match__col" aria-label="Terms">
              ${step.pairs.map((p, i) => html`<li><button type="button" class="match__item" data-side="left" data-index="${i}" aria-pressed="false">
                <span class="match__badge" aria-hidden="true"></span><span class="match__text">${p[0]}</span></button></li>`)}
            </ul>
            <ul class="match__col" aria-label="Descriptions">
              ${ctx.rightOrder.map((ri) => html`<li><button type="button" class="match__item" data-side="right" data-index="${ri}" aria-pressed="false">
                <span class="match__badge" aria-hidden="true"></span><span class="match__text">${step.pairs[ri][1]}</span></button></li>`)}
            </ul>
          </div>
          <p class="visually-hidden" aria-live="polite" data-match-status></p>
        </article>`;
    },
    mount(host, step, ctx) {
      const root = host.querySelector('[data-match]');
      const status = host.querySelector('[data-match-status]');
      const pairs = new Map(); // leftIndex -> rightIndex
      const labels = new Map(); // leftIndex -> pair number
      let active = null; // { side, index }
      let locked = false;
      const btn = (side, index) => root.querySelector(`[data-side="${side}"][data-index="${index}"]`);

      function nextNumber() {
        const used = new Set(labels.values());
        let n = 1;
        while (used.has(n)) n++;
        return n;
      }

      function paint() {
        U.$$('.match__item', root).forEach((b) => {
          const side = b.dataset.side;
          const index = Number(b.dataset.index);
          let leftIndex = null;
          if (side === 'left' && pairs.has(index)) leftIndex = index;
          if (side === 'right') pairs.forEach((r, l) => { if (r === index) leftIndex = l; });
          const paired = leftIndex !== null;
          const num = paired ? labels.get(leftIndex) : null;
          b.classList.toggle('is-paired', paired);
          b.dataset.pair = paired ? String(num) : '';
          b.querySelector('.match__badge').textContent = paired ? String(num) : '';
          const isActive = !!active && active.side === side && active.index === index;
          b.classList.toggle('is-active', isActive);
          b.setAttribute('aria-pressed', isActive || paired ? 'true' : 'false');
          const text = b.querySelector('.match__text').textContent;
          let partner = '';
          if (paired) {
            partner = side === 'left' ? step.pairs[pairs.get(index)][1] : step.pairs[leftIndex][0];
          }
          b.setAttribute('aria-label', paired ? `${text} — matched with ${partner}` : text);
        });
      }

      function unpair(leftIndex) {
        pairs.delete(leftIndex);
        labels.delete(leftIndex);
      }

      root.addEventListener('click', (e) => {
        const b = e.target.closest('.match__item');
        if (!b || locked) return;
        const side = b.dataset.side;
        const index = Number(b.dataset.index);
        // Undo an existing pair.
        if (side === 'left' && pairs.has(index)) { unpair(index); active = null; paint(); ctx.changed(); status.textContent = 'Pair removed.'; return; }
        if (side === 'right') {
          let owner = null;
          pairs.forEach((r, l) => { if (r === index) owner = l; });
          if (owner !== null) { unpair(owner); active = null; paint(); ctx.changed(); status.textContent = 'Pair removed.'; return; }
        }
        if (!active || active.side === side) {
          active = active && active.side === side && active.index === index ? null : { side, index };
          paint();
          return;
        }
        const left = side === 'left' ? index : active.index;
        const right = side === 'right' ? index : active.index;
        pairs.set(left, right);
        labels.set(left, nextNumber());
        active = null;
        paint();
        status.textContent = `Matched ${step.pairs[left][0]} with ${step.pairs[right][1]}.`;
        ctx.changed();
      }, { signal: ctx.signal });

      paint();
      return {
        canSubmit: () => pairs.size === step.pairs.length,
        submit() {
          locked = true;
          let allRight = true;
          pairs.forEach((r, l) => {
            const ok = r === l;
            if (!ok) allRight = false;
            btn('left', l).classList.add(ok ? 'is-correct' : 'is-wrong');
            btn('right', r).classList.add(ok ? 'is-correct' : 'is-wrong');
          });
          U.$$('.match__item', root).forEach((b) => { b.disabled = true; });
          const answer = step.pairs.map((p) => `${p[0]} → ${p[1]}`).join('; ');
          return { correct: allRight, explain: step.explain || '', correctText: allRight ? '' : answer };
        },
        reveal() {
          locked = true;
          pairs.clear();
          labels.clear();
          step.pairs.forEach((_, i) => { pairs.set(i, i); labels.set(i, i + 1); });
          paint();
          U.$$('.match__item', root).forEach((b) => { b.disabled = true; b.classList.add('is-correct'); });
        },
      };
    },
  };

  /* ---------- sort into bins ---------- */
  S.sort = {
    question: true,
    render(step, ctx) {
      if (!ctx.order) ctx.order = U.shuffle(step.items.map((_, i) => i));
      const base = U.uid('sort');
      return html`
        <article class="step step--question">
          ${retryNote(step)}
          <p class="step__eyebrow">${T.icon('grid')}<span>${step.title || 'Sort it out'}</span></p>
          <h2 class="step__title">${step.prompt}</h2>
          <ul class="sortlist">
            ${ctx.order.map((ii) => {
              const item = step.items[ii];
              return html`
                <li class="sortlist__row" data-item="${ii}">
                  <fieldset class="sortlist__set">
                    <legend class="sortlist__text">${item.text}</legend>
                    <div class="segmented segmented--sm">
                      ${step.bins.map((b, bi) => html`
                        <label class="segmented__option">
                          <input type="radio" name="${base}-${ii}" value="${bi}">
                          <span>${b}</span>
                        </label>`)}
                    </div>
                  </fieldset>
                  <span class="sortlist__mark" aria-hidden="true"></span>
                </li>`;
            })}
          </ul>
        </article>`;
    },
    mount(host, step, ctx) {
      const rows = U.$$('.sortlist__row', host);
      host.addEventListener('change', () => ctx.changed(), { signal: ctx.signal });
      const chosen = (row) => {
        const i = row.querySelector('input:checked');
        return i ? Number(i.value) : null;
      };
      return {
        canSubmit: () => rows.every((r) => chosen(r) !== null),
        submit() {
          let wrong = 0;
          rows.forEach((r) => {
            const item = step.items[Number(r.dataset.item)];
            const ok = chosen(r) === item.bin;
            if (!ok) wrong++;
            r.classList.add(ok ? 'is-correct' : 'is-wrong');
            if (!ok) r.querySelector('.sortlist__mark').textContent = `→ ${step.bins[item.bin]}`;
            U.$$('input', r).forEach((i) => { i.disabled = true; });
          });
          return { correct: wrong === 0, explain: step.explain || '', correctText: wrong ? `${wrong} item${wrong > 1 ? 's were' : ' was'} in the wrong group — see the corrections above.` : '' };
        },
        reveal() {
          rows.forEach((r) => {
            const item = step.items[Number(r.dataset.item)];
            const input = r.querySelector(`input[value="${item.bin}"]`);
            if (input) input.checked = true;
            r.classList.add('is-correct');
            U.$$('input', r).forEach((i) => { i.disabled = true; });
          });
        },
      };
    },
  };

  /* ---------- vocabulary gallery ---------- */
  S.signs = {
    render(step) {
      const ids = step.signIds || [];
      const counts = T.media.counts(ids);
      const signs = ids.map((id) => T.data.getSign(id)).filter(Boolean);
      return html`
        <article class="step step--signs">
          <h2 class="step__title">${step.title}</h2>
          <p class="step__lead">${step.intro || ''}</p>
          ${T.config.demonstrations ? html`
            <p class="media-summary">
              ${C.statusBadge(counts.withMedia ? 'verified' : 'pending', { compact: true })}
              <span>${counts.verified} verified · ${counts.local} on this device${counts.test ? ` · ${counts.test} test` : ''} · ${counts.pending} awaiting verification</span>
            </p>` : ''}
          <div class="sign-grid sign-grid--compact" data-gallery>
            ${signs.map((s) => C.signTile(s, { button: true }))}
          </div>
        </article>`;
    },
    mount(host, step, ctx) {
      host.addEventListener('click', (e) => {
        const b = e.target.closest('[data-quickview]');
        if (b) C.quickView(b.dataset.quickview);
      }, { signal: ctx.signal });
      // Keep the "Learned" marks current after a word card is closed.
      T.bus.on('learned:change', ({ id }) => {
        const tile = host.querySelector(`[data-quickview="${CSS.escape(id)}"]`);
        const sign = T.data.getSign(id);
        if (tile && sign) tile.outerHTML = String(C.signTile(sign, { button: true }));
      }, ctx.signal);
    },
  };

  /* ---------- recognition (needs media) ---------- */
  S.recognize = {
    question: true,
    render(step) {
      const sign = T.data.getSign(step.signId);
      const name = U.uid('rec');
      return html`
        <article class="step step--question step--recognize">
          ${retryNote(step)}
          <p class="step__eyebrow">${T.icon('eye')}<span>Recognition check</span></p>
          <div class="recognize">
            ${C.mediaFrame(sign, { size: 'md', autoplay: true, controls: true })}
            <fieldset class="options">
              <legend class="step__title">Which entry does this demonstration show?</legend>
              ${step.options.map((id, i) => {
                const s = T.data.getSign(id);
                return option(name, id, i, s ? C.signLabel(s) + (s.fil && s.fil !== s.en ? ` · ${s.fil}` : '') : id);
              })}
            </fieldset>
          </div>
          ${keyHint(step.options.length)}
        </article>`;
    },
    mount(host, step, ctx) {
      const sign = T.data.getSign(step.signId);
      return radioController(host, ctx, (v) => v === step.signId, step.signId, sign ? C.signLabel(sign) : step.signId, '');
    },
  };

  /* ---------- self check (no media yet) ---------- */
  S.selfcheck = {
    render(step) {
      const signs = (step.signIds || []).map((id) => T.data.getSign(id)).filter(Boolean);
      const checked = T.store.state.progress.selfcheck || {};
      return html`
        <article class="step step--selfcheck">
          <h2 class="step__title">Self-check</h2>
          ${T.config.demonstrations ? html`
            <div class="notice">
              ${T.icon('hourglass')}
              <p><strong>Recognition quiz locked:</strong> it unlocks when at least 4 entries in this lesson have a demonstration (now: ${step.withMedia} of ${signs.length}). Tanaw never quizzes you on unverified signs.</p>
            </div>` : ''}
          <p class="step__lead">Learning with a Deaf teacher or class? Tick the entries you can already sign confidently. Your teacher is the best judge — use this list to plan what to practice next.</p>
          <ul class="checklist-grid">
            ${signs.map((s) => html`
              <li><label class="check">
                <input type="checkbox" value="${s.id}" ${checked[s.id] ? raw('checked') : ''}>
                <span class="check__box" aria-hidden="true">${T.icon('check')}</span>
                <span class="check__text">${C.signLabel(s)}${s.fil && s.fil !== s.en ? html` <span class="check__fil" lang="fil">${s.fil}</span>` : ''}</span>
              </label></li>`)}
          </ul>
        </article>`;
    },
    mount(host) {
      return {
        beforeNext() {
          const boxes = U.$$('input[type="checkbox"]', host);
          T.store.update((st) => {
            boxes.forEach((b) => {
              if (b.checked) st.progress.selfcheck[b.value] = true;
              else delete st.progress.selfcheck[b.value];
            });
          });
        },
      };
    },
  };

  /* ---------- reflection ---------- */
  S.reflect = {
    render(step) {
      const id = U.uid('reflect');
      return html`
        <article class="step step--reflect">
          <p class="step__eyebrow">${T.icon('edit')}<span>Learning journal</span></p>
          <h2 class="step__title"><label for="${id}">${step.prompt}</label></h2>
          <textarea class="textarea" id="${id}" rows="4" maxlength="2000" placeholder="${step.placeholder || ''}"></textarea>
          <p class="field__hint">${T.icon('lock')}<span>Private: saved only in this browser. Optional — leave it blank to skip.</span></p>
        </article>`;
    },
    mount(host, step, ctx) {
      const ta = host.querySelector('textarea');
      return {
        beforeNext() {
          const text = ta.value.trim();
          if (text.length >= 3) {
            T.progress.addJournal({ lessonId: ctx.lessonId, prompt: step.prompt, text });
            T.progress.addXP(5, { reason: 'journal' });
            T.ui.toast('Saved to your learning journal.', { icon: 'edit' });
          }
        },
      };
    },
  };

  T.steps = S;
})();
