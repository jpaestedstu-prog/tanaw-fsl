/* =========================================================================
   Tanaw — game rules (loaded with the game player, play.js)
   Each game receives the player's kit: body, setProgress, setScore,
   feedback, next, finish… and keeps its own round state. Every game is
   fully playable with a keyboard; pointer gestures are shortcuts only.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const C = T.components;
  const G = (T.gameImpl = T.gameImpl || {});

  const keyHint = (n) => html`<p class="game-keys">${T.icon('keyboard')}<span>Keys 1–${n} choose.</span></p>`;

  /** Number keys choose among buttons while the round is waiting for an answer. */
  function numberKeys(kit, getButtons) {
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || U.isTyping(e) || document.querySelector('dialog[open]')) return;
      if (!/^[1-9]$/.test(e.key)) return;
      const btns = getButtons().filter((b) => !b.disabled);
      const b = btns[Number(e.key) - 1];
      if (b) { e.preventDefault(); b.click(); }
    }, { signal: kit.signal });
  }

  /* ======================================================================
     Sightlines — interactive scenes that respond to the choice
     ====================================================================== */
  const bust = (...a) => T.art.bust(...a);
  const headOf = (cx, top, s) => ({ x: cx, y: top + 22 * s, s });
  function eyes(h, look, cls) {
    const dx = look === 'right' ? 6 : look === 'left' ? -6 : 0;
    const sp = look === 'front' ? 7 : 5;
    const y = (h.y - 2 * h.s).toFixed(1);
    return `<g class="${cls}"><circle cx="${(h.x + (dx - sp) * h.s).toFixed(1)}" cy="${y}" r="${(2.5 * h.s).toFixed(2)}"/><circle cx="${(h.x + (dx + sp) * h.s).toFixed(1)}" cy="${y}" r="${(2.5 * h.s).toFixed(2)}"/></g>`;
  }
  const sight = (a, b, cls = 'fx fx-sight') => `<path class="${cls}" d="M${a.x + 10 * a.s} ${a.y - 2} L${b.x - 10 * b.s} ${b.y - 2}"/>`;
  const youTag = (h) => `<text x="${h.x}" y="${(h.y - 26 * h.s).toFixed(1)}" text-anchor="middle" class="sl-tag">You</text>`;
  const floor = '<path d="M10 182h300" class="a-line-stroke"/>';
  const cross = '<g class="sl-x"><circle cx="292" cy="28" r="16"/><path d="m285 21 14 14M299 21l-14 14"/></g>';
  const check = '<g class="sl-check"><circle cx="292" cy="28" r="16"/><path d="m284 28 6 6 10-11"/></g>';

  const LAYOUTS = {
    back() {
      const you = headOf(78, 84, 0.9);
      const fr = headOf(232, 84, 0.9);
      return `${floor}
        <rect x="236" y="136" width="56" height="9" rx="2" class="a-line-fill"/>
        ${bust(78, 84, 0.9, 'a-primary')}${eyes(you, 'right', 'sl-eyes')}${youTag(you)}
        ${bust(232, 84, 0.9, 'a-teal')}${eyes(fr, 'left', 'sl-turn')}
        <g class="fx fx-tap"><circle cx="206" cy="148" r="7"/><circle cx="206" cy="148" r="15"/><circle cx="206" cy="148" r="23"/></g>
        ${sight(you, fr)}`;
    },
    room() {
      const you = headOf(52, 98, 0.78);
      const xs = [132, 182, 232, 282];
      const tones = ['a-teal', 'a-coral', 'a-gold', 'a-teal'];
      return `${floor}
        <path d="M20 16h280" class="a-line-stroke"/>
        <path d="M168 16v14" class="a-ink-stroke"/><path d="M152 30h32l9 15h-50z" class="a-gold a-stroke"/>
        <g class="fx fx-lights"><path d="M168 54v14M146 50l-10 10M190 50l10 10M128 42l-14 3M208 42l14 3"/></g>
        ${bust(52, 98, 0.78, 'a-primary')}${eyes(you, 'right', 'sl-eyes')}${youTag(you)}
        ${xs.map((x, i) => `${bust(x, 112, 0.6, tones[i])}${eyes(headOf(x, 112, 0.6), 'left', 'sl-turn')}`).join('')}`;
    },
    across() {
      const you = headOf(66, 92, 0.8);
      const fr = headOf(262, 110, 0.6);
      return `${floor}
        ${bust(66, 92, 0.8, 'a-primary')}${eyes(you, 'right', 'sl-eyes')}${youTag(you)}
        ${bust(262, 110, 0.6, 'a-coral')}${eyes(fr, 'left', 'sl-eyes')}
        <g class="fx fx-wave"><path d="M104 112a14 14 0 0 1 0 22M112 106a24 24 0 0 1 0 34M120 100a34 34 0 0 1 0 46"/></g>
        ${sight(you, fr)}`;
    },
    table() {
      const you = headOf(92, 78, 0.85);
      const fr = headOf(230, 78, 0.85);
      return `${floor}
        ${bust(92, 78, 0.85, 'a-primary')}${eyes(you, 'right', 'sl-eyes')}${youTag(you)}
        ${bust(230, 78, 0.85, 'a-teal')}${eyes(fr, 'right', 'sl-before')}${eyes(fr, 'left', 'sl-turn')}
        <rect x="36" y="148" width="248" height="12" rx="4" class="a-surface a-stroke"/>
        <path d="M58 160v22M262 160v22" class="a-ink-stroke"/>
        <ellipse cx="112" cy="146" rx="18" ry="4" class="a-line-fill"/><ellipse cx="208" cy="146" rx="18" ry="4" class="a-line-fill"/>
        <g class="fx fx-table"><path d="M140 140l4-7 4 7 4-7 4 7M168 140l4-7 4 7 4-7 4 7"/></g>
        ${sight(you, fr)}`;
    },
    hallway() {
      const a = headOf(92, 64, 0.85);
      const b = headOf(228, 64, 0.85);
      const you = headOf(160, 126, 0.5);
      return `${floor}
        <path d="M18 182V30M302 182V30" class="a-line-stroke"/>
        ${bust(92, 64, 0.85, 'a-teal')}${eyes(a, 'right', 'sl-eyes')}
        ${bust(228, 64, 0.85, 'a-coral')}${eyes(b, 'left', 'sl-eyes')}
        <path class="sl-convo" d="M114 72 Q160 26 206 72"/>
        <g class="sl-walker">${bust(160, 126, 0.5, 'a-primary')}${eyes(you, 'front', 'sl-eyes')}${youTag(you)}</g>
        <g class="fx fx-pass"><path d="M160 116V36"/><path d="m151 48 9-12 9 12"/></g>`;
    },
    clinic() {
      const you = headOf(64, 88, 0.82);
      const pt = headOf(172, 84, 0.9);
      const it = headOf(266, 98, 0.72);
      return `${floor}
        <rect x="236" y="22" width="44" height="44" rx="9" class="a-surface a-stroke"/><path d="M258 32v24M246 44h24" class="a-cross"/>
        ${bust(64, 88, 0.82, 'a-primary')}${eyes(you, 'right', 'sl-eyes')}${youTag(you)}
        ${bust(172, 84, 0.9, 'a-teal')}${eyes(pt, 'left', 'sl-eyes')}
        ${bust(266, 98, 0.72, 'a-gold')}${eyes(it, 'left', 'sl-eyes')}
        ${sight(you, pt, 'fx fx-sight fx-face')}`;
    },
    group() {
      const p = [headOf(56, 98, 0.7), headOf(114, 90, 0.76), headOf(172, 98, 0.7)];
      const cw = headOf(262, 92, 0.8);
      const smile = (h) => `<path class="sl-smile" d="M${h.x - 6 * h.s} ${h.y + 6 * h.s}q${6 * h.s} ${6 * h.s} ${12 * h.s} 0"/>`;
      return `${floor}
        ${bust(56, 98, 0.7, 'a-teal')}${eyes(p[0], 'right', 'sl-eyes')}${smile(p[0])}
        ${bust(114, 90, 0.76, 'a-primary')}${eyes(p[1], 'right', 'sl-eyes')}${smile(p[1])}${youTag(p[1])}
        ${bust(172, 98, 0.7, 'a-gold')}${eyes(p[2], 'left', 'sl-eyes')}${smile(p[2])}
        ${bust(262, 92, 0.8, 'a-coral')}${eyes(cw, 'left', 'sl-eyes')}
        <g class="sl-bubble"><circle cx="296" cy="72" r="15" class="a-surface a-stroke"/><text x="296" y="79" text-anchor="middle" class="sl-q">?</text></g>
        <path class="sl-smile sl-smile--late" d="M${cw.x - 6 * cw.s} ${cw.y + 6 * cw.s}q${6 * cw.s} ${6 * cw.s} ${12 * cw.s} 0"/>
        <g class="fx fx-write"><rect x="194" y="114" width="32" height="24" rx="3" class="a-surface a-stroke"/><path d="M200 122h20M200 130h13" class="a-line-stroke"/></g>`;
    },
    call() {
      const you = headOf(160, 74, 0.95);
      return `
        <g class="fx fx-light"><path d="M30 64h34l9 20H21z" class="a-gold a-stroke"/><path d="M47 84v66M32 152h30" class="a-ink-stroke"/><path d="M78 80l26 5M78 96h26M78 112l26-5" class="sl-beam"/></g>
        <rect x="106" y="10" width="108" height="176" rx="16" class="a-surface a-stroke"/>
        <rect x="116" y="26" width="88" height="142" rx="8" class="sl-screen"/>
        <rect x="170" y="34" width="28" height="40" rx="2" class="sl-window"/>
        <circle cx="184" cy="54" r="34" class="sl-glare"/>
        <g class="sl-callee">${bust(160, 74, 0.95, 'a-primary')}</g>${eyes(you, 'front', 'sl-turn')}
        <text x="160" y="181" text-anchor="middle" class="sl-tag">You, on camera</text>`;
    },
  };

  function sceneSVG(item) {
    const build = LAYOUTS[item.layout];
    // "art" gives the scene the shared illustration palette (figures, floor, lamp).
    return `<svg class="art sl-scene sl-scene--${item.layout}" viewBox="0 0 320 200" role="img" aria-label="Scene: ${U.esc(item.prompt)}" data-scene>${build ? build() : ''}${check}${cross}</svg>`;
  }

  G.sightlines = (kit) => {
    const items = U.shuffle(T.data.sightlines);
    let i = 0;
    let score = 0;
    let buttons = [];
    numberKeys(kit, () => buttons);

    function show() {
      const it = items[i];
      kit.clearFeedback();
      kit.hideNext();
      kit.setProgress(i, items.length);
      const opts = U.shuffle(it.options);
      kit.body.innerHTML = String(html`
        <div class="sl">
          <figure class="sl__figure">${raw(sceneSVG(it))}</figure>
          <div class="sl__ask">
            <h2 class="game-q" data-focus>${it.prompt}</h2>
            <div class="answer-list" role="group" aria-label="Choices">
              ${opts.map((o, k) => html`<button type="button" class="answer" data-k="${k}"><span class="answer__key" aria-hidden="true">${k + 1}</span><span class="answer__text">${o.text}</span></button>`)}
            </div>
            ${keyHint(opts.length)}
          </div>
        </div>`);
      buttons = U.$$('.answer', kit.body);
      const svg = kit.body.querySelector('[data-scene]');
      buttons.forEach((b) => b.addEventListener('click', () => {
        const o = opts[Number(b.dataset.k)];
        buttons.forEach((x) => { x.disabled = true; });
        const right = opts.find((x) => x.ok);
        buttons[opts.indexOf(right)].classList.add('is-correct');
        if (o.ok) {
          score += 1;
          kit.setScore(score);
          svg.classList.add('is-solved', `is-${it.effect}`);
          kit.feedback(true, html`<p class="game__feedback-title">Yes — that works.</p><p>${it.explain}</p>`);
        } else {
          b.classList.add('is-wrong');
          svg.classList.add('is-wrong');
          kit.feedback(false, html`<p class="game__feedback-title">Not quite.</p><p>${o.why}</p><p><strong>Better:</strong> ${right.text}. ${it.explain}</p>`);
          // Then show what the respectful choice looks like.
          setTimeout(() => { if (!kit.signal.aborted) { svg.classList.remove('is-wrong'); svg.classList.add('is-solved', 'is-shown', `is-${it.effect}`); } }, U.reducedMotion() ? 0 : 900);
        }
        kit.next(i === items.length - 1 ? 'See results' : 'Next moment', () => {
          i += 1;
          if (i >= items.length) kit.finish(score, items.length);
          else { show(); kit.focusTitle(); }
        });
      }, { signal: kit.signal }));
    }
    show();
  };

  /* ======================================================================
     Myth or Fact? — a swipeable deck (buttons and arrow keys work too)
     ====================================================================== */
  G['myth-fact'] = (kit) => {
    const pool = [];
    T.data.myths.forEach((m, k) => {
      pool.push({ text: m.myth, kind: 'myth', pair: k });
      pool.push({ text: m.fact, kind: 'fact', pair: k });
    });
    // Ten cards, both kinds well represented.
    const myths = U.shuffle(pool.filter((p) => p.kind === 'myth')).slice(0, 5);
    const facts = U.shuffle(pool.filter((p) => p.kind === 'fact')).slice(0, 5);
    const deck = U.shuffle(myths.concat(facts));
    let i = 0;
    let score = 0;
    let answered = false;

    function show() {
      const card = deck[i];
      answered = false;
      kit.clearFeedback();
      kit.hideNext();
      kit.setProgress(i, deck.length);
      kit.body.innerHTML = String(html`
        <div class="mf">
          <h2 class="visually-hidden" data-focus>Card ${i + 1} of ${deck.length}: myth or fact?</h2>
          <div class="mf__table">
            <span class="mf__side mf__side--myth" aria-hidden="true">${T.icon('arrow-left')}<span>Myth</span></span>
            <article class="mf__card" data-card tabindex="-1">
              <p class="mf__kicker">${T.icon('help')}<span>Myth or fact?</span></p>
              <p class="mf__text">${card.text}</p>
              <p class="mf__swipe" aria-hidden="true">Swipe, use the arrow keys, or choose below</p>
            </article>
            <span class="mf__side mf__side--fact" aria-hidden="true"><span>Fact</span>${T.icon('arrow-right')}</span>
          </div>
          <div class="mf__choices" role="group" aria-label="Your answer">
            <button type="button" class="btn btn--lg mf__btn mf__btn--myth" data-say="myth">${T.icon('arrow-left')}<span>Myth</span></button>
            <button type="button" class="btn btn--lg mf__btn mf__btn--fact" data-say="fact"><span>Fact</span>${T.icon('arrow-right')}</button>
          </div>
        </div>`);
      const el = kit.body.querySelector('[data-card]');
      kit.body.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.say), { signal: kit.signal }));
      swipe(el);
    }

    function answer(say) {
      if (answered) return;
      answered = true;
      const card = deck[i];
      const ok = say === card.kind;
      if (ok) { score += 1; kit.setScore(score); }
      const el = kit.body.querySelector('[data-card]');
      el.classList.add(`is-${say}`, ok ? 'is-right' : 'is-miss');
      kit.body.querySelectorAll('[data-say]').forEach((b) => { b.disabled = true; });
      const m = T.data.myths[card.pair];
      kit.feedback(ok, card.kind === 'myth'
        ? html`<p class="game__feedback-title">${ok ? 'Right — it’s a myth.' : 'It’s actually a myth.'}</p><p><strong>Fact:</strong> ${m.fact}</p>`
        : html`<p class="game__feedback-title">${ok ? 'Right — it’s a fact.' : 'It’s actually a fact.'}</p><p>It answers a common myth: “${m.myth}”</p>`);
      kit.next(i === deck.length - 1 ? 'See results' : 'Next card', () => {
        i += 1;
        if (i >= deck.length) kit.finish(score, deck.length);
        else { show(); kit.focusTitle(); }
      });
    }

    function swipe(el) {
      let startX = null;
      let dx = 0;
      el.addEventListener('pointerdown', (e) => {
        if (answered || e.button > 0) return;
        startX = e.clientX;
        dx = 0;
        el.setPointerCapture(e.pointerId);
        el.classList.add('is-dragging');
      }, { signal: kit.signal });
      el.addEventListener('pointermove', (e) => {
        if (startX == null) return;
        dx = e.clientX - startX;
        el.style.setProperty('--dx', String(Math.round(dx))); // unitless: CSS turns it into px and deg
        el.dataset.lean = dx < -30 ? 'myth' : dx > 30 ? 'fact' : '';
      }, { signal: kit.signal });
      const end = () => {
        if (startX == null) return;
        startX = null;
        el.classList.remove('is-dragging');
        el.style.removeProperty('--dx');
        el.dataset.lean = '';
        if (Math.abs(dx) > 90) answer(dx < 0 ? 'myth' : 'fact');
      };
      el.addEventListener('pointerup', end, { signal: kit.signal });
      el.addEventListener('pointercancel', end, { signal: kit.signal });
    }

    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || U.isTyping(e) || document.querySelector('dialog[open]')) return;
      if (answered) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); answer('myth'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); answer('fact'); }
    }, { signal: kit.signal });

    kit.setHint('← Myth · Fact →');
    show();
  };

  /* ======================================================================
     Word Lens — find the outdated word, then choose a respectful one
     ====================================================================== */
  function tokens(text) {
    const out = [];
    const re = /\[([^\]]+)\]/;
    const m = re.exec(text);
    const before = text.slice(0, m.index);
    const after = text.slice(m.index + m[0].length);
    before.split(/\s+/).filter(Boolean).forEach((w) => out.push({ t: w }));
    out.push({ t: m[1], target: true });
    // Punctuation directly after the target stays with it visually but is not part of it.
    const tail = after.match(/^([.,!?;:]*)(.*)$/);
    if (tail[1]) out[out.length - 1].punct = tail[1];
    tail[2].split(/\s+/).filter(Boolean).forEach((w) => out.push({ t: w }));
    return out;
  }

  G['word-lens'] = (kit) => {
    const items = U.shuffle(T.data.wordLens);
    const total = items.length * 2;
    let i = 0;
    let score = 0;
    let buttons = [];
    numberKeys(kit, () => buttons);

    function show() {
      const it = items[i];
      const tk = tokens(it.text);
      const term = T.data.terms[it.term];
      let phase = 'find';
      kit.clearFeedback();
      kit.hideNext();
      kit.setProgress(i, items.length);
      kit.body.innerHTML = String(html`
        <div class="lens">
          <p class="lens__step" data-step>Step 1 of 2 · Find</p>
          <h2 class="game-q" data-focus>Which word or phrase should change?</h2>
          <p class="lens__sentence" data-sentence>
            ${tk.map((w, k) => html`<button type="button" class="lens__word" data-w="${k}">${w.t}</button>${w.punct ? html`<span class="lens__punct">${w.punct}</span>` : ''} `)}
          </p>
          <div class="lens__fix" data-fix hidden></div>
        </div>`);
      buttons = [];
      const words = U.$$('.lens__word', kit.body);
      const targetIdx = tk.findIndex((w) => w.target);
      const targetBtn = words[targetIdx];

      words.forEach((b) => b.addEventListener('click', () => {
        if (phase !== 'find') return;
        phase = 'fix';
        words.forEach((x) => { x.disabled = true; });
        const k = Number(b.dataset.w);
        const found = k === targetIdx;
        if (found) { score += 1; kit.setScore(score); }
        else b.classList.add('is-wrong');
        targetBtn.classList.add('is-lens');
        kit.announce(found ? `Found it: ${tk[targetIdx].t}.` : `Not that one. The phrase to change is: ${tk[targetIdx].t}.`);
        fix(found);
      }, { signal: kit.signal }));

      function fix(found) {
        const options = U.shuffle(it.options.map((t, k) => ({ t, ok: k === 0 })));
        kit.body.querySelector('[data-step]').textContent = 'Step 2 of 2 · Fix';
        kit.body.querySelector('.game-q').textContent = 'Now make it respectful';
        const host = kit.body.querySelector('[data-fix]');
        host.hidden = false;
        host.innerHTML = String(html`
          <p class="lens__found ${found ? 'is-ok' : ''}">${found ? 'Found it.' : 'This is the part to change:'} <strong>“${tk[targetIdx].t}”</strong></p>
          <h3 class="lens__q" id="fix-q">Choose a respectful replacement</h3>
          <div class="answer-list" role="group" aria-labelledby="fix-q">
            ${options.map((o, k) => html`<button type="button" class="answer" data-k="${k}"><span class="answer__key" aria-hidden="true">${k + 1}</span><span class="answer__text">${o.t}</span></button>`)}
          </div>
          ${keyHint(options.length)}`);
        buttons = U.$$('.answer', host);
        buttons[0].focus({ preventScroll: true });
        buttons.forEach((b) => b.addEventListener('click', () => {
          const o = options[Number(b.dataset.k)];
          buttons.forEach((x) => { x.disabled = true; });
          const right = options.find((x) => x.ok);
          buttons[options.indexOf(right)].classList.add('is-correct');
          if (o.ok) { score += 1; kit.setScore(score); } else b.classList.add('is-wrong');
          targetBtn.textContent = right.t;
          targetBtn.classList.add('is-fixed');
          kit.feedback(o.ok, html`
            <p class="game__feedback-title">${o.ok ? 'Respectful choice.' : `Better: “${right.t}”.`}</p>
            <p><strong>Say “${term.use}”, not “${term.avoid}”.</strong> ${term.why}</p>`);
          kit.next(i === items.length - 1 ? 'See results' : 'Next sentence', () => {
            i += 1;
            if (i >= items.length) kit.finish(score, total);
            else { show(); kit.focusTitle(); }
          });
        }, { signal: kit.signal }));
      }
    }
    kit.setHint('Two points per sentence: find, then fix.');
    show();
  };

  /* ======================================================================
     Rights Match — which part of RA 11106 covers this situation?
     ====================================================================== */
  G['rights-match'] = (kit) => {
    const items = U.shuffle(T.data.rightsMatch);
    const rights = T.data.rights;
    let i = 0;
    let score = 0;
    let buttons = [];
    numberKeys(kit, () => buttons);

    function show() {
      const it = items[i];
      const right = rights.find((r) => r.sec === it.sec);
      const opts = U.shuffle([right].concat(U.sample(rights.filter((r) => r.sec !== it.sec), 3)));
      kit.clearFeedback();
      kit.hideNext();
      kit.setProgress(i, items.length);
      kit.body.innerHTML = String(html`
        <div class="rm">
          <p class="rm__kicker">${T.icon('scale')}<span>Situation ${i + 1}</span></p>
          <h2 class="game-q" data-focus>${it.text}</h2>
          <p class="rm__ask">Which part of the FSL Act covers it?</p>
          <div class="rm__grid" role="group" aria-label="Sections of RA 11106">
            ${opts.map((r, k) => html`
              <button type="button" class="answer answer--place" data-k="${k}">
                <span class="answer__key" aria-hidden="true">${k + 1}</span>
                <span class="answer__icon">${T.icon(r.icon)}</span>
                <span class="answer__text"><strong>${r.area}</strong><span>Sec. ${r.sec} · ${r.place}</span></span>
              </button>`)}
          </div>
          ${keyHint(opts.length)}
        </div>`);
      buttons = U.$$('.answer', kit.body);
      buttons.forEach((b) => b.addEventListener('click', () => {
        const r = opts[Number(b.dataset.k)];
        const ok = r.sec === it.sec;
        buttons.forEach((x) => { x.disabled = true; });
        buttons[opts.indexOf(right)].classList.add('is-correct');
        if (ok) { score += 1; kit.setScore(score); } else b.classList.add('is-wrong');
        kit.feedback(ok, html`
          <p class="game__feedback-title">${ok ? 'Correct.' : `It’s Sec. ${right.sec}: ${right.area}.`}</p>
          <p>${right.text}</p>
          <p class="game__feedback-src">${T.icon('book')}<span>Republic Act No. 11106, Section ${right.sec}.</span></p>`);
        kit.next(i === items.length - 1 ? 'See results' : 'Next situation', () => {
          i += 1;
          if (i >= items.length) kit.finish(score, items.length);
          else { show(); kit.focusTitle(); }
        });
      }, { signal: kit.signal }));
    }
    show();
  };

  /* ======================================================================
     Timeline — put moments in order (drag, or the move buttons)
     ====================================================================== */
  G.timeline = (kit) => {
    const events = U.shuffle(T.data.timeline.filter((t) => !t.future && !t.approx));
    const rounds = [events.slice(0, 5), events.slice(5, 10)].filter((r) => r.length >= 3);
    const total = rounds.reduce((n, r) => n + r.length, 0);
    const position = (t) => T.data.timeline.indexOf(t);
    let ri = 0;
    let score = 0;

    function show() {
      const correct = rounds[ri].slice().sort((a, b) => position(a) - position(b));
      let order = U.shuffle(rounds[ri]);
      while (order.every((t, k) => t === correct[k])) order = U.shuffle(rounds[ri]);
      let checked = false;
      kit.clearFeedback();
      kit.setProgress(ri, rounds.length);
      kit.body.innerHTML = String(html`
        <div class="tl">
          <h2 class="game-q" data-focus>Round ${ri + 1} of ${rounds.length}: put these moments in order, oldest first</h2>
          <p class="tl__how">Drag a card by its handle, or use the arrow buttons.</p>
          <ol class="tl__list" data-list></ol>
          <p class="visually-hidden" aria-live="polite" data-live></p>
        </div>`);
      const list = kit.body.querySelector('[data-list]');
      const live = kit.body.querySelector('[data-live]');

      function paint(focusId, focusDir) {
        list.innerHTML = String(html`${order.map((t, k) => html`
          <li class="tl__item ${checked ? (t === correct[k] ? 'is-right' : 'is-off') : ''}" data-id="${position(t)}">
            <span class="tl__grip" aria-hidden="true" data-grip>${T.icon('grip')}</span>
            <span class="tl__pos" aria-hidden="true">${k + 1}</span>
            <span class="tl__body"><strong class="tl__title">${t.title}</strong><span class="tl__text">${t.text}</span>
              ${checked ? html`<span class="tl__year">${t.year}${t === correct[k] ? '' : ` · belongs at position ${correct.indexOf(t) + 1}`}</span>` : ''}</span>
            ${checked ? '' : html`<span class="tl__moves">
              <button type="button" class="icon-btn" data-move="-1" aria-label="Move “${t.title}” earlier" ${k === 0 ? U.raw('disabled') : ''}>${T.icon('arrow-up')}</button>
              <button type="button" class="icon-btn" data-move="1" aria-label="Move “${t.title}” later" ${k === order.length - 1 ? U.raw('disabled') : ''}>${T.icon('arrow-down')}</button>
            </span>`}
          </li>`)}`);
        if (focusId != null) {
          const li = list.querySelector(`[data-id="${focusId}"]`);
          const btn = li && (li.querySelector(`[data-move="${focusDir}"]:not([disabled])`) || li.querySelector('[data-move]:not([disabled])'));
          if (btn) btn.focus({ preventScroll: true });
        }
      }

      function move(id, dir) {
        const k = order.findIndex((t) => position(t) === id);
        const j = k + dir;
        if (k < 0 || j < 0 || j >= order.length) return;
        [order[k], order[j]] = [order[j], order[k]];
        paint(id, dir);
        live.textContent = `${order[j].title}: now position ${j + 1} of ${order.length}.`;
      }

      list.addEventListener('click', (e) => {
        const b = e.target.closest('[data-move]');
        if (!b || checked) return;
        move(Number(b.closest('[data-id]').dataset.id), Number(b.dataset.move));
      }, { signal: kit.signal });

      // Pointer drag: swap with neighbours as the card crosses their middle.
      let drag = null;
      list.addEventListener('pointerdown', (e) => {
        const grip = e.target.closest('[data-grip]');
        if (!grip || checked) return;
        const li = grip.closest('[data-id]');
        drag = { id: Number(li.dataset.id), y: e.clientY };
        li.classList.add('is-dragging');
        grip.setPointerCapture(e.pointerId);
        e.preventDefault();
      }, { signal: kit.signal });
      list.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const li = list.querySelector(`[data-id="${drag.id}"]`);
        if (!li) return;
        const k = order.findIndex((t) => position(t) === drag.id);
        const prevLi = li.previousElementSibling;
        const nextLi = li.nextElementSibling;
        if (prevLi && e.clientY < prevLi.getBoundingClientRect().top + prevLi.offsetHeight / 2) {
          [order[k], order[k - 1]] = [order[k - 1], order[k]];
          paint();
        } else if (nextLi && e.clientY > nextLi.getBoundingClientRect().top + nextLi.offsetHeight / 2) {
          [order[k], order[k + 1]] = [order[k + 1], order[k]];
          paint();
        }
        const again = list.querySelector(`[data-id="${drag.id}"]`);
        if (again) again.classList.add('is-dragging');
      }, { signal: kit.signal });
      const stop = () => {
        if (!drag) return;
        const li = list.querySelector(`[data-id="${drag.id}"]`);
        if (li) li.classList.remove('is-dragging');
        drag = null;
      };
      list.addEventListener('pointerup', stop, { signal: kit.signal });
      list.addEventListener('pointercancel', stop, { signal: kit.signal });

      paint();
      kit.next('Check the order', () => {
        checked = true;
        const right = order.filter((t, k) => t === correct[k]).length;
        score += right;
        kit.setScore(score);
        paint();
        kit.feedback(right === order.length, html`
          <p class="game__feedback-title">${right === order.length ? 'Perfect order!' : `${right} of ${order.length} in the right place.`}</p>
          <p>The years are shown on each card now. ${right === order.length ? '' : 'Cards marked in coral belong elsewhere.'}</p>`);
        kit.next(ri === rounds.length - 1 ? 'See results' : 'Next round', () => {
          ri += 1;
          if (ri >= rounds.length) kit.finish(score, total);
          else { show(); kit.focusTitle(); }
        });
      });
    }
    show();
  };

  /* ======================================================================
     Five Parts — quick-fire sorting of clues into the five parameters
     ====================================================================== */
  G['five-parts'] = (kit) => {
    const { bins, clues } = T.data.fiveParts;
    const items = U.shuffle(clues);
    let i = 0;
    let score = 0;
    let run = 0;
    let buttons = [];
    let timer = null;
    numberKeys(kit, () => buttons);
    kit.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });

    function show() {
      const it = items[i];
      kit.clearFeedback();
      kit.hideNext();
      kit.setProgress(i, items.length);
      kit.body.innerHTML = String(html`
        <div class="fp">
          <p class="fp__run" aria-hidden="true">${run >= 2 ? html`${T.icon('flame')}<span>${run} in a row</span>` : ''}</p>
          <p class="fp__kicker">Which parameter is this clue about?</p>
          <h2 class="game-q fp__clue" data-focus>“${it.text}”</h2>
          <div class="fp__bins" role="group" aria-label="The five parameters">
            ${bins.map((b, k) => html`<button type="button" class="answer fp__bin fp__bin--${k}" data-k="${k}"><span class="answer__key" aria-hidden="true">${k + 1}</span><span class="answer__text">${b}</span></button>`)}
          </div>
          ${keyHint(bins.length)}
        </div>`);
      buttons = U.$$('.answer', kit.body);
      buttons.forEach((b) => b.addEventListener('click', () => {
        const k = Number(b.dataset.k);
        const ok = k === it.bin;
        buttons.forEach((x) => { x.disabled = true; });
        buttons[it.bin].classList.add('is-correct');
        if (ok) { score += 1; run += 1; kit.setScore(score); } else { run = 0; b.classList.add('is-wrong'); }
        const advance = () => {
          i += 1;
          if (i >= items.length) kit.finish(score, items.length);
          else { show(); kit.focusTitle(); }
        };
        if (ok) {
          kit.feedback(true, html`<p class="game__feedback-title">${bins[it.bin]}.</p>`);
          kit.next(i === items.length - 1 ? 'See results' : 'Next clue', advance);
          // Quick-fire: move on by itself after a moment (the button works immediately).
          timer = setTimeout(() => { if (!kit.signal.aborted && !kit.ended) { kit.hideNext(); advance(); } }, 1100);
        } else {
          kit.feedback(false, html`<p class="game__feedback-title">It’s ${bins[it.bin]}.</p><p>Every sign combines all five parameters. When you copy a sign, check them one at a time.</p>`);
          kit.next(i === items.length - 1 ? 'See results' : 'Next clue', advance);
        }
      }, { signal: kit.signal }));
      clearTimeout(timer);
    }
    show();
  };
  /* ======================================================================
     Read the Hand — an experimental 3D hand fingerspells; choose what it shows
     ====================================================================== */
  // Distractors that look alike, so each round asks for a real look at the hand.
  const LOOKALIKE = {
    A: ['S', 'E', 'M'], B: ['F', 'W', 'U'], C: ['O', 'G', 'L'], D: ['F', 'X', 'L'], E: ['S', 'A', 'O'],
    F: ['D', 'W', 'B'], G: ['Q', 'L', 'H'], H: ['U', 'G', 'R'], I: ['J', 'Y', 'A'], J: ['I', 'Y', 'Z'],
    K: ['V', 'P', 'R'], L: ['G', 'Y', 'D'], M: ['N', 'S', 'E'], N: ['M', 'S', 'A'], O: ['C', 'E', 'D'],
    P: ['K', 'Q', 'H'], Q: ['G', 'P', 'L'], R: ['U', 'V', 'K'], S: ['A', 'E', 'N'], U: ['V', 'R', 'H'],
    V: ['U', 'R', 'K'], W: ['V', 'F', 'B'], X: ['D', 'Z', 'A'], Y: ['I', 'L', 'J'], Z: ['X', 'D', 'G'],
  };

  G['read-hand'] = (kit) => {
    kit.body.innerHTML = String(html`<p class="rh__loading">${T.icon('cube')}<span>Loading the 3D hand…</span></p>`);
    // Testing for WebGL is slow before the page's first paint, so wait until it has been shown.
    T.router.ensureHand().then(() => T.hand3d.whenShown()).then(() => {
      if (kit.signal.aborted) return;
      if (!T.hand3d.supported()) {
        kit.body.innerHTML = String(html`
          <div class="rh">
            <h2 class="game-q" data-focus>This game needs 3D</h2>
            <p>Read the Hand uses WebGL, which this browser or device does not provide. Try another game, or open Tanaw in a recent Chrome, Edge, Firefox or Safari.</p>
            <a class="btn btn--primary" href="#/play">${T.icon('arrow-left')}<span>Back to games</span></a>
          </div>`);
        kit.focusTitle();
        return;
      }
      start();
    }).catch((err) => {
      console.error('[Tanaw] Read the Hand could not start:', err);
      kit.body.innerHTML = String(html`<p>The 3D hand could not be loaded. <a href="#/play">Back to games</a></p>`);
    });

    function start() {
      const D = T.data;
      const letters = D.handLetters.filter((l) => !l.gap).map((l) => l.id);
      const words = D.fsWords.filter((w) => w.length <= 5 && D.spellTokens(w).every((t) => !t.gap));
      const rounds = U.sample(letters, 6).map((id) => ({ kind: 'letter', answer: id, options: U.shuffle([id].concat(U.sample(LOOKALIKE[id] || letters.filter((x) => x !== id), 3))) }))
        .concat(U.sample(words, 4).map((w) => {
          const same = words.filter((x) => x !== w && x.length === w.length);
          const pool = same.length >= 3 ? same : words.filter((x) => x !== w);
          return { kind: 'word', answer: w, options: U.shuffle([w].concat(U.sample(pool, 3))) };
        }));
      let i = 0;
      let score = 0;
      let buttons = [];
      numberKeys(kit, () => buttons);

      kit.body.innerHTML = String(html`
        <div class="rh">
          ${C.handStage({ kind: 'Read the hand', name: '?', compact: true, className: 'rh__stage' })}
          <p class="rh__note">${T.icon('flask')}<span>Experimental 3D hand: the one-handed manual alphabet without FSL’s T, not validated by Deaf FSL experts. This game is visual: it practices reading handshapes.</span></p>
          <div data-round></div>
        </div>`);
      const stageEl = kit.body.querySelector('[data-stage3d]');
      const hand = C.mountHand(stageEl, { signal: kit.signal, label: '3D hand showing something to read' });
      const host = kit.body.querySelector('[data-round]');

      const play = (r) => {
        C.handHud(stageEl, r.kind === 'letter' ? 'Which letter?' : 'Which word?', '?');
        if (r.kind === 'letter') { hand.show('rest', { instant: true }); hand.show(r.answer); }
        else hand.spell(r.answer);
      };

      function show() {
        const r = rounds[i];
        kit.clearFeedback();
        kit.hideNext();
        kit.setProgress(i, rounds.length);
        host.innerHTML = String(html`
          <h2 class="game-q" data-focus>${r.kind === 'letter' ? 'Which letter does the hand show?' : 'Which word does the hand spell?'}</h2>
          <div class="btn-row"><button type="button" class="btn btn--secondary btn--sm" data-replay>${T.icon('repeat')}<span>Show again</span></button></div>
          <div class="answer-list rh__answers" role="group" aria-label="Answers">
            ${r.options.map((o, k) => html`<button type="button" class="answer" data-k="${k}"><span class="answer__key" aria-hidden="true">${k + 1}</span><span class="answer__text">${o}</span></button>`)}
          </div>
          ${keyHint(r.options.length)}`);
        buttons = U.$$('.answer', host);
        host.querySelector('[data-replay]').addEventListener('click', () => play(r), { signal: kit.signal });
        buttons.forEach((b) => b.addEventListener('click', () => {
          const pick = r.options[Number(b.dataset.k)];
          const ok = pick === r.answer;
          buttons.forEach((x) => { x.disabled = true; if (x.querySelector('.answer__text').textContent === r.answer) x.classList.add('is-correct'); });
          if (ok) { score += 1; kit.setScore(score); } else b.classList.add('is-wrong');
          C.handHud(stageEl, ok ? 'Correct' : 'It was', r.answer);
          const desc = r.kind === 'letter' ? (D.handLetter(r.answer) || {}).desc : '';
          kit.feedback(ok, html`<p class="game__feedback-title">${ok ? 'Correct.' : `It was ${r.answer}.`}</p>${desc ? html`<p>${r.answer}: ${desc}</p>` : ''}`);
          kit.next(i === rounds.length - 1 ? 'See results' : 'Next', () => {
            i += 1;
            if (i >= rounds.length) kit.finish(score, rounds.length);
            else { show(); kit.focusTitle(); play(rounds[i]); }
          });
        }, { signal: kit.signal }));
      }
      show();
      play(rounds[0]);
    }
  };
})();
