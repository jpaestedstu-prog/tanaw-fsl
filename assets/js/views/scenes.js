/* =========================================================================
   Tanaw — Everyday scenes (#/scenes, #/scenes/:id)
   Where the two worlds meet: for one ordinary moment, the vocabulary to
   learn (with honest media status), written phrases to show, the etiquette
   that keeps it visual, and the rights that apply.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const tally = (s) => [
    `${s.signs.length} words`,
    `${s.phrases.length} phrases`,
    `${s.etiquette.length} etiquette tip${s.etiquette.length === 1 ? '' : 's'}`,
    s.rights.length ? `${s.rights.length} right${s.rights.length === 1 ? '' : 's'}` : '',
  ].filter(Boolean).join(' · ');

  V.scenes = {
    title: 'Everyday scenes',
    world: 'learn',
    station: 'scenes',
    render(el, params, query, { signal }) {
      const scenes = T.data.scenes;
      const explored = scenes.filter((s) => T.progress.explored(`scene:${s.id}`)).length;
      el.innerHTML = String(html`
        <div class="container page">
          ${C.pageHead({
            eyebrow: 'Everyday scenes', icon: 'pin',
            title: 'Ordinary moments, both worlds',
            lead: 'Each scene gathers what you need for one everyday situation in the Philippines: words to learn, written phrases you can show, the etiquette that keeps a conversation visual, and the rights that apply.',
          })}
          <p class="results-summary">${explored} of ${scenes.length} scenes explored</p>
          <div class="scene-grid" data-tilt-root>
            ${scenes.map((s, i) => html`
              <a class="scene-card scene-card--${s.tone} ${T.progress.explored(`scene:${s.id}`) ? 'is-explored' : ''}" href="#/scenes/${s.id}" data-tilt data-reveal style="--d:${i % 3}">
                <span class="scene-card__art" aria-hidden="true">${raw(T.art.scene(s.id))}</span>
                <span class="scene-card__body">
                  <span class="scene-card__fil" lang="fil">${s.fil}</span>
                  <span class="scene-card__title">${s.title}</span>
                  <span class="scene-card__text">${s.summary}</span>
                  <span class="scene-card__meta">${tally(s)}</span>
                </span>
                ${T.progress.explored(`scene:${s.id}`) ? html`<span class="scene-card__done">${T.icon('check-circle')}<span>Explored</span></span>` : ''}
              </a>`)}
          </div>
        </div>`);
      T.fx.tilt(el.querySelector('[data-tilt-root]'), signal);
      T.fx.reveal(el, signal);
    },
  };

  V.scene = {
    world: 'learn',
    station: 'scenes',
    title: (params) => {
      const s = T.data.getScene(params.id);
      return s ? `${s.title} — Everyday scenes` : 'Scene not found';
    },
    render(el, params, query, { signal }) {
      const D = T.data;
      const s = D.getScene(params.id);
      if (!s) {
        el.innerHTML = String(html`<div class="container page">${C.emptyState({ icon: 'pin', title: 'Scene not found', body: 'This scene does not exist.', action: html`<a class="btn btn--primary" href="#/scenes">All everyday scenes</a>`, page: true })}</div>`);
        return;
      }
      const idx = D.scenes.indexOf(s);
      const prev = D.scenes[idx - 1] || null;
      const next = D.scenes[idx + 1] || null;
      const signs = s.signs.map((id) => D.getSign(id)).filter(Boolean);
      const counts = T.media.counts(signs.map((x) => x.id));
      const phrases = s.phrases.map((id) => D.getPhrase(id)).filter(Boolean);
      const etiquette = s.etiquette.map((id) => D.getEtiquette(id)).filter(Boolean);
      const rights = s.rights.map((sec) => D.rights.find((r) => r.sec === sec)).filter(Boolean);
      const lesson = s.lesson ? D.getLesson(s.lesson) : null;
      const game = s.game ? D.getGame(s.game) : null;
      const hasTTS = C.tts.available();

      el.innerHTML = String(html`
        <div class="container page scene-page scene-page--${s.tone}">
          ${C.pageHead({
            crumbs: [{ label: 'Everyday scenes', href: '#/scenes' }, { label: s.title }],
            eyebrow: html`<span lang="fil">${s.fil}</span>`,
            title: s.title,
            lead: s.summary,
          })}
          <div class="scene-hero" aria-hidden="true">${raw(T.art.scene(s.id))}</div>

          <nav class="layer-nav" aria-label="In this scene">
            <a class="chip" href="#layer-words" data-layer>${T.icon('library')}<span>Words</span></a>
            <a class="chip" href="#layer-phrases" data-layer>${T.icon('chat')}<span>Phrases</span></a>
            <a class="chip" href="#layer-etiquette" data-layer>${T.icon('eye')}<span>Etiquette</span></a>
            ${rights.length ? html`<a class="chip" href="#layer-rights" data-layer>${T.icon('scale')}<span>Rights</span></a>` : ''}
          </nav>

          <section class="layer" id="layer-words" aria-labelledby="h-words">
            <div class="layer__head">
              <span class="layer__num" aria-hidden="true">1</span>
              <h2 class="layer__title" id="h-words">Words to learn</h2>
            </div>
            ${T.config.demonstrations ? html`
              <p class="media-summary">
                ${C.statusBadge(counts.withMedia ? 'verified' : 'pending', { compact: true })}
                <span>${counts.verified} verified · ${counts.local} on this device${counts.test ? ` · ${counts.test} test` : ''} · ${counts.pending} awaiting a Deaf signer’s verified demonstration</span>
              </p>
              <p class="layer__lead">Open a word to see its demonstration once one is verified. Until then, learn these with a Deaf teacher, and remember that FSL varies by region.</p>` : html`
              <p class="layer__lead">Learn the signs for these words with a Deaf teacher — FSL varies by region, so learn the ones used around you. Select a word to open its card and mark the ones you can sign.</p>`}
            <div class="sign-grid sign-grid--compact">${signs.map((x) => C.signTile(x, { button: true }))}</div>
          </section>

          <section class="layer" id="layer-phrases" aria-labelledby="h-phrases">
            <div class="layer__head">
              <span class="layer__num" aria-hidden="true">2</span>
              <h2 class="layer__title" id="h-phrases">Phrases you can show</h2>
            </div>
            <p class="layer__lead">Written Filipino and English, to show on your screen or read aloud with your device’s voice. These are text, not sign language.</p>
            <ul class="phrase-list">
              ${phrases.map((p) => html`
                <li class="phrase" data-phrase="${p.id}">
                  <p class="phrase__fil" lang="fil">${p.fil}</p>
                  <p class="phrase__en">${p.en}</p>
                  <div class="phrase__actions">
                    <button type="button" class="btn btn--secondary btn--sm" data-show>${T.icon('maximize')}<span>Show</span></button>
                    ${hasTTS ? html`<button type="button" class="btn btn--ghost btn--sm" data-say="fil">${T.icon('volume')}<span>Filipino</span></button><button type="button" class="btn btn--ghost btn--sm" data-say="en">${T.icon('volume')}<span>English</span></button>` : ''}
                  </div>
                </li>`)}
            </ul>
          </section>

          <section class="layer" id="layer-etiquette" aria-labelledby="h-etiquette">
            <div class="layer__head">
              <span class="layer__num" aria-hidden="true">3</span>
              <h2 class="layer__title" id="h-etiquette">Etiquette that helps</h2>
            </div>
            <ul class="tip-list">
              ${etiquette.map((x) => html`
                <li class="tip tip--${x.kind}">
                  <span class="tip__icon">${T.icon(x.kind === 'do' ? 'check-circle' : 'x-circle')}</span>
                  <p><strong>${x.title}.</strong> ${x.text}</p>
                </li>`)}
            </ul>
          </section>

          ${rights.length ? html`
            <section class="layer" id="layer-rights" aria-labelledby="h-rights">
              <div class="layer__head">
                <span class="layer__num" aria-hidden="true">4</span>
                <h2 class="layer__title" id="h-rights">Rights that relate to this scene</h2>
              </div>
              <div class="rights-mini">
                ${rights.map((r) => html`
                  <a class="right-chip" href="#/community/rights?sec=${r.sec}">
                    <span class="right-chip__icon">${T.icon(r.icon)}</span>
                    <span class="right-chip__text"><span class="right-chip__sec">RA 11106 · Sec. ${r.sec}</span><strong>${r.area}</strong><span>${r.text}</span></span>
                  </a>`)}
              </div>
            </section>` : ''}

          <section class="layer layer--more" aria-labelledby="h-more">
            <h2 class="section__title section__title--sm" id="h-more">${T.icon('sparkles')}<span>Keep going</span></h2>
            <div class="btn-row">
              ${lesson ? html`<a class="btn btn--primary" href="#/learn/${lesson.id}">${T.icon('path')}<span>Lesson: ${lesson.title}</span></a>` : ''}
              ${game ? html`<a class="btn btn--secondary" href="#/play/${game.id}">${T.icon('dice')}<span>Game: ${game.title}</span></a>` : ''}
              ${s.tool ? html`<a class="btn btn--secondary" href="${s.tool.href}">${T.icon(s.tool.icon || 'arrow-right')}<span>${s.tool.label}</span></a>` : ''}
            </div>
          </section>

          <div class="scene-end" data-scene-end aria-hidden="true"></div>
          <nav class="pager" aria-label="More scenes">
            ${prev ? html`<a class="pager__link" href="#/scenes/${prev.id}">${T.icon('chevron-left')}<span><small>Previous scene</small>${prev.title}</span></a>` : html`<span></span>`}
            ${next ? html`<a class="pager__link pager__link--next" href="#/scenes/${next.id}"><span><small>Next scene</small>${next.title}</span>${T.icon('chevron-right')}</a>` : html`<a class="pager__link pager__link--next" href="#/scenes"><span><small>Done</small>All scenes</span>${T.icon('chevron-right')}</a>`}
          </nav>
        </div>`);

      C.hydrateMedia(el);

      el.addEventListener('click', (e) => {
        const qv = e.target.closest('[data-quickview]');
        if (qv) { C.quickView(qv.dataset.quickview); return; }
        const layer = e.target.closest('[data-layer]');
        if (layer) {
          e.preventDefault();
          const target = el.querySelector(layer.getAttribute('href'));
          if (target) {
            target.scrollIntoView({ block: 'start', behavior: U.reducedMotion() ? 'auto' : 'smooth' });
            const h = target.querySelector('h2');
            if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
          }
          return;
        }
        const li = e.target.closest('[data-phrase]');
        if (!li) return;
        const p = D.getPhrase(li.dataset.phrase);
        if (!p) return;
        if (e.target.closest('[data-show]')) {
          C.showBig(html`<span class="bigtext__primary" lang="fil">${p.fil}</span><span class="bigtext__secondary">${p.en}</span>`, { onShow: C.countBridgeUse });
        }
        const say = e.target.closest('[data-say]');
        if (say && C.tts.speak(say.dataset.say === 'en' ? p.en : p.fil, say.dataset.say, T.store.state.settings.ttsVoice)) C.countBridgeUse();
      }, { signal });

      // Keep the "Learned" marks current after a word card is closed.
      T.bus.on('learned:change', ({ id }) => {
        const tile = el.querySelector(`#layer-words [data-quickview="${CSS.escape(id)}"]`);
        const sign = D.getSign(id);
        if (tile && sign) tile.outerHTML = String(C.signTile(sign, { button: true }));
      }, signal);

      T.fx.onceVisible(el.querySelector('[data-scene-end]'), () => {
        if (T.progress.markExplored(`scene:${s.id}`, { xp: 3 })) T.ui.toast('Scene explored (+3 XP).', { icon: 'pin', tone: 'gold' });
      }, signal, 0);

      return () => C.tts.stop();
    },
  };
})();
